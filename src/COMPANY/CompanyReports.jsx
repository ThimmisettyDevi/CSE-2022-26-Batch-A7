// src/components/Company/CompanyReports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    FaChartLine,
    FaChartBar,
    FaChartPie,
    FaUsers,
    FaCalendarAlt,
    FaCalendarCheck,
    FaCalendarTimes,
    FaUserCheck,
    FaUserTimes,
    FaMoneyBillWave,
    FaMapMarkerAlt,
    FaBriefcase,
    FaFilter,
    FaDownload,
    FaFileExcel,
    FaFilePdf,
    FaFileAlt,
    FaSearch,
    FaCalendar,
    FaClock,
    FaStar,
    FaTrophy,
    FaPercentage,
    FaEye,
    FaPrint,
    FaShare,
    FaSync,
    FaCog
} from 'react-icons/fa';
import { IoIosTrendingDown, IoIosTrendingUp } from "react-icons/io";

import {
    MdWork,
    MdAttachMoney,
    MdDateRange,
    MdTimeline,
    MdLocationOn,
    MdBarChart,
    MdPieChart,
    MdShowChart
} from 'react-icons/md';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Color schemes for charts (moved outside component for global access)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const STATUS_COLORS = {
    Applied: '#FFB347',
    Shortlisted: '#36A2EB',
    Interviewed: '#9966FF',
    Selected: '#4BC0C0',
    Rejected: '#FF6384',
    Withdrawn: '#C9CBCF'
};

const CompanyReports = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reports');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [selectedReport, setSelectedReport] = useState('overview');
    const [showFilters, setShowFilters] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    // State for data
    const [reports, setReports] = useState({
        overview: null,
        applications: null,
        internships: null,
        performance: null
    });

    // Filter states
    const [filters, setFilters] = useState({
        timeRange: 'month',
        internshipId: '',
        department: '',
        location: ''
    });

    // State for filter options
    const [filterOptions, setFilterOptions] = useState({
        internships: [],
        departments: [],
        locations: []
    });

    // Fetch reports data
    const fetchReports = async () => {
        try {
            setLoading(true);

            // Fetch stats from applications endpoint
            const statsResponse = await axiosInstance.get('/applications/stats/overview');
            const statsData = statsResponse.data.overview || {};

            // Fetch applications for detailed analysis
            const appsResponse = await axiosInstance.get('/applications');
            const applications = appsResponse.data.applications || [];

            // Fetch internships for analysis
            const internshipsRes = await axiosInstance.get('/internships/company/my-internships');
            const internships = internshipsRes.data.internships || [];

            // Process data for reports
            const processedData = processReportData(statsData, applications, internships);
            setReports(processedData);

            // Extract filter options
            const departments = [...new Set(internships.map(i => i.department).filter(Boolean))];
            const locations = [...new Set(internships.map(i => i.location).filter(Boolean))];

            setFilterOptions({
                internships: internships.map(i => ({ value: i._id, label: i.title })),
                departments,
                locations
            });

        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    // Process raw data into report formats
    const processReportData = (stats, applications, internships) => {
        // Overview report
        const overview = {
            totalApplications: stats.total || 0,
            totalInternships: internships.length || 0,
            applicationGrowth: calculateGrowth(applications),
            selectionRate: calculateSelectionRate(stats),
            avgTimeToHire: calculateAvgTimeToHire(applications),
            topPerforming: findTopPerformingInternships(applications, internships)
        };

        // Applications report
        const applicationsReport = {
            byStatus: stats.byStatus || {},
            monthlyTrends: processMonthlyTrends(applications),
            byInternship: processApplicationsByInternship(applications, internships),
            byLocation: processApplicationsByLocation(applications, internships),
            bySource: processApplicationsBySource(applications)
        };

        // Internships report
        const internshipsReport = {
            summary: processInternshipsSummary(internships),
            performance: processInternshipsPerformance(internships, applications),
            openPositions: calculateOpenPositions(internships),
            byDepartment: processInternshipsByDepartment(internships),
            byDuration: processInternshipsByDuration(internships)
        };

        // Performance metrics
        const performanceReport = {
            efficiency: calculateEfficiencyMetrics(applications, internships),
            quality: calculateQualityMetrics(applications),
            timeline: processTimelineMetrics(applications),
            predictions: generatePredictions(stats, applications)
        };

        return {
            overview,
            applications: applicationsReport,
            internships: internshipsReport,
            performance: performanceReport
        };
    };

    // Helper calculations
    const calculateGrowth = (applications) => {
        if (applications.length < 2) return 0;
        const currentMonth = applications.filter(app => {
            const appDate = new Date(app.createdAt);
            const now = new Date();
            return appDate.getMonth() === now.getMonth() &&
                appDate.getFullYear() === now.getFullYear();
        }).length;

        const lastMonth = applications.filter(app => {
            const appDate = new Date(app.createdAt);
            const now = new Date();
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
            return appDate.getMonth() === lastMonthDate.getMonth() &&
                appDate.getFullYear() === lastMonthDate.getFullYear();
        }).length;

        if (lastMonth === 0) return currentMonth > 0 ? 100 : 0;
        return ((currentMonth - lastMonth) / lastMonth) * 100;
    };

    const calculateSelectionRate = (stats) => {
        const selected = stats.byStatus?.Selected || 0;
        const total = stats.total || 0;
        return total > 0 ? (selected / total) * 100 : 0;
    };

    const calculateAvgTimeToHire = (applications) => {
        const selectedApps = applications.filter(app => app.status === 'Selected');
        if (selectedApps.length === 0) return 0;

        const totalDays = selectedApps.reduce((sum, app) => {
            const applied = new Date(app.applicationDate);
            const selected = new Date(app.updatedAt);
            const diffTime = Math.abs(selected - applied);
            return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }, 0);

        return Math.round(totalDays / selectedApps.length);
    };

    const findTopPerformingInternships = (applications, internships) => {
        const internshipApps = {};
        applications.forEach(app => {
            const internshipId = app.internshipId?._id || app.internship?._id;
            if (internshipId) {
                if (!internshipApps[internshipId]) {
                    internshipApps[internshipId] = {
                        applications: 0,
                        selected: 0
                    };
                }
                internshipApps[internshipId].applications++;
                if (app.status === 'Selected') {
                    internshipApps[internshipId].selected++;
                }
            }
        });

        return Object.entries(internshipApps)
            .map(([id, data]) => {
                const internship = internships.find(i => i._id === id);
                return {
                    id,
                    title: internship?.title || 'Unknown',
                    applications: data.applications,
                    selected: data.selected,
                    selectionRate: data.applications > 0 ? (data.selected / data.applications) * 100 : 0
                };
            })
            .sort((a, b) => b.selectionRate - a.selectionRate)
            .slice(0, 5);
    };

    const processMonthlyTrends = (applications) => {
        const monthlyData = {};
        applications.forEach(app => {
            const date = new Date(app.createdAt);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    Applied: 0,
                    Shortlisted: 0,
                    Interviewed: 0,
                    Selected: 0,
                    Rejected: 0
                };
            }

            if (monthlyData[monthYear][app.status]) {
                monthlyData[monthYear][app.status]++;
            }
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                ...data,
                total: Object.values(data).reduce((a, b) => a + b, 0)
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months
    };

    const processApplicationsByInternship = (applications, internships) => {
        const internshipData = {};
        internships.forEach(internship => {
            internshipData[internship._id] = {
                name: internship.title,
                applications: 0,
                selected: 0
            };
        });

        applications.forEach(app => {
            const internshipId = app.internshipId?._id || app.internship?._id;
            if (internshipId && internshipData[internshipId]) {
                internshipData[internshipId].applications++;
                if (app.status === 'Selected') {
                    internshipData[internshipId].selected++;
                }
            }
        });

        return Object.values(internshipData)
            .filter(item => item.applications > 0)
            .sort((a, b) => b.applications - a.applications)
            .slice(0, 10);
    };

    const processApplicationsByLocation = (applications, internships) => {
        const locationData = {};
        applications.forEach(app => {
            const internshipId = app.internshipId?._id || app.internship?._id;
            const internship = internships.find(i => i._id === internshipId);
            const location = internship?.location || 'Remote';

            if (!locationData[location]) {
                locationData[location] = 0;
            }
            locationData[location]++;
        });

        return Object.entries(locationData)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const processApplicationsBySource = (applications) => {
        const sources = {
            'Platform': applications.filter(app => !app.additionalInfo?.includes('external')).length,
            'External': applications.filter(app => app.additionalInfo?.includes('external')).length,
            'Referral': applications.filter(app => app.additionalInfo?.includes('referral')).length
        };

        return Object.entries(sources)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);
    };

    const processInternshipsSummary = (internships) => {
        const now = new Date();
        const active = internships.filter(i => i.isActive && i.status === 'Published').length;
        const closed = internships.filter(i => !i.isActive || i.status !== 'Published').length;
        const upcoming = internships.filter(i => new Date(i.startDate) > now).length;
        const filled = internships.reduce((sum, i) => sum + (i.filledPositions || 0), 0);
        const totalOpenings = internships.reduce((sum, i) => sum + (i.openings || 0), 0);

        return {
            total: internships.length,
            active,
            closed,
            upcoming,
            filled,
            totalOpenings,
            fillRate: totalOpenings > 0 ? (filled / totalOpenings) * 100 : 0
        };
    };

    const processInternshipsPerformance = (internships, applications) => {
        return internships.map(internship => {
            const internshipApps = applications.filter(app =>
                app.internshipId?._id === internship._id || app.internship?._id === internship._id
            );

            const selected = internshipApps.filter(app => app.status === 'Selected').length;
            const applicationsCount = internshipApps.length;

            return {
                name: internship.title,
                openings: internship.openings || 0,
                filled: internship.filledPositions || 0,
                applications: applicationsCount,
                selected,
                selectionRate: applicationsCount > 0 ? (selected / applicationsCount) * 100 : 0
            };
        }).sort((a, b) => b.selectionRate - a.selectionRate);
    };

    const calculateOpenPositions = (internships) => {
        return internships.reduce((acc, internship) => {
            const openings = internship.openings || 0;
            const filled = internship.filledPositions || 0;
            return acc + Math.max(0, openings - filled);
        }, 0);
    };

    const processInternshipsByDepartment = (internships) => {
        const deptData = {};
        internships.forEach(internship => {
            const dept = internship.department || 'Other';
            if (!deptData[dept]) {
                deptData[dept] = 0;
            }
            deptData[dept]++;
        });

        return Object.entries(deptData)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const processInternshipsByDuration = (internships) => {
        const durationData = {};
        internships.forEach(internship => {
            const duration = internship.duration || 0;
            const key = duration <= 3 ? '1-3 months' :
                duration <= 6 ? '4-6 months' :
                    '6+ months';

            if (!durationData[key]) {
                durationData[key] = 0;
            }
            durationData[key]++;
        });

        return Object.entries(durationData)
            .map(([name, value]) => ({ name, value }));
    };

    const calculateEfficiencyMetrics = (applications, internships) => {
        const totalApplications = applications.length;
        const selectedApplications = applications.filter(app => app.status === 'Selected').length;
        const totalInternships = internships.length;

        return {
            applicationToSelectionRatio: totalApplications > 0 ? (selectedApplications / totalApplications) * 100 : 0,
            internshipFillRate: calculateOverallFillRate(internships),
            avgResponseTime: calculateAvgResponseTime(applications)
        };
    };

    const calculateOverallFillRate = (internships) => {
        const totalOpenings = internships.reduce((sum, i) => sum + (i.openings || 0), 0);
        const filled = internships.reduce((sum, i) => sum + (i.filledPositions || 0), 0);
        return totalOpenings > 0 ? (filled / totalOpenings) * 100 : 0;
    };

    const calculateAvgResponseTime = (applications) => {
        const respondedApps = applications.filter(app =>
            app.status !== 'Applied' && app.updatedAt && app.applicationDate
        );

        if (respondedApps.length === 0) return 0;

        const totalHours = respondedApps.reduce((sum, app) => {
            const applied = new Date(app.applicationDate);
            const responded = new Date(app.updatedAt);
            const diffHours = (responded - applied) / (1000 * 60 * 60);
            return sum + diffHours;
        }, 0);

        return Math.round(totalHours / respondedApps.length);
    };

    const calculateQualityMetrics = (applications) => {
        const selectedApps = applications.filter(app => app.status === 'Selected');
        const totalSelected = selectedApps.length;

        const avgRating = totalSelected > 0
            ? selectedApps.reduce((sum, app) => sum + (app.rating || 0), 0) / totalSelected
            : 0;

        const feedbackCount = applications.filter(app => app.feedback).length;
        const feedbackRate = applications.length > 0 ? (feedbackCount / applications.length) * 100 : 0;

        return {
            avgRating,
            feedbackRate,
            qualityScore: (avgRating * 20) + (feedbackRate * 0.8) // Weighted score out of 100
        };
    };

    const processTimelineMetrics = (applications) => {
        const monthlyData = {};
        applications.forEach(app => {
            const date = new Date(app.createdAt);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    applications: 0,
                    selected: 0,
                    conversion: 0
                };
            }

            monthlyData[monthYear].applications++;
            if (app.status === 'Selected') {
                monthlyData[monthYear].selected++;
            }
        });

        // Calculate conversion rates
        Object.keys(monthlyData).forEach(month => {
            const data = monthlyData[month];
            data.conversion = data.applications > 0 ? (data.selected / data.applications) * 100 : 0;
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                ...data
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    };

    const generatePredictions = (stats, applications) => {
        const currentMonth = new Date().getMonth();
        const monthlyData = processMonthlyTrends(applications);

        if (monthlyData.length < 2) return null;

        const lastMonth = monthlyData[monthlyData.length - 1];
        const secondLastMonth = monthlyData[monthlyData.length - 2];

        const applicationGrowth = lastMonth.total > 0
            ? ((lastMonth.total - secondLastMonth.total) / secondLastMonth.total) * 100
            : 0;

        const selectionGrowth = lastMonth.Selected > 0
            ? ((lastMonth.Selected - secondLastMonth.Selected) / secondLastMonth.Selected) * 100
            : 0;

        return {
            nextMonthApplications: Math.round(lastMonth.total * (1 + (applicationGrowth / 100))),
            nextMonthSelections: Math.round(lastMonth.Selected * (1 + (selectionGrowth / 100))),
            applicationTrend: applicationGrowth >= 0 ? 'up' : 'down',
            selectionTrend: selectionGrowth >= 0 ? 'up' : 'down'
        };
    };

    // Initial fetch
    useEffect(() => {
        fetchReports();
    }, []);

    // Handle filter change
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Apply filters
    const applyFilters = () => {
        setShowFilters(false);
        fetchReports();
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            timeRange: 'month',
            internshipId: '',
            department: '',
            location: ''
        });
        setDateRange([null, null]);
        fetchReports();
    };

    // Export reports
    const exportReport = (format) => {
        setGeneratingReport(true);
        setTimeout(() => {
            toast.success(`${format.toUpperCase()} report generated successfully`);
            setGeneratingReport(false);

            // Create and trigger download
            const dataStr = JSON.stringify(reports, null, 2);
            const dataUri = `data:text/${format};charset=utf-8,${encodeURIComponent(dataStr)}`;
            const exportFileDefaultName = `company_report_${new Date().toISOString().split('T')[0]}.${format}`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }, 1500);
    };

    // Render report based on selection
    const renderReport = () => {
        switch (selectedReport) {
            case 'applications':
                return <ApplicationsReport data={reports.applications} />;
            case 'internships':
                return <InternshipsReport data={reports.internships} />;
            case 'performance':
                return <PerformanceReport data={reports.performance} />;
            case 'overview':
            default:
                return <OverviewReport data={reports.overview} />;
        }
    };

    if (loading && !reports.overview) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Generating reports...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="flex-1 p-4 md:p-6 overflow-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Analytics & Reports</h1>
                            <p className="text-blue-100">Comprehensive insights into your internship program</p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            <button
                                onClick={() => fetchReports()}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                            >
                                <FaSync /> Refresh
                            </button>
                            <button
                                onClick={() => exportReport('pdf')}
                                disabled={generatingReport}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition flex items-center gap-2"
                            >
                                <FaFilePdf /> PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Type Selector */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: <FaChartLine /> },
                            { id: 'applications', label: 'Applications', icon: <FaUsers /> },
                            { id: 'internships', label: 'Internships', icon: <FaBriefcase /> },
                            { id: 'performance', label: 'Performance', icon: <FaTrophy /> }
                        ].map((report) => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report.id)}
                                className={`px-4 py-3 rounded-lg transition flex items-center gap-2 ${selectedReport === report.id
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {report.icon} {report.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <DatePicker
                                    selectsRange={true}
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(update) => setDateRange(update)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholderText="Select date range"
                                />
                                <FaCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>

                            <select
                                value={filters.timeRange}
                                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                            >
                                <FaFilter /> More Filters
                            </button>
                            <button
                                onClick={() => exportReport('json')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                            >
                                <FaDownload /> Export
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Internship
                                        </label>
                                        <select
                                            value={filters.internshipId}
                                            onChange={(e) => handleFilterChange('internshipId', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">All Internships</option>
                                            {filterOptions.internships.map((internship, index) => (
                                                <option key={index} value={internship.value}>
                                                    {internship.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Department
                                        </label>
                                        <select
                                            value={filters.department}
                                            onChange={(e) => handleFilterChange('department', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">All Departments</option>
                                            {filterOptions.departments.map((dept, index) => (
                                                <option key={index} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Location
                                        </label>
                                        <select
                                            value={filters.location}
                                            onChange={(e) => handleFilterChange('location', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">All Locations</option>
                                            {filterOptions.locations.map((location, index) => (
                                                <option key={index} value={location}>{location}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={applyFilters}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Report Content */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    {renderReport()}
                </div>

                {/* Export Options */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaDownload className="text-blue-600" /> Export Options
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => exportReport('pdf')}
                            disabled={generatingReport}
                            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition flex flex-col items-center justify-center gap-2"
                        >
                            <FaFilePdf className="text-red-600 text-2xl" />
                            <span className="font-medium text-gray-900">Export as PDF</span>
                            <span className="text-sm text-gray-600">Printable report format</span>
                        </button>
                        <button
                            onClick={() => exportReport('excel')}
                            disabled={generatingReport}
                            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition flex flex-col items-center justify-center gap-2"
                        >
                            <FaFileExcel className="text-green-600 text-2xl" />
                            <span className="font-medium text-gray-900">Export as Excel</span>
                            <span className="text-sm text-gray-600">Spreadsheet format</span>
                        </button>
                        <button
                            onClick={() => exportReport('json')}
                            disabled={generatingReport}
                            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex flex-col items-center justify-center gap-2"
                        >
                            <FaFileAlt className="text-blue-600 text-2xl" />
                            <span className="font-medium text-gray-900">Export as JSON</span>
                            <span className="text-sm text-gray-600">Raw data format</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components for different reports
const OverviewReport = ({ data }) => {
    if (!data) return <div>No data available</div>;

    const kpiCards = [
        {
            title: 'Total Applications',
            value: data.totalApplications,
            icon: <FaUsers className="text-blue-600" />,
            trend: data.applicationGrowth >= 0 ? 'up' : 'down',
            trendValue: `${Math.abs(data.applicationGrowth).toFixed(1)}%`,
            color: 'bg-blue-50'
        },
        {
            title: 'Selection Rate',
            value: `${data.selectionRate.toFixed(1)}%`,
            icon: <FaPercentage className="text-green-600" />,
            trend: data.selectionRate >= 50 ? 'up' : 'down',
            trendValue: 'Target: 50%',
            color: 'bg-green-50'
        },
        {
            title: 'Avg. Time to Hire',
            value: `${data.avgTimeToHire} days`,
            icon: <FaClock className="text-purple-600" />,
            trend: data.avgTimeToHire <= 30 ? 'up' : 'down',
            trendValue: 'Goal: ≤30 days',
            color: 'bg-purple-50'
        },
        {
            title: 'Active Internships',
            value: data.totalInternships,
            icon: <FaBriefcase className="text-orange-600" />,
            trend: data.totalInternships > 0 ? 'up' : 'down',
            trendValue: 'All departments',
            color: 'bg-orange-50'
        }
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview Report</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpiCards.map((kpi, index) => (
                    <div key={index} className={`${kpi.color} p-4 rounded-xl border border-gray-200`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                {kpi.icon}
                            </div>
                            <div className={`flex items-center gap-1 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {kpi.trend === 'up' ? <IoIosTrendingUp /> : <IoIosTrendingDown />}
                                <span className="text-sm font-medium">{kpi.trendValue}</span>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                        <div className="text-sm text-gray-600">{kpi.title}</div>
                    </div>
                ))}
            </div>

            {/* Top Performing Internships */}
            {data.topPerforming && data.topPerforming.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Internships</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-600 border-b">
                                        <th className="pb-2">Internship</th>
                                        <th className="pb-2">Applications</th>
                                        <th className="pb-2">Selected</th>
                                        <th className="pb-2">Selection Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topPerforming.map((internship, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-white">
                                            <td className="py-3">
                                                <div className="font-medium">{internship.title}</div>
                                            </td>
                                            <td className="py-3">{internship.applications}</td>
                                            <td className="py-3">{internship.selected}</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-green-500 h-2 rounded-full"
                                                            style={{ width: `${Math.min(internship.selectionRate, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-medium">{internship.selectionRate.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Quick Insights</h4>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                            <IoIosTrendingUp className="text-green-500" />
                            <span>Application volume {data.applicationGrowth >= 0 ? 'increasing' : 'decreasing'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <FaStar className="text-yellow-500" />
                            <span>Selection rate is {data.selectionRate >= 50 ? 'above' : 'below'} target</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <FaClock className="text-purple-500" />
                            <span>Average hiring time is {data.avgTimeToHire <= 30 ? 'within' : 'above'} target</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <ul className="space-y-3">
                        {data.selectionRate < 50 && (
                            <li className="flex items-start gap-2">
                                <FaCog className="text-blue-500 mt-1" />
                                <span>Improve selection criteria to increase selection rate</span>
                            </li>
                        )}
                        {data.avgTimeToHire > 30 && (
                            <li className="flex items-start gap-2">
                                <FaCog className="text-purple-500 mt-1" />
                                <span>Streamline hiring process to reduce time-to-hire</span>
                            </li>
                        )}
                        {data.topPerforming && data.topPerforming.length > 0 && (
                            <li className="flex items-start gap-2">
                                <FaCog className="text-green-500 mt-1" />
                                <span>Replicate successful internship strategies across departments</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const ApplicationsReport = ({ data }) => {
    if (!data) return <div>No applications data available</div>;

    const chartData = data.monthlyTrends || [];

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Applications Analysis</h2>

            {/* Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Status</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.entries(data.byStatus || {}).map(([name, value]) => ({ name, value }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {Object.entries(data.byStatus || {}).map(([name], index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[name] ?? COLORS[index % COLORS.length]}
                                        />
                                    ))}

                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="Applied" stackId="1" stroke="#FFB347" fill="#FFB347" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="Shortlisted" stackId="1" stroke="#36A2EB" fill="#36A2EB" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="Interviewed" stackId="1" stroke="#9966FF" fill="#9966FF" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="Selected" stackId="1" stroke="#4BC0C0" fill="#4BC0C0" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Tables */}
            <div className="space-y-6">
                {/* By Internship */}
                {data.byInternship && data.byInternship.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Internship</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-sm text-gray-600 border-b">
                                            <th className="pb-2">Internship</th>
                                            <th className="pb-2">Applications</th>
                                            <th className="pb-2">Selected</th>
                                            <th className="pb-2">Selection Rate</th>
                                            <th className="pb-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.byInternship.map((internship, index) => (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-white">
                                                <td className="py-3">
                                                    <div className="font-medium truncate max-w-xs">{internship.name}</div>
                                                </td>
                                                <td className="py-3">{internship.applications}</td>
                                                <td className="py-3">{internship.selected}</td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-green-500 h-2 rounded-full"
                                                                style={{ width: `${Math.min(internship.selectionRate || 0, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-medium">{(internship.selectionRate || 0).toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${(internship.selectionRate || 0) >= 50 ? 'bg-green-100 text-green-800' :
                                                        (internship.selectionRate || 0) >= 30 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {(internship.selectionRate || 0) >= 50 ? 'High' :
                                                            (internship.selectionRate || 0) >= 30 ? 'Medium' : 'Low'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* By Location */}
                {data.byLocation && data.byLocation.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications by Location</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.byLocation}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const InternshipsReport = ({ data }) => {
    if (!data) return <div>No internships data available</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Internships Analysis</h2>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">{data.summary?.total || 0}</div>
                    <div className="text-sm text-blue-600">Total Internships</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="text-2xl font-bold text-green-700">{data.summary?.active || 0}</div>
                    <div className="text-sm text-green-600">Active Internships</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="text-2xl font-bold text-orange-700">{data.openPositions || 0}</div>
                    <div className="text-sm text-orange-600">Open Positions</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="text-2xl font-bold text-purple-700">{data.summary?.fillRate?.toFixed(1) || 0}%</div>
                    <div className="text-sm text-purple-600">Fill Rate</div>
                </div>
            </div>

            {/* Performance Chart */}
            {data.performance && data.performance.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Internship Performance</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.performance.slice(0, 8)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="applications" name="Applications" fill="#0088FE" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="selected" name="Selected" fill="#00C49F" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Department Distribution */}
            {data.byDepartment && data.byDepartment.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Internships by Department</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.byDepartment}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {data.byDepartment.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Duration Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.byDuration}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#FF8042" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Performance Table */}
            {data.performance && data.performance.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Performance</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-600 border-b">
                                        <th className="pb-2">Internship</th>
                                        <th className="pb-2">Openings</th>
                                        <th className="pb-2">Filled</th>
                                        <th className="pb-2">Applications</th>
                                        <th className="pb-2">Selected</th>
                                        <th className="pb-2">Selection Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.performance.map((internship, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-white">
                                            <td className="py-3">
                                                <div className="font-medium truncate max-w-xs">{internship.name}</div>
                                            </td>
                                            <td className="py-3">{internship.openings}</td>
                                            <td className="py-3">{internship.filled}</td>
                                            <td className="py-3">{internship.applications}</td>
                                            <td className="py-3">{internship.selected}</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-green-500 h-2 rounded-full"
                                                            style={{ width: `${Math.min(internship.selectionRate || 0, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-medium">{(internship.selectionRate || 0).toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PerformanceReport = ({ data }) => {
    if (!data) return <div>No performance data available</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h2>

            {/* Efficiency Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <FaPercentage className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-700">{data.efficiency?.applicationToSelectionRatio?.toFixed(1) || 0}%</div>
                            <div className="text-sm text-blue-600">App to Selection Ratio</div>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <FaChartLine className="text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-700">{data.efficiency?.internshipFillRate?.toFixed(1) || 0}%</div>
                            <div className="text-sm text-green-600">Internship Fill Rate</div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <FaClock className="text-purple-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-700">{data.efficiency?.avgResponseTime || 0}</div>
                            <div className="text-sm text-purple-600">Avg Response Time (hours)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-gray-600">Average Rating</div>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar
                                            key={i}
                                            className={`text-lg ${i < Math.floor(data.quality?.avgRating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{data.quality?.avgRating?.toFixed(1) || 0}/5</div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-gray-600">Feedback Rate</div>
                                <div className="text-sm font-medium text-gray-900">{data.quality?.feedbackRate?.toFixed(1) || 0}%</div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(data.quality?.feedbackRate || 0, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-lg text-white">
                            <div className="text-sm mb-1">Overall Quality Score</div>
                            <div className="text-3xl font-bold">{data.quality?.qualityScore?.toFixed(0) || 0}/100</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Analysis</h3>
                    {data.timeline && data.timeline.length > 0 && (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.timeline}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="conversion" name="Conversion Rate (%)" stroke="#8884d8" strokeWidth={2} />
                                    <Line type="monotone" dataKey="applications" name="Applications" stroke="#82ca9d" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Predictions */}
            {data.predictions && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Month Predictions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <FaUsers className="text-blue-600" />
                                <div className="text-sm text-gray-600">Expected Applications</div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{data.predictions.nextMonthApplications}</div>
                            <div className={`flex items-center gap-1 text-sm ${data.predictions.applicationTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {data.predictions.applicationTrend === 'up' ? <IoIosTrendingUp /> : <IoIosTrendingDown />}
                                <span>{data.predictions.applicationTrend === 'up' ? 'Increasing' : 'Decreasing'} trend</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <FaUserCheck className="text-green-600" />
                                <div className="text-sm text-gray-600">Expected Selections</div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{data.predictions.nextMonthSelections}</div>
                            <div className={`flex items-center gap-1 text-sm ${data.predictions.selectionTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {data.predictions.selectionTrend === 'up' ? <IoIosTrendingUp /> : <IoIosTrendingDown />}
                                <span>{data.predictions.selectionTrend === 'up' ? 'Increasing' : 'Decreasing'} trend</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyReports;
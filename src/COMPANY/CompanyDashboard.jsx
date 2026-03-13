// src/components/company/CompanyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaBriefcase,
    FaUsers,
    FaFileAlt,
    FaCalendarCheck,
    FaChartLine,
    FaChartBar,
    FaChartPie,
    FaCheckCircle,
    FaClock,
    FaMoneyBillWave,
    FaMapMarkerAlt,
    FaBuilding,
    FaUserTie,
    FaEnvelope,
    FaPhone,
    FaGlobe,
    FaEye,
    FaEdit,
    FaPlus,
    FaSpinner,
    FaSync,
    FaSearch,
    FaBell,
    FaArrowUp,
    FaArrowDown,
    FaExclamationTriangle,
    FaCalendarAlt,
    FaFileContract,
    FaGraduationCap
} from 'react-icons/fa';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const CompanyDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState('30days');

    // Dashboard data states
    const [dashboardData, setDashboardData] = useState({
        company: null,
        stats: null,
        internships: [],
        applications: [],
        recentActivities: [],
        charts: null,
        upcomingInterviews: [],
        topApplicants: []
    });

    // Fetch all company dashboard data
    const fetchDashboardData = async (isRefresh = false) => {
        try {
            if (!isRefresh) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError(null);

            // Fetch company data
            const [companyRes, applicationsRes, internshipsRes, statsRes] = await Promise.all([
                axiosInstance.get('/company/me'),
                axiosInstance.get('/applications/'),
                axiosInstance.get('/internships/company/my-internships'),
                axiosInstance.get('/internships/stats/company')
            ]);

            console.log('Company Data:', companyRes.data);
            console.log('Applications Data:', applicationsRes.data);
            console.log('Internships Data:', internshipsRes.data);
            console.log('Stats Data:', statsRes.data);

            // Get data from responses
            const company = companyRes.data || {};
            const applications = applicationsRes.data?.applications || [];
            const internships = internshipsRes.data?.internships || [];
            const stats = statsRes.data?.stats || {
                activeInternships: 0,
                totalApplications: 0,
                pendingApplications: 0,
                upcomingInterviews: 0
            };

            // Calculate additional stats
            const calculatedStats = {
                ...stats,
                totalInternships: internships.length || 0,
                activeInternships: internships.filter(i => i.status === 'Published').length || 0,
                totalApplications: applications.length || 0,
                pendingApplications: applications.filter(app => app.status === 'pending' || app.status === 'Applied').length || 0,
                conversionRate: stats.selectedApplications && stats.totalApplications ? 
                    ((stats.selectedApplications / stats.totalApplications) * 100).toFixed(1) : 0
            };

            // Generate recent activities from applications
            const recentActivities = [
                ...internships.slice(0, 2).map(internship => ({
                    type: 'internship',
                    action: internship.status === 'Published' ? 'published' : 'created',
                    title: internship.title,
                    time: internship.createdAt,
                    icon: FaBriefcase,
                    status: internship.status
                })),
                ...applications.slice(0, 3).map(application => ({
                    id: application._id,
                    type: 'application',
                    action: 'submitted',
                    applicant: application.user?.name || application.userDetails?.name || 'Student',
                    position: application.internship?.title || application.internshipDetails?.title || 'Internship',
                    time: application.applicationDate || application.createdAt,
                    icon: FaFileAlt,
                    status: application.status
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

            // Get upcoming interviews from applications with interview status
            const upcomingInterviews = applications
                .filter(app => app.status === 'Interviewed' && app.interviewDate)
                .slice(0, 3)
                .map(app => ({
                    id: app._id,
                    applicant: app.user?.name || app.userDetails?.name || 'Applicant',
                    position: app.internship?.title || app.internshipDetails?.title || 'Internship',
                    date: new Date(app.interviewDate),
                    type: app.interviewType || ['Video Call', 'On-site'][Math.floor(Math.random() * 2)]
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            // Get top applicants (high rating or recently applied)
            const topApplicants = applications
                .filter(app => ['pending', 'Applied', 'Shortlisted', 'Interviewed'].includes(app.status))
                .sort((a, b) => {
                    // Sort by rating if available, then by date
                    const ratingA = a.rating || 0;
                    const ratingB = b.rating || 0;
                    if (ratingB !== ratingA) return ratingB - ratingA;
                    return new Date(b.applicationDate || b.createdAt) - new Date(a.applicationDate || a.createdAt);
                })
                .slice(0, 3)
                .map(app => ({
                    id: app._id,
                    name: app.user?.name || app.userDetails?.name || 'Applicant',
                    email: app.user?.email || app.userDetails?.email,
                    skills: app.user?.skills || app.userDetails?.skills || [],
                    rating: app.rating || 0,
                    matchScore: Math.floor(Math.random() * 20) + 80, // Mock match score
                    appliedDate: app.applicationDate || app.createdAt,
                    status: app.status
                }));

            // Generate charts data
            const charts = {
                applicationTrends: generateApplicationTrends(applications, dateRange),
                internshipPerformance: generateInternshipPerformance(internships, applications),
                applicationStatus: generateApplicationStatus(applications)
            };

            setDashboardData({
                company,
                stats: calculatedStats,
                internships: internships.slice(0, 5),
                applications: applications.slice(0, 5),
                recentActivities,
                charts,
                upcomingInterviews,
                topApplicants
            });

        } catch (err) {
            console.error('Error fetching company dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Helper functions for chart data generation
    const generateApplicationTrends = (applications, range) => {
        const now = new Date();
        const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        let labels, data;

        switch (range) {
            case '7days':
                labels = [];
                data = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    labels.push(daysInWeek[date.getDay()]);
                    
                    const dayStart = new Date(date.setHours(0, 0, 0, 0));
                    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
                    
                    const dayApps = applications.filter(app => {
                        const appDate = new Date(app.applicationDate || app.createdAt);
                        return appDate >= dayStart && appDate <= dayEnd;
                    }).length;
                    data.push(dayApps);
                }
                break;
                
            case '30days':
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                data = labels.map(() => 0);
                
                applications.forEach(app => {
                    const appDate = new Date(app.applicationDate || app.createdAt);
                    const daysAgo = Math.floor((now - appDate) / (1000 * 60 * 60 * 24));
                    if (daysAgo <= 30) {
                        const weekIndex = Math.floor((30 - daysAgo) / 7.5);
                        if (weekIndex >= 0 && weekIndex < 4) {
                            data[weekIndex]++;
                        }
                    }
                });
                break;
                
            default:
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentMonth = now.getMonth();
                labels = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
                data = labels.map(() => 0);
                
                applications.forEach(app => {
                    const appDate = new Date(app.applicationDate || app.createdAt);
                    const monthIndex = appDate.getMonth();
                    const labelIndex = labels.indexOf(months[monthIndex]);
                    if (labelIndex !== -1) {
                        data[labelIndex]++;
                    }
                });
        }

        return {
            labels,
            datasets: [{
                label: 'Applications',
                data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        };
    };

    const generateInternshipPerformance = (internships, applications) => {
        const activeInternships = internships.filter(i => i.status === 'Published');
        const labels = activeInternships.map(i => 
            i.title.length > 15 ? i.title.substring(0, 15) + '...' : i.title
        );
        
        const applicationsData = activeInternships.map(internship => {
            return applications.filter(app => 
                app.internshipId?._id === internship._id || 
                app.internship?._id === internship._id
            ).length;
        });
        
        const filledData = activeInternships.map(internship => internship.filledPositions || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'Applications',
                    data: applicationsData,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Filled Positions',
                    data: filledData,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        };
    };

    const generateApplicationStatus = (applications) => {
        const statusCounts = {
            Applied: applications.filter(app => app.status === 'Applied').length,
            Shortlisted: applications.filter(app => app.status === 'Shortlisted').length,
            Interviewed: applications.filter(app => app.status === 'Interviewed').length,
            Selected: applications.filter(app => app.status === 'Selected').length,
            Rejected: applications.filter(app => app.status === 'Rejected').length,
            Withdrawn: applications.filter(app => app.status === 'Withdrawn').length
        };

        // Filter out zero values
        const filteredLabels = [];
        const filteredData = [];
        const filteredColors = [
            '#f59e0b', // Applied - yellow
            '#3b82f6', // Shortlisted - blue
            '#8b5cf6', // Interviewed - purple
            '#10b981', // Selected - green
            '#ef4444', // Rejected - red
            '#94a3b8'  // Withdrawn - gray
        ];

        Object.entries(statusCounts).forEach(([status, count], index) => {
            if (count > 0) {
                filteredLabels.push(status);
                filteredData.push(count);
            }
        });

        return {
            labels: filteredLabels,
            datasets: [{
                data: filteredData,
                backgroundColor: filteredColors.slice(0, filteredLabels.length),
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        };
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const handleRefresh = () => {
        fetchDashboardData(true);
    };

    const handleCreateInternship = () => {
        window.location.href = '/company/internships/add';
    };

    const handleViewApplications = () => {
        window.location.href = '/company/applications';
    };

    const handleViewInternships = () => {
        window.location.href = '/company/internships';
    };

    const handleViewProfile = () => {
        window.location.href = '/company/profile';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'Not specified';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    font: {
                        size: 11
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        size: 10
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    if (loading && !refreshing) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading company dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    const { company, stats, internships, applications, recentActivities, charts, upcomingInterviews, topApplicants } = dashboardData;

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-2xl font-black bg-gradient-to-r from-black to-black bg-clip-text text-transparent">
                            Welcome back, <i className="text-3xl md:text-2xl font-black bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                                {company?.companyName || company?.name || 'Company'}!
                            </i>
                        </h1>
                        <p className="text-gray-600 mt-2">Here's your company dashboard overview</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search internships, applicants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            <FaSync className={`${refreshing ? 'animate-spin' : ''} text-gray-600`} />
                        </button>

                        <button className="relative p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                            <FaBell className="text-gray-600" />
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {applications?.filter(app => ['pending', 'Applied'].includes(app.status)).length || 0}
                            </span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                {company?.logo ? (
                                    <img
                                        src={company.logo}
                                        alt={company.companyName}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <FaBuilding className="text-white" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FaBriefcase className="text-blue-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.totalInternships || 0}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Internships</h3>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-green-600">
                                <FaArrowUp className="inline mr-1" />
                                {stats?.activeInternships || 0} active
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <FaFileAlt className="text-green-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.totalApplications || 0}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Applications</h3>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-yellow-600">
                                {stats?.pendingApplications || 0} pending review
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <FaCalendarCheck className="text-purple-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.upcomingInterviews || 0}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Upcoming Interviews</h3>
                        <p className="text-xs text-gray-500 mt-1">Scheduled interviews</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <FaChartLine className="text-orange-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.conversionRate || 0}%
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Conversion Rate</h3>
                        <p className="text-xs text-gray-500 mt-1">Application to acceptance</p>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Recent Applications */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaFileAlt className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
                            </div>
                            <button
                                onClick={handleViewApplications}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                View All
                            </button>
                        </div>

                        {applications && applications.length > 0 ? (
                            <div className="space-y-4">
                                {applications.map((application, index) => (
                                    <motion.div
                                        key={application._id || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                                <FaGraduationCap className="text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">
                                                    {application.user?.name || application.userDetails?.name || 'Applicant'}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    Applied for: {application.internship?.title || application.internshipDetails?.title || 'Internship'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${application.status === 'Applied' || application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            application.status === 'Selected' || application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                                application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                                    application.status === 'Interviewed' || application.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                                        application.status === 'Shortlisted' ? 'bg-indigo-100 text-indigo-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {application.status || 'Applied'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(application.applicationDate || application.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.location.href = `/company/applications/${application._id}`}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <FaEye />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No applications yet</h3>
                                <p className="text-gray-500 text-sm">Applications will appear here when students apply</p>
                                <button
                                    onClick={handleCreateInternship}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Create Internship
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Upcoming Interviews */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FaCalendarCheck className="text-purple-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Upcoming Interviews</h2>
                            </div>
                            <button
                                onClick={() => window.location.href = '/company/applications'}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                Schedule
                            </button>
                        </div>

                        {upcomingInterviews && upcomingInterviews.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingInterviews.map((interview, index) => (
                                    <div key={interview.id || index} className="p-4 bg-purple-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">{interview.applicant}</h4>
                                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                                                {interview.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{interview.position}</p>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <FaClock className="mr-2" />
                                            {formatDateTime(interview.date)} • 45 min
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaCalendarCheck className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No upcoming interviews</h3>
                                <p className="text-gray-500 text-sm">Schedule interviews with applicants</p>
                                <button
                                    onClick={() => window.location.href = '/company/applications'}
                                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    View Applications
                                </button>
                            </div>
                        )}

                        {/* Company Verification Status */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Company Status</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${company?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {company?.verified ? 'Verified' : 'Pending Verification'}
                                </span>
                            </div>
                            {!company?.verified && (
                                <p className="text-xs text-gray-500">
                                    Your company profile is under review. Complete verification to access all features.
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Application Trends */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaChartLine className="text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Application Trends</h2>
                            </div>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                            </select>
                        </div>
                        <div className="h-64">
                            {charts?.applicationTrends && (
                                <Line data={charts.applicationTrends} options={chartOptions} />
                            )}
                        </div>
                    </motion.div>

                    {/* Internship Performance */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaChartBar className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Internship Performance</h2>
                            </div>
                            <div className="text-sm text-gray-500">
                                {internships?.length || 0} active internships
                            </div>
                        </div>
                        <div className="h-64">
                            {charts?.internshipPerformance && (
                                <Bar data={charts.internshipPerformance} options={chartOptions} />
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Internships */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                    <FaBriefcase className="text-cyan-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Internships</h2>
                            </div>
                            <button
                                onClick={handleViewInternships}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                Manage All
                            </button>
                        </div>

                        {internships && internships.length > 0 ? (
                            <div className="space-y-4">
                                {internships.map((internship, index) => (
                                    <div key={internship._id || index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{internship.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${internship.status === 'Published' ? 'bg-green-100 text-green-800' :
                                                            internship.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {internship.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {internship.applicationsCount || 0} applications
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {formatCurrency(internship.stipend?.amount)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                            <div className="flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-gray-400" />
                                                <span>{internship.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaClock className="text-gray-400" />
                                                <span>{internship.duration} months</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <FaCalendarAlt />
                                                <span>Deadline: {formatDate(internship.applicationDeadline)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => window.location.href = `/company/internships/${internship._id}`}
                                                    className="text-xs text-blue-600 hover:text-blue-700"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => window.location.href = `/company/internships/${internship._id}/applications`}
                                                    className="text-xs text-green-600 hover:text-green-700"
                                                >
                                                    Applications
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No internships yet</h3>
                                <p className="text-gray-500 text-sm">Create your first internship posting</p>
                                <button
                                    onClick={handleCreateInternship}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Create Internship
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Activities */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <FaClock className="text-orange-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                            </div>
                        </div>

                        {recentActivities && recentActivities.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => {
                                    const Icon = activity.icon;
                                    return (
                                        <div key={activity.id || index} className="flex items-start gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Icon className="text-gray-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {activity.type === 'internship' ? (
                                                        <>
                                                            Internship <span className="font-bold">{activity.title}</span> {activity.action}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-bold">{activity.applicant}</span> applied for {activity.position}
                                                        </>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDateTime(activity.time)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${activity.type === 'internship'
                                                    ? 'bg-cyan-100 text-cyan-800'
                                                    : activity.status === 'pending' || activity.status === 'Applied'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : activity.status === 'Selected' || activity.status === 'accepted'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {activity.type === 'internship' ? 'Internship' : activity.status || 'Applied'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaClock className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No recent activities</h3>
                                <p className="text-gray-500 text-sm">Activities will appear here</p>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCreateInternship}
                                    className="p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition text-center"
                                >
                                    <FaPlus className="text-blue-600 text-xl mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">New Internship</p>
                                </button>
                                <button
                                    onClick={() => window.location.href = '/company/applications/review'}
                                    className="p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition text-center"
                                >
                                    <FaFileAlt className="text-green-600 text-xl mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Review Apps</p>
                                </button>
                                <button
                                    onClick={() => window.location.href = '/company/interviews/schedule'}
                                    className="p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-center"
                                >
                                    <FaCalendarCheck className="text-purple-600 text-xl mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Schedule Interview</p>
                                </button>
                                <button
                                    onClick={handleViewProfile}
                                    className="p-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition text-center"
                                >
                                    <FaBuilding className="text-orange-600 text-xl mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Company Profile</p>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Top Applicants */}
                {topApplicants && topApplicants.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <FaUsers className="text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Top Applicants</h2>
                            </div>
                            <button
                                onClick={() => window.location.href = '/company/applications'}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                View All
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {topApplicants.map((applicant, index) => (
                                <motion.div
                                    key={applicant.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{applicant.name}</h3>
                                            <p className="text-gray-600 text-sm">{applicant.email}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                            {applicant.matchScore}% match
                                        </div>
                                    </div>

                                    {applicant.skills && applicant.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {applicant.skills.slice(0, 3).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm">Applied</p>
                                            <p className="font-medium text-gray-900">
                                                {formatDate(applicant.appliedDate)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => window.location.href = `/company/applications/${applicant.id}`}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default CompanyDashboard;
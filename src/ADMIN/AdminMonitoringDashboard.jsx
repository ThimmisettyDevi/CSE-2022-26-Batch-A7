// src/components/admin/AdminMonitoringDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaUsers,
    FaBuilding,
    FaBriefcase,
    FaFileAlt,
    FaChartLine,
    FaChartBar,
    FaChartPie,
    FaSearch,
    FaSync,
    FaInfoCircle ,
    FaSpinner,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaArrowUp,
    FaArrowDown,
    FaEye,
    FaUserCheck,
    FaUserTimes,
    FaMoneyBillWave,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaDatabase,
    FaServer,
    FaNetworkWired,
    FaCog,
    FaBell,
    FaShieldAlt,
    FaLayerGroup,
    FaTachometerAlt,
    FaList,
    FaTable,
    FaThLarge
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

const AdminMonitoringDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('monitoring');
    const [dateRange, setDateRange] = useState('30days');
    const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed', 'analytics'

    // Dashboard data states
    const [dashboardData, setDashboardData] = useState({
        stats: null,
        recentActivities: [],
        systemMetrics: null,
        charts: null,
        alerts: [],
        topCompanies: [],
        topInternships: [],
        recentUsers: [],
        recentApplications: []
    });

    // System monitoring data
    const [systemData, setSystemData] = useState({
        serverLoad: 0,
        databaseConnections: 0,
        memoryUsage: 0,
        apiRequests: 0,
        responseTime: 0,
        activeSessions: 0
    });

    // Fetch all monitoring data
    const fetchMonitoringData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [
                companiesRes,
                usersRes,
                internshipsRes,
                applicationsRes
            ] = await Promise.all([
                axiosInstance.get('/company?limit=100'),
                axiosInstance.get('/auth/users'),
                axiosInstance.get('/internships?limit=100'),
                axiosInstance.get('/applications?limit=50')
            ]);

            console.log('Monitoring Data:', {
                companies: companiesRes.data,
                users: usersRes.data,
                internships: internshipsRes.data,
                applications: applicationsRes.data
            });

            // Get data from responses
            const companies = companiesRes.data?.companies || [];
            const users = usersRes.data?.users || [];
            const internships = internshipsRes.data?.internships || [];
            const applications = applicationsRes.data?.applications || [];

            // Calculate comprehensive stats
            const totalUsers = users.length;
            const activeUsers = users.filter(user =>
                user.accountStatus === 'Active' || user.isActive === true
            ).length;
            const pendingUsers = users.filter(user =>
                user.accountStatus === 'Pending' || user.isAccepted === false
            ).length;
            const newUsersToday = users.filter(user => {
                const today = new Date();
                const userDate = new Date(user.createdAt || user.accountCreatedAt);
                return userDate.toDateString() === today.toDateString();
            }).length;

            const totalCompanies = companies.length;
            const verifiedCompanies = companies.filter(company =>
                company.verified === true || company.verificationStatus === 'Verified'
            ).length;
            const pendingCompanies = companies.filter(company =>
                company.verified === false || company.verificationStatus === 'Pending'
            ).length;

            const totalInternships = internships.length;
            const activeInternships = internships.filter(internship =>
                internship.status === 'Published' && internship.isActive === true
            ).length;
            const expiredInternships = internships.filter(internship => {
                if (!internship.applicationDeadline) return false;
                return new Date(internship.applicationDeadline) < new Date();
            }).length;

            const totalApplications = applications.length;
            const pendingApplications = applications.filter(app =>
                app.status === 'pending' || app.status === 'applied'
            ).length;
            const acceptedApplications = applications.filter(app =>
                app.status === 'accepted' || app.status === 'selected'
            ).length;

            // Calculate conversion rate
            const conversionRate = totalApplications > 0
                ? Math.round((acceptedApplications / totalApplications) * 100)
                : 0;

            // Calculate growth metrics
            const userGrowth = calculateGrowthRate(users, 'createdAt');
            const companyGrowth = calculateGrowthRate(companies, 'accountCreatedAt');
            const internshipGrowth = calculateGrowthRate(internships, 'createdAt');
            const applicationGrowth = calculateGrowthRate(applications, 'createdAt');

            // Prepare recent activities
            const recentActivities = [
                // User activities
                ...users.slice(0, 3).map(user => ({
                    id: user._id,
                    type: 'user',
                    action: user.accountStatus === 'Pending' ? 'registered' : 'activated',
                    name: user.name,
                    time: user.createdAt || user.accountCreatedAt,
                    icon: FaUsers,
                    status: user.accountStatus || 'Active'
                })),
                // Company activities
                ...companies.slice(0, 2).map(company => ({
                    id: company._id,
                    type: 'company',
                    action: company.verified ? 'verified' : 'registered',
                    name: company.companyName,
                    time: company.createdAt || company.accountCreatedAt,
                    icon: FaBuilding,
                    status: company.verificationStatus
                })),
                // Internship activities
                ...internships.slice(0, 2).map(internship => ({
                    id: internship._id,
                    type: 'internship',
                    action: 'created',
                    name: internship.title,
                    company: internship.companyInfo?.companyName,
                    time: internship.createdAt,
                    icon: FaBriefcase,
                    status: internship.status
                })),
                // Application activities
                ...applications.slice(0, 2).map(app => ({
                    id: app._id,
                    type: 'application',
                    action: 'submitted',
                    name: app.studentId?.name || 'Student',
                    internship: app.internshipId?.title,
                    time: app.createdAt || app.applicationDate,
                    icon: FaFileAlt,
                    status: app.status
                }))
            ]
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .slice(0, 8);

            // Get top performing companies
            const topCompanies = companies
                .filter(company => company.verified)
                .map(company => {
                    const companyInternships = internships.filter(i =>
                        i.companyId === company._id || i.companyInfo?._id === company._id
                    );
                    const companyApplications = applications.filter(app =>
                        companyInternships.some(internship => internship._id === app.internshipId)
                    );

                    return {
                        ...company,
                        internshipCount: companyInternships.length,
                        applicationCount: companyApplications.length,
                        avgStipend: calculateAverageStipend(companyInternships)
                    };
                })
                .sort((a, b) => b.internshipCount - a.internshipCount)
                .slice(0, 5);

            // Get top performing internships
            const topInternships = internships
                .filter(internship => internship.status === 'Published')
                .map(internship => ({
                    ...internship,
                    applicationCount: internship.applicationsCount ||
                        applications.filter(app => app.internshipId === internship._id).length,
                    fillRate: internship.openings > 0
                        ? Math.round((internship.filledPositions / internship.openings) * 100)
                        : 0
                }))
                .sort((a, b) => b.applicationCount - a.applicationCount)
                .slice(0, 5);

            // Get recent users
            const recentUsers = users
                .sort((a, b) => new Date(b.createdAt || b.accountCreatedAt) - new Date(a.createdAt || a.accountCreatedAt))
                .slice(0, 5);

            // Get recent applications
            const recentApplications = applications
                .sort((a, b) => new Date(b.createdAt || b.applicationDate) - new Date(a.createdAt || a.applicationDate))
                .slice(0, 5);

            // Generate charts data
            const charts = {
                userGrowthChart: generateUserGrowthChart(users, dateRange),
                applicationTrendsChart: generateApplicationTrendsChart(applications, dateRange),
                categoryDistributionChart: generateCategoryDistributionChart(internships),
                statusDistributionChart: generateStatusDistributionChart({
                    users,
                    companies,
                    internships,
                    applications
                }),
                performanceMetricsChart: generatePerformanceMetricsChart({
                    conversionRate,
                    avgStipend: calculateAverageStipend(internships),
                    fillRate: calculateAverageFillRate(internships),
                    responseTime: systemData.responseTime
                })
            };

            // Generate alerts
            const alerts = generateAlerts({
                users: users.length,
                pendingUsers,
                companies: companies.length,
                pendingCompanies,
                internships: internships.length,
                expiredInternships,
                applications: applications.length,
                systemMetrics: systemData
            });

            // Mock system metrics (in production, this would come from your monitoring system)
            const mockSystemMetrics = {
                serverLoad: Math.floor(Math.random() * 30) + 20,
                databaseConnections: Math.floor(Math.random() * 50) + 20,
                memoryUsage: Math.floor(Math.random() * 40) + 30,
                apiRequests: Math.floor(Math.random() * 1000) + 500,
                responseTime: Math.floor(Math.random() * 300) + 100,
                activeSessions: Math.floor(Math.random() * 200) + 50,
                uptime: '99.9%',
                errorRate: '0.2%'
            };

            setSystemData(mockSystemMetrics);

            setDashboardData({
                stats: {
                    totalUsers,
                    activeUsers,
                    pendingUsers,
                    newUsersToday,
                    totalCompanies,
                    verifiedCompanies,
                    pendingCompanies,
                    totalInternships,
                    activeInternships,
                    expiredInternships,
                    totalApplications,
                    pendingApplications,
                    acceptedApplications,
                    conversionRate,
                    userGrowth,
                    companyGrowth,
                    internshipGrowth,
                    applicationGrowth,
                    avgStipend: calculateAverageStipend(internships),
                    avgResponseTime: systemData.responseTime
                },
                recentActivities,
                systemMetrics: mockSystemMetrics,
                charts,
                alerts,
                topCompanies,
                topInternships,
                recentUsers,
                recentApplications
            });

        } catch (err) {
            console.error('Error fetching monitoring data:', err);
            setError(err.response?.data?.message || 'Failed to load monitoring data');
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    const calculateGrowthRate = (data, dateField) => {
        if (data.length < 2) return 0;

        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentCount = data.filter(item => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= weekAgo;
        }).length;

        const previousCount = data.filter(item => {
            const itemDate = new Date(item[dateField]);
            const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
            return itemDate >= twoWeeksAgo && itemDate < weekAgo;
        }).length;

        if (previousCount === 0) return recentCount > 0 ? 100 : 0;

        return Math.round(((recentCount - previousCount) / previousCount) * 100);
    };

    const calculateAverageStipend = (internships) => {
        if (!internships.length) return 0;
        const total = internships.reduce((sum, internship) => {
            return sum + (internship.stipend?.amount || 0);
        }, 0);
        return Math.round(total / internships.length);
    };

    const calculateAverageFillRate = (internships) => {
        const activeInternships = internships.filter(i => i.status === 'Published');
        if (!activeInternships.length) return 0;

        const totalFillRate = activeInternships.reduce((sum, internship) => {
            if (internship.openings === 0) return sum;
            return sum + (internship.filledPositions / internship.openings * 100);
        }, 0);

        return Math.round(totalFillRate / activeInternships.length);
    };

    const generateUserGrowthChart = (users, range) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        let labels, data;

        switch (range) {
            case '7days':
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                data = labels.map((_, i) => Math.floor(Math.random() * 20) + 5);
                break;
            case '30days':
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                data = labels.map((_, i) => Math.floor(Math.random() * 50) + 20);
                break;
            default:
                labels = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
                data = labels.map((_, i) => Math.floor(Math.random() * 100) + 30);
        }

        return {
            labels,
            datasets: [{
                label: 'New Users',
                data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        };
    };

    const generateApplicationTrendsChart = (applications, range) => {
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const data = labels.map((_, i) => Math.floor(Math.random() * 100) + 50);

        return {
            labels,
            datasets: [
                {
                    label: 'Applications',
                    data,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Accepted',
                    data: data.map(val => Math.floor(val * 0.3)),
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        };
    };

    const generateCategoryDistributionChart = (internships) => {
        const categories = ['Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Other'];
        const data = categories.map(category =>
            internships.filter(i => i.category === category).length
        );

        return {
            labels: categories,
            datasets: [{
                data,
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981',
                    '#3b82f6'
                ],
                borderWidth: 0
            }]
        };
    };

    const generateStatusDistributionChart = (data) => {
        const userStatus = {
            Active: data.users.filter(u => u.accountStatus === 'Active').length,
            Pending: data.users.filter(u => u.accountStatus === 'Pending').length,
            Inactive: data.users.filter(u => !u.accountStatus || u.accountStatus === 'Inactive').length
        };

        return {
            labels: Object.keys(userStatus),
            datasets: [{
                data: Object.values(userStatus),
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#6b7280'
                ],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        };
    };

    const generatePerformanceMetricsChart = (metrics) => {
        return {
            labels: ['Conversion Rate', 'Avg Stipend', 'Fill Rate', 'Response Time'],
            datasets: [{
                label: 'Performance Metrics',
                data: [
                    metrics.conversionRate,
                    metrics.avgStipend / 1000, // Scale down for chart
                    metrics.fillRate,
                    metrics.responseTime / 10 // Scale down for chart
                ],
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                borderWidth: 2,
                fill: true
            }]
        };
    };

    const generateAlerts = (data) => {
        const alerts = [];

        // User alerts
        if (data.pendingUsers > 10) {
            alerts.push({
                id: 'user-alert',
                type: 'warning',
                title: 'High Pending Users',
                message: `${data.pendingUsers} users awaiting approval`,
                icon: FaUsers,
                time: new Date().toISOString()
            });
        }

        // Company alerts
        if (data.pendingCompanies > 5) {
            alerts.push({
                id: 'company-alert',
                type: 'warning',
                title: 'Pending Company Verifications',
                message: `${data.pendingCompanies} companies need verification`,
                icon: FaBuilding,
                time: new Date().toISOString()
            });
        }

        // Internship alerts
        if (data.expiredInternships > 0) {
            alerts.push({
                id: 'internship-alert',
                type: 'info',
                title: 'Expired Internships',
                message: `${data.expiredInternships} internships have expired`,
                icon: FaBriefcase,
                time: new Date().toISOString()
            });
        }

        // System alerts
        if (data.systemMetrics.serverLoad > 80) {
            alerts.push({
                id: 'system-alert',
                type: 'error',
                title: 'High Server Load',
                message: `Server load at ${data.systemMetrics.serverLoad}%`,
                icon: FaServer,
                time: new Date().toISOString()
            });
        }

        if (data.systemMetrics.memoryUsage > 85) {
            alerts.push({
                id: 'memory-alert',
                type: 'error',
                title: 'High Memory Usage',
                message: `Memory usage at ${data.systemMetrics.memoryUsage}%`,
                icon: FaDatabase,
                time: new Date().toISOString()
            });
        }

        // Add default alerts if none
        if (alerts.length === 0) {
            alerts.push({
                id: 'all-good',
                type: 'success',
                title: 'System Normal',
                message: 'All systems operating normally',
                icon: FaCheckCircle,
                time: new Date().toISOString()
            });
        }

        return alerts.slice(0, 5); // Limit to 5 alerts
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            default: return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return <FaExclamationTriangle className="text-red-600" />;
            case 'warning': return <FaExclamationTriangle className="text-yellow-600" />;
            case 'info': return <FaInfoCircle className="text-blue-600" />;
            case 'success': return <FaCheckCircle className="text-green-600" />;
            default: return <FaBell className="text-gray-600" />;
        }
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
                        size: 12
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
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    useEffect(() => {
        fetchMonitoringData();
        // Refresh data every 30 seconds
        const interval = setInterval(fetchMonitoringData, 30000);
        return () => clearInterval(interval);
    }, [dateRange]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMonitoringData();
        setTimeout(() => setRefreshing(false), 1000);
    };

    if (loading && !refreshing) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading monitoring dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    const {
        stats,
        recentActivities,
        systemMetrics,
        charts,
        alerts,
        topCompanies,
        topInternships,
        recentUsers,
        recentApplications
    } = dashboardData;

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-2xl font-black bg-gradient-to-r from-black to-black bg-clip-text text-transparent">
                            System <span className="bg-gradient-to-r from-purple-700 to-purple-600 bg-clip-text text-transparent">Monitoring</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Real-time platform analytics and system metrics</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search metrics or alerts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="7days">Last 7 days</option>
                                <option value="30days">Last 30 days</option>
                                <option value="90days">Last 90 days</option>
                            </select>

                            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('overview')}
                                    className={`px-3 py-2 text-sm ${viewMode === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    <FaThLarge />
                                </button>
                                <button
                                    onClick={() => setViewMode('detailed')}
                                    className={`px-3 py-2 text-sm ${viewMode === 'detailed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    <FaTable />
                                </button>
                                <button
                                    onClick={() => setViewMode('analytics')}
                                    className={`px-3 py-2 text-sm ${viewMode === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    <FaChartBar />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            <FaSync className={`${refreshing ? 'animate-spin' : ''} text-gray-600`} />
                        </button>
                    </div>
                </div>

                {/* Alerts Banner */}
                {alerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alerts.map((alert, index) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded-xl border ${getAlertColor(alert.type)} flex items-start gap-3`}
                                >
                                    <div className="mt-1">
                                        {getAlertIcon(alert.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                                        <p className="text-xs mt-1">{alert.message}</p>
                                        <p className="text-xs opacity-75 mt-2">
                                            {formatDate(alert.time)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* System Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FaServer className="text-blue-600 text-xl" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                    {systemMetrics?.serverLoad || 0}%
                                </span>
                                <p className="text-sm text-gray-500">Server Load</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${systemMetrics?.serverLoad > 80 ? 'bg-red-500' :
                                        systemMetrics?.serverLoad > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${systemMetrics?.serverLoad || 0}%` }}
                            />
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
                                <FaDatabase className="text-green-600 text-xl" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                    {formatNumber(systemMetrics?.databaseConnections || 0)}
                                </span>
                                <p className="text-sm text-gray-500">DB Connections</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Active</span>
                            <span className="text-green-600">
                                <FaArrowUp className="inline mr-1" />
                                +12%
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
                                <FaNetworkWired className="text-purple-600 text-xl" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                    {formatNumber(systemMetrics?.apiRequests || 0)}
                                </span>
                                <p className="text-sm text-gray-500">API Requests/min</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Response: {systemMetrics?.responseTime || 0}ms</span>
                            <span className="text-green-600">99.8% success</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <FaShieldAlt className="text-orange-600 text-xl" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                    {systemMetrics?.uptime || '99.9%'}
                                </span>
                                <p className="text-sm text-gray-500">System Uptime</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Error Rate</span>
                            <span className="text-red-600">{systemMetrics?.errorRate || '0.2%'}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Platform Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* User Statistics */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaUsers className="text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">User Statistics</h2>
                            </div>
                            <span className="text-sm text-gray-500">
                                {stats?.userGrowth || 0}% growth
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Users</span>
                                <span className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalUsers || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Active Users</span>
                                <span className="text-lg font-semibold text-green-600">{formatNumber(stats?.activeUsers || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Pending Approval</span>
                                <span className="text-lg font-semibold text-yellow-600">{formatNumber(stats?.pendingUsers || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">New Today</span>
                                <span className="text-lg font-semibold text-blue-600">{formatNumber(stats?.newUsersToday || 0)}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Company Statistics */}
                    <motion.div
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FaBuilding className="text-purple-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Company Statistics</h2>
                            </div>
                            <span className="text-sm text-gray-500">
                                {stats?.companyGrowth || 0}% growth
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Companies</span>
                                <span className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalCompanies || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Verified</span>
                                <span className="text-lg font-semibold text-green-600">{formatNumber(stats?.verifiedCompanies || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Pending Verification</span>
                                <span className="text-lg font-semibold text-yellow-600">{formatNumber(stats?.pendingCompanies || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Growth Rate</span>
                                <span className={`text-lg font-semibold ${(stats?.companyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats?.companyGrowth || 0}%
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Internship Statistics */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaBriefcase className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Internship Statistics</h2>
                            </div>
                            <span className="text-sm text-gray-500">
                                {stats?.internshipGrowth || 0}% growth
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Internships</span>
                                <span className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalInternships || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Active</span>
                                <span className="text-lg font-semibold text-green-600">{formatNumber(stats?.activeInternships || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Expired</span>
                                <span className="text-lg font-semibold text-red-600">{formatNumber(stats?.expiredInternships || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Avg Stipend</span>
                                <span className="text-lg font-semibold text-blue-600">{formatCurrency(stats?.avgStipend || 0)}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Activities & Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Recent Activities */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 lg:col-span-2"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <FaClock className="text-orange-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                            </div>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                View All
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentActivities.map((activity, index) => {
                                const Icon = activity.icon;
                                return (
                                    <div key={activity.id || index} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Icon className="text-gray-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                <span className="capitalize">{activity.name}</span> {activity.action}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {activity.company ? `at ${activity.company}` : ''}
                                                {activity.internship ? `for ${activity.internship}` : ''}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDate(activity.time)}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${activity.type === 'user'
                                                ? 'bg-blue-100 text-blue-800'
                                                : activity.type === 'company'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : activity.type === 'internship'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {activity.type}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Top Companies */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FaTachometerAlt className="text-purple-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Top Companies</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {topCompanies.map((company, index) => (
                                <div key={company._id || index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                            {company.logo ? (
                                                <img
                                                    src={company.logo}
                                                    alt={company.companyName}
                                                    className="w-full h-full rounded-lg object-cover"
                                                />
                                            ) : (
                                                <FaBuilding className="text-purple-600 text-sm" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{company.companyName}</p>
                                            <p className="text-xs text-gray-500">{company.internshipCount} internships</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">{company.applicationCount} apps</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(company.avgStipend || 0)} avg</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Performance Metrics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaChartPie className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Performance Metrics</h2>
                            </div>
                        </div>
                        <div className="h-64">
                            {charts?.performanceMetricsChart && (
                                <Bar data={charts.performanceMetricsChart} options={{
                                    ...chartOptions,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: 'rgba(0, 0, 0, 0.05)'
                                            }
                                        },
                                        x: {
                                            grid: {
                                                display: false
                                            }
                                        }
                                    }
                                }} />
                            )}
                        </div>
                    </motion.div>

                    {/* Category Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaLayerGroup className="text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Category Distribution</h2>
                            </div>
                        </div>
                        <div className="h-64">
                            {charts?.categoryDistributionChart && (
                                <Pie data={charts.categoryDistributionChart} options={chartOptions} />
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Platform Stats</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{stats?.conversionRate || 0}%</div>
                            <p className="text-sm text-gray-700">Conversion Rate</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                            <div className="text-3xl font-bold text-green-600 mb-2">{formatNumber(stats?.totalApplications || 0)}</div>
                            <p className="text-sm text-gray-700">Total Applications</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-xl">
                            <div className="text-3xl font-bold text-purple-600 mb-2">{formatCurrency(stats?.avgStipend || 0)}</div>
                            <p className="text-sm text-gray-700">Avg Stipend</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-xl">
                            <div className="text-3xl font-bold text-orange-600 mb-2">{systemMetrics?.activeSessions || 0}</div>
                            <p className="text-sm text-gray-700">Active Sessions</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMonitoringDashboard;
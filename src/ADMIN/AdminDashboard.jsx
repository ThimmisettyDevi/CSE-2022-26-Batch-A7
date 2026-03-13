// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaUsers,
    FaBuilding,
    FaBriefcase,
    FaFileAlt,
    FaChartLine,
    FaSearch,
    FaSync,
    FaExclamationTriangle,
    FaUserCheck,
    FaUserTimes,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaEye,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaSpinner,
    FaBell,
    FaUser,
    FaCog,
    FaHome,
    FaList,
    FaDatabase,
    FaChartBar,
    FaChartPie,
    FaMoneyBillWave
} from 'react-icons/fa';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');

    // Dashboard data states
    const [dashboardData, setDashboardData] = useState({
        stats: null,
        companies: [],
        users: [],
        internships: [],
        applications: [],
        recentActivities: []
    });

    // Fetch all admin dashboard data
    const fetchDashboardData = async (isRefresh = false) => {
        try {
            if (!isRefresh) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError(null);

            // Fetch all data in parallel
            const [
                companiesRes,
                usersRes,
                internshipsRes,
                applicationsRes
            ] = await Promise.all([
                axiosInstance.get('/company?limit=10&page=1'),
                axiosInstance.get('/auth/users'),
                axiosInstance.get('/internships?limit=10&page=1'),
                axiosInstance.get('/applications?limit=10&page=1')
            ]);

            console.log('Companies Data:', companiesRes.data);
            console.log('Users Data:', usersRes.data);
            console.log('Internships Data:', internshipsRes.data);
            console.log('Applications Data:', applicationsRes.data);

            // Get data from responses
            const companies = companiesRes.data?.companies || [];
            const users = usersRes.data?.users || [];
            const internships = internshipsRes.data?.internships || [];
            const applications = applicationsRes.data?.applications || [];

            // Calculate stats from real data
            const totalUsers = users.length;
            const activeUsers = users.filter(user =>
                user.accountStatus === 'Active' || user.isActive === true
            ).length;
            const pendingUsers = users.filter(user =>
                user.accountStatus === 'Pending' || user.isAccepted === false
            ).length;
            const suspendedUsers = users.filter(user =>
                user.accountStatus === 'Suspended' || user.isActive === false
            ).length;

            const totalCompanies = companies.length;
            const verifiedCompanies = companies.filter(company =>
                company.verified === true || company.verificationStatus === 'Verified'
            ).length;
            const pendingCompanies = companies.filter(company =>
                company.verified === false || company.verificationStatus === 'Pending'
            ).length;

            const totalInternships = internships.length;
            const activeInternships = internships.filter(internship =>
                internship.status === 'Published' || internship.isActive === true
            ).length;
            const draftInternships = internships.filter(internship =>
                internship.status === 'Draft' || internship.isActive === false
            ).length;

            const totalApplications = applications.length;
            const pendingApplications = applications.filter(app =>
                app.status === 'pending' || app.status === 'applied'
            ).length;
            const acceptedApplications = applications.filter(app =>
                app.status === 'accepted' || app.status === 'selected'
            ).length;
            const rejectedApplications = applications.filter(app =>
                app.status === 'rejected'
            ).length;

            // Calculate conversion rate
            const conversionRate = totalApplications > 0
                ? Math.round((acceptedApplications / totalApplications) * 100)
                : 0;

            // Prepare recent activities from real data
            const recentActivities = [
                // Recent user registrations
                ...users.slice(0, 2).map(user => ({
                    id: user._id,
                    type: 'user',
                    action: 'registered',
                    name: user.name,
                    email: user.email,
                    time: user.createdAt || user.accountCreatedAt,
                    icon: FaUser
                })),
                // Recent company verifications
                ...companies.slice(0, 2).filter(c => c.verified).map(company => ({
                    id: company._id,
                    type: 'company',
                    action: 'verified',
                    name: company.companyName,
                    email: company.email,
                    time: company.updatedAt,
                    icon: FaBuilding
                })),
                // Recent internship postings
                ...internships.slice(0, 2).map(internship => ({
                    id: internship._id,
                    type: 'internship',
                    action: 'created',
                    name: internship.title,
                    company: internship.companyInfo?.companyName,
                    time: internship.createdAt,
                    icon: FaBriefcase
                })),
                // Recent applications
                ...applications.slice(0, 1).map(app => ({
                    id: app._id,
                    type: 'application',
                    action: 'submitted',
                    name: app.applicantName || 'User',
                    internship: app.internshipTitle,
                    time: app.createdAt,
                    icon: FaFileAlt
                }))
            ]
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .slice(0, 5);

            setDashboardData({
                stats: {
                    totalUsers,
                    activeUsers,
                    pendingUsers,
                    suspendedUsers,
                    totalCompanies,
                    verifiedCompanies,
                    pendingCompanies,
                    totalInternships,
                    activeInternships,
                    draftInternships,
                    totalApplications,
                    pendingApplications,
                    acceptedApplications,
                    rejectedApplications,
                    conversionRate,
                    avgStipend: calculateAverageStipend(internships)
                },
                companies: companies.slice(0, 5),
                users: users.slice(0, 5),
                internships: internships.slice(0, 5),
                applications: applications.slice(0, 5),
                recentActivities
            });

        } catch (err) {
            console.error('Error fetching admin dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Calculate average stipend
    const calculateAverageStipend = (internships) => {
        if (!internships.length) return 0;
        const total = internships.reduce((sum, internship) => {
            return sum + (internship.stipend?.amount || 0);
        }, 0);
        return Math.round(total / internships.length);
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRefresh = () => {
        fetchDashboardData(true);
    };

    const handleStatusChange = async (type, id, status) => {
        try {
            let endpoint = '';
            let data = {};

            switch (type) {
                case 'user':
                    endpoint = `/auth/users/${id}/status`;
                    data = { status: status === 'active' ? 'Active' : 'Suspended' };
                    break;
                case 'company':
                    endpoint = `/company/${id}/verify`;
                    data = { verified: status === 'verified' };
                    break;
                case 'internship':
                    endpoint = `/internships/${id}/status`;
                    data = { status: status === 'active' ? 'Published' : 'Draft' };
                    break;
                default:
                    return;
            }

            await axiosInstance.patch(endpoint, data);
            fetchDashboardData(true); // Refresh data
        } catch (err) {
            console.error(`Error updating ${type} status:`, err);
            alert(`Failed to update ${type} status: ${err.response?.data?.message || err.message}`);
        }
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

    const getStatusColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'active':
            case 'published':
            case 'verified':
            case 'selected':
            case 'accepted':
                return 'bg-green-500';
            case 'pending':
            case 'applied':
            case 'draft':
                return 'bg-yellow-500';
            case 'suspended':
            case 'rejected':
            case 'inactive':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status) => {
        if (!status) return 'N/A';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (loading && !refreshing) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
                    <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                    >
                        <FaSync /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { stats, companies, users, internships, applications, recentActivities } = dashboardData;

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
                            Admin <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Dashboard</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Manage your platform efficiently</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      

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
                                3
                            </span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <FaUser className="text-white" />
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-gray-900">Admin User</p>
                                <p className="text-xs text-gray-500">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Users Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FaUsers className="text-blue-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.totalUsers || 0}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Users</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-green-600">
                                <FaUserCheck className="inline mr-1" />
                                {stats?.activeUsers || 0} active
                            </span>
                            <span className="text-yellow-600">
                                {stats?.pendingUsers || 0} pending
                            </span>
                        </div>
                    </motion.div>

                    {/* Companies Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <FaBuilding className="text-purple-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.totalCompanies || 0}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Companies</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-green-600">
                                <FaCheckCircle className="inline mr-1" />
                                {stats?.verifiedCompanies || 0} verified
                            </span>
                            <span className="text-yellow-600">
                                {stats?.pendingCompanies || 0} pending
                            </span>
                        </div>
                    </motion.div>

                    {/* Internships Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <FaBriefcase className="text-green-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.totalInternships || 0}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Internships</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-green-600">
                                {stats?.activeInternships || 0} active
                            </span>
                            <span className="text-gray-600">
                                {stats?.draftInternships || 0} draft
                            </span>
                        </div>
                    </motion.div>

                    {/* Applications Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <FaFileAlt className="text-orange-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats?.totalApplications || 0}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Applications</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-blue-600">
                                {stats?.pendingApplications || 0} pending
                            </span>
                            <span className="text-green-600">
                                {stats?.acceptedApplications || 0} accepted
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Recent Users Table */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaUsers className="text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
                            </div>
                            <button
                                onClick={() => window.location.href = '/admin/users'}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                View All
                            </button>
                        </div>

                        {users && users.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Last Login</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Mobile Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user, index) => (
                                            <tr key={user._id || index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                            {user.image ? (
                                                                <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <FaUser className="text-white text-sm" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                            <p className="text-xs text-gray-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.accountStatus || user.isActive)} text-white`}>
                                                        {getStatusText(user.accountStatus || (user.isActive ? 'Active' : 'Inactive'))}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {formatDateTime(user.lastLogin)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusText(user.mobileNumber)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No users found</h3>
                                <p className="text-gray-500 text-sm">No users have registered yet</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Companies */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FaBuilding className="text-purple-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Companies</h2>
                            </div>
                            <button
                                onClick={() => window.location.href = '/admin/companies'}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                View All
                            </button>
                        </div>

                        {companies && companies.length > 0 ? (
                            <div className="space-y-4">
                                {companies.map((company, index) => (
                                    <div key={company._id || index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                                    {company.logo ? (
                                                        <img src={company.logo} alt={company.companyName} className="w-full h-full rounded-lg object-cover" />
                                                    ) : (
                                                        <FaBuilding className="text-blue-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{company.companyName}</h4>
                                                    <p className="text-xs text-gray-500">{company.industry || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${company.verified || company.verificationStatus === 'Verified'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {company.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FaCalendarAlt />
                                                <span>{formatDate(company.createdAt || company.accountCreatedAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleStatusChange('company', company._id,
                                                        company.verified ? 'unverify' : 'verify')}
                                                    className={`text-xs ${company.verified
                                                            ? 'text-red-600 hover:text-red-700'
                                                            : 'text-green-600 hover:text-green-700'
                                                        }`}
                                                >
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaBuilding className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No companies found</h3>
                                <p className="text-gray-500 text-sm">No companies have registered yet</p>
                            </div>
                        )}

                        {/* Platform Stats */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Platform Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Conversion Rate</span>
                                    <span className="font-bold text-blue-600">{stats?.conversionRate || 0}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Avg. Stipend</span>
                                    <span className="font-bold text-green-600">₹{stats?.avgStipend?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Active Internships</span>
                                    <span className="font-bold text-purple-600">{stats?.activeInternships || 0}</span>
                                </div>
                            </div>
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
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaBriefcase className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Internships</h2>
                            </div>
                            <button
                                onClick={() => window.location.href = '/admin/internships'}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                View All
                            </button>
                        </div>

                        {internships && internships.length > 0 ? (
                            <div className="space-y-4">
                                {internships.map((internship, index) => (
                                    <div key={internship._id || index} className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{internship.title}</h4>
                                                <p className="text-sm text-gray-600">{internship.companyInfo?.companyName || internship.companyName}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${internship.status === 'Published' || internship.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {getStatusText(internship.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                            <div className="flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-gray-400" />
                                                <span>{internship.location || 'Remote'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaMoneyBillWave className="text-gray-400" />
                                                <span>₹{internship.stipend?.amount?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">
                                                {formatDate(internship.createdAt)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleStatusChange('internship', internship._id,
                                                        (internship.status === 'Published' || internship.isActive) ? 'inactive' : 'active')}
                                                    className={`text-xs ${(internship.status === 'Published' || internship.isActive)
                                                            ? 'text-red-600 hover:text-red-700'
                                                            : 'text-green-600 hover:text-green-700'
                                                        }`}
                                                >
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No internships found</h3>
                                <p className="text-gray-500 text-sm">No internships have been posted yet</p>
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
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    <span className="capitalize">{activity.name}</span> {activity.action}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {activity.company ? `at ${activity.company}` : ''}
                                                    {activity.internship ? `for ${activity.internship}` : ''}
                                                    {activity.email ? `(${activity.email})` : ''}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDateTime(activity.time)}
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
                        ) : (
                            <div className="text-center py-8">
                                <FaClock className="text-4xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-600 mb-2">No recent activities</h3>
                                <p className="text-gray-500 text-sm">Activities will appear here</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => window.location.href = '/admin/users'}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition text-center"
                        >
                            <FaUsers className="text-blue-600 text-2xl mx-auto mb-2" />
                            <p className="font-medium text-gray-900">Manage Users</p>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/companies'}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition text-center"
                        >
                            <FaBuilding className="text-purple-600 text-2xl mx-auto mb-2" />
                            <p className="font-medium text-gray-900">Manage Companies</p>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/internships'}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition text-center"
                        >
                            <FaBriefcase className="text-green-600 text-2xl mx-auto mb-2" />
                            <p className="font-medium text-gray-900">Manage Internships</p>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/settings'}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition text-center"
                        >
                            <FaCog className="text-orange-600 text-2xl mx-auto mb-2" />
                            <p className="font-medium text-gray-900">Settings</p>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
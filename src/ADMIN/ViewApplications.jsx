// src/components/company/ViewApplications.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaEye,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaCalendarAlt,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaFileAlt,
    FaBriefcase,
    FaSearch,
    FaFilter,
    FaSync,
    FaSpinner,
    FaDownload,
    FaComment,
    FaStar,
    FaCalendarCheck,
    FaGraduationCap,
    FaMapMarkerAlt,
    FaExclamationTriangle,
    FaPaperPlane,
    FaChevronDown,
    FaChevronUp
} from 'react-icons/fa';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';

const ViewApplications = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('applications');

    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        internship: 'all',
        sortBy: 'date',
        sortOrder: 'desc'
    });

    // Data
    const [applications, setApplications] = useState([]);
    const [internships, setInternships] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        shortlisted: 0,
        interviewed: 0,
        selected: 0,
        rejected: 0
    });

    // Selected application
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);

    // Status update
    const [newStatus, setNewStatus] = useState('');
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);

    // Interview scheduling
    const [interviewData, setInterviewData] = useState({
        date: '',
        time: '',
        duration: 60,
        mode: 'online',
        meetingLink: '',
        notes: ''
    });

    // Processing states
    const [processingId, setProcessingId] = useState(null);
    const [processingAction, setProcessingAction] = useState('');

    // Expanded applications
    const [expandedApplications, setExpandedApplications] = useState(new Set());

    // Fetch applications and internships data
    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch company's internships first
            const internshipsRes = await axiosInstance.get('/internships/company/my-internships');
            const companyInternships = internshipsRes.data?.internships || [];
            setInternships(companyInternships);

            if (companyInternships.length === 0) {
                setApplications([]);
                setLoading(false);
                return;
            }

            // Fetch applications for each internship
            const allApplications = [];
            for (const internship of companyInternships) {
                try {
                    const appsRes = await axiosInstance.get(`/internships/${internship._id}/applications`);
                    const apps = appsRes.data?.applications || [];
                    apps.forEach(app => {
                        allApplications.push({
                            ...app,
                            internshipTitle: internship.title,
                            internshipDetails: internship
                        });
                    });
                } catch (err) {
                    console.error(`Error fetching applications for internship ${internship._id}:`, err);
                }
            }

            console.log('Applications data:', allApplications);

            // Calculate stats
            const total = allApplications.length;
            const pending = allApplications.filter(app => app.status === 'pending' || app.status === 'applied').length;
            const shortlisted = allApplications.filter(app => app.status === 'shortlisted').length;
            const interviewed = allApplications.filter(app => app.status === 'interviewed' || app.status === 'interview').length;
            const selected = allApplications.filter(app => app.status === 'selected' || app.status === 'accepted').length;
            const rejected = allApplications.filter(app => app.status === 'rejected').length;

            setApplications(allApplications);
            setStats({ total, pending, shortlisted, interviewed, selected, rejected });

        } catch (err) {
            console.error('Error fetching applications:', err);
            setError(err.response?.data?.message || 'Failed to load applications data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchApplications();
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Handle status change
    const handleStatusChange = async (applicationId, status) => {
        try {
            setProcessingId(applicationId);
            setProcessingAction('status');

            await axiosInstance.patch(`/internships/applications/${applicationId}`, {
                status,
                feedback: feedback || undefined,
                rating: rating || undefined
            });

            // Update local state
            setApplications(prev => prev.map(app =>
                app._id === applicationId
                    ? { ...app, status, feedback, rating }
                    : app
            ));

            // Update stats
            const oldStatus = applications.find(a => a._id === applicationId)?.status;
            updateStats(oldStatus, status);

            setShowStatusModal(false);
            setNewStatus('');
            setFeedback('');
            setRating(0);
            alert(`Application status updated to ${status}`);
        } catch (err) {
            console.error('Error updating application status:', err);
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingId(null);
            setProcessingAction('');
        }
    };

    // Handle interview scheduling
    const handleScheduleInterview = async (applicationId) => {
        try {
            setProcessingAction('interview');

            const interviewDateTime = new Date(`${interviewData.date}T${interviewData.time}`);

            await axiosInstance.patch(`/internships/applications/${applicationId}`, {
                status: 'interview',
                interviewDate: interviewDateTime.toISOString(),
                interviewNotes: interviewData.notes
            });

            // Update local state
            setApplications(prev => prev.map(app =>
                app._id === applicationId
                    ? {
                        ...app,
                        status: 'interview',
                        interviewDate: interviewDateTime.toISOString(),
                        interviewNotes: interviewData.notes
                    }
                    : app
            ));

            // Update stats
            const oldStatus = applications.find(a => a._id === applicationId)?.status;
            updateStats(oldStatus, 'interview');

            setShowInterviewModal(false);
            setInterviewData({
                date: '',
                time: '',
                duration: 60,
                mode: 'online',
                meetingLink: '',
                notes: ''
            });
            alert('Interview scheduled successfully!');
        } catch (err) {
            console.error('Error scheduling interview:', err);
            alert(`Failed to schedule interview: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingAction('');
        }
    };

    // Update stats helper
    const updateStats = (oldStatus, newStatus) => {
        setStats(prev => {
            const newStats = { ...prev };

            // Decrement old status
            if (oldStatus) {
                const normalizedOld = normalizeStatus(oldStatus);
                switch (normalizedOld) {
                    case 'pending': newStats.pending--; break;
                    case 'shortlisted': newStats.shortlisted--; break;
                    case 'interviewed': newStats.interviewed--; break;
                    case 'selected': newStats.selected--; break;
                    case 'rejected': newStats.rejected--; break;
                }
            }

            // Increment new status
            const normalizedNew = normalizeStatus(newStatus);
            switch (normalizedNew) {
                case 'pending': newStats.pending++; break;
                case 'shortlisted': newStats.shortlisted++; break;
                case 'interviewed': newStats.interviewed++; break;
                case 'selected': newStats.selected++; break;
                case 'rejected': newStats.rejected++; break;
            }

            return newStats;
        });
    };

    // Normalize status
    const normalizeStatus = (status) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower.includes('pending') || statusLower.includes('applied')) return 'pending';
        if (statusLower.includes('shortlisted')) return 'shortlisted';
        if (statusLower.includes('interview')) return 'interviewed';
        if (statusLower.includes('selected') || statusLower.includes('accepted')) return 'selected';
        if (statusLower.includes('rejected')) return 'rejected';
        return 'pending';
    };

    // View application details
    const handleViewDetails = async (application) => {
        try {
            // Fetch detailed student profile
            const studentRes = await axiosInstance.get(`/auth/profile/${application.studentId?._id || application.studentId}`);
            setSelectedApplication({
                ...application,
                studentDetails: studentRes.data
            });
            setShowDetailsModal(true);
        } catch (err) {
            console.error('Error fetching student details:', err);
            // Use basic info if detailed fetch fails
            setSelectedApplication(application);
            setShowDetailsModal(true);
        }
    };

    // Open status change modal
    const handleOpenStatusChange = (application) => {
        setSelectedApplication(application);
        setNewStatus(application.status || 'pending');
        setFeedback(application.feedback || '');
        setRating(application.rating || 0);
        setShowStatusModal(true);
    };

    // Open interview modal
    const handleOpenInterviewModal = (application) => {
        setSelectedApplication(application);

        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const timeStr = '10:00';

        setInterviewData({
            date: dateStr,
            time: timeStr,
            duration: 60,
            mode: 'online',
            meetingLink: '',
            notes: ''
        });
        setShowInterviewModal(true);
    };

    // Toggle application expansion
    const toggleApplicationExpansion = (applicationId) => {
        const newExpanded = new Set(expandedApplications);
        if (newExpanded.has(applicationId)) {
            newExpanded.delete(applicationId);
        } else {
            newExpanded.add(applicationId);
        }
        setExpandedApplications(newExpanded);
    };

    // Close all modals
    const closeAllModals = () => {
        setShowDetailsModal(false);
        setShowStatusModal(false);
        setShowInterviewModal(false);
        setSelectedApplication(null);
        setNewStatus('');
        setFeedback('');
        setRating(0);
        setInterviewData({
            date: '',
            time: '',
            duration: 60,
            mode: 'online',
            meetingLink: '',
            notes: ''
        });
    };

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            (app.studentId?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (app.studentId?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (app.internshipTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        const matchesStatus =
            filters.status === 'all' ? true : normalizeStatus(app.status) === filters.status;

        const matchesInternship =
            filters.internship === 'all' ? true : app.internshipDetails?._id === filters.internship;

        return matchesSearch && matchesStatus && matchesInternship;
    });

    // Sort applications
    const sortedApplications = [...filteredApplications].sort((a, b) => {
        let aValue, bValue;

        switch (filters.sortBy) {
            case 'date':
                aValue = new Date(a.applicationDate || a.createdAt);
                bValue = new Date(b.applicationDate || b.createdAt);
                break;
            case 'name':
                aValue = a.studentId?.name?.toLowerCase() || '';
                bValue = b.studentId?.name?.toLowerCase() || '';
                break;
            case 'rating':
                aValue = a.rating || 0;
                bValue = b.rating || 0;
                break;
            default:
                aValue = new Date(a.applicationDate || a.createdAt);
                bValue = new Date(b.applicationDate || b.createdAt);
        }

        if (filters.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge style
    const getStatusBadge = (status) => {
        const normalized = normalizeStatus(status);

        switch (normalized) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'shortlisted':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'interviewed':
                return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'selected':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // Get status text
    const getStatusText = (status) => {
        const normalized = normalizeStatus(status);

        switch (normalized) {
            case 'pending': return 'Pending';
            case 'shortlisted': return 'Shortlisted';
            case 'interviewed': return 'Interviewed';
            case 'selected': return 'Selected';
            case 'rejected': return 'Rejected';
            default: return 'Applied';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        const normalized = normalizeStatus(status);

        switch (normalized) {
            case 'pending': return <FaClock className="text-yellow-600" />;
            case 'shortlisted': return <FaStar className="text-blue-600" />;
            case 'interviewed': return <FaCalendarCheck className="text-purple-600" />;
            case 'selected': return <FaCheckCircle className="text-green-600" />;
            case 'rejected': return <FaTimesCircle className="text-red-600" />;
            default: return <FaPaperPlane className="text-gray-600" />;
        }
    };

    if (loading && !refreshing) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading applications...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                            View <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Applications</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Review and manage internship applications</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search applicants..."
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
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FaFileAlt className="text-blue-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.total}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Applications</h3>
                        <p className="text-xs text-gray-500 mt-1">All applications received</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <FaClock className="text-yellow-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.pending}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Pending</h3>
                        <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FaStar className="text-blue-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.shortlisted}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Shortlisted</h3>
                        <p className="text-xs text-gray-500 mt-1">Candidates shortlisted</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <FaCalendarCheck className="text-purple-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.interviewed}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Interviewed</h3>
                        <p className="text-xs text-gray-500 mt-1">Candidates interviewed</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <FaCheckCircle className="text-green-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.selected}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Selected</h3>
                        <p className="text-xs text-gray-500 mt-1">Candidates selected</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <FaTimesCircle className="text-red-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.rejected}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Rejected</h3>
                        <p className="text-xs text-gray-500 mt-1">Candidates not selected</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <FaFilter className="text-gray-400 text-xl" />
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="interviewed">Interviewed</option>
                                    <option value="selected">Selected</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Internship</label>
                                <select
                                    value={filters.internship}
                                    onChange={(e) => setFilters(prev => ({ ...prev, internship: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Internships</option>
                                    {internships.map(internship => (
                                        <option key={internship._id} value={internship._id}>
                                            {internship.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                <div className="flex gap-2">
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        <option value="date">Application Date</option>
                                        <option value="name">Student Name</option>
                                        <option value="rating">Rating</option>
                                    </select>
                                    <button
                                        onClick={() => setFilters(prev => ({
                                            ...prev,
                                            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                                        }))}
                                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Applications List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Applications ({filteredApplications.length})
                            </h2>
                            <span className="text-sm text-gray-500">
                                Showing {Math.min(filteredApplications.length, 10)} applications
                            </span>
                        </div>
                    </div>

                    {error ? (
                        <div className="p-8 text-center">
                            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : internships.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Internships Posted</h3>
                            <p className="text-gray-600 mb-4">Post internships to start receiving applications</p>
                            <button
                                onClick={() => window.location.href = '/company/internships/add'}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Post Your First Internship
                            </button>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchQuery
                                    ? 'No applications match your search criteria'
                                    : 'No applications received yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {sortedApplications.map((application, index) => (
                                <motion.div
                                    key={application._id || index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-6 hover:bg-gray-50 transition-colors"
                                >
                                    {/* Application Header */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <FaUser className="text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {application.studentId?.name || 'Applicant'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(application.status)}`}>
                                                            {getStatusText(application.status)}
                                                        </span>
                                                        {application.rating > 0 && (
                                                            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">
                                                                <FaStar className="inline mr-1" /> {application.rating}/5
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{application.studentId?.email || 'No email provided'}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Applied for: <span className="font-medium">{application.internshipTitle}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleApplicationExpansion(application._id)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                            >
                                                {expandedApplications.has(application._id) ? <FaChevronUp /> : <FaChevronDown />}
                                            </button>
                                            <button
                                                onClick={() => handleViewDetails(application)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Application Details (Expanded) */}
                                    {expandedApplications.has(application._id) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-6 pt-6 border-t border-gray-200"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Application Info */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Application Details</h4>
                                                        <div className="bg-gray-50 p-4 rounded-lg">
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-sm text-gray-600">Applied On:</span>
                                                                <span className="font-medium">{formatDate(application.applicationDate || application.createdAt)}</span>
                                                            </div>
                                                            {application.interviewDate && (
                                                                <div className="flex justify-between mb-2">
                                                                    <span className="text-sm text-gray-600">Interview Date:</span>
                                                                    <span className="font-medium">{formatDateTime(application.interviewDate)}</span>
                                                                </div>
                                                            )}
                                                            {application.coverLetter && (
                                                                <div className="mt-3">
                                                                    <h5 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h5>
                                                                    <p className="text-sm text-gray-600 line-clamp-3">{application.coverLetter}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Resume */}
                                                    {application.resume && (
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Resume</h4>
                                                            <a
                                                                href={application.resume}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                                            >
                                                                <FaDownload /> Download Resume
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-medium text-gray-700">Actions</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            onClick={() => handleOpenStatusChange(application)}
                                                            className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                                        >
                                                            <FaCheckCircle /> Change Status
                                                        </button>

                                                        {application.status !== 'selected' && application.status !== 'rejected' && (
                                                            <button
                                                                onClick={() => handleOpenInterviewModal(application)}
                                                                className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition flex items-center justify-center gap-2"
                                                            >
                                                                <FaCalendarCheck /> Schedule Interview
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => window.location.href = `mailto:${application.studentId?.email}`}
                                                            className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-2"
                                                        >
                                                            <FaEnvelope /> Contact
                                                        </button>

                                                        <button
                                                            onClick={() => handleViewDetails(application)}
                                                            className="p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
                                                        >
                                                            <FaEye /> View Profile
                                                        </button>
                                                    </div>

                                                    {application.feedback && (
                                                        <div className="mt-4">
                                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Feedback</h5>
                                                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                                {application.feedback}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Application Details Modal */}
            {showDetailsModal && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {/* Student Profile */}
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {selectedApplication.studentDetails?.image ? (
                                        <img
                                            src={selectedApplication.studentDetails.image}
                                            alt={selectedApplication.studentDetails.name}
                                            className="w-full h-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <FaUser className="text-blue-600 text-3xl" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedApplication.studentId?.name}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedApplication.status)}`}>
                                            {getStatusText(selectedApplication.status)}
                                        </span>
                                        {selectedApplication.rating > 0 && (
                                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                                                <FaStar className="inline mr-1" /> Rating: {selectedApplication.rating}/5
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mt-3">
                                        Applied for: <span className="font-semibold">{selectedApplication.internshipTitle}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaEnvelope className="text-blue-600" />
                                        Contact Information
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="text-gray-900">{selectedApplication.studentId?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="text-gray-900">{selectedApplication.studentDetails?.mobileNumber || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Address</p>
                                            <p className="text-gray-900">{selectedApplication.studentDetails?.address || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Education */}
                                {selectedApplication.studentDetails?.education && selectedApplication.studentDetails.education.length > 0 && (
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <FaGraduationCap className="text-green-600" />
                                            Education
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedApplication.studentDetails.education.map((edu, index) => (
                                                <div key={index} className="border-l-4 border-green-500 pl-4">
                                                    <p className="font-medium text-gray-900">{edu.institution}</p>
                                                    <p className="text-sm text-gray-600">{edu.degree} in {edu.fieldOfStudy}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            {selectedApplication.studentDetails?.skills && selectedApplication.studentDetails.skills.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedApplication.studentDetails.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cover Letter */}
                            {selectedApplication.coverLetter && (
                                <div className="mb-8">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h4>
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <p className="text-gray-700 whitespace-pre-line">{selectedApplication.coverLetter}</p>
                                    </div>
                                </div>
                            )}

                            {/* Application Timeline */}
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <FaPaperPlane className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Application Submitted</p>
                                                <p className="text-sm text-gray-500">{formatDateTime(selectedApplication.applicationDate || selectedApplication.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedApplication.interviewDate && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <FaCalendarCheck className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Interview Scheduled</p>
                                                    <p className="text-sm text-gray-500">{formatDateTime(selectedApplication.interviewDate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                {getStatusIcon(selectedApplication.status)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Current Status</p>
                                                <p className="text-sm text-gray-500">{getStatusText(selectedApplication.status)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                            <button
                                onClick={closeAllModals}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    closeAllModals();
                                    handleOpenStatusChange(selectedApplication);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Update Status
                            </button>
                            {selectedApplication.resume && (
                                <a
                                    href={selectedApplication.resume}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Download Resume
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Update Application Status</h2>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleStatusChange(selectedApplication._id, newStatus);
                        }}>
                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Applicant
                                    </label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                            <FaUser className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedApplication.studentId?.name}</p>
                                            <p className="text-sm text-gray-500">{selectedApplication.internshipTitle}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Status *
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="shortlisted">Shortlisted</option>
                                        <option value="interview">Interview</option>
                                        <option value="selected">Selected</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating (Optional)
                                    </label>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="text-2xl"
                                            >
                                                <FaStar className={star <= rating ? "text-yellow-500" : "text-gray-300"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Feedback (Optional)
                                    </label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        rows="3"
                                        placeholder="Add feedback for the applicant..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={closeAllModals}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingId === selectedApplication._id && processingAction === 'status'}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processingId === selectedApplication._id && processingAction === 'status' ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Updating...
                                        </>
                                    ) : (
                                        'Update Status'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Interview Scheduling Modal */}
            {showInterviewModal && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleScheduleInterview(selectedApplication._id);
                        }}>
                            <div className="p-6">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                            <FaUser className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedApplication.studentId?.name}</p>
                                            <p className="text-sm text-gray-500">{selectedApplication.internshipTitle}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={interviewData.date}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, date: e.target.value }))}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={interviewData.time}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, time: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="15"
                                        max="180"
                                        value={interviewData.duration}
                                        onChange={(e) => setInterviewData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Interview Mode
                                    </label>
                                    <select
                                        value={interviewData.mode}
                                        onChange={(e) => setInterviewData(prev => ({ ...prev, mode: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="online">Online</option>
                                        <option value="offline">Offline</option>
                                        <option value="phone">Phone</option>
                                    </select>
                                </div>

                                {interviewData.mode === 'online' && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meeting Link (Optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={interviewData.meetingLink}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, meetingLink: e.target.value }))}
                                            placeholder="https://meet.google.com/..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={interviewData.notes}
                                        onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows="3"
                                        placeholder="Add interview notes or instructions..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={closeAllModals}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingAction === 'interview'}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processingAction === 'interview' ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Scheduling...
                                        </>
                                    ) : (
                                        <>
                                            <FaCalendarCheck /> Schedule Interview
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ViewApplications;
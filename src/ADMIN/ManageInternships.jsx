// src/components/admin/ManageInternships.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaBriefcase,
    FaBuilding,
    FaEye,
    FaEdit,
    FaTrash,
    FaSearch,
    FaFilter,
    FaSync,
    FaSpinner,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaUsers,
    FaClock,
    FaFileAlt,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaChartBar,
    FaSortAmountDown,
    FaSortAmountUp,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';

const ManageInternships = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('internships');

    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        category: 'all',
        workMode: 'all',
        location: 'all'
    });

    // Sort
    const [sort, setSort] = useState({
        field: 'createdAt',
        order: 'desc'
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    // Data
    const [internships, setInternships] = useState([]);
    const [availableFilters, setAvailableFilters] = useState({
        categories: [],
        workModes: [],
        locations: [],
        companies: []
    });
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        closed: 0,
        archived: 0
    });

    // Selected internship
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    // Processing states
    const [processingId, setProcessingId] = useState(null);
    const [processingAction, setProcessingAction] = useState('');

    // New status
    const [newStatus, setNewStatus] = useState('Published');

    // Fetch internships data
    const fetchInternships = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            // Build query params
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                sortBy: sort.field,
                sortOrder: sort.order
            });

            // Add filters
            if (filters.status !== 'all') {
                params.append('status', filters.status);
            }
            if (filters.category !== 'all') {
                params.append('category', filters.category);
            }
            if (filters.workMode !== 'all') {
                params.append('workMode', filters.workMode);
            }
            if (filters.location !== 'all') {
                params.append('location', filters.location);
            }
            if (searchQuery) {
                params.append('q', searchQuery);
            }

            const response = await axiosInstance.get(`/internships?${params}`);
            console.log('Internships API Response:', response.data);

            const internshipsData = response.data?.internships || [];
            const paginationData = response.data?.pagination || {};
            const availableFiltersData = response.data?.filters || {};

            // Calculate stats
            const total = paginationData.total || internshipsData.length;
            const published = internshipsData.filter(i => i.status === 'Published').length;
            const draft = internshipsData.filter(i => i.status === 'Draft').length;
            const closed = internshipsData.filter(i => i.status === 'Closed').length;
            const archived = internshipsData.filter(i => i.status === 'Archived').length;

            // Get unique companies for filter
            const companies = [...new Set(internshipsData.map(i => i.companyInfo?.companyName).filter(Boolean))];

            setInternships(internshipsData);
            setPagination(paginationData);
            setAvailableFilters({
                categories: availableFiltersData.categories || [],
                workModes: availableFiltersData.workModes || [],
                locations: availableFiltersData.locations || [],
                companies
            });
            setStats({ total, published, draft, closed, archived });

        } catch (err) {
            console.error('Error fetching internships:', err);
            setError(err.response?.data?.message || 'Failed to load internships data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, [filters, sort]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchInternships(pagination.page);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Handle sort change
    const handleSortChange = (field) => {
        setSort(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Handle status change
    const handleStatusChange = async (internshipId, status) => {
        try {
            setProcessingId(internshipId);
            setProcessingAction('status');

            await axiosInstance.patch(`/internships/${internshipId}`, {
                status
            });

            // Update local state
            setInternships(prev => prev.map(internship =>
                internship._id === internshipId
                    ? { ...internship, status }
                    : internship
            ));

            // Update stats
            setStats(prev => {
                const oldStatus = internships.find(i => i._id === internshipId)?.status;
                const newStats = { ...prev };

                // Decrement old status
                if (oldStatus) {
                    switch (oldStatus) {
                        case 'Published': newStats.published--; break;
                        case 'Draft': newStats.draft--; break;
                        case 'Closed': newStats.closed--; break;
                        case 'Archived': newStats.archived--; break;
                    }
                }

                // Increment new status
                switch (status) {
                    case 'Published': newStats.published++; break;
                    case 'Draft': newStats.draft++; break;
                    case 'Closed': newStats.closed++; break;
                    case 'Archived': newStats.archived++; break;
                }

                return newStats;
            });

            setShowStatusModal(false);
            setSelectedInternship(null);
            toast.success(`Internship status updated to ${status}`);
        } catch (err) {
            console.error('Error updating internship status:', err);
            toast.error(`Failed to update status: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingId(null);
            setProcessingAction('');
        }
    };

    // Handle delete internship
    const handleDeleteInternship = async () => {
        try {
            setProcessingAction('delete');

            await axiosInstance.delete(`/internships/${selectedInternship._id}`);

            // Update local state
            setInternships(prev => prev.filter(internship => internship._id !== selectedInternship._id));

            // Update stats
            setStats(prev => {
                const newStats = { ...prev };
                newStats.total--;

                switch (selectedInternship.status) {
                    case 'Published': newStats.published--; break;
                    case 'Draft': newStats.draft--; break;
                    case 'Closed': newStats.closed--; break;
                    case 'Archived': newStats.archived--; break;
                }

                return newStats;
            });

            setShowDeleteModal(false);
            setSelectedInternship(null);
            toast.success('Internship deleted successfully!');
        } catch (err) {
            console.error('Error deleting internship:', err);
            toast.error(`Failed to delete internship: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingAction('');
        }
    };

    // View details
    const handleViewDetails = (internship) => {
        setSelectedInternship(internship);
        setShowDetailsModal(true);
    };

    // Open status change modal
    const handleOpenStatusChange = (internship) => {
        setSelectedInternship(internship);
        setNewStatus(internship.status);
        setShowStatusModal(true);
    };

    // Open delete modal
    const handleOpenDelete = (internship) => {
        setSelectedInternship(internship);
        setShowDeleteModal(true);
    };

    // Close all modals
    const closeAllModals = () => {
        setShowDetailsModal(false);
        setShowDeleteModal(false);
        setShowStatusModal(false);
        setSelectedInternship(null);
        setNewStatus('Published');
    };

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

    // Format currency
    const formatCurrency = (amount, currency = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Get status badge style
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'published':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'closed':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'archived':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'published':
                return <FaCheckCircle className="text-green-600" />;
            case 'draft':
                return <FaFileAlt className="text-yellow-600" />;
            case 'closed':
                return <FaClock className="text-blue-600" />;
            case 'archived':
                return <FaTimesCircle className="text-gray-600" />;
            default:
                return null;
        }
    };

    // Check if internship is expired
    const isExpired = (applicationDeadline) => {
        if (!applicationDeadline) return false;
        return new Date(applicationDeadline) < new Date();
    };

    // Check if positions are filled
    const isFilled = (internship) => {
        return internship.filledPositions >= internship.openings;
    };

    if (loading && !refreshing) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading internships data...</p>
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
                            Manage <span className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">Internships</span>
                        </h1>
                        <p className="text-gray-600 mt-2">View and manage all internships</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search internships..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                                {stats.total}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Internships</h3>
                        <p className="text-xs text-gray-500 mt-1">All internships</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <FaCheckCircle className="text-green-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.published}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Published</h3>
                        <p className="text-xs text-gray-500 mt-1">Active and visible</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <FaFileAlt className="text-yellow-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.draft}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Draft</h3>
                        <p className="text-xs text-gray-500 mt-1">Not published yet</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FaClock className="text-blue-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.closed}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Closed</h3>
                        <p className="text-xs text-gray-500 mt-1">Applications closed</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                <FaTimesCircle className="text-gray-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.archived}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Archived</h3>
                        <p className="text-xs text-gray-500 mt-1">Old internships</p>
                    </motion.div>
                </div>

                {/* Filters and Sort */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <FaFilter className="text-gray-400 text-xl" />
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Categories</option>
                                    {availableFilters.categories.map((category, index) => (
                                        <option key={index} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                                <select
                                    value={filters.workMode}
                                    onChange={(e) => handleFilterChange('workMode', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Work Modes</option>
                                    {availableFilters.workModes.map((mode, index) => (
                                        <option key={index} value={mode}>{mode}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <select
                                    value={filters.location}
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Locations</option>
                                    {availableFilters.locations.map((location, index) => (
                                        <option key={index} value={location}>{location}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FaSortAmountDown className="text-gray-400" />
                                <select
                                    value={sort.field}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="createdAt">Created Date</option>
                                    <option value="title">Title</option>
                                    <option value="stipend.amount">Stipend</option>
                                    <option value="applicationsCount">Applications</option>
                                    <option value="views">Views</option>
                                </select>
                                <button
                                    onClick={() => setSort(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    {sort.order === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Internships Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Internships ({internships.length})
                            </h2>
                            <span className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.pages}
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No internships found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchQuery
                                    ? 'No internships match your search criteria'
                                    : 'No internships found with current filters'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Internship</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Company</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Details</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Stats</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {internships.map((internship, index) => (
                                        <motion.tr
                                            key={internship._id || index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`hover:bg-gray-50 transition-colors ${isExpired(internship.applicationDeadline) ? 'bg-red-50 hover:bg-red-100' : ''
                                                }`}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FaBriefcase className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{internship.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${internship.category ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
                                                                }`}>
                                                                {internship.category || 'General'}
                                                            </span>
                                                            {isExpired(internship.applicationDeadline) && (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                                    Expired
                                                                </span>
                                                            )}
                                                            {isFilled(internship) && (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                                    Filled
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                                        {internship.companyInfo?.logo ? (
                                                            <img
                                                                src={internship.companyInfo.logo}
                                                                alt={internship.companyInfo.companyName}
                                                                className="w-full h-full rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <FaBuilding className="text-purple-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {internship.companyInfo?.companyName || 'Unknown Company'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {internship.companyInfo?.verified ? 'Verified' : 'Unverified'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaMapMarkerAlt className="text-gray-400" />
                                                        <span>{internship.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaMoneyBillWave className="text-gray-400" />
                                                        <span>{formatCurrency(internship.stipend?.amount, internship.stipend?.currency)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaCalendarAlt className="text-gray-400" />
                                                        <span>Deadline: {formatDate(internship.applicationDeadline)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Positions:</span>
                                                        <span className="font-medium">
                                                            {internship.filledPositions || 0}/{internship.openings}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Applications:</span>
                                                        <span className="font-medium">{internship.applicationsCount || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Views:</span>
                                                        <span className="font-medium">{internship.views || 0}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(internship.status)}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(internship.status)}`}>
                                                        {internship.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Created: {formatDate(internship.createdAt)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(internship)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenStatusChange(internship)}
                                                        disabled={processingId === internship._id && processingAction === 'status'}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                                        title="Change Status"
                                                    >
                                                        {processingId === internship._id && processingAction === 'status' ? (
                                                            <FaSpinner className="animate-spin" />
                                                        ) : (
                                                            <FaEdit />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenDelete(internship)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete Internship"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {internships.length > 0 && pagination.pages > 1 && (
                        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} internships
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchInternships(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => fetchInternships(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Internship Details Modal */}
            {showDetailsModal && selectedInternship && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Internship Details</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row gap-6 mb-8">
                                <div className="md:w-2/3">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedInternship.title}</h3>
                                    <div className="flex flex-wrap items-center gap-4 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedInternship.status)}`}>
                                            {selectedInternship.status}
                                        </span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                            {selectedInternship.category}
                                        </span>
                                        {isExpired(selectedInternship.applicationDeadline) && (
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                                Expired
                                            </span>
                                        )}
                                        {isFilled(selectedInternship) && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                Positions Filled
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700">{selectedInternship.description}</p>
                                </div>
                                <div className="md:w-1/3">
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Stipend:</span>
                                                <span className="font-semibold">
                                                    {formatCurrency(selectedInternship.stipend?.amount, selectedInternship.stipend?.currency)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Duration:</span>
                                                <span className="font-semibold">{selectedInternship.duration} months</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Work Mode:</span>
                                                <span className="font-semibold">{selectedInternship.workMode}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Type:</span>
                                                <span className="font-semibold">{selectedInternship.internshipType}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Company Info */}
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaBuilding className="text-purple-600" />
                                        Company Information
                                    </h4>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                            {selectedInternship.companyInfo?.logo ? (
                                                <img
                                                    src={selectedInternship.companyInfo.logo}
                                                    alt={selectedInternship.companyInfo.companyName}
                                                    className="w-full h-full rounded-lg object-cover"
                                                />
                                            ) : (
                                                <FaBuilding className="text-purple-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedInternship.companyInfo?.companyName}</p>
                                            <p className="text-sm text-gray-600">{selectedInternship.companyInfo?.industry}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm">
                                            <span className="text-gray-600">Status:</span>{' '}
                                            <span className={`font-medium ${selectedInternship.companyInfo?.verified ? 'text-green-600' : 'text-yellow-600'
                                                }`}>
                                                {selectedInternship.companyInfo?.verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </p>
                                        <p className="text-sm">
                                            <span className="text-gray-600">Size:</span>{' '}
                                            <span className="font-medium">{selectedInternship.companyInfo?.companySize}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Location & Dates */}
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-red-600" />
                                        Location & Dates
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Location</p>
                                            <p className="font-medium text-gray-900">{selectedInternship.location}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Start Date</p>
                                            <p className="font-medium text-gray-900">{formatDate(selectedInternship.startDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Application Deadline</p>
                                            <p className={`font-medium ${isExpired(selectedInternship.applicationDeadline) ? 'text-red-600' : 'text-gray-900'
                                                }`}>
                                                {formatDate(selectedInternship.applicationDeadline)}
                                                {isExpired(selectedInternship.applicationDeadline) && ' (Expired)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaChartBar className="text-blue-600" />
                                        Statistics
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Openings</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">
                                                    {selectedInternship.filledPositions || 0}/{selectedInternship.openings}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${isFilled(selectedInternship)
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {isFilled(selectedInternship) ? 'Filled' : 'Open'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Applications</span>
                                            <span className="font-bold text-gray-900">{selectedInternship.applicationsCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Views</span>
                                            <span className="font-bold text-gray-900">{selectedInternship.views || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created</span>
                                            <span className="font-medium text-gray-900">{formatDate(selectedInternship.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Requirements & Responsibilities */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h4>
                                    <ul className="space-y-2">
                                        {selectedInternship.requirements?.map((req, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
                                                <span className="text-gray-700">{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h4>
                                    <ul className="space-y-2">
                                        {selectedInternship.responsibilities?.map((resp, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <FaCheckCircle className="text-blue-600 mt-1 flex-shrink-0" />
                                                <span className="text-gray-700">{resp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Skills */}
                            {selectedInternship.skills && selectedInternship.skills.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedInternship.skills.map((skill, index) => (
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

                            {/* Perks */}
                            {selectedInternship.perks && selectedInternship.perks.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Perks & Benefits</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedInternship.perks.map((perk, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                                            >
                                                {perk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                    handleOpenStatusChange(selectedInternship);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                Change Status
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Status Change Modal */}
            {showStatusModal && selectedInternship && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Change Internship Status</h2>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <p className="text-gray-600 mb-2">Internship:</p>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                                        <FaBriefcase className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedInternship.title}</p>
                                        <p className="text-sm text-gray-500">
                                            Current: <span className={`font-medium ${getStatusBadge(selectedInternship.status)} px-2 py-1 rounded`}>
                                                {selectedInternship.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Status
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Published">Published (Visible to all)</option>
                                    <option value="Draft">Draft (Hidden from public)</option>
                                    <option value="Closed">Closed (Applications closed)</option>
                                    <option value="Archived">Archived (Historical record)</option>
                                </select>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-yellow-800 font-medium">Important Note</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Changing status to "Published" will make this internship visible to all users.
                                            Changing to "Draft" will hide it from public view.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                            <button
                                onClick={closeAllModals}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleStatusChange(selectedInternship._id, newStatus)}
                                disabled={processingId === selectedInternship._id && processingAction === 'status'}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {processingId === selectedInternship._id && processingAction === 'status' ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Updating...
                                    </>
                                ) : (
                                    'Update Status'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedInternship && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Delete Internship</h2>
                            <p className="text-gray-600">Are you sure you want to delete this internship? This action cannot be undone.</p>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                                <FaExclamationTriangle className="text-red-600 text-xl" />
                                <div>
                                    <p className="font-medium text-red-800">{selectedInternship.title}</p>
                                    <p className="text-sm text-red-600">This will permanently delete the internship.</p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 mb-4 space-y-2">
                                <p><strong>Company:</strong> {selectedInternship.companyInfo?.companyName}</p>
                                <p><strong>Status:</strong> {selectedInternship.status}</p>
                                <p><strong>Applications:</strong> {selectedInternship.applicationsCount || 0}</p>
                                <p><strong>Positions Filled:</strong> {selectedInternship.filledPositions || 0}/{selectedInternship.openings}</p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> If this internship has applications, it will be archived instead of deleted.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                            <button
                                onClick={closeAllModals}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteInternship}
                                disabled={processingAction === 'delete'}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {processingAction === 'delete' ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FaTrash /> Delete Internship
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ManageInternships;
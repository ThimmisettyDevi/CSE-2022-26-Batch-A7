// src/components/Applications/MyApplications.jsx
import React, { useState, useEffect } from 'react';
import {
    FaSearch,
    FaFilter,
    FaCalendarAlt,
    FaClock,
    FaBriefcase,
    FaBuilding,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassHalf,
    FaFileAlt,
    FaEye,
    FaTrash,
    FaChartLine,
    FaSortAmountDown,
    FaSortAmountUp,
    FaExternalLinkAlt,
    FaEnvelope,
    FaPhone,
    FaUser,
    FaStar,
    FaCalendarCheck,
    FaCalendarTimes,
    FaUserCircle,
    FaGraduationCap,
    FaLink,
    FaGithub,
    FaLinkedin
} from 'react-icons/fa';
import {
    MdWork,
    MdLocationOn,
    MdAttachMoney,
    MdAccessTime,
    MdDescription,
    MdDateRange
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';

const MyApplications = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('applications');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');
    const [showFilters, setShowFilters] = useState(false);
    const [showApplicationDetails, setShowApplicationDetails] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        company: '',
        location: '',
        category: ''
    });

    // State for applications data
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        Applied: 0,
        Shortlisted: 0,
        Interviewed: 0,
        Selected: 0,
        Rejected: 0,
        Withdrawn: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    // State for filter options
    const [filterOptions, setFilterOptions] = useState({
        companies: [],
        locations: [],
        categories: [],
        statuses: [
            { value: 'Applied', label: 'Applied', color: 'bg-yellow-100 text-yellow-800' },
            { value: 'Shortlisted', label: 'Shortlisted', color: 'bg-blue-100 text-blue-800' },
            { value: 'Interviewed', label: 'Interviewed', color: 'bg-purple-100 text-purple-800' },
            { value: 'Selected', label: 'Selected', color: 'bg-green-100 text-green-800' },
            { value: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
            { value: 'Withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' }
        ]
    });

    // Fetch applications data
    const fetchApplications = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                ...(searchQuery && { search: searchQuery }),
                ...(filters.status && { status: filters.status }),
                ...(filters.company && { company: filters.company }),
                ...(filters.location && { location: filters.location }),
                ...(filters.category && { category: filters.category }),
                sortBy: sortBy
            });

            // Using the my-applications endpoint
            const response = await axiosInstance.get(`/applications/my-applications?${params}`);
            const { applications: data, stats: statsData, pagination: paginationData } = response.data;

            setApplications(data);
            
            // Update stats from backend response
            const updatedStats = {
                total: paginationData.total || 0,
                Applied: statsData?.Applied || 0,
                Shortlisted: statsData?.Shortlisted || 0,
                Interviewed: statsData?.Interviewed || 0,
                Selected: statsData?.Selected || 0,
                Rejected: statsData?.Rejected || 0,
                Withdrawn: statsData?.Withdrawn || 0
            };
            setStats(updatedStats);
            
            setPagination(paginationData);

            // Extract filter options from applications
            if (data.length > 0) {
                const companies = [...new Set(data.map(app => 
                    app.internshipId?.companyId?.companyName || app.internship?.companyInfo?.companyName
                ).filter(Boolean))];
                
                const locations = [...new Set(data.map(app => 
                    app.internshipId?.location || app.internship?.location
                ).filter(Boolean))];
                
                const categories = [...new Set(data.map(app => 
                    app.internshipId?.category || app.internship?.category
                ).filter(Boolean))];

                setFilterOptions(prev => ({
                    ...prev,
                    companies,
                    locations,
                    categories
                }));
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [sortBy]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchApplications(1);
    };

    // Handle filter change
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Apply filters
    const applyFilters = () => {
        fetchApplications(1);
        setShowFilters(false);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            status: '',
            company: '',
            location: '',
            category: ''
        });
        setSearchQuery('');
        fetchApplications(1);
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchApplications(page);
    };

    // Handle sort change
    const handleSortChange = (newSortBy) => {
        // Remove the '-' prefix if present to check field name
        const fieldName = newSortBy.startsWith('-') ? newSortBy.substring(1) : newSortBy;
        const currentField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
        
        if (fieldName === currentField) {
            // Toggle sort order if same field
            const newSort = sortBy.startsWith('-') ? fieldName : `-${fieldName}`;
            setSortBy(newSort);
        } else {
            // Set new sort field with default descending order
            setSortBy(`-${fieldName}`);
        }
    };

    // Get sort display text
    const getSortDisplayText = () => {
        const field = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
        const order = sortBy.startsWith('-') ? ' (Newest First)' : ' (Oldest First)';
        
        const sortOptions = {
            'createdAt': 'Application Date',
            'updatedAt': 'Last Updated',
            'status': 'Status',
            'applicationDate': 'Application Date'
        };

        return `${sortOptions[field] || 'Application Date'}${order}`;
    };

    // Get status color and icon
    const getStatusInfo = (status) => {
        switch (status) {
            case 'Selected':
                return {
                    color: 'bg-green-100 text-green-800 border-green-200',
                    icon: <FaCheckCircle className="text-green-500" />,
                    label: 'Selected'
                };
            case 'Shortlisted':
                return {
                    color: 'bg-blue-100 text-blue-800 border-blue-200',
                    icon: <FaStar className="text-blue-500" />,
                    label: 'Shortlisted'
                };
            case 'Interviewed':
                return {
                    color: 'bg-purple-100 text-purple-800 border-purple-200',
                    icon: <FaCalendarCheck className="text-purple-500" />,
                    label: 'Interviewed'
                };
            case 'Rejected':
                return {
                    color: 'bg-red-100 text-red-800 border-red-200',
                    icon: <FaTimesCircle className="text-red-500" />,
                    label: 'Rejected'
                };
            case 'Withdrawn':
                return {
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    icon: <FaCalendarTimes className="text-gray-500" />,
                    label: 'Withdrawn'
                };
            case 'Applied':
            default:
                return {
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    icon: <FaHourglassHalf className="text-yellow-500" />,
                    label: 'Applied'
                };
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format time
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get days since application
    const getDaysSince = (dateString) => {
        if (!dateString) return 0;
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // View application details
    const viewApplicationDetails = (application) => {
        setSelectedApplication(application);
        setShowApplicationDetails(true);
    };

    // Close application details
    const closeApplicationDetails = () => {
        setShowApplicationDetails(false);
        setSelectedApplication(null);
    };

    // Withdraw application
    const withdrawApplication = async (applicationId) => {
        if (!window.confirm('Are you sure you want to withdraw this application?')) {
            return;
        }

        try {
            await axiosInstance.post(`/applications/${applicationId}/withdraw`);

            // Update local state
            setApplications(prev => prev.map(app =>
                app._id === applicationId
                    ? { ...app, status: 'Withdrawn', updatedAt: new Date().toISOString() }
                    : app
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                Withdrawn: prev.Withdrawn + 1,
                Applied: prev.Applied - 1
            }));

            toast.success('Application withdrawn successfully');
        } catch (error) {
            console.error('Error withdrawing application:', error);
            toast.error(error.response?.data?.message || 'Failed to withdraw application');
        }
    };

    // Get internship details safely
    const getInternshipDetails = (application) => {
        const internship = application.internshipId || application.internship || {};
        const companyId = internship.companyId || {};
        
        return {
            title: internship.title || 'Internship',
            location: internship.location || 'Remote',
            workMode: internship.workMode || 'Full-time',
            duration: internship.duration || 0,
            stipend: internship.stipend || { amount: 0, currency: 'INR', type: 'Fixed' },
            category: internship.category || 'General',
            skills: internship.skills || [],
            description: internship.description || '',
            requirements: internship.requirements || [],
            companyName: companyId.companyName || internship.companyInfo?.companyName || 'Company',
            companyLogo: companyId.logo || internship.companyInfo?.logo || '',
            companyVerified: companyId.verified || internship.companyInfo?.verified || false,
            applicationDeadline: internship.applicationDeadline
        };
    };

    if (loading && applications.length === 0) {
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
                        <p className="mt-4 text-gray-600">Loading your applications...</p>
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
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">My Applications</h1>
                    <p className="text-blue-100">Track and manage your internship applications</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
                        <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl shadow border border-yellow-100">
                        <div className="text-2xl font-bold text-yellow-700">{stats.Applied || 0}</div>
                        <div className="text-sm text-yellow-600">Applied</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl shadow border border-blue-100">
                        <div className="text-2xl font-bold text-blue-700">{stats.Shortlisted || 0}</div>
                        <div className="text-sm text-blue-600">Shortlisted</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl shadow border border-purple-100">
                        <div className="text-2xl font-bold text-purple-700">{stats.Interviewed || 0}</div>
                        <div className="text-sm text-purple-600">Interviewed</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl shadow border border-green-100">
                        <div className="text-2xl font-bold text-green-700">{stats.Selected || 0}</div>
                        <div className="text-sm text-green-600">Selected</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl shadow border border-red-100">
                        <div className="text-2xl font-bold text-red-700">{stats.Rejected || 0}</div>
                        <div className="text-sm text-red-600">Rejected</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-gray-700">{stats.Withdrawn || 0}</div>
                        <div className="text-sm text-gray-600">Withdrawn</div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1">
                            <form onSubmit={handleSearch} className="relative">
                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by company, internship title, or location..."
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Search
                                </button>
                            </form>
                        </div>

                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => handleSortChange('createdAt')}
                                className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                            >
                                {sortBy.startsWith('-') ? <FaSortAmountDown /> : <FaSortAmountUp />}
                                {getSortDisplayText()}
                            </button>
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                        >
                            <FaFilter /> Filters
                            {(filters.status || filters.company || filters.location || filters.category) && (
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Status</option>
                                        {filterOptions.statuses.map((status, index) => (
                                            <option key={index} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Company Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company
                                    </label>
                                    <select
                                        value={filters.company}
                                        onChange={(e) => handleFilterChange('company', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Companies</option>
                                        {filterOptions.companies.map((company, index) => (
                                            <option key={index} value={company}>{company}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location Filter */}
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

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Categories</option>
                                        {filterOptions.categories.map((category, index) => (
                                            <option key={index} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Filter Actions */}
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
                </div>

                {/* Applications List */}
                {applications.length > 0 ? (
                    <>
                        <div className="space-y-4 mb-8">
                            {applications.map((application, index) => {
                                const statusInfo = getStatusInfo(application.status);
                                const internship = getInternshipDetails(application);
                                const daysSince = getDaysSince(application.createdAt);

                                return (
                                    <motion.div
                                        key={application._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                {/* Left Section - Internship & Company Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        {/* Company Logo */}
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                                            {internship.companyLogo ? (
                                                                <img
                                                                    src={internship.companyLogo}
                                                                    alt={internship.companyName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                                    <FaBuilding className="text-gray-400 text-2xl" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Internship Details */}
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                                        {internship.title}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="font-medium text-gray-700">
                                                                            {internship.companyName}
                                                                        </span>
                                                                        {internship.companyVerified && (
                                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                                                <FaCheckCircle /> Verified
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Quick Info */}
                                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                                                <span className="flex items-center gap-1">
                                                                    <FaMapMarkerAlt /> {internship.location}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MdWork /> {internship.workMode}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MdAttachMoney /> ₹{internship.stipend.amount?.toLocaleString() || 'Negotiable'}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MdAccessTime /> {internship.duration} months
                                                                </span>
                                                            </div>

                                                            {/* Skills */}
                                                            {internship.skills.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {internship.skills.slice(0, 3).map((skill, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                                                        >
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {internship.skills.length > 3 && (
                                                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                                                            +{internship.skills.length - 3} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section - Application Status & Actions */}
                                                <div className="lg:w-64 flex flex-col gap-4">
                                                    {/* Status Badge */}
                                                    <div className={`px-4 py-2 rounded-lg border flex items-center justify-center gap-2 ${statusInfo.color}`}>
                                                        {statusInfo.icon}
                                                        <span className="font-medium">{statusInfo.label}</span>
                                                    </div>

                                                    {/* Application Details */}
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Applied:</span>
                                                            <span className="font-medium">{formatDate(application.applicationDate)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Last Updated:</span>
                                                            <span className="font-medium">{formatDate(application.updatedAt)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Days Since:</span>
                                                            <span className="font-medium">{daysSince} days</span>
                                                        </div>
                                                        {application.interviewDate && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Interview:</span>
                                                                <span className="font-medium">
                                                                    {formatDate(application.interviewDate)} {formatTime(application.interviewDate)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => viewApplicationDetails(application)}
                                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                                        >
                                                            <FaEye /> View
                                                        </button>
                                                        {application.status === 'Applied' && (
                                                            <button
                                                                onClick={() => withdrawApplication(application._id)}
                                                                className="flex-1 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2"
                                                            >
                                                                <FaTrash /> Withdraw
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cover Letter Preview */}
                                            {application.coverLetter && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaFileAlt className="text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700">Cover Letter:</span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm line-clamp-2">
                                                        {application.coverLetter.substring(0, 200)}...
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.pages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.pages - 2) {
                                        pageNum = pagination.pages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-4 py-2 rounded-lg ${pagination.page === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow border border-gray-100">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
                            <FaFileAlt className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No applications yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchQuery || Object.values(filters).some(f => f)
                                ? 'No applications match your search criteria. Try adjusting your filters.'
                                : 'You haven\'t applied to any internships yet. Start browsing opportunities!'}
                        </p>
                        {(searchQuery || Object.values(filters).some(f => f)) ? (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Clear Search & Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => window.location.href = '/internships'}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                            >
                                Browse Internships
                            </button>
                        )}
                    </div>
                )}

                {/* Application Details Modal */}
                <AnimatePresence>
                    {showApplicationDetails && selectedApplication && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeApplicationDetails}
                                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            >
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                    {/* Dialog Header */}
                                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                                                    {getInternshipDetails(selectedApplication).companyLogo ? (
                                                        <img
                                                            src={getInternshipDetails(selectedApplication).companyLogo}
                                                            alt={getInternshipDetails(selectedApplication).companyName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                            <FaBuilding className="text-gray-400 text-2xl" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                                        {getInternshipDetails(selectedApplication).title}
                                                    </h2>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-700">
                                                            {getInternshipDetails(selectedApplication).companyName}
                                                        </span>
                                                        {getInternshipDetails(selectedApplication).companyVerified && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                <FaCheckCircle className="inline mr-1" /> Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={closeApplicationDetails}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                            >
                                                <FaTimesCircle className="text-2xl text-gray-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dialog Content */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            {/* Application Status */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Status</h3>
                                                <div className="flex items-center justify-between">
                                                    <div className={`px-4 py-2 rounded-lg ${getStatusInfo(selectedApplication.status).color} flex items-center gap-2`}>
                                                        {getStatusInfo(selectedApplication.status).icon}
                                                        <span className="font-medium">{getStatusInfo(selectedApplication.status).label}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Applied: {formatDate(selectedApplication.applicationDate)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Internship Details */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Internship Details</h3>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Location:</span>
                                                        <span className="font-medium">{getInternshipDetails(selectedApplication).location}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Work Mode:</span>
                                                        <span className="font-medium">{getInternshipDetails(selectedApplication).workMode}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Duration:</span>
                                                        <span className="font-medium">{getInternshipDetails(selectedApplication).duration} months</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Stipend:</span>
                                                        <span className="font-medium">₹{getInternshipDetails(selectedApplication).stipend.amount?.toLocaleString() || 'Negotiable'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cover Letter */}
                                        {selectedApplication.coverLetter && (
                                            <div className="mb-8">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <FaFileAlt className="text-blue-600" /> Cover Letter
                                                </h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-700 whitespace-pre-line">
                                                        {selectedApplication.coverLetter}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Resume & Links */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Materials</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedApplication.resume && (
                                                    <div className="bg-blue-50 p-4 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaFileAlt className="text-blue-600" />
                                                            <span className="font-medium">Resume</span>
                                                        </div>
                                                        <a
                                                            href={selectedApplication.resume}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline text-sm"
                                                        >
                                                            View Resume
                                                        </a>
                                                    </div>
                                                )}
                                                {selectedApplication.portfolioLink && (
                                                    <div className="bg-purple-50 p-4 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaLink className="text-purple-600" />
                                                            <span className="font-medium">Portfolio</span>
                                                        </div>
                                                        <a
                                                            href={selectedApplication.portfolioLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-purple-600 hover:underline text-sm"
                                                        >
                                                            {selectedApplication.portfolioLink}
                                                        </a>
                                                    </div>
                                                )}
                                                {selectedApplication.githubLink && (
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaGithub className="text-gray-800" />
                                                            <span className="font-medium">GitHub</span>
                                                        </div>
                                                        <a
                                                            href={selectedApplication.githubLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-700 hover:underline text-sm"
                                                        >
                                                            {selectedApplication.githubLink}
                                                        </a>
                                                    </div>
                                                )}
                                                {selectedApplication.linkedinLink && (
                                                    <div className="bg-blue-50 p-4 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaLinkedin className="text-blue-700" />
                                                            <span className="font-medium">LinkedIn</span>
                                                        </div>
                                                        <a
                                                            href={selectedApplication.linkedinLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-700 hover:underline text-sm"
                                                        >
                                                            {selectedApplication.linkedinLink}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Additional Information */}
                                        {selectedApplication.additionalInfo && (
                                            <div className="mb-8">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-700">{selectedApplication.additionalInfo}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Interview Details (if applicable) */}
                                        {selectedApplication.interviewDate && (
                                            <div className="mb-8">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <FaCalendarCheck className="text-green-600" /> Interview Details
                                                </h3>
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-sm text-gray-600">Interview Date & Time</div>
                                                            <div className="font-medium">
                                                                {formatDate(selectedApplication.interviewDate)} at {formatTime(selectedApplication.interviewDate)}
                                                            </div>
                                                        </div>
                                                        {selectedApplication.interviewNotes && (
                                                            <div>
                                                                <div className="text-sm text-gray-600">Notes</div>
                                                                <div className="font-medium">{selectedApplication.interviewNotes}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Feedback (if applicable) */}
                                        {selectedApplication.feedback && (
                                            <div className="mb-8">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Feedback</h3>
                                                <div className="bg-yellow-50 p-4 rounded-lg">
                                                    <p className="text-gray-700">{selectedApplication.feedback}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dialog Footer */}
                                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-600">
                                                Application ID: {selectedApplication._id}
                                            </div>
                                            <div className="flex gap-3">
                                                {selectedApplication.status === 'Applied' && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to withdraw this application?')) {
                                                                withdrawApplication(selectedApplication._id);
                                                                closeApplicationDetails();
                                                            }
                                                        }}
                                                        className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                                    >
                                                        Withdraw Application
                                                    </button>
                                                )}
                                                <button
                                                    onClick={closeApplicationDetails}
                                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Tips Section */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FaChartLine className="text-blue-600" /> Application Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaEnvelope className="text-blue-500" /> Follow Up
                            </div>
                            <p className="text-sm text-gray-600">Consider following up after 7-10 days if you haven't heard back.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaCalendarCheck className="text-green-500" /> Prepare for Interviews
                            </div>
                            <p className="text-sm text-gray-600">Research the company and practice common interview questions.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaUser className="text-purple-500" /> Update Your Profile
                            </div>
                            <p className="text-sm text-gray-600">Keep your profile and resume updated for better chances.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyApplications;
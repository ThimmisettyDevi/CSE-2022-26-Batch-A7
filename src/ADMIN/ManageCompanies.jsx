// src/components/admin/ManageCompanies.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaBuilding,
    FaCheckCircle,
    FaTimesCircle,
    FaEye,
    FaEdit,
    FaTrash,
    FaSearch,
    FaFilter,
    FaSync,
    FaSpinner,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaGlobe,
    FaUsers,
    FaMapMarkerAlt,
    FaExclamationTriangle,
    FaPlus,
    FaExternalLinkAlt,
    FaIndustry,
    FaBriefcase,
    FaFileContract
} from 'react-icons/fa';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';

const ManageCompanies = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'verified', 'pending', 'rejected', 'suspended'
    const [filterIndustry, setFilterIndustry] = useState('all');
    const [activeTab, setActiveTab] = useState('companies');

    // Companies data
    const [companies, setCompanies] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0,
        suspended: 0
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    // Modal states
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        industry: '',
        companySize: '',
        website: '',
        foundedYear: '',
        headquarters: '',
        description: '',
        mobileNumber: '',
        address: '',
        companyEmail: '',
        hrContactName: '',
        hrContactNumber: ''
    });

    // Verification form
    const [verificationData, setVerificationData] = useState({
        verificationStatus: 'Verified',
        notes: ''
    });

    // Loading states
    const [processingId, setProcessingId] = useState(null);
    const [processingAction, setProcessingAction] = useState('');

    // Fetch companies data
    const fetchCompanies = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            if (filterStatus !== 'all') {
                params.append('verificationStatus', filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1));
            }

            if (filterIndustry !== 'all') {
                params.append('industry', filterIndustry);
            }

            const response = await axiosInstance.get(`/company?${params}`);
            console.log('Companies API Response:', response.data);

            const companiesData = response.data?.companies || [];
            const paginationData = response.data?.pagination || {};

            // Extract unique industries
            const uniqueIndustries = [...new Set(companiesData.map(company => company.industry).filter(Boolean))];
            setIndustries(uniqueIndustries);

            // Calculate stats
            const total = paginationData.total || companiesData.length;
            const verified = companiesData.filter(c => c.verified || c.verificationStatus === 'Verified').length;
            const pending = companiesData.filter(c => c.verificationStatus === 'Pending').length;
            const rejected = companiesData.filter(c => c.verificationStatus === 'Rejected').length;
            const suspended = companiesData.filter(c => c.verificationStatus === 'Suspended').length;

            setCompanies(companiesData);
            setPagination(paginationData);
            setStats({ total, verified, pending, rejected, suspended });

        } catch (err) {
            console.error('Error fetching companies:', err);
            setError(err.response?.data?.message || 'Failed to load companies data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, [filterStatus, filterIndustry]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCompanies(pagination.page);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Handle company verification
    const handleVerifyCompany = async (companyId, status, notes = '') => {
        try {
            setProcessingId(companyId);
            setProcessingAction('verify');

            await axiosInstance.patch(`/company/admin/verify/${companyId}`, {
                verificationStatus: status,
                notes
            });

            // Update local state
            setCompanies(prev => prev.map(company =>
                company._id === companyId
                    ? {
                        ...company,
                        verificationStatus: status,
                        verified: status === 'Verified',
                        statusUpdatedAt: new Date().toISOString(),
                        verificationNotes: notes || company.verificationNotes
                    }
                    : company
            ));

            // Update stats
            setStats(prev => {
                const newStats = { ...prev };
                const company = companies.find(c => c._id === companyId);
                if (company) {
                    // Decrement old status
                    switch (company.verificationStatus) {
                        case 'Verified': newStats.verified--; break;
                        case 'Pending': newStats.pending--; break;
                        case 'Rejected': newStats.rejected--; break;
                        case 'Suspended': newStats.suspended--; break;
                    }
                    // Increment new status
                    switch (status) {
                        case 'Verified': newStats.verified++; break;
                        case 'Pending': newStats.pending++; break;
                        case 'Rejected': newStats.rejected++; break;
                        case 'Suspended': newStats.suspended++; break;
                    }
                }
                return newStats;
            });

            setShowVerificationModal(false);
            setVerificationData({ verificationStatus: 'Verified', notes: '' });
            toast.success(`Company ${status.toLowerCase()} successfully!`);
        } catch (err) {
            console.error('Error verifying company:', err);
            toast.error(`Failed to update company status: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingId(null);
            setProcessingAction('');
        }
    };

    // Handle create company
    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            setProcessingAction('create');

            // Create FormData for file upload
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add default password (companies should reset it)
            formDataToSend.append('password', 'TempPass123!');
            formDataToSend.append('role', 'company');

            const response = await axiosInstance.post('/company/register', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Reset form and refresh data
            setFormData({
                companyName: '',
                email: '',
                industry: '',
                companySize: '',
                website: '',
                foundedYear: '',
                headquarters: '',
                description: '',
                mobileNumber: '',
                address: '',
                companyEmail: '',
                hrContactName: '',
                hrContactNumber: ''
            });
            setShowCreateModal(false);
            fetchCompanies();
            toast.success('Company created successfully!');
        } catch (err) {
            console.error('Error creating company:', err);
            toast.error(`Failed to create company: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingAction('');
        }
    };

    // Handle update company
    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        try {
            setProcessingAction('update');

            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] && formData[key] !== selectedCompany[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const response = await axiosInstance.patch('/company/update-profile', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update local state
            setCompanies(prev => prev.map(company =>
                company._id === selectedCompany._id
                    ? { ...company, ...formData }
                    : company
            ));

            setShowEditModal(false);
            setSelectedCompany(null);
            toast.success('Company updated successfully!');
        } catch (err) {
            console.error('Error updating company:', err);
            toast.error(`Failed to update company: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingAction('');
        }
    };

    // Handle delete company
    const handleDeleteCompany = async () => {
        try {
            setProcessingAction('delete');

            await axiosInstance.delete(`/company/${selectedCompany._id}`);

            // Update local state
            setCompanies(prev => prev.filter(company => company._id !== selectedCompany._id));

            // Update stats
            setStats(prev => {
                const newStats = { ...prev };
                newStats.total--;
                switch (selectedCompany.verificationStatus) {
                    case 'Verified': newStats.verified--; break;
                    case 'Pending': newStats.pending--; break;
                    case 'Rejected': newStats.rejected--; break;
                    case 'Suspended': newStats.suspended--; break;
                }
                return newStats;
            });

            setShowDeleteModal(false);
            setSelectedCompany(null);
            toast.success('Company deleted successfully!');
        } catch (err) {
            console.error('Error deleting company:', err);
            toast.error(`Failed to delete company: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingAction('');
        }
    };

    // View company details
    const handleViewDetails = (company) => {
        setSelectedCompany(company);
        setShowDetailsModal(true);
    };

    // Open edit modal
    const handleEditCompany = (company) => {
        setSelectedCompany(company);
        setFormData({
            companyName: company.companyName || '',
            email: company.email || '',
            industry: company.industry || '',
            companySize: company.companySize || '',
            website: company.website || '',
            foundedYear: company.foundedYear || '',
            headquarters: company.headquarters || '',
            description: company.description || '',
            mobileNumber: company.mobileNumber || '',
            address: company.address || '',
            companyEmail: company.companyEmail || '',
            hrContactName: company.hrContactName || '',
            hrContactNumber: company.hrContactNumber || ''
        });
        setShowEditModal(true);
    };

    // Open verification modal
    const handleOpenVerification = (company) => {
        setSelectedCompany(company);
        setVerificationData({
            verificationStatus: company.verificationStatus || 'Pending',
            notes: company.verificationNotes || ''
        });
        setShowVerificationModal(true);
    };

    // Open delete modal
    const handleOpenDelete = (company) => {
        setSelectedCompany(company);
        setShowDeleteModal(true);
    };

    // Close all modals
    const closeAllModals = () => {
        setShowDetailsModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        setShowVerificationModal(false);
        setShowCreateModal(false);
        setSelectedCompany(null);
        setFormData({
            companyName: '',
            email: '',
            industry: '',
            companySize: '',
            website: '',
            foundedYear: '',
            headquarters: '',
            description: '',
            mobileNumber: '',
            address: '',
            companyEmail: '',
            hrContactName: '',
            hrContactNumber: ''
        });
        setVerificationData({
            verificationStatus: 'Verified',
            notes: ''
        });
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

    // Get status badge style
    const getStatusBadge = (company) => {
        const status = company.verificationStatus || 'Pending';

        switch (status.toLowerCase()) {
            case 'verified':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'suspended':
                return 'bg-purple-100 text-purple-800 border border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // Get status icon
    const getStatusIcon = (company) => {
        const status = company.verificationStatus || 'Pending';

        switch (status.toLowerCase()) {
            case 'verified':
                return <FaCheckCircle className="text-green-600" />;
            case 'pending':
                return <FaSpinner className="text-yellow-600 animate-spin" />;
            case 'rejected':
                return <FaTimesCircle className="text-red-600" />;
            case 'suspended':
                return <FaExclamationTriangle className="text-purple-600" />;
            default:
                return null;
        }
    };

    // Filter companies based on search
    const filteredCompanies = companies.filter(company => {
        const searchLower = searchQuery.toLowerCase();
        return (
            (company.companyName?.toLowerCase() || '').includes(searchLower) ||
            (company.email?.toLowerCase() || '').includes(searchLower) ||
            (company.industry?.toLowerCase() || '').includes(searchLower) ||
            (company.companyEmail?.toLowerCase() || '').includes(searchLower) ||
            (company._id?.includes(searchQuery))
        );
    });

    if (loading && !refreshing) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading companies data...</p>
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
                            Manage <span className="bg-gradient-to-r from-purple-700 to-purple-600 bg-clip-text text-transparent">Companies</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Manage company registrations and verifications</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition flex items-center gap-2"
                        >
                            <FaPlus /> Add Company
                        </button>

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
                                <FaBuilding className="text-blue-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.total}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Companies</h3>
                        <p className="text-xs text-gray-500 mt-1">All registered companies</p>
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
                                {stats.verified}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Verified</h3>
                        <p className="text-xs text-gray-500 mt-1">Approved companies</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <FaSpinner className="text-yellow-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.pending}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Pending</h3>
                        <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
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
                        <p className="text-xs text-gray-500 mt-1">Registration rejected</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <FaExclamationTriangle className="text-purple-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.suspended}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Suspended</h3>
                        <p className="text-xs text-gray-500 mt-1">Accounts suspended</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <FaFilter className="text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Verification Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="verified">Verified</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Industry</label>
                                <select
                                    value={filterIndustry}
                                    onChange={(e) => setFilterIndustry(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Industries</option>
                                    {industries.map((industry, index) => (
                                        <option key={index} value={industry}>{industry}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Companies ({filteredCompanies.length})
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
                    ) : filteredCompanies.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaBuilding className="text-4xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchQuery
                                    ? 'No companies match your search criteria'
                                    : filterStatus !== 'all'
                                        ? `No ${filterStatus} companies found`
                                        : 'No companies have registered yet'}
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                            >
                                <FaPlus /> Add First Company
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Company</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Industry</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Contact</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Registration Date</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredCompanies.map((company, index) => (
                                        <motion.tr
                                            key={company._id || index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                                        {company.logo ? (
                                                            <img
                                                                src={company.logo}
                                                                alt={company.companyName}
                                                                className="w-full h-full rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <FaBuilding className="text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{company.companyName}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <FaGlobe className="text-gray-400" />
                                                            <a
                                                                href={company.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:text-blue-600 transition"
                                                            >
                                                                {company.website?.replace('https://', '').replace('http://', '').slice(0, 20)}...
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <FaIndustry className="text-gray-400" />
                                                    <span className="text-gray-700">{company.industry || 'N/A'}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    <FaUsers className="inline mr-1" /> {company.companySize}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaEnvelope className="text-gray-400" />
                                                        <span>{company.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaPhone className="text-gray-400" />
                                                        <span>{company.mobileNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    <span>{formatDate(company.accountCreatedAt || company.createdAt)}</span>
                                                </div>
                                                {company.lastLogin && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Last login: {formatDate(company.lastLogin)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(company)}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(company)}`}>
                                                        {company.verificationStatus || 'Pending'}
                                                    </span>
                                                </div>
                                                {company.verificationNotes && (
                                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs" title={company.verificationNotes}>
                                                        {company.verificationNotes.slice(0, 50)}...
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(company)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    <button
                                                        onClick={() => handleEditCompany(company)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Edit Company"
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenVerification(company)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                        title="Change Verification Status"
                                                    >
                                                        <FaFileContract />
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenDelete(company)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete Company"
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
                    {filteredCompanies.length > 0 && pagination.pages > 1 && (
                        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} companies
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchCompanies(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => fetchCompanies(pagination.page + 1)}
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

            {/* Company Details Modal */}
            {showDetailsModal && selectedCompany && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Company Details</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {/* Header with logo and basic info */}
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {selectedCompany.logo ? (
                                        <img
                                            src={selectedCompany.logo}
                                            alt={selectedCompany.companyName}
                                            className="w-full h-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <FaBuilding className="text-blue-600 text-3xl" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedCompany.companyName}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedCompany)}`}>
                                            {selectedCompany.verificationStatus || 'Pending'}
                                        </span>
                                        {selectedCompany.website && (
                                            <a
                                                href={selectedCompany.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                            >
                                                <FaExternalLinkAlt /> Website
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mt-3">{selectedCompany.description}</p>
                                </div>
                            </div>

                            {/* Grid of company information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Information */}
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaEnvelope className="text-blue-600" />
                                        Contact Information
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Company Email</p>
                                            <p className="text-gray-900">{selectedCompany.companyEmail || selectedCompany.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">HR Contact</p>
                                            <p className="text-gray-900">{selectedCompany.hrContactName}</p>
                                            <p className="text-gray-600">{selectedCompany.hrContactNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Mobile Number</p>
                                            <p className="text-gray-900">{selectedCompany.mobileNumber}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Details */}
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaBuilding className="text-green-600" />
                                        Company Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Industry</p>
                                            <p className="text-gray-900">{selectedCompany.industry}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Company Size</p>
                                            <p className="text-gray-900">{selectedCompany.companySize}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Founded Year</p>
                                            <p className="text-gray-900">{selectedCompany.foundedYear}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Information */}
                                <div className="bg-gray-50 p-6 rounded-xl md:col-span-2">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-red-600" />
                                        Location Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Headquarters</p>
                                            <p className="text-gray-900">{selectedCompany.headquarters}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Address</p>
                                            <p className="text-gray-900">{selectedCompany.address}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="bg-gray-50 p-6 rounded-xl md:col-span-2">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Registration Date</p>
                                            <p className="text-gray-900">{formatDate(selectedCompany.accountCreatedAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Last Login</p>
                                            <p className="text-gray-900">{formatDate(selectedCompany.lastLogin) || 'Never'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Status Updated</p>
                                            <p className="text-gray-900">{formatDate(selectedCompany.statusUpdatedAt)}</p>
                                        </div>
                                    </div>
                                    {selectedCompany.verificationNotes && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">Verification Notes</p>
                                            <p className="text-gray-900 bg-white p-3 rounded-lg mt-1 border border-gray-200">
                                                {selectedCompany.verificationNotes}
                                            </p>
                                        </div>
                                    )}
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
                                    handleEditCompany(selectedCompany);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                            >
                                <FaEdit /> Edit Company
                            </button>
                            <button
                                onClick={() => {
                                    closeAllModals();
                                    handleOpenVerification(selectedCompany);
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                            >
                                <FaFileContract /> Change Status
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Edit Company Modal */}
            {showEditModal && selectedCompany && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Company</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCompany}>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Industry *
                                        </label>
                                        <select
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Industry</option>
                                            <option value="Technology">Technology</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Healthcare">Healthcare</option>
                                            <option value="Education">Education</option>
                                            <option value="Retail">Retail</option>
                                            <option value="Manufacturing">Manufacturing</option>
                                            <option value="Consulting">Consulting</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Size *
                                        </label>
                                        <select
                                            value={formData.companySize}
                                            onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Size</option>
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="201-500">201-500 employees</option>
                                            <option value="501-1000">501-1000 employees</option>
                                            <option value="1000+">1000+ employees</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Founded Year
                                        </label>
                                        <input
                                            type="number"
                                            min="1900"
                                            max={new Date().getFullYear()}
                                            value={formData.foundedYear}
                                            onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Headquarters
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.headquarters}
                                            onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mobile Number *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            value={formData.mobileNumber}
                                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.companyEmail}
                                            onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            HR Contact Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.hrContactName}
                                            onChange={(e) => setFormData({ ...formData, hrContactName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            HR Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            value={formData.hrContactNumber}
                                            onChange={(e) => setFormData({ ...formData, hrContactNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
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
                                    disabled={processingAction === 'update'}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processingAction === 'update' ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Updating...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle /> Update Company
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Verification Modal */}
            {showVerificationModal && selectedCompany && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Update Verification Status</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleVerifyCompany(selectedCompany._id, verificationData.verificationStatus, verificationData.notes);
                        }}>
                            <div className="p-6">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company
                                    </label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                            {selectedCompany.logo ? (
                                                <img
                                                    src={selectedCompany.logo}
                                                    alt={selectedCompany.companyName}
                                                    className="w-full h-full rounded-lg object-cover"
                                                />
                                            ) : (
                                                <FaBuilding className="text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedCompany.companyName}</p>
                                            <p className="text-sm text-gray-500">Current: {selectedCompany.verificationStatus}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Status *
                                    </label>
                                    <select
                                        value={verificationData.verificationStatus}
                                        onChange={(e) => setVerificationData({ ...verificationData, verificationStatus: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Verified">Verified</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={verificationData.notes}
                                        onChange={(e) => setVerificationData({ ...verificationData, notes: e.target.value })}
                                        rows="3"
                                        placeholder="Add notes about verification decision..."
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
                                    disabled={processingId === selectedCompany._id && processingAction === 'verify'}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processingId === selectedCompany._id && processingAction === 'verify' ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle /> Update Status
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedCompany && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Delete Company</h2>
                            <p className="text-gray-600">Are you sure you want to delete this company? This action cannot be undone.</p>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                                <FaExclamationTriangle className="text-red-600 text-xl" />
                                <div>
                                    <p className="font-medium text-red-800">{selectedCompany.companyName}</p>
                                    <p className="text-sm text-red-600">This will permanently delete the company and all associated data.</p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 mb-4">
                                <p><strong>Email:</strong> {selectedCompany.email}</p>
                                <p><strong>Industry:</strong> {selectedCompany.industry}</p>
                                <p><strong>Status:</strong> {selectedCompany.verificationStatus}</p>
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
                                onClick={handleDeleteCompany}
                                disabled={processingAction === 'delete'}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {processingAction === 'delete' ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FaTrash /> Delete Company
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Create Company Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Add New Company</h2>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateCompany}>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Industry *
                                        </label>
                                        <select
                                            required
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Industry</option>
                                            <option value="Technology">Technology</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Healthcare">Healthcare</option>
                                            <option value="Education">Education</option>
                                            <option value="Retail">Retail</option>
                                            <option value="Manufacturing">Manufacturing</option>
                                            <option value="Consulting">Consulting</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Size *
                                        </label>
                                        <select
                                            required
                                            value={formData.companySize}
                                            onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select Size</option>
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="201-500">201-500 employees</option>
                                            <option value="501-1000">501-1000 employees</option>
                                            <option value="1000+">1000+ employees</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Founded Year
                                        </label>
                                        <input
                                            type="number"
                                            min="1900"
                                            max={new Date().getFullYear()}
                                            value={formData.foundedYear}
                                            onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Headquarters
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.headquarters}
                                            onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mobile Number *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            value={formData.mobileNumber}
                                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.companyEmail}
                                            onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            HR Contact Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.hrContactName}
                                            onChange={(e) => setFormData({ ...formData, hrContactName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            HR Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[0-9]{10}"
                                            value={formData.hrContactNumber}
                                            onChange={(e) => setFormData({ ...formData, hrContactNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
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
                                    disabled={processingAction === 'create'}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processingAction === 'create' ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus /> Create Company
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

export default ManageCompanies;
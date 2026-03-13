// src/components/company/ManageInternships.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FaBriefcase,
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
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
    FaExternalLinkAlt,
    FaCopy,
    FaArchive,
    FaRocket,
    FaFileContract,
    FaTimes,
    FaSave,
    FaBuilding,
    FaGraduationCap,
    FaTasks,
    FaCog,
    FaListUl,
    FaTags,
    FaAward
} from 'react-icons/fa';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import { toast } from 'react-hot-toast';

const CompanyManageInternships = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('internships');

    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        category: 'all',
        workMode: 'all'
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
    const [allInternships, setAllInternships] = useState([]);
    const [availableFilters, setAvailableFilters] = useState({
        categories: [],
        workModes: []
    });
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        closed: 0,
        archived: 0,
        applications: 0
    });

    // Selected internship
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Processing states
    const [processingId, setProcessingId] = useState(null);
    const [processingAction, setProcessingAction] = useState('');

    // New status
    const [newStatus, setNewStatus] = useState('Published');

    // New internship form state
    const [newInternship, setNewInternship] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        workMode: 'Remote',
        internshipType: 'Full-time',
        duration: 3,
        startDate: '',
        applicationDeadline: '',
        applyBy: '',
        openings: 1,
        department: '',
        skills: [],
        requirements: [],
        responsibilities: [],
        perks: [],
        stipend: {
            amount: 0,
            currency: 'INR'
        },
        status: 'Draft'
    });

    const [currentSkill, setCurrentSkill] = useState('');
    const [currentRequirement, setCurrentRequirement] = useState('');
    const [currentResponsibility, setCurrentResponsibility] = useState('');
    const [currentPerk, setCurrentPerk] = useState('');
    const [creating, setCreating] = useState(false);

    // Fetch internships data
    const fetchInternships = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axiosInstance.get(`/internships/company/my-internships`);
            console.log('Company Internships API Response:', response.data);

            let internshipsData = response.data.internships || response.data || [];

            if (!Array.isArray(internshipsData)) {
                internshipsData = [];
            }

            // Store all internships for filtering
            setAllInternships(internshipsData);

            // Get unique categories and work modes for filter
            const categories = [...new Set(internshipsData
                .map(i => i.category)
                .filter(Boolean)
                .sort())];
            const workModes = [...new Set(internshipsData
                .map(i => i.workMode)
                .filter(Boolean)
                .sort())];

            // Calculate stats
            const total = internshipsData.length;
            const published = internshipsData.filter(i => i.status === 'Published').length;
            const draft = internshipsData.filter(i => i.status === 'Draft').length;
            const closed = internshipsData.filter(i => i.status === 'Closed').length;
            const archived = internshipsData.filter(i => i.status === 'Archived').length;
            const applications = internshipsData.reduce((sum, internship) => 
                sum + (internship.applicationsCount || 0), 0
            );

            setAvailableFilters({
                categories,
                workModes
            });
            setStats({
                total,
                published,
                draft,
                closed,
                archived,
                applications
            });

            // Apply filtering, sorting and pagination
            applyFiltersAndPagination(internshipsData);

        } catch (err) {
            console.error('Error fetching company internships:', err);
            setError(err.response?.data?.message || 'Failed to load internships data');
            toast.error('Failed to load internships');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters, sorting and pagination
    const applyFiltersAndPagination = (data) => {
        let filteredInternships = [...data];
        
        // Apply status filter
        if (filters.status !== 'all') {
            filteredInternships = filteredInternships.filter(i => i.status === filters.status);
        }
        
        // Apply category filter
        if (filters.category !== 'all') {
            filteredInternships = filteredInternships.filter(i => i.category === filters.category);
        }
        
        // Apply work mode filter
        if (filters.workMode !== 'all') {
            filteredInternships = filteredInternships.filter(i => i.workMode === filters.workMode);
        }
        
        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredInternships = filteredInternships.filter(i => 
                i.title?.toLowerCase().includes(query) ||
                i.description?.toLowerCase().includes(query) ||
                i.location?.toLowerCase().includes(query) ||
                i.category?.toLowerCase().includes(query)
            );
        }
        
        // Apply sorting
        filteredInternships.sort((a, b) => {
            let aValue, bValue;
            
            switch (sort.field) {
                case 'title':
                    aValue = a.title || '';
                    bValue = b.title || '';
                    return sort.order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                
                case 'stipend.amount':
                    aValue = a.stipend?.amount || 0;
                    bValue = b.stipend?.amount || 0;
                    return sort.order === 'asc' ? aValue - bValue : bValue - aValue;
                
                case 'applicationsCount':
                    aValue = a.applicationsCount || 0;
                    bValue = b.applicationsCount || 0;
                    return sort.order === 'asc' ? aValue - bValue : bValue - aValue;
                
                case 'views':
                    aValue = a.views || 0;
                    bValue = b.views || 0;
                    return sort.order === 'asc' ? aValue - bValue : bValue - aValue;
                
                case 'applicationDeadline':
                    aValue = new Date(a.applicationDeadline || 0);
                    bValue = new Date(b.applicationDeadline || 0);
                    return sort.order === 'asc' ? aValue - bValue : bValue - aValue;
                
                default: // 'createdAt' or default
                    aValue = new Date(a.createdAt || 0);
                    bValue = new Date(b.createdAt || 0);
                    return sort.order === 'asc' ? aValue - bValue : bValue - aValue;
            }
        });
        
        // Apply pagination
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedInternships = filteredInternships.slice(startIndex, endIndex);

        // Update state
        setInternships(paginatedInternships);
        setPagination(prev => ({
            ...prev,
            total: filteredInternships.length,
            pages: Math.ceil(filteredInternships.length / prev.limit)
        }));
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    useEffect(() => {
        if (allInternships.length > 0) {
            applyFiltersAndPagination(allInternships);
        }
    }, [filters, sort, searchQuery, pagination.page]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchInternships();
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

            const response = await axiosInstance.patch(`/internships/${internshipId}`, {
                status
            });

            // Update local state
            const updatedInternships = allInternships.map(internship =>
                internship._id === internshipId
                    ? { ...internship, status }
                    : internship
            );

            setAllInternships(updatedInternships);
            applyFiltersAndPagination(updatedInternships);

            // Update stats
            const oldStatus = allInternships.find(i => i._id === internshipId)?.status;
            setStats(prev => {
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

            const response = await axiosInstance.delete(`/internships/${selectedInternship._id}`);

            // Check if it was archived instead of deleted
            if (response.data?.message?.includes('archived')) {
                // Update local state to archived
                const updatedInternships = allInternships.map(internship =>
                    internship._id === selectedInternship._id
                        ? { ...internship, status: 'Archived', isActive: false }
                        : internship
                );

                setAllInternships(updatedInternships);
                applyFiltersAndPagination(updatedInternships);

                // Update stats
                const oldStatus = selectedInternship.status;
                setStats(prev => {
                    const newStats = { ...prev };

                    // Decrement old status
                    switch (oldStatus) {
                        case 'Published': newStats.published--; break;
                        case 'Draft': newStats.draft--; break;
                        case 'Closed': newStats.closed--; break;
                        case 'Archived': newStats.archived--; break;
                    }

                    // Increment archived
                    newStats.archived++;

                    return newStats;
                });

                toast.success('Internship archived (has existing applications)');
            } else {
                // Actually deleted
                const updatedInternships = allInternships.filter(internship => internship._id !== selectedInternship._id);
                setAllInternships(updatedInternships);
                applyFiltersAndPagination(updatedInternships);

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

                toast.success('Internship deleted successfully!');
            }

            setShowDeleteModal(false);
            setSelectedInternship(null);
        } catch (err) {
            console.error('Error deleting internship:', err);
            toast.error(`Failed to delete internship: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingAction('');
        }
    };

    // Handle duplicate internship
    const handleDuplicateInternship = async () => {
        try {
            setProcessingAction('duplicate');

            // First, fetch the full internship details
            const internshipResponse = await axiosInstance.get(`/internships/${selectedInternship._id}`);
            const fullInternshipData = internshipResponse.data;

            // Prepare data for duplication (remove ID and timestamps)
            const { _id, __v, createdAt, updatedAt, companyId, filledPositions, views, applicationsCount, availablePositions, isOpen, companyInfo, hasApplied, applicationStatus, ...internshipData } = fullInternshipData;

            // Create new internship with modified title
            const duplicateData = {
                ...internshipData,
                title: `${internshipData.title} (Copy)`,
                status: 'Draft',
                openings: internshipData.openings || 1,
                filledPositions: 0,
                applicationsCount: 0,
                views: 0,
                isActive: true
            };

            // Create the duplicate using POST endpoint
            const response = await axiosInstance.post('/internships', duplicateData);

            // Add new internship to list
            if (response.data.internship) {
                const updatedInternships = [response.data.internship, ...allInternships];
                setAllInternships(updatedInternships);
                applyFiltersAndPagination(updatedInternships);

                // Update stats
                setStats(prev => ({
                    ...prev,
                    total: prev.total + 1,
                    draft: prev.draft + 1
                }));

                setShowDuplicateModal(false);
                setSelectedInternship(null);
                toast.success('Internship duplicated successfully!');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error duplicating internship:', err);
            toast.error(`Failed to duplicate: ${err.response?.data?.message || err.message}`);
        } finally {
            setProcessingAction('');
        }
    };

    // Handle create new internship
    const handleCreateInternship = async () => {
        try {
            setCreating(true);

            // Validate required fields
            if (!newInternship.title.trim()) {
                toast.error('Title is required');
                return;
            }

            if (!newInternship.description.trim()) {
                toast.error('Description is required');
                return;
            }

            if (!newInternship.category.trim()) {
                toast.error('Category is required');
                return;
            }

            if (!newInternship.location.trim()) {
                toast.error('Location is required');
                return;
            }

            if (!newInternship.startDate) {
                toast.error('Start date is required');
                return;
            }

            if (!newInternship.applicationDeadline) {
                toast.error('Application deadline is required');
                return;
            }

            // Create the internship
            const response = await axiosInstance.post('/internships', newInternship);

            if (response.data.internship) {
                // Add new internship to list
                const updatedInternships = [response.data.internship, ...allInternships];
                setAllInternships(updatedInternships);
                applyFiltersAndPagination(updatedInternships);

                // Update stats
                setStats(prev => ({
                    ...prev,
                    total: prev.total + 1,
                    draft: prev.draft + 1
                }));

                // Reset form and close modal
                resetNewInternshipForm();
                setShowCreateModal(false);
                toast.success('Internship created successfully!');
            }
        } catch (err) {
            console.error('Error creating internship:', err);
            toast.error(`Failed to create internship: ${err.response?.data?.message || err.message}`);
        } finally {
            setCreating(false);
        }
    };

    // Reset new internship form
    const resetNewInternshipForm = () => {
        setNewInternship({
            title: '',
            description: '',
            category: '',
            location: '',
            workMode: 'Remote',
            internshipType: 'Full-time',
            duration: 3,
            startDate: '',
            applicationDeadline: '',
            applyBy: '',
            openings: 1,
            department: '',
            skills: [],
            requirements: [],
            responsibilities: [],
            perks: [],
            stipend: {
                amount: 0,
                currency: 'INR'
            },
            status: 'Draft'
        });
        setCurrentSkill('');
        setCurrentRequirement('');
        setCurrentResponsibility('');
        setCurrentPerk('');
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewInternship(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStipendChange = (e) => {
        const { name, value } = e.target;
        setNewInternship(prev => ({
            ...prev,
            stipend: {
                ...prev.stipend,
                [name]: name === 'amount' ? parseFloat(value) || 0 : value
            }
        }));
    };

    // Add skill
    const addSkill = () => {
        if (currentSkill.trim() && !newInternship.skills.includes(currentSkill.trim())) {
            setNewInternship(prev => ({
                ...prev,
                skills: [...prev.skills, currentSkill.trim()]
            }));
            setCurrentSkill('');
        }
    };

    const removeSkill = (skill) => {
        setNewInternship(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skill)
        }));
    };

    // Add requirement
    const addRequirement = () => {
        if (currentRequirement.trim()) {
            setNewInternship(prev => ({
                ...prev,
                requirements: [...prev.requirements, currentRequirement.trim()]
            }));
            setCurrentRequirement('');
        }
    };

    const removeRequirement = (index) => {
        setNewInternship(prev => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index)
        }));
    };

    // Add responsibility
    const addResponsibility = () => {
        if (currentResponsibility.trim()) {
            setNewInternship(prev => ({
                ...prev,
                responsibilities: [...prev.responsibilities, currentResponsibility.trim()]
            }));
            setCurrentResponsibility('');
        }
    };

    const removeResponsibility = (index) => {
        setNewInternship(prev => ({
            ...prev,
            responsibilities: prev.responsibilities.filter((_, i) => i !== index)
        }));
    };

    // Add perk
    const addPerk = () => {
        if (currentPerk.trim()) {
            setNewInternship(prev => ({
                ...prev,
                perks: [...prev.perks, currentPerk.trim()]
            }));
            setCurrentPerk('');
        }
    };

    const removePerk = (index) => {
        setNewInternship(prev => ({
            ...prev,
            perks: prev.perks.filter((_, i) => i !== index)
        }));
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

    // Open duplicate modal
    const handleOpenDuplicate = (internship) => {
        setSelectedInternship(internship);
        setShowDuplicateModal(true);
    };

    // Open create modal
    const handleOpenCreate = () => {
        setShowCreateModal(true);
    };

    // Close all modals
    const closeAllModals = () => {
        setShowDetailsModal(false);
        setShowDeleteModal(false);
        setShowStatusModal(false);
        setShowDuplicateModal(false);
        setShowCreateModal(false);
        setSelectedInternship(null);
        setNewStatus('Published');
        resetNewInternshipForm();
    };

    // Navigate to edit page
    const handleEditInternship = (internshipId) => {
        navigate(`/company/internships/edit/${internshipId}`);
    };

    // Navigate to applications page
    const handleViewApplications = (internshipId) => {
        navigate(`/company/applications?internship=${internshipId}`);
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
        if (!amount) return 'Unpaid';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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
                return <FaArchive className="text-gray-600" />;
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
        return (internship.filledPositions || 0) >= (internship.openings || 1);
    };

    // Check if internship is open for applications
    const isOpenForApplications = (internship) => {
        return internship.status === 'Published' &&
            !isExpired(internship.applicationDeadline) &&
            !isFilled(internship);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    if (loading && !refreshing) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading your internships...</p>
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
                            Manage <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Internships</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Create and manage your company's internships</p>
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
                            onClick={handleOpenCreate}
                            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition flex items-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            <FaPlus /> New Internship
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
                                <FaRocket className="text-green-600 text-xl" />
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
                                <FaArchive className="text-gray-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.archived}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Archived</h3>
                        <p className="text-xs text-gray-500 mt-1">Old internships</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <FaUsers className="text-purple-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.applications}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Applications</h3>
                        <p className="text-xs text-gray-500 mt-1">Total received</p>
                    </motion.div>
                </div>

                {/* Filters and Sort */}
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
                                    <option value="applicationDeadline">Deadline</option>
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
                                Your Internships ({pagination.total})
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
                                {searchQuery || filters.status !== 'all' || filters.category !== 'all' || filters.workMode !== 'all'
                                    ? 'No internships match your search criteria'
                                    : 'You haven\'t created any internships yet'}
                            </p>
                            <button
                                onClick={handleOpenCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                            >
                                <FaPlus /> Create Your First Internship
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Internship</th>
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
                                                            {isOpenForApplications(internship) && (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                                    Open
                                                                </span>
                                                            )}
                                                        </div>
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
                                                            {internship.filledPositions || 0}/{internship.openings || 1}
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

                                                    {/* <button
                                                        onClick={() => handleEditInternship(internship._id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Edit Internship"
                                                    >
                                                        <FaEdit />
                                                    </button> */}

                                                    <button
                                                        onClick={() => handleOpenStatusChange(internship)}
                                                        disabled={processingId === internship._id && processingAction === 'status'}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition disabled:opacity-50"
                                                        title="Change Status"
                                                    >
                                                        {processingId === internship._id && processingAction === 'status' ? (
                                                            <FaSpinner className="animate-spin" />
                                                        ) : (
                                                            <FaFileContract />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenDuplicate(internship)}
                                                        className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition"
                                                        title="Duplicate Internship"
                                                    >
                                                        <FaCopy />
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
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions Footer */}
                <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={handleOpenCreate}
                            className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:border-blue-300 transition text-center"
                        >
                            <FaPlus className="text-blue-600 text-2xl mx-auto mb-2" />
                            <p className="font-medium text-blue-800">Create New Internship</p>
                            <p className="text-xs text-blue-600 mt-1">Post a new opportunity</p>
                        </button>

                        <button
                            onClick={() => navigate('/company/applications')}
                            className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:border-green-300 transition text-center"
                        >
                            <FaUsers className="text-green-600 text-2xl mx-auto mb-2" />
                            <p className="font-medium text-green-800">View Applications</p>
                            <p className="text-xs text-green-600 mt-1">Review all applications</p>
                        </button>

                        <button
                            onClick={() => navigate('/company/reports')}
                            className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:border-purple-300 transition text-center"
                        >
                            <FaChartBar className="text-purple-600 text-2xl mx-auto mb-2" />
                            <p className="font-medium text-purple-800">View Reports</p>
                            <p className="text-xs text-purple-600 mt-1">Performance analytics</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Create New Internship Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Create New Internship</h2>
                                <p className="text-gray-600 mt-1">Fill in the details to create a new internship opportunity</p>
                            </div>
                            <button
                                onClick={closeAllModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <FaTimes className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column - Basic Info */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FaBuilding className="inline mr-2 text-blue-600" />
                                            Internship Title *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={newInternship.title}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Frontend Developer Intern"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FaFileAlt className="inline mr-2 text-green-600" />
                                            Description *
                                        </label>
                                        <textarea
                                            name="description"
                                            value={newInternship.description}
                                            onChange={handleInputChange}
                                            rows="4"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Describe the internship role, company culture, and what students will learn..."
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                            <input
                                                type="text"
                                                name="category"
                                                value={newInternship.category}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Software Development"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                            <input
                                                type="text"
                                                name="department"
                                                value={newInternship.department}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Engineering"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={newInternship.location}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Remote, Bengaluru"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                                            <select
                                                name="workMode"
                                                value={newInternship.workMode}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="Remote">Remote</option>
                                                <option value="Hybrid">Hybrid</option>
                                                <option value="On-site">On-site</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Internship Type</label>
                                            <select
                                                name="internshipType"
                                                value={newInternship.internshipType}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (months)</label>
                                            <input
                                                type="number"
                                                name="duration"
                                                value={newInternship.duration}
                                                onChange={handleInputChange}
                                                min="1"
                                                max="12"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Dates, Skills, etc. */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={newInternship.startDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                                            <input
                                                type="date"
                                                name="applicationDeadline"
                                                value={newInternship.applicationDeadline}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Apply By</label>
                                            <input
                                                type="date"
                                                name="applyBy"
                                                value={newInternship.applyBy}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Openings</label>
                                            <input
                                                type="number"
                                                name="openings"
                                                value={newInternship.openings}
                                                onChange={handleInputChange}
                                                min="1"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Stipend Amount</label>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={newInternship.stipend.amount}
                                                onChange={handleStipendChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0 for unpaid"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                            <select
                                                name="currency"
                                                value={newInternship.stipend.currency}
                                                onChange={handleStipendChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="INR">INR</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FaGraduationCap className="inline mr-2 text-purple-600" />
                                            Required Skills
                                        </label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={currentSkill}
                                                onChange={(e) => setCurrentSkill(e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., React, Python"
                                                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                            />
                                            <button
                                                onClick={addSkill}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newInternship.skills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                                                >
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSkill(skill)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Requirements, Responsibilities, and Perks */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                {/* Requirements */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaListUl className="inline mr-2 text-red-600" />
                                        Requirements
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={currentRequirement}
                                            onChange={(e) => setCurrentRequirement(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Currently enrolled in university"
                                            onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                                        />
                                        <button
                                            onClick={addRequirement}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <ul className="space-y-2">
                                        {newInternship.requirements.map((req, index) => (
                                            <li key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                                                <span className="text-sm">{req}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRequirement(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Responsibilities */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaTasks className="inline mr-2 text-green-600" />
                                        Responsibilities
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={currentResponsibility}
                                            onChange={(e) => setCurrentResponsibility(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Develop new features"
                                            onKeyPress={(e) => e.key === 'Enter' && addResponsibility()}
                                        />
                                        <button
                                            onClick={addResponsibility}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <ul className="space-y-2">
                                        {newInternship.responsibilities.map((resp, index) => (
                                            <li key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                                <span className="text-sm">{resp}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeResponsibility(index)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Perks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaAward className="inline mr-2 text-yellow-600" />
                                        Perks & Benefits
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={currentPerk}
                                            onChange={(e) => setCurrentPerk(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Flexible hours"
                                            onKeyPress={(e) => e.key === 'Enter' && addPerk()}
                                        />
                                        <button
                                            onClick={addPerk}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <ul className="space-y-2">
                                        {newInternship.perks.map((perk, index) => (
                                            <li key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                                <span className="text-sm">{perk}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removePerk(index)}
                                                    className="text-yellow-600 hover:text-yellow-800"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
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
                                onClick={handleCreateInternship}
                                disabled={creating}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Creating...
                                    </>
                                ) : (
                                    <>
                                        <FaSave /> Create Internship
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

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
                                        <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm">
                                            {selectedInternship.workMode}
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
                                        {isOpenForApplications(selectedInternship) && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                Accepting Applications
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
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Openings:</span>
                                                <span className="font-semibold">
                                                    {selectedInternship.filledPositions || 0}/{selectedInternship.openings || 1} filled
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                                                    {selectedInternship.filledPositions || 0}/{selectedInternship.openings || 1}
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

                                {/* Application Details */}
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaFileAlt className="text-green-600" />
                                        Application Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Department</p>
                                            <p className="font-medium text-gray-900">{selectedInternship.department || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Category</p>
                                            <p className="font-medium text-gray-900">{selectedInternship.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Apply By</p>
                                            <p className="font-medium text-gray-900">{formatDate(selectedInternship.applyBy)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Active</p>
                                            <p className={`font-medium ${selectedInternship.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                {selectedInternship.isActive ? 'Yes' : 'No'}
                                            </p>
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
                                        )) || <p className="text-gray-500">No requirements specified</p>}
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
                                        )) || <p className="text-gray-500">No responsibilities specified</p>}
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
                                onClick={() => handleViewApplications(selectedInternship._id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <FaUsers /> View Applications ({selectedInternship.applicationsCount || 0})
                            </button>
                            <button
                                onClick={() => {
                                    closeAllModals();
                                    handleEditInternship(selectedInternship._id);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                            >
                                <FaEdit /> Edit Internship
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
                                            Changing status to "Published" will make this internship visible to all students.
                                            Changing to "Draft" will hide it from public view.
                                            "Closed" will stop new applications but keep it visible.
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

            {/* Duplicate Confirmation Modal */}
            {showDuplicateModal && selectedInternship && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Duplicate Internship</h2>
                            <p className="text-gray-600 mt-2">Create a copy of this internship</p>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <p className="text-gray-600 mb-2">Original Internship:</p>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                                        <FaBriefcase className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedInternship.title}</p>
                                        <p className="text-sm text-gray-500">
                                            Status: <span className={`font-medium ${getStatusBadge(selectedInternship.status)} px-2 py-1 rounded`}>
                                                {selectedInternship.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <FaCopy className="text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium">Duplicate Details</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            The duplicate will be created as a Draft with "(Copy)" added to the title.
                                            All other details will be copied exactly.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600">
                                <p><strong>New Title:</strong> {selectedInternship.title} (Copy)</p>
                                <p><strong>Status:</strong> Draft</p>
                                <p><strong>Applications:</strong> 0 (fresh start)</p>
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
                                onClick={handleDuplicateInternship}
                                disabled={processingAction === 'duplicate'}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {processingAction === 'duplicate' ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Duplicating...
                                    </>
                                ) : (
                                    <>
                                        <FaCopy /> Duplicate Internship
                                    </>
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
                            <p className="text-gray-600">Are you sure you want to delete this internship?</p>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                                <FaExclamationTriangle className="text-red-600 text-xl" />
                                <div>
                                    <p className="font-medium text-red-800">{selectedInternship.title}</p>
                                    <p className="text-sm text-red-600">
                                        {selectedInternship.applicationsCount > 0
                                            ? 'This internship has applications and will be archived instead of deleted.'
                                            : 'This will permanently delete the internship.'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 mb-4 space-y-2">
                                <p><strong>Status:</strong> {selectedInternship.status}</p>
                                <p><strong>Applications:</strong> {selectedInternship.applicationsCount || 0}</p>
                                <p><strong>Positions Filled:</strong> {selectedInternship.filledPositions || 0}/{selectedInternship.openings || 1}</p>
                                <p><strong>Views:</strong> {selectedInternship.views || 0}</p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> If this internship has applications, it will be archived instead of deleted.
                                    Archived internships can be restored if needed.
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

export default CompanyManageInternships;
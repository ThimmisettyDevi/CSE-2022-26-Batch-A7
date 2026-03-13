// src/components/Applications/ViewAllApplications.jsx (Corrected)
import React, { useState, useEffect, useMemo } from 'react';
import {
    FaSearch,
    FaFilter,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaClock,
    FaBriefcase,
    FaBuilding,
    FaMoneyBillWave,
    FaCheckCircle,
    FaTimes,
    FaExternalLinkAlt,
    FaSortAmountDown,
    FaSortAmountUp,
    FaStar,
    FaFire,
    FaRocket,
    FaGraduationCap,
    FaCertificate,
    FaUsers,
    FaListAlt,
    FaFileAlt,
    FaLink,
    FaGithub,
    FaLinkedin,
    FaPaperPlane,
    FaUpload,
    FaSpinner
} from 'react-icons/fa';
import { MdWork, MdLocationOn, MdAttachMoney, MdAccessTime, MdClose } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';

const ViewAllApplications = () => {
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [quickApplyingId, setQuickApplyingId] = useState(null);
    const [activeTab, setActiveTab] = useState('internships');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [profileComplete, setProfileComplete] = useState(true);
    const [studentProfile, setStudentProfile] = useState(null);

    const [applicationForm, setApplicationForm] = useState({
        coverLetter: '',
        portfolioLink: '',
        githubLink: '',
        linkedinLink: '',
        additionalInfo: ''
    });

    const [filters, setFilters] = useState({
        category: '',
        workMode: '',
        internshipType: '',
        location: '',
        minStipend: 0,
        maxStipend: 100000,
        duration: '',
        status: 'all'
    });

    // State for internships data
    const [allInternships, setAllInternships] = useState([]);
    const [filteredInternships, setFilteredInternships] = useState([]);

    // State for filter options (extracted from data)
    const [filterOptions, setFilterOptions] = useState({
        categories: [],
        workModes: [],
        locations: [],
        internshipTypes: []
    });

    // Fetch student profile
    const fetchStudentProfile = async () => {
        try {
            const response = await axiosInstance.get('/auth/me');
            const { user } = response.data;
            setStudentProfile(user);

            // Check if profile is complete
            const isComplete = user?.name && user?.email && user?.mobileNumber && user?.education?.[0]?.college;
            setProfileComplete(user);

            // Pre-fill application form with profile data
            setApplicationForm(prev => ({
                ...prev,
                portfolioLink: user.portfolioWebsite || '',
                githubLink: user.githubProfile || '',
                linkedinLink: user.linkedinProfile || ''
            }));
        } catch (error) {
            console.error('Error fetching student profile:', error);
            setProfileComplete(false);
        }
    };

    // Fetch all internships data
    const fetchInternships = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/internships');
            
            // Check response structure
            let data = [];
            if (response.data.internships) {
                data = response.data.internships;
            } else if (response.data.data) {
                data = response.data.data;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            }

            // Fetch user's applications to check which internships they've applied to
            let userApplications = [];
            try {
                const appsResponse = await axiosInstance.get('/applications/my-applications');
                userApplications = appsResponse.data.applications || [];
            } catch (error) {
                console.log('No applications found or error fetching applications:', error.message);
            }

            // Map internship data with hasApplied field
            const internshipsWithAppliedStatus = data.map(internship => {
                const hasApplied = userApplications.some(app => {
                    // Check different possible structures
                    return (
                        app.internshipId?._id === internship._id ||
                        app.internshipId === internship._id ||
                        app.internship?._id === internship._id
                    );
                });
                
                // Determine if internship is open for applications
                const now = new Date();
                const deadline = new Date(internship.applicationDeadline);
                const isOpen = internship.status === 'Published' && 
                               internship.isActive === true && 
                               deadline >= now &&
                               (internship.filledPositions || 0) < (internship.openings || 1);
                
                return {
                    ...internship,
                    hasApplied: hasApplied || false,
                    isOpen: isOpen,
                    availablePositions: Math.max(0, (internship.openings || 1) - (internship.filledPositions || 0)),
                    // Ensure company info structure
                    companyInfo: internship.companyInfo || {
                        companyName: internship.companyId?.companyName || internship.companyName || 'Unknown Company',
                        logo: internship.companyId?.logo || internship.logo,
                        verified: internship.companyId?.verified || false,
                        industry: internship.companyId?.industry
                    }
                };
            });

            setAllInternships(internshipsWithAppliedStatus);

            // Extract filter options from data
            const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
            const workModes = [...new Set(data.map(item => item.workMode).filter(Boolean))];
            const locations = [...new Set(data.map(item => item.location).filter(Boolean))];
            const internshipTypes = [...new Set(data.map(item => item.internshipType || item.type).filter(Boolean))];

            setFilterOptions({
                categories,
                workModes,
                locations,
                internshipTypes
            });

        } catch (error) {
            console.error('Error fetching internships:', error);
            toast.error('Failed to load internships');
            setAllInternships([]);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to update hasApplied status for an internship
    const updateInternshipAppliedStatus = (internshipId) => {
        setAllInternships(prev => prev.map(internship => {
            if (internship._id === internshipId) {
                return {
                    ...internship,
                    hasApplied: true,
                    isOpen: false, // Close it since user applied
                    applicationsCount: (internship.applicationsCount || 0) + 1,
                    availablePositions: Math.max(0, (internship.availablePositions || internship.openings || 1) - 1)
                };
            }
            return internship;
        }));
    };

    useEffect(() => {
        fetchStudentProfile();
        fetchInternships();
    }, []);

    // Apply filters to internships
    useEffect(() => {
        if (allInternships.length === 0) return;

        let filtered = [...allInternships];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(internship =>
                internship.title?.toLowerCase().includes(query) ||
                internship.description?.toLowerCase().includes(query) ||
                internship.companyInfo?.companyName?.toLowerCase().includes(query) ||
                internship.skills?.some(skill => skill.toLowerCase().includes(query)) ||
                internship.category?.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (filters.category) {
            filtered = filtered.filter(internship => internship.category === filters.category);
        }

        // Work mode filter
        if (filters.workMode) {
            filtered = filtered.filter(internship => internship.workMode === filters.workMode);
        }

        // Internship type filter
        if (filters.internshipType) {
            filtered = filtered.filter(internship => 
                (internship.internshipType || internship.type) === filters.internshipType
            );
        }

        // Location filter
        if (filters.location) {
            filtered = filtered.filter(internship => internship.location === filters.location);
        }

        // Stipend filter
        filtered = filtered.filter(internship => {
            // Handle different stipend structures
            let stipendAmount = 0;
            if (internship.stipend && typeof internship.stipend === 'object') {
                stipendAmount = internship.stipend.amount || internship.stipend.min || 0;
            } else if (typeof internship.stipend === 'number') {
                stipendAmount = internship.stipend;
            } else if (internship.stipend && internship.stipend.includes('-')) {
                // Handle "5000-10000" format
                stipendAmount = parseInt(internship.stipend.split('-')[0]) || 0;
            }
            return stipendAmount >= filters.minStipend && stipendAmount <= filters.maxStipend;
        });

        // Duration filter
        if (filters.duration) {
            const duration = parseInt(filters.duration);
            filtered = filtered.filter(internship => internship.duration <= duration);
        }

        // Status filter
        if (filters.status === 'open') {
            filtered = filtered.filter(internship => internship.isOpen === true);
        } else if (filters.status === 'closed') {
            filtered = filtered.filter(internship => internship.isOpen === false);
        }

        // Sort filtered results
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'stipend':
                    // Handle different stipend structures
                    let aStipend = 0, bStipend = 0;
                    
                    if (a.stipend && typeof a.stipend === 'object') {
                        aStipend = a.stipend.amount || a.stipend.min || 0;
                    } else if (typeof a.stipend === 'number') {
                        aStipend = a.stipend;
                    }
                    
                    if (b.stipend && typeof b.stipend === 'object') {
                        bStipend = b.stipend.amount || b.stipend.min || 0;
                    } else if (typeof b.stipend === 'number') {
                        bStipend = b.stipend;
                    }
                    
                    aValue = aStipend;
                    bValue = bStipend;
                    break;
                    
                case 'openings':
                    aValue = a.openings || 0;
                    bValue = b.openings || 0;
                    break;
                    
                case 'duration':
                    aValue = a.duration || 0;
                    bValue = b.duration || 0;
                    break;
                    
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt).getTime() || 0;
                    bValue = new Date(b.createdAt).getTime() || 0;
                    break;
            }

            if (sortOrder === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        setFilteredInternships(filtered);
    }, [allInternships, searchQuery, filters, sortBy, sortOrder]);

    // Handle sort change
    const handleSortChange = (newSortBy) => {
        if (newSortBy === sortBy) {
            // Toggle sort order if same field
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            // Set new sort field with default descending order
            setSortBy(newSortBy);
            setSortOrder('desc');
        }
    };

    // Get sort display text
    const getSortDisplayText = () => {
        const sortOptions = {
            'createdAt': 'Date',
            'stipend': 'Stipend',
            'openings': 'Openings',
            'duration': 'Duration'
        };

        const field = sortOptions[sortBy] || 'Date';
        const order = sortOrder === 'desc' ? ' (Newest/High to Low)' : ' (Oldest/Low to High)';

        return `${field}${order}`;
    };

    // Handle resume file selection
    const handleResumeUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF or DOC file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Resume size should be less than 10MB');
            return;
        }

        setResumeFile(file);
    };

    // Get formatted stipend display
    const getFormattedStipend = (stipend) => {
        if (!stipend) return 'Negotiable';
        
        if (typeof stipend === 'object') {
            if (stipend.amount) {
                return `₹${stipend.amount.toLocaleString()}`;
            } else if (stipend.min && stipend.max) {
                return `₹${stipend.min.toLocaleString()} - ₹${stipend.max.toLocaleString()}`;
            } else if (stipend.min) {
                return `From ₹${stipend.min.toLocaleString()}`;
            }
        } else if (typeof stipend === 'number') {
            return `₹${stipend.toLocaleString()}`;
        } else if (typeof stipend === 'string') {
            return stipend;
        }
        
        return 'Negotiable';
    };

    // Get numeric stipend for filtering
    const getNumericStipend = (stipend) => {
        if (!stipend) return 0;
        
        if (typeof stipend === 'object') {
            return stipend.amount || stipend.min || 0;
        } else if (typeof stipend === 'number') {
            return stipend;
        } else if (typeof stipend === 'string' && stipend.includes('-')) {
            return parseInt(stipend.split('-')[0]) || 0;
        }
        
        return 0;
    };

    // Submit application from form
    const submitApplication = async () => {
        if (applying || !selectedInternship) return;

        if (!profileComplete) {
            toast.error('Please complete your profile before applying');
            return;
        }

        if (!applicationForm.coverLetter.trim()) {
            toast.error('Cover letter is required');
            return;
        }

        try {
            setApplying(true);
            const formData = new FormData();
            formData.append('internshipId', selectedInternship._id);
            formData.append('coverLetter', applicationForm.coverLetter);

            if (applicationForm.portfolioLink) {
                formData.append('portfolioLink', applicationForm.portfolioLink);
            }
            if (applicationForm.githubLink) {
                formData.append('githubLink', applicationForm.githubLink);
            }
            if (applicationForm.linkedinLink) {
                formData.append('linkedinLink', applicationForm.linkedinLink);
            }
            if (applicationForm.additionalInfo) {
                formData.append('additionalInfo', applicationForm.additionalInfo);
            }
            if (resumeFile) {
                formData.append('resume', resumeFile);
            }

            const response = await axiosInstance.post('/applications', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Check for successful response
            if (response.status === 200 || response.status === 201) {
                updateInternshipAppliedStatus(selectedInternship._id);
                toast.success('Application submitted successfully!');
                closeApplicationForm();
            } else {
                throw new Error('Failed to submit application');
            }

        } catch (error) {
            console.error('Error applying:', error);

            // Check for specific error messages
            if (error.response?.status === 400) {
                const errorMsg = error.response.data?.message || error.response.data?.msg;
                if (errorMsg?.toLowerCase().includes('already applied')) {
                    toast.error('You have already applied for this internship');
                    updateInternshipAppliedStatus(selectedInternship._id);
                    closeApplicationForm();
                } else if (errorMsg?.toLowerCase().includes('profile')) {
                    toast.error('Please complete your profile before applying');
                } else if (errorMsg?.toLowerCase().includes('resume')) {
                    toast.error('Resume is required. Please upload a resume or update your profile.');
                } else if (errorMsg?.toLowerCase().includes('internship is not currently accepting')) {
                    toast.error('This internship is not currently accepting applications');
                    closeApplicationForm();
                } else {
                    toast.error(errorMsg || 'Failed to submit application');
                }
            } else if (error.response?.status === 401) {
                toast.error('Please log in to apply');
            } else if (error.response?.status === 404) {
                toast.error('Internship not found');
                closeApplicationForm();
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.msg || 'Failed to submit application');
            }
        } finally {
            setApplying(false);
        }
    };

    // Quick apply (without custom cover letter)
    const handleQuickApply = async (internshipId) => {
        if (quickApplyingId === internshipId || applying) return;

        if (!profileComplete) {
            toast.error('Please complete your profile before applying');
            return;
        }

        const internship = allInternships.find(i => i._id === internshipId);
        if (!internship || internship.hasApplied || !internship.isOpen) {
            return;
        }

        if (!window.confirm('Are you sure you want to apply for this internship?')) {
            return;
        }

        try {
            setQuickApplyingId(internshipId);
            const formData = new FormData();
            formData.append('internshipId', internshipId);
            formData.append('coverLetter', 'I am very interested in this position and believe my skills align well with your requirements.');

            // Use profile links if available
            if (studentProfile?.portfolioWebsite) {
                formData.append('portfolioLink', studentProfile.portfolioWebsite);
            }
            if (studentProfile?.githubProfile) {
                formData.append('githubLink', studentProfile.githubProfile);
            }
            if (studentProfile?.linkedinProfile) {
                formData.append('linkedinLink', studentProfile.linkedinProfile);
            }

            const response = await axiosInstance.post('/applications', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Check for successful response
            if (response.status === 200 || response.status === 201) {
                updateInternshipAppliedStatus(internshipId);
                toast.success('Application submitted successfully!');
            } else {
                throw new Error('Failed to submit application');
            }

        } catch (error) {
            console.error('Error applying:', error);

            // Check for specific error messages
            if (error.response?.status === 400) {
                const errorMsg = error.response.data?.message || error.response.data?.msg;
                if (errorMsg?.toLowerCase().includes('already applied')) {
                    toast.error('You have already applied for this internship');
                    updateInternshipAppliedStatus(internshipId);
                } else if (errorMsg?.toLowerCase().includes('profile')) {
                    toast.error('Please complete your profile before applying');
                } else if (errorMsg?.toLowerCase().includes('resume')) {
                    toast.error('Resume is required. Please upload a resume or update your profile.');
                } else if (errorMsg?.toLowerCase().includes('internship is not currently accepting')) {
                    toast.error('This internship is not currently accepting applications');
                } else {
                    toast.error(errorMsg || 'Failed to submit application');
                }
            } else if (error.response?.status === 401) {
                toast.error('Please log in to apply');
            } else if (error.response?.status === 404) {
                toast.error('Internship not found');
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.msg || 'Failed to submit application');
            }
        } finally {
            setQuickApplyingId(null);
        }
    };

    // Open application form
    const openApplicationForm = (internship) => {
        if (internship.hasApplied) {
            toast.error('You have already applied for this internship');
            return;
        }

        if (!internship.isOpen) {
            toast.error('This internship is no longer accepting applications');
            return;
        }

        if (!profileComplete) {
            toast.error('Please complete your profile before applying');
            return;
        }

        setSelectedInternship(internship);
        setShowApplicationForm(true);
    };

    // Close application form
    const closeApplicationForm = () => {
        setShowApplicationForm(false);
        setApplicationForm({
            coverLetter: '',
            portfolioLink: studentProfile?.portfolioWebsite || '',
            githubLink: studentProfile?.githubProfile || '',
            linkedinLink: studentProfile?.linkedinProfile || '',
            additionalInfo: ''
        });
        setResumeFile(null);
        setSelectedInternship(null);
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        // Search is handled in useEffect
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
        setShowFilters(false);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            category: '',
            workMode: '',
            internshipType: '',
            location: '',
            minStipend: 0,
            maxStipend: 100000,
            duration: '',
            status: 'all'
        });
        setSearchQuery('');
    };

    // Open details dialog
    const openDetails = (internship) => {
        setSelectedInternship(internship);
        setShowDetails(true);
    };

    // Close details dialog
    const closeDetails = () => {
        setShowDetails(false);
        setSelectedInternship(null);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    // Calculate days left to apply
    const getDaysLeft = (deadline) => {
        if (!deadline) return 0;
        try {
            const deadlineDate = new Date(deadline);
            const today = new Date();
            const diffTime = deadlineDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 0;
        } catch (error) {
            return 0;
        }
    };

    // Check if application deadline is near (less than 3 days)
    const isDeadlineNear = (deadline) => {
        return getDaysLeft(deadline) <= 3 && getDaysLeft(deadline) > 0;
    };

    // Get statistics
    const stats = useMemo(() => {
        const total = allInternships.length;
        const open = allInternships.filter(i => i.isOpen).length;
        const closed = total - open;
        const applied = allInternships.filter(i => i.hasApplied).length;
        const categories = filterOptions.categories.length;
        const locations = filterOptions.locations.length;

        return { total, open, closed, applied, categories, locations };
    }, [allInternships, filterOptions]);

    if (loading && allInternships.length === 0) {
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
                        <p className="mt-4 text-gray-600">Loading internships...</p>
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
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Your Dream Internship</h1>
                    <p className="text-blue-100">Browse and apply to top internships from leading companies</p>
                    {!profileComplete && (
                        <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                            <p className="text-yellow-100 text-sm">
                                <strong>Note:</strong> Complete your profile before applying to internships.
                                <a href="/profile" className="underline ml-2">Complete Profile</a>
                            </p>
                        </div>
                    )}
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
                                    placeholder="Search internships by title, skills, company, or description..."
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
                                onClick={() => handleSortChange(sortBy)}
                                className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                            >
                                {sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                                {getSortDisplayText()}
                            </button>
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                        >
                            <FaFilter /> Filters
                            {(filters.category || filters.workMode || filters.location || filters.internshipType ||
                                filters.minStipend > 0 || filters.maxStipend < 100000 || filters.duration || filters.status !== 'all') && (
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                                {/* Work Mode Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Work Mode
                                    </label>
                                    <select
                                        value={filters.workMode}
                                        onChange={(e) => handleFilterChange('workMode', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Work Modes</option>
                                        {filterOptions.workModes.map((mode, index) => (
                                            <option key={index} value={mode}>{mode}</option>
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

                                {/* Internship Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Internship Type
                                    </label>
                                    <select
                                        value={filters.internshipType}
                                        onChange={(e) => handleFilterChange('internshipType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Types</option>
                                        {filterOptions.internshipTypes.map((type, index) => (
                                            <option key={index} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

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
                                        <option value="all">All Internships</option>
                                        <option value="open">Open Positions</option>
                                        <option value="closed">Closed Positions</option>
                                    </select>
                                </div>

                                {/* Duration Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Duration (months)
                                    </label>
                                    <select
                                        value={filters.duration}
                                        onChange={(e) => handleFilterChange('duration', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Any Duration</option>
                                        <option value="3">Up to 3 months</option>
                                        <option value="6">Up to 6 months</option>
                                        <option value="12">Up to 12 months</option>
                                    </select>
                                </div>

                                {/* Min Stipend Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Min Stipend (₹)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50000"
                                        step="5000"
                                        value={filters.minStipend}
                                        onChange={(e) => handleFilterChange('minStipend', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-sm text-gray-600">
                                        ₹{filters.minStipend.toLocaleString()}
                                    </div>
                                </div>

                                {/* Max Stipend Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Stipend (₹)
                                    </label>
                                    <input
                                        type="range"
                                        min="5000"
                                        max="100000"
                                        step="5000"
                                        value={filters.maxStipend}
                                        onChange={(e) => handleFilterChange('maxStipend', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-sm text-gray-600">
                                        ₹{filters.maxStipend.toLocaleString()}
                                    </div>
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

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        <div className="text-sm text-gray-600">Total Internships</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-green-600">{stats.open}</div>
                        <div className="text-sm text-gray-600">Open Positions</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-red-600">{stats.closed}</div>
                        <div className="text-sm text-gray-600">Closed Positions</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
                        <div className="text-sm text-gray-600">Categories</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-orange-600">{stats.locations}</div>
                        <div className="text-sm text-gray-600">Locations</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-teal-600">{stats.applied}</div>
                        <div className="text-sm text-gray-600">Applied by You</div>
                    </div>
                </div>

                {/* Internships Grid */}
                {filteredInternships.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {filteredInternships.map((internship, index) => (
                            <motion.div
                                key={internship._id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                                {/* Urgent Badge */}
                                {isDeadlineNear(internship.applicationDeadline) && !internship.hasApplied && internship.isOpen && (
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full z-10">
                                        <FaFire className="inline mr-1" /> Apply Soon!
                                    </div>
                                )}

                                {/* Applied Badge */}
                                {internship.hasApplied && (
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full z-10">
                                        <FaCheckCircle className="inline mr-1" /> Applied
                                    </div>
                                )}

                                {/* Internship Header */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                                                {internship.companyInfo?.logo ? (
                                                    <img
                                                        src={internship.companyInfo.logo}
                                                        alt={internship.companyInfo.companyName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.parentElement.innerHTML = `
                                                                <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                                    <i class="fas fa-building text-gray-400 text-2xl"></i>
                                                                </div>
                                                            `;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                        <FaBuilding className="text-gray-400 text-2xl" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {internship.title || 'Untitled Internship'}
                                                </h3>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-medium text-gray-700">
                                                        {internship.companyInfo?.companyName || 'Unknown Company'}
                                                    </span>
                                                    {internship.companyInfo?.verified && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                            <FaCheckCircle /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <FaMapMarkerAlt /> {internship.location || 'Remote'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MdWork /> {internship.workMode || 'Flexible'}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                        {internship.internshipType || internship.type || 'Internship'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Internship Details */}
                                <div className="p-6">
                                    {/* Description */}
                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                        {internship.description || 'No description available.'}
                                    </p>

                                    {/* Skills */}
                                    {internship.skills && internship.skills.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {internship.skills.slice(0, 5).map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {internship.skills.length > 5 && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                                        +{internship.skills.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                                                <MdAttachMoney />
                                                <span className="text-xs">Stipend</span>
                                            </div>
                                            <div className="font-bold text-gray-900">
                                                {getFormattedStipend(internship.stipend)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                                                <MdAccessTime />
                                                <span className="text-xs">Duration</span>
                                            </div>
                                            <div className="font-bold text-gray-900">
                                                {internship.duration || 'Flexible'} months
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                                                <FaUsers />
                                                <span className="text-xs">Openings</span>
                                            </div>
                                            <div className="font-bold text-gray-900">
                                                {internship.availablePositions || internship.openings || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                                                <FaCalendarAlt />
                                                <span className="text-xs">Apply By</span>
                                            </div>
                                            <div className={`font-bold ${isDeadlineNear(internship.applicationDeadline) && !internship.hasApplied && internship.isOpen ? 'text-red-600' : 'text-gray-900'}`}>
                                                {formatDate(internship.applicationDeadline)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer with Action Button */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="text-sm text-gray-500">
                                            {!internship.hasApplied && internship.isOpen && (
                                                <span className="flex items-center gap-1">
                                                    <FaClock className="text-gray-400" />
                                                    {getDaysLeft(internship.applicationDeadline)} days left to apply
                                                </span>
                                            )}
                                            {internship.hasApplied && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <FaCheckCircle /> You have applied for this position
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => openDetails(internship)}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                                            >
                                                <FaExternalLinkAlt /> View Details
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (quickApplyingId === internship._id) return;
                                                    if (internship.hasApplied) {
                                                        toast.error('You have already applied');
                                                        return;
                                                    }
                                                    if (!internship.isOpen) {
                                                        toast.error('Internship is closed');
                                                        return;
                                                    }
                                                    if (!profileComplete) {
                                                        toast.error('Please complete your profile');
                                                        return;
                                                    }
                                                    if (window.confirm('Are you sure you want to apply for this internship?')) {
                                                        handleQuickApply(internship._id);
                                                    }
                                                }}
                                                disabled={internship.hasApplied || !internship.isOpen || !profileComplete || quickApplyingId === internship._id}
                                                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 min-w-[120px] justify-center ${internship.hasApplied
                                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                    : !internship.isOpen
                                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        : !profileComplete
                                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                            : quickApplyingId === internship._id
                                                                ? 'bg-blue-500 text-white cursor-not-allowed opacity-75'
                                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                                    }`}
                                            >
                                                {quickApplyingId === internship._id ? (
                                                    <>
                                                        <FaSpinner className="animate-spin mr-2" />
                                                        Applying...
                                                    </>
                                                ) : internship.hasApplied ? (
                                                    <>
                                                        <FaCheckCircle /> Applied
                                                    </>
                                                ) : !internship.isOpen ? (
                                                    'Closed'
                                                ) : !profileComplete ? (
                                                    'Complete Profile'
                                                ) : (
                                                    'Apply Now'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow border border-gray-100">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
                            <MdWork className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No internships found</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchQuery || Object.values(filters).some(f =>
                                (typeof f === 'string' && f) ||
                                (typeof f === 'number' && (f !== 0 && f !== 100000))
                            )
                                ? 'Try adjusting your search or filters to find more opportunities.'
                                : 'No internships available at the moment. Check back soon!'}
                        </p>
                        {(searchQuery || Object.values(filters).some(f =>
                            (typeof f === 'string' && f) ||
                            (typeof f === 'number' && (f !== 0 && f !== 100000))
                        )) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Clear Search & Filters
                                </button>
                            )}
                    </div>
                )}

                {/* Quick Tips */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FaRocket className="text-blue-600" /> Quick Tips for Applicants
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1">Complete Your Profile</div>
                            <p className="text-sm text-gray-600">Make sure your profile is 100% complete before applying.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1">Customize Your Application</div>
                            <p className="text-sm text-gray-600">Tailor your resume and cover letter for each internship.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1">Apply Early</div>
                            <p className="text-sm text-gray-600">Positions fill up quickly, so apply as soon as possible.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Form Dialog */}
            <AnimatePresence>
                {showApplicationForm && selectedInternship && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeApplicationForm}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                                {/* Dialog Header */}
                                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                                Apply for {selectedInternship.title}
                                            </h2>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-700">
                                                    {selectedInternship.companyInfo?.companyName}
                                                </span>
                                                {selectedInternship.companyInfo?.verified && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <FaCheckCircle /> Verified Company
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeApplicationForm}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <MdClose className="text-2xl text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Dialog Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {/* Resume Upload */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Resume Upload (Optional)
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
                                            {resumeFile ? (
                                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <FaFileAlt className="text-blue-600 text-xl" />
                                                        <div className="text-left">
                                                            <p className="font-medium text-gray-900">{resumeFile.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setResumeFile(null)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <FaFileAlt className="text-3xl text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-600 mb-2">Upload your resume (PDF or DOC)</p>
                                                    <p className="text-xs text-gray-500 mb-3">
                                                        If you don't upload a new resume, your profile resume will be used.
                                                    </p>
                                                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
                                                        <FaUpload className="mr-2" />
                                                        Choose File
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx"
                                                            onChange={handleResumeUpload}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Maximum file size: 10MB. Allowed formats: PDF, DOC, DOCX
                                        </p>
                                    </div>

                                    {/* Cover Letter */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cover Letter *
                                        </label>
                                        <textarea
                                            value={applicationForm.coverLetter}
                                            onChange={(e) => setApplicationForm(prev => ({
                                                ...prev,
                                                coverLetter: e.target.value
                                            }))}
                                            rows={6}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Write a compelling cover letter explaining why you're a good fit for this internship..."
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Minimum 100 characters recommended
                                        </p>
                                    </div>

                                    {/* Portfolio Links */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Portfolio Links (Optional)
                                        </label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                                    <FaLink className="text-blue-500" /> Portfolio Website
                                                </label>
                                                <input
                                                    type="url"
                                                    value={applicationForm.portfolioLink}
                                                    onChange={(e) => setApplicationForm(prev => ({
                                                        ...prev,
                                                        portfolioLink: e.target.value
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                    placeholder="https://yourportfolio.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                                    <FaGithub className="text-gray-800" /> GitHub Profile
                                                </label>
                                                <input
                                                    type="url"
                                                    value={applicationForm.githubLink}
                                                    onChange={(e) => setApplicationForm(prev => ({
                                                        ...prev,
                                                        githubLink: e.target.value
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                    placeholder="https://github.com/username"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                                    <FaLinkedin className="text-blue-700" /> LinkedIn Profile
                                                </label>
                                                <input
                                                    type="url"
                                                    value={applicationForm.linkedinLink}
                                                    onChange={(e) => setApplicationForm(prev => ({
                                                        ...prev,
                                                        linkedinLink: e.target.value
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                    placeholder="https://linkedin.com/in/username"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Information (Optional)
                                        </label>
                                        <textarea
                                            value={applicationForm.additionalInfo}
                                            onChange={(e) => setApplicationForm(prev => ({
                                                ...prev,
                                                additionalInfo: e.target.value
                                            }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                            placeholder="Any additional information you'd like to share with the recruiter..."
                                        />
                                    </div>
                                </div>

                                {/* Dialog Footer */}
                                <div className="p-6 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <FaClock className="text-gray-400" />
                                                {getDaysLeft(selectedInternship.applicationDeadline)} days left to apply
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={closeApplicationForm}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={submitApplication}
                                                disabled={applying || !applicationForm.coverLetter.trim()}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {applying ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" /> Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPaperPlane /> Submit Application
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Internship Details Dialog */}
            <AnimatePresence>
                {showDetails && selectedInternship && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeDetails}
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-40 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                {/* Dialog Header */}
                                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                                                {selectedInternship.companyInfo?.logo ? (
                                                    <img
                                                        src={selectedInternship.companyInfo.logo}
                                                        alt={selectedInternship.companyInfo.companyName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.parentElement.innerHTML = `
                                                                <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                                    <i class="fas fa-building text-gray-400 text-3xl"></i>
                                                                </div>
                                                            `;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                        <FaBuilding className="text-gray-400 text-3xl" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                                    {selectedInternship.title}
                                                </h2>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-medium text-gray-700">
                                                        {selectedInternship.companyInfo?.companyName}
                                                    </span>
                                                    {selectedInternship.companyInfo?.verified && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                            <FaCheckCircle /> Verified Company
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                        {selectedInternship.category || 'General'}
                                                    </span>
                                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                                        {selectedInternship.workMode || 'Flexible'}
                                                    </span>
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                        {selectedInternship.internshipType || selectedInternship.type || 'Internship'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeDetails}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <MdClose className="text-2xl text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Dialog Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {/* Company Info */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <FaBuilding className="text-blue-600" /> About the Company
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <div className="text-sm text-gray-600">Industry</div>
                                                    <div className="font-medium">{selectedInternship.companyInfo?.industry || 'Technology'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Location</div>
                                                    <div className="font-medium flex items-center gap-1">
                                                        <FaMapMarkerAlt className="text-gray-400" />
                                                        {selectedInternship.location || 'Remote'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                {selectedInternship.companyInfo?.description || selectedInternship.company?.description || 'A leading company in its industry.'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Internship Details */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <FaBriefcase className="text-blue-600" /> Internship Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">Duration</div>
                                                <div className="font-medium flex items-center gap-2">
                                                    <MdAccessTime /> {selectedInternship.duration || 'Flexible'} months
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">Stipend</div>
                                                <div className="font-medium flex items-center gap-2">
                                                    <MdAttachMoney /> {getFormattedStipend(selectedInternship.stipend)}
                                                    {selectedInternship.stipend?.type && (
                                                        <span className="text-sm text-gray-500">({selectedInternship.stipend.type})</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">Start Date</div>
                                                <div className="font-medium flex items-center gap-2">
                                                    <FaCalendarAlt /> {formatDate(selectedInternship.startDate) || 'Flexible'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 mb-1">Apply By</div>
                                                <div className={`font-medium flex items-center gap-2 ${isDeadlineNear(selectedInternship.applicationDeadline) ? 'text-red-600' : ''}`}>
                                                    <FaCalendarAlt /> {formatDate(selectedInternship.applicationDeadline)}
                                                    {isDeadlineNear(selectedInternship.applicationDeadline) && (
                                                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                                            {getDaysLeft(selectedInternship.applicationDeadline)} days left
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-line">
                                                {selectedInternship.description || 'No description available.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Responsibilities */}
                                    {selectedInternship.responsibilities && selectedInternship.responsibilities.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <FaListAlt className="text-blue-600" /> Key Responsibilities
                                            </h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <ul className="space-y-2">
                                                    {selectedInternship.responsibilities.map((responsibility, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                                                            <span className="text-gray-700">{responsibility}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Requirements */}
                                    {selectedInternship.requirements && selectedInternship.requirements.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <FaGraduationCap className="text-blue-600" /> Requirements
                                            </h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <ul className="space-y-2">
                                                    {selectedInternship.requirements.map((requirement, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <FaCheckCircle className="text-blue-500 mt-1 flex-shrink-0" />
                                                            <span className="text-gray-700">{requirement}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {selectedInternship.skills && selectedInternship.skills.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedInternship.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium"
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
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <FaCertificate className="text-yellow-600" /> Perks & Benefits
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedInternship.perks.map((perk, index) => (
                                                    <div key={index} className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                                                        <FaCheckCircle className="text-green-500" />
                                                        <span className="text-gray-700">{perk}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Department</div>
                                            <div className="font-medium">{selectedInternship.department || 'Not specified'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Available Positions</div>
                                            <div className="font-medium">
                                                {selectedInternship.availablePositions || selectedInternship.openings || 0} of {selectedInternship.openings || 0} positions open
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dialog Footer */}
                                <div className="p-6 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Posted on {formatDate(selectedInternship.createdAt)}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={closeDetails}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => {
                                                    closeDetails();
                                                    openApplicationForm(selectedInternship);
                                                }}
                                                disabled={selectedInternship.hasApplied || !selectedInternship.isOpen || !profileComplete}
                                                className={`px-6 py-3 rounded-lg transition flex items-center gap-2 ${selectedInternship.hasApplied
                                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                    : !selectedInternship.isOpen
                                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        : !profileComplete
                                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                                    }`}
                                            >
                                                {selectedInternship.hasApplied ? (
                                                    <>
                                                        <FaCheckCircle /> Already Applied
                                                    </>
                                                ) : !selectedInternship.isOpen ? (
                                                    'Position Closed'
                                                ) : !profileComplete ? (
                                                    'Complete Profile'
                                                ) : (
                                                    'Apply Now'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ViewAllApplications;
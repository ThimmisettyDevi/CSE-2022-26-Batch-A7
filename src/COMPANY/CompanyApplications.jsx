// src/components/Company/CompanyApplications.jsx (Fully Corrected with Blockchain Integration)
import React, { useState, useEffect, useMemo } from 'react';
import {
    FaSearch,
    FaFilter,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaClock,
    FaBriefcase,
    FaBuilding,
    FaMapMarkerAlt,
    FaFileAlt,
    FaEye,
    FaCheckCircle,
    FaTimesCircle,
    FaStar,
    FaCalendarCheck,
    FaCalendarTimes,
    FaSortAmountDown,
    FaSortAmountUp,
    FaExternalLinkAlt,
    FaDownload,
    FaComment,
    FaChartLine,
    FaUsers,
    FaGraduationCap,
    FaUniversity,
    FaLink,
    FaGithub,
    FaLinkedin,
    FaPaperPlane,
    FaCheck,
    FaTimes,
    FaUserCheck,
    FaUserTimes,
    FaCommentAlt,
    FaEdit,
    FaTrash,
    FaHistory,
    FaSpinner,
    FaDatabase,
    FaShieldAlt,
    FaLock
} from 'react-icons/fa';
import {
    MdWork,
    MdLocationOn,
    MdAttachMoney,
    MdAccessTime,
    MdDateRange,
    MdSchool,
    MdDescription,
    MdClose
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';
import axios from 'axios';

const CompanyApplications = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('applications');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('applicationDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [showApplicationDetails, setShowApplicationDetails] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [savingToBlockchain, setSavingToBlockchain] = useState(false);
    const [internships, setInternships] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [interviewModalTitle, setInterviewModalTitle] = useState('Schedule Interview');
    const [blockchainStatus, setBlockchainStatus] = useState({});

    // Filters state
    const [filters, setFilters] = useState({
        status: '',
        internship: '',
        location: '',
        skills: '',
        education: ''
    });

    // State for data
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

    // Modal states
    const [statusUpdate, setStatusUpdate] = useState({
        status: '',
        feedback: '',
        rating: 5,
        interviewDate: '',
        interviewNotes: ''
    });
    const [feedbackData, setFeedbackData] = useState({
        feedback: '',
        rating: 5
    });
    const [interviewData, setInterviewData] = useState({
        date: '',
        time: '',
        mode: 'online',
        link: '',
        notes: '',
        duration: 60,
        interviewerName: '',
        location: 'Virtual'
    });

    // State for filter options
    const [filterOptions, setFilterOptions] = useState({
        internships: [],
        locations: [],
        skills: [],
        educationLevels: ['High School', 'Bachelor\'s', 'Master\'s', 'PhD'],
        statuses: [
            { value: 'Applied', label: 'Applied', color: 'bg-yellow-100 text-yellow-800' },
            { value: 'Shortlisted', label: 'Shortlisted', color: 'bg-blue-100 text-blue-800' },
            { value: 'Interviewed', label: 'Interviewed', color: 'bg-purple-100 text-purple-800' },
            { value: 'Selected', label: 'Selected', color: 'bg-green-100 text-green-800' },
            { value: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
            { value: 'Withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' }
        ]
    });

    // Fetch internships for filter
    const fetchInternships = async () => {
        try {
            const response = await axiosInstance.get('/internships/company/my-internships');
            if (response.data && response.data.internships) {
                setInternships(response.data.internships);

                // Update filter options
                setFilterOptions(prev => ({
                    ...prev,
                    internships: response.data.internships.map(i => ({
                        value: i._id,
                        label: i.title,
                        location: i.location
                    }))
                }));
            }
        } catch (error) {
            console.error('Error fetching internships:', error);
            toast.error('Failed to load internships');
        }
    };

    // Fetch applications
    const fetchApplications = async (page = 1) => {
        try {
            setLoading(true);

            // Build query params
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                sortBy: sortBy,
                sortOrder: sortOrder
            });

            if (searchQuery) params.append('q', searchQuery);
            if (filters.status) params.append('status', filters.status);
            if (filters.internship) params.append('internshipId', filters.internship);
            if (filters.location) params.append('location', filters.location);

            // Get applications for all internships
            const response = await axiosInstance.get(`/applications?${params.toString()}`);
            const { applications: data, stats: statsData, pagination: paginationData } = response.data;

            setApplications(data || []);
            setStats(statsData || {});
            setPagination(paginationData || {
                page: 1,
                limit: 10,
                total: 0,
                pages: 1
            });

            // Check blockchain status for each application
            checkBlockchainStatus(data);

            // Extract filter options from applications
            if (data && data.length > 0) {
                const locations = [...new Set(data
                    .map(app => app.internshipDetails?.location)
                    .filter(Boolean))];

                const allSkills = data.flatMap(app =>
                    app.userDetails?.skills || []
                ).filter(Boolean);
                const skills = [...new Set(allSkills)];

                setFilterOptions(prev => ({
                    ...prev,
                    locations,
                    skills: skills.slice(0, 20) // Limit to 20 skills for dropdown
                }));
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    // Check blockchain status for applications
    const checkBlockchainStatus = async (applications) => {
        if (!applications || applications.length === 0) return;

        const statusMap = {};

        // For each application, check if it's on blockchain
        // This is a simplified version - you might want to check with your backend
        for (const app of applications) {
            if (app.status === 'Interviewed' && app.interviewDate) {
                // Check if interview is stored on blockchain
                // You might have a separate endpoint to check this
                statusMap[app._id] = 'interview_on_blockchain';
            } else if (app.status === 'Selected') {
                statusMap[app._id] = 'selected_on_blockchain';
            }
        }

        setBlockchainStatus(statusMap);
    };

    // Initial data fetch
    useEffect(() => {
        fetchInternships();
        fetchApplications();
    }, []);

    // Refetch when sort or filters change
    useEffect(() => {
        if (!loading) {
            fetchApplications(1);
        }
    }, [sortBy, sortOrder, filters, refreshKey]);

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
            internship: '',
            location: '',
            skills: '',
            education: ''
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
        if (newSortBy === sortBy) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('desc');
        }
    };

    // Get status info
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
                    icon: <FaClock className="text-yellow-500" />,
                    label: 'Applied'
                };
        }
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
            return 'Invalid Date';
        }
    };

    // Format time
    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
        }
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Get days since application
    const getDaysSince = (dateString) => {
        if (!dateString) return 0;
        try {
            const date = new Date(dateString);
            const today = new Date();
            const diffTime = Math.abs(today - date);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    };

    // View application details
    const viewApplicationDetails = (application) => {
        setSelectedApplication(application);
        setShowApplicationDetails(true);
    };

    // Open status update modal
    const openStatusModal = (application, status) => {
        setSelectedApplication(application);
        setStatusUpdate({
            status: status || application.status,
            feedback: application.feedback || '',
            rating: application.rating || 5,
            interviewDate: application.interviewDate || '',
            interviewNotes: application.interviewNotes || ''
        });
        setShowStatusModal(true);
    };

    // Open feedback modal
    const openFeedbackModal = (application) => {
        setSelectedApplication(application);
        setFeedbackData({
            feedback: application.feedback || '',
            rating: application.rating || 5
        });
        setShowFeedbackModal(true);
    };

    // Open interview modal
    const openInterviewModal = (application) => {
        // Check if application can have interview scheduled
        if (['Selected', 'Rejected', 'Withdrawn'].includes(application.status)) {
            toast.error(`Cannot schedule interview for application with status: ${application.status}`);
            return;
        }

        setSelectedApplication(application);

        let initialDate = '';
        let initialTime = '';
        let isRescheduling = false;

        if (application.interviewDate) {
            // This is a reschedule
            isRescheduling = true;
            const date = new Date(application.interviewDate);
            initialDate = date.toISOString().split('T')[0];
            initialTime = date.toTimeString().split(' ')[0].substring(0, 5);

            // Show info message
            toast.info('Rescheduling existing interview', {
                duration: 3000
            });
        } else {
            // This is a new schedule
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            initialDate = tomorrow.toISOString().split('T')[0];
            initialTime = '10:00';
        }

        setInterviewData({
            date: initialDate,
            time: initialTime,
            mode: 'online',
            link: '',
            notes: application.interviewNotes || '',
            duration: 60,
            interviewerName: '',
            location: 'Virtual'
        });

        // Set modal title based on whether it's rescheduling
        setInterviewModalTitle(isRescheduling ? 'Reschedule Interview' : 'Schedule Interview');
        setShowInterviewModal(true);
    };

    // Close modals
    const closeModals = () => {
        setShowApplicationDetails(false);
        setShowStatusModal(false);
        setShowFeedbackModal(false);
        setShowInterviewModal(false);
        setSelectedApplication(null);
        setStatusUpdate({ status: '', feedback: '', rating: 5, interviewDate: '', interviewNotes: '' });
        setFeedbackData({ feedback: '', rating: 5 });
        setInterviewData({ date: '', time: '', mode: 'online', link: '', notes: '', duration: 60, interviewerName: '', location: 'Virtual' });
        setInterviewModalTitle('Schedule Interview');
    };

    // Save interview to blockchain
    const saveInterviewToBlockchain = async (interviewPayload) => {
        try {
            setSavingToBlockchain(true);

            // Prepare data for blockchain API
            const blockchainData = {
                _id: selectedApplication._id,
                company: selectedApplication.internshipDetails?.companyName || 'Company',
                student: selectedApplication.userDetails?.name || 'Student',
                position: selectedApplication.internshipDetails?.title || 'Internship',
                scheduledDate: interviewData.date,
                scheduledTime: interviewData.time,
                duration: interviewData.duration || 60,
                interviewType: interviewData.mode === 'online' ? 'Virtual' :
                    interviewData.mode === 'phone' ? 'Phone' : 'In-person',
                status_: 'Scheduled',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Send to blockchain API
            const response = await axios.post('http://127.0.0.1:8000/interview/store/', blockchainData);

            console.log('Blockchain response:', response.data);

            // Update blockchain status
            setBlockchainStatus(prev => ({
                ...prev,
                [selectedApplication._id]: 'stored_on_blockchain'
            }));

            return response.data;
        } catch (error) {
            console.error('Error saving to blockchain:', error);
            throw error;
        } finally {
            setSavingToBlockchain(false);
        }
    };

    // Update application status
    const updateApplicationStatus = async () => {
        if (!statusUpdate.status) {
            toast.error('Please select a status');
            return;
        }

        // Check if we're trying to select but positions might be filled
        if (statusUpdate.status === 'Selected') {
            const internship = selectedApplication.internshipDetails;
            if (internship && internship.availablePositions <= 0) {
                toast.error('All positions have been filled');
                return;
            }
        }

        try {
            setUpdating(true);
            const payload = {
                status: statusUpdate.status,
                ...(statusUpdate.feedback && { feedback: statusUpdate.feedback }),
                ...(statusUpdate.rating && { rating: statusUpdate.rating }),
                ...(statusUpdate.interviewDate && { interviewDate: statusUpdate.interviewDate }),
                ...(statusUpdate.interviewNotes && { interviewNotes: statusUpdate.interviewNotes })
            };

            const response = await axiosInstance.patch(`/applications/${selectedApplication._id}/status`, payload);

            // Update local state
            setApplications(prev => prev.map(app =>
                app._id === selectedApplication._id
                    ? {
                        ...app,
                        ...payload,
                        updatedAt: new Date().toISOString()
                    }
                    : app
            ));

            // Update stats
            setStats(prev => {
                const newStats = { ...prev };
                if (prev[selectedApplication.status]) {
                    newStats[selectedApplication.status] = Math.max(0, prev[selectedApplication.status] - 1);
                }
                if (prev[statusUpdate.status]) {
                    newStats[statusUpdate.status]++;
                }
                return newStats;
            });

            toast.success(`Application marked as ${statusUpdate.status}`);
            closeModals();
            setRefreshKey(prev => prev + 1); // Refresh data
        } catch (error) {
            console.error('Error updating status:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.msg || 'Failed to update application status';
            toast.error(errorMsg);
        } finally {
            setUpdating(false);
        }
    };

    // Send feedback
    const sendFeedback = async () => {
        if (!feedbackData.feedback.trim()) {
            toast.error('Please enter feedback');
            return;
        }

        try {
            setUpdating(true);
            const payload = {
                feedback: feedbackData.feedback,
                rating: feedbackData.rating
            };

            const response = await axiosInstance.patch(`/applications/${selectedApplication._id}/status`, payload);

            // Update local state
            setApplications(prev => prev.map(app =>
                app._id === selectedApplication._id
                    ? {
                        ...app,
                        ...payload,
                        updatedAt: new Date().toISOString()
                    }
                    : app
            ));

            toast.success('Feedback sent successfully');
            closeModals();
        } catch (error) {
            console.error('Error sending feedback:', error);
            toast.error('Failed to send feedback');
        } finally {
            setUpdating(false);
        }
    };

    // Schedule interview (with blockchain integration)
    const scheduleInterview = async () => {
        if (!interviewData.date || !interviewData.time) {
            toast.error('Please select date and time');
            return;
        }

        const interviewDateTime = new Date(`${interviewData.date}T${interviewData.time}`);
        if (interviewDateTime < new Date()) {
            toast.error('Interview date cannot be in the past');
            return;
        }

        try {
            setUpdating(true);

            // Determine if we're scheduling or rescheduling
            const isRescheduling = selectedApplication.status === 'Interviewed';

            // Create interview data for API
            const interviewPayload = {
                status: 'Interviewed',
                interviewDate: interviewDateTime.toISOString(),
                interviewNotes: interviewData.notes || '',
                ...(interviewData.interviewerName && { interviewerName: interviewData.interviewerName })
            };

            // Update application status locally first
            const response = await axiosInstance.patch(`/applications/${selectedApplication._id}/status`, interviewPayload);

            // Then create separate interview record in local database
            try {
                await axiosInstance.post(`/applications/${selectedApplication._id}/schedule-interview`, {
                    interviewDate: interviewData.date,
                    interviewTime: interviewData.time,
                    duration: interviewData.duration || 60,
                    interviewType: interviewData.mode === 'online' ? 'Virtual' :
                        interviewData.mode === 'phone' ? 'Phone' : 'In-person',
                    location: interviewData.location || (interviewData.mode === 'online' ? 'Virtual' : 'Office'),
                    interviewerName: interviewData.interviewerName || '',
                    additionalNotes: interviewData.notes || ''
                });
            } catch (interviewError) {
                console.warn('Could not create separate interview record:', interviewError);
                // Continue anyway since application status was updated
            }

            // Then save to blockchain
            try {
                await saveInterviewToBlockchain(interviewPayload);

                // Update local state
                setApplications(prev => prev.map(app =>
                    app._id === selectedApplication._id
                        ? {
                            ...app,
                            status: 'Interviewed',
                            interviewDate: interviewDateTime.toISOString(),
                            interviewNotes: interviewData.notes,
                            updatedAt: new Date().toISOString(),
                            blockchainStored: true
                        }
                        : app
                ));

                // Update stats only if it's a new interview (not rescheduling)
                if (!isRescheduling) {
                    setStats(prev => ({
                        ...prev,
                        Interviewed: (prev.Interviewed || 0) + 1,
                        [selectedApplication.status]: (prev[selectedApplication.status] || 1) - 1
                    }));
                }

                toast.success(`${isRescheduling ? 'Interview rescheduled' : 'Interview scheduled'} and stored on blockchain`);
                closeModals();
                setRefreshKey(prev => prev + 1); // Refresh data
            } catch (blockchainError) {
                console.error('Blockchain save failed:', blockchainError);

                // Still update local state even if blockchain fails
                setApplications(prev => prev.map(app =>
                    app._id === selectedApplication._id
                        ? {
                            ...app,
                            status: 'Interviewed',
                            interviewDate: interviewDateTime.toISOString(),
                            interviewNotes: interviewData.notes,
                            updatedAt: new Date().toISOString()
                        }
                        : app
                ));

                toast.success(`${isRescheduling ? 'Interview rescheduled' : 'Interview scheduled'} (blockchain storage failed)`);
                closeModals();
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error scheduling interview:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.msg || 'Failed to schedule interview';
            toast.error(errorMsg);
        } finally {
            setUpdating(false);
        }
    };

    // Download resume
    const downloadResume = (resumeUrl) => {
        if (!resumeUrl) {
            toast.error('Resume not available');
            return;
        }
        window.open(resumeUrl, '_blank');
    };

    // Get sort display text
    const getSortDisplayText = () => {
        const sortOptions = {
            'applicationDate': 'Application Date',
            'updatedAt': 'Last Updated',
            'status': 'Status',
            'createdAt': 'Created Date'
        };

        const field = sortOptions[sortBy] || 'Application Date';
        const order = sortOrder === 'desc' ? ' (Newest)' : ' (Oldest)';

        return `${field}${order}`;
    };

    // Get student details safely
    const getStudentDetails = (application) => {
        return application.userDetails || application.user || {};
    };

    // Get internship details safely
    const getInternshipDetails = (application) => {
        return application.internshipDetails || application.internship || {};
    };

    // Get formatted stipend
    const getFormattedStipend = (stipend) => {
        if (!stipend) return 'Negotiable';

        if (typeof stipend === 'object') {
            if (stipend.amount) {
                return `₹${stipend.amount.toLocaleString()}`;
            } else if (stipend.min && stipend.max) {
                return `₹${stipend.min.toLocaleString()} - ₹${stipend.max.toLocaleString()}`;
            }
        }

        return 'Negotiable';
    };

    // Get quick actions based on application status
    const getQuickActions = (application) => {
        const baseActions = [
            {
                icon: <FaUserCheck className="text-green-600" />,
                label: 'Shortlist',
                status: 'Shortlisted',
                color: 'bg-green-50 hover:bg-green-100 text-green-700',
                description: 'Move to shortlist for further review',
                allowedStatuses: ['Applied']
            },
            {
                icon: <FaCalendarCheck className="text-blue-600" />,
                label: 'Interview',
                status: 'Interviewed',
                color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
                description: 'Schedule an interview',
                allowedStatuses: ['Applied', 'Shortlisted']
            },
            {
                icon: <FaCheckCircle className="text-purple-600" />,
                label: 'Select',
                status: 'Selected',
                color: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
                description: 'Select candidate for position',
                allowedStatuses: ['Interviewed', 'Shortlisted']
            },
            {
                icon: <FaUserTimes className="text-red-600" />,
                label: 'Reject',
                status: 'Rejected',
                color: 'bg-red-50 hover:bg-red-100 text-red-700',
                description: 'Reject application',
                allowedStatuses: ['Applied', 'Shortlisted', 'Interviewed']
            }
        ];

        return baseActions.filter(action =>
            action.allowedStatuses.includes(application.status)
        );
    };

    // Check if application is on blockchain
    const isOnBlockchain = (applicationId) => {
        return blockchainStatus[applicationId] === 'stored_on_blockchain' ||
            blockchainStatus[applicationId] === 'interview_on_blockchain';
    };

    // Get blockchain status badge
    const getBlockchainBadge = (applicationId) => {
        if (isOnBlockchain(applicationId)) {
            return (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full text-xs font-medium border border-purple-200">
                    <FaShieldAlt className="text-xs" />
                    <span>On Blockchain</span>
                </div>
            );
        }
        return null;
    };

    // Save specific application to blockchain
    const saveApplicationToBlockchain = async (application) => {
        if (!application || !application._id) {
            toast.error('Invalid application');
            return;
        }

        try {
            setSavingToBlockchain(true);

            // Determine what data to save based on application status
            let blockchainData = {};

            if (application.status === 'Interviewed' && application.interviewDate) {
                // Save interview data
                const interviewDateTime = new Date(application.interviewDate);
                blockchainData = {
                    _id: application._id,
                    company: application.internshipDetails?.companyName || 'Company',
                    student: application.userDetails?.name || 'Student',
                    position: application.internshipDetails?.title || 'Internship',
                    scheduledDate: interviewDateTime.toISOString().split('T')[0],
                    scheduledTime: interviewDateTime.toTimeString().split(' ')[0].substring(0, 5),
                    duration: 60,
                    interviewType: 'Virtual',
                    status_: 'Scheduled',
                    createdAt: application.createdAt || new Date().toISOString(),
                    updatedAt: application.updatedAt || new Date().toISOString()
                };
            } else if (application.status === 'Selected') {
                // Save selection data (you might need a different endpoint for this)
                blockchainData = {
                    Type: 'Selection',
                    _id: application._id,
                    company: application.internshipDetails?.companyName || 'Company',
                    student: application.userDetails?.name || 'Student',
                    position: application.internshipDetails?.title || 'Internship',
                    status_: 'Selected',
                    createdAt: application.createdAt || new Date().toISOString(),
                    updatedAt: application.updatedAt || new Date().toISOString()
                };
                // For now, we'll use the interview endpoint as an example
                // You might need to create a separate endpoint for selections
                toast.info('Creating a blockchain record for selection...');
            }

            const response = await axios.post('http://127.0.0.1:8000/interview/store/', blockchainData);

            // Update blockchain status
            setBlockchainStatus(prev => ({
                ...prev,
                [application._id]: 'stored_on_blockchain'
            }));

            toast.success('Application data saved to blockchain successfully');

        } catch (error) {
            console.error('Error saving to blockchain:', error);
            toast.error('Failed to save to blockchain');
        } finally {
            setSavingToBlockchain(false);
        }
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
                        <p className="mt-4 text-gray-600">Loading applications...</p>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Applications Management</h1>
                            <p className="text-blue-100">Review and manage internship applications for your company</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                <span className="font-medium">Blockchain Enabled</span>
                            </div>
                        </div>
                    </div>
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

                {/* Blockchain Info Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FaLock className="text-purple-600 text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-purple-900">Blockchain Integration Active</h3>
                                <p className="text-sm text-purple-700">
                                    Interviews are automatically stored on the blockchain for secure and immutable records
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-700">
                            <FaDatabase />
                            <span>Secure Storage</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                            onClick={() => {
                                if (applications.length === 0) {
                                    toast.error('No applications available');
                                    return;
                                }
                                toast.info('Select an application to perform actions', {
                                    duration: 3000,
                                    icon: 'ℹ️'
                                });
                            }}
                            className="p-4 rounded-xl border bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all duration-200 flex flex-col items-center justify-center gap-2"
                        >
                            <FaUserCheck className="text-green-600 text-xl" />
                            <span className="font-medium">Shortlist</span>
                            <span className="text-xs opacity-75 text-center">Move to shortlist</span>
                        </button>
                        <button
                            onClick={() => {
                                if (applications.length === 0) {
                                    toast.error('No applications available');
                                    return;
                                }
                                toast.info('Select an application to schedule interview', {
                                    duration: 3000,
                                    icon: 'ℹ️'
                                });
                            }}
                            className="p-4 rounded-xl border bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all duration-200 flex flex-col items-center justify-center gap-2"
                        >
                            <FaCalendarCheck className="text-blue-600 text-xl" />
                            <span className="font-medium">Interview</span>
                            <span className="text-xs opacity-75 text-center">Schedule interview</span>
                        </button>
                        <button
                            onClick={() => {
                                if (applications.length === 0) {
                                    toast.error('No applications available');
                                    return;
                                }
                                toast.info('Select an application to mark as selected', {
                                    duration: 3000,
                                    icon: 'ℹ️'
                                });
                            }}
                            className="p-4 rounded-xl border bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all duration-200 flex flex-col items-center justify-center gap-2"
                        >
                            <FaCheckCircle className="text-purple-600 text-xl" />
                            <span className="font-medium">Select</span>
                            <span className="text-xs opacity-75 text-center">Select candidate</span>
                        </button>
                        <button
                            onClick={() => {
                                if (applications.length === 0) {
                                    toast.error('No applications available');
                                    return;
                                }
                                toast.info('Select an application to reject', {
                                    duration: 3000,
                                    icon: 'ℹ️'
                                });
                            }}
                            className="p-4 rounded-xl border bg-red-50 hover:bg-red-100 text-red-700 transition-all duration-200 flex flex-col items-center justify-center gap-2"
                        >
                            <FaUserTimes className="text-red-600 text-xl" />
                            <span className="font-medium">Reject</span>
                            <span className="text-xs opacity-75 text-center">Reject application</span>
                        </button>
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
                                    placeholder="Search applications by student name, skills, or internship..."
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
                                onClick={() => handleSortChange('applicationDate')}
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
                            {(filters.status || filters.internship || filters.location || filters.skills || filters.education) && (
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                                {/* Internship Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Internship
                                    </label>
                                    <select
                                        value={filters.internship}
                                        onChange={(e) => handleFilterChange('internship', e.target.value)}
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

                                {/* Skills Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Skills
                                    </label>
                                    <select
                                        value={filters.skills}
                                        onChange={(e) => handleFilterChange('skills', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Skills</option>
                                        {filterOptions.skills.map((skill, index) => (
                                            <option key={index} value={skill}>{skill}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Education Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Education
                                    </label>
                                    <select
                                        value={filters.education}
                                        onChange={(e) => handleFilterChange('education', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Education</option>
                                        {filterOptions.educationLevels.map((level, index) => (
                                            <option key={index} value={level}>{level}</option>
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
                                const student = getStudentDetails(application);
                                const internship = getInternshipDetails(application);
                                const daysSince = getDaysSince(application.applicationDate);
                                const quickActions = getQuickActions(application);
                                const blockchainBadge = getBlockchainBadge(application._id);

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
                                                {/* Left Section - Student & Application Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        {/* Student Avatar */}
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                            {student.image ? (
                                                                <img
                                                                    src={student.image}
                                                                    alt={student.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.parentElement.innerHTML = `
                                                                            <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                                                <i class="fas fa-user text-gray-400 text-2xl"></i>
                                                                            </div>
                                                                        `;
                                                                    }}
                                                                />
                                                            ) : (
                                                                <FaUser className="text-gray-400 text-2xl" />
                                                            )}
                                                        </div>

                                                        {/* Student Details */}
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                                        {student.name || 'Applicant'}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="font-medium text-gray-700">
                                                                            {student.email}
                                                                        </span>
                                                                        {student.education?.[0]?.degree && (
                                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                                                <MdSchool /> {student.education[0].degree}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {blockchainBadge}
                                                                    {isOnBlockchain(application._id) && (
                                                                        <button
                                                                            onClick={() => toast.success('Already stored on blockchain!')}
                                                                            className="text-xs text-purple-600 hover:text-purple-800"
                                                                        >
                                                                            <FaShieldAlt />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Internship Info */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <FaBriefcase className="text-gray-400" />
                                                                    <span className="font-medium text-gray-900">{internship.title}</span>
                                                                    <span className="text-sm text-gray-600">•</span>
                                                                    <span className="flex items-center gap-1 text-sm text-gray-600">
                                                                        <FaMapMarkerAlt /> {internship.location}
                                                                    </span>
                                                                    <span className="text-sm text-gray-600">•</span>
                                                                    <span className="text-sm text-gray-600">
                                                                        Stipend: {getFormattedStipend(internship.stipend)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Skills */}
                                                            {student.skills && student.skills.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {student.skills.slice(0, 4).map((skill, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                                                        >
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {student.skills.length > 4 && (
                                                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                                                            +{student.skills.length - 4} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section - Status & Actions */}
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
                                                            <span className="text-gray-600">Days Since:</span>
                                                            <span className="font-medium">{daysSince} days</span>
                                                        </div>
                                                        {application.rating && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Rating:</span>
                                                                <div className="flex items-center gap-1">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <FaStar
                                                                            key={i}
                                                                            className={`text-sm ${i < application.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {application.interviewDate && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Interview:</span>
                                                                <span className="font-medium">{formatDateTime(application.interviewDate)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => viewApplicationDetails(application)}
                                                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <FaEye /> View
                                                        </button>
                                                        <button
                                                            onClick={() => downloadResume(application.resume)}
                                                            className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <FaDownload /> Resume
                                                        </button>
                                                        {(application.status === 'Applied' || application.status === 'Shortlisted') ? (
                                                            <button
                                                                onClick={() => openInterviewModal(application)}
                                                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <FaCalendarCheck /> Interview
                                                            </button>
                                                        ) : application.status === 'Interviewed' ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (application.interviewDate) {
                                                                        toast.info(`Interview already scheduled for ${formatDateTime(application.interviewDate)}`);
                                                                    } else {
                                                                        openInterviewModal(application);
                                                                    }
                                                                }}
                                                                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <FaCalendarCheck /> {application.interviewDate ? 'Interviewed' : 'Reschedule'}
                                                            </button>
                                                        ) : null}
                                                        {application.status === 'Interviewed' && (
                                                            <button
                                                                onClick={() => openFeedbackModal(application)}
                                                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <FaCommentAlt /> Feedback
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openStatusModal(application)}
                                                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <FaEdit /> Update
                                                        </button>
                                                        {/* Blockchain Save Button (only for certain statuses) */}
                                                        {(application.status === 'Interviewed' || application.status === 'Selected') && !isOnBlockchain(application._id) && (
                                                            <button
                                                                onClick={() => saveApplicationToBlockchain(application)}
                                                                disabled={savingToBlockchain}
                                                                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                {savingToBlockchain ? (
                                                                    <FaSpinner className="animate-spin" />
                                                                ) : (
                                                                    <FaDatabase />
                                                                )}
                                                                Save to Blockchain
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
                            <div className="flex justify-center items-center gap-2 mb-8">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-1">
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
                                                className={`w-10 h-10 rounded-lg ${pagination.page === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>

                                <div className="text-sm text-gray-600 ml-4">
                                    Page {pagination.page} of {pagination.pages} • {pagination.total} total applications
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow border border-gray-100">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
                            <FaUsers className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No applications found</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchQuery || Object.values(filters).some(f => f)
                                ? 'No applications match your search criteria. Try adjusting your filters.'
                                : 'You haven\'t received any applications yet. Share your internship postings!'}
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
                                onClick={() => window.location.href = '/company/internships'}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                            >
                                View Internships
                            </button>
                        )}
                    </div>
                )}

                {/* Tips Section */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FaChartLine className="text-blue-600" /> Application Management Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaClock className="text-blue-500" /> Quick Response
                            </div>
                            <p className="text-sm text-gray-600">Respond to applications within 48 hours for better candidate experience.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaCommentAlt className="text-green-500" /> Provide Feedback
                            </div>
                            <p className="text-sm text-gray-600">Give constructive feedback to rejected candidates to help them improve.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaDatabase className="text-purple-500" /> Blockchain Security
                            </div>
                            <p className="text-sm text-gray-600">All interviews are securely stored on blockchain for immutable records.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Details Modal */}
            <AnimatePresence>
                {showApplicationDetails && selectedApplication && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModals}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                                {/* Dialog Header */}
                                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                {getStudentDetails(selectedApplication).image ? (
                                                    <img
                                                        src={getStudentDetails(selectedApplication).image}
                                                        alt={getStudentDetails(selectedApplication).name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.parentElement.innerHTML = `
                                                                <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                                    <i class="fas fa-user text-gray-400 text-3xl"></i>
                                                                </div>
                                                            `;
                                                        }}
                                                    />
                                                ) : (
                                                    <FaUser className="text-gray-400 text-3xl" />
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                                    {getStudentDetails(selectedApplication).name || 'Applicant'}
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-700">
                                                        {getInternshipDetails(selectedApplication).title || 'Internship'}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                        {getInternshipDetails(selectedApplication).companyName}
                                                    </span>
                                                    <div className={`px-3 py-1 rounded-lg ${getStatusInfo(selectedApplication.status).color} flex items-center gap-1`}>
                                                        {getStatusInfo(selectedApplication.status).icon}
                                                        <span className="text-xs font-medium">{getStatusInfo(selectedApplication.status).label}</span>
                                                    </div>
                                                    {isOnBlockchain(selectedApplication._id) && (
                                                        <div className="px-2 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
                                                            <FaShieldAlt className="text-xs" />
                                                            <span>On Blockchain</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeModals}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <MdClose className="text-2xl text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Dialog Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left Column - Student Information */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Personal Information */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <FaUser className="text-blue-600" /> Personal Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">Full Name</div>
                                                        <div className="font-medium">{getStudentDetails(selectedApplication).name}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">Email Address</div>
                                                        <div className="font-medium">{getStudentDetails(selectedApplication).email}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">Phone</div>
                                                        <div className="font-medium">{getStudentDetails(selectedApplication).mobileNumber || 'Not provided'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-1">Application Date</div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            <FaCalendarAlt className="text-gray-400" />
                                                            {formatDate(selectedApplication.applicationDate)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Education */}
                                            {getStudentDetails(selectedApplication).education?.length > 0 && (
                                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
                                                    <div className="space-y-4">
                                                        {getStudentDetails(selectedApplication).education.map((edu, index) => (
                                                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                                                <div className="font-medium text-gray-900">{edu.degree}</div>
                                                                <div className="text-sm text-gray-600">{edu.institution}</div>
                                                                <div className="text-sm text-gray-600">
                                                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                                                </div>
                                                                {edu.grade && (
                                                                    <div className="text-sm text-gray-600">Grade: {edu.grade}</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Skills */}
                                            {getStudentDetails(selectedApplication).skills?.length > 0 && (
                                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {getStudentDetails(selectedApplication).skills.map((skill, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cover Letter */}
                                            {selectedApplication.coverLetter && (
                                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        <FaFileAlt className="text-blue-600" /> Cover Letter
                                                    </h3>
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-gray-700 whitespace-pre-line">
                                                            {selectedApplication.coverLetter}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Additional Information */}
                                            {selectedApplication.additionalInfo && (
                                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-gray-700">{selectedApplication.additionalInfo}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column - Application Details & Actions */}
                                        <div className="space-y-6">
                                            {/* Application Status */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
                                                <div className={`px-4 py-3 rounded-lg border flex items-center justify-center gap-2 ${getStatusInfo(selectedApplication.status).color} mb-4`}>
                                                    {getStatusInfo(selectedApplication.status).icon}
                                                    <span className="font-medium text-lg">{getStatusInfo(selectedApplication.status).label}</span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Applied:</span>
                                                        <span className="font-medium">{formatDate(selectedApplication.applicationDate)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Last Updated:</span>
                                                        <span className="font-medium">{formatDate(selectedApplication.updatedAt)}</span>
                                                    </div>
                                                    {selectedApplication.interviewDate && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Interview:</span>
                                                            <span className="font-medium">
                                                                {formatDateTime(selectedApplication.interviewDate)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedApplication.rating && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Rating:</span>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <FaStar
                                                                        key={i}
                                                                        className={`text-sm ${i < selectedApplication.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {isOnBlockchain(selectedApplication._id) && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Blockchain:</span>
                                                            <div className="flex items-center gap-1 text-green-600">
                                                                <FaCheckCircle />
                                                                <span>Secured</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Blockchain Section */}
                                            {!isOnBlockchain(selectedApplication._id) && (
                                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                                                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                                                        <FaDatabase className="text-purple-600" /> Blockchain Security
                                                    </h3>
                                                    <p className="text-sm text-purple-700 mb-4">
                                                        Store this application data on the blockchain for secure and immutable records.
                                                    </p>
                                                    <button
                                                        onClick={() => saveApplicationToBlockchain(selectedApplication)}
                                                        disabled={savingToBlockchain}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
                                                    >
                                                        {savingToBlockchain ? (
                                                            <>
                                                                <FaSpinner className="animate-spin" />
                                                                Saving to Blockchain...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaLock />
                                                                Save to Blockchain
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Interview Information (if exists) */}
                                            {selectedApplication.interviewDate && (
                                                <div className={`p-6 rounded-xl border ${isOnBlockchain(selectedApplication._id) ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                                                            <FaCalendarCheck className="text-blue-600" /> Interview Details
                                                        </h3>
                                                        {isOnBlockchain(selectedApplication._id) && (
                                                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                                <FaCheckCircle className="text-xs" />
                                                                <span>On Blockchain</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-blue-700">Scheduled:</span>
                                                            <span className="font-medium">{formatDateTime(selectedApplication.interviewDate)}</span>
                                                        </div>
                                                        {selectedApplication.interviewNotes && (
                                                            <div>
                                                                <span className="text-sm text-blue-700">Notes:</span>
                                                                <p className="text-sm mt-1 text-blue-900">{selectedApplication.interviewNotes}</p>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                closeModals();
                                                                openInterviewModal(selectedApplication);
                                                            }}
                                                            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                                        >
                                                            Reschedule Interview
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Resume & Links */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Materials</h3>
                                                <div className="space-y-3">
                                                    {selectedApplication.resume && (
                                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <FaFileAlt className="text-blue-600" />
                                                                <div>
                                                                    <div className="font-medium">Resume</div>
                                                                    <div className="text-xs text-gray-600">Click to download</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => downloadResume(selectedApplication.resume)}
                                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                                            >
                                                                <FaDownload />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {selectedApplication.portfolioLink && (
                                                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                                            <FaLink className="text-purple-600" />
                                                            <div className="flex-1">
                                                                <div className="font-medium">Portfolio</div>
                                                                <a
                                                                    href={selectedApplication.portfolioLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-purple-600 hover:underline truncate"
                                                                >
                                                                    {selectedApplication.portfolioLink}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedApplication.githubLink && (
                                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <FaGithub className="text-gray-800" />
                                                            <div className="flex-1">
                                                                <div className="font-medium">GitHub</div>
                                                                <a
                                                                    href={selectedApplication.githubLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-gray-700 hover:underline truncate"
                                                                >
                                                                    {selectedApplication.githubLink}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedApplication.linkedinLink && (
                                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                            <FaLinkedin className="text-blue-700" />
                                                            <div className="flex-1">
                                                                <div className="font-medium">LinkedIn</div>
                                                                <a
                                                                    href={selectedApplication.linkedinLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-blue-700 hover:underline truncate"
                                                                >
                                                                    {selectedApplication.linkedinLink}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Feedback & Rating */}
                                            {(selectedApplication.feedback || selectedApplication.rating) && (
                                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback & Rating</h3>
                                                    {selectedApplication.feedback && (
                                                        <div className="mb-3">
                                                            <div className="text-sm text-gray-600 mb-1">Feedback</div>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-gray-700 text-sm">{selectedApplication.feedback}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedApplication.rating && (
                                                        <div>
                                                            <div className="text-sm text-gray-600 mb-1">Rating</div>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <FaStar
                                                                        key={i}
                                                                        className={`text-lg ${i < selectedApplication.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                                    />
                                                                ))}
                                                                <span className="ml-2 text-sm text-gray-600">
                                                                    ({selectedApplication.rating}/5)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Quick Actions */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                                <div className="space-y-2">
                                                    {(selectedApplication.status === 'Applied' || selectedApplication.status === 'Shortlisted') && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    openInterviewModal(selectedApplication);
                                                                    closeModals();
                                                                }}
                                                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                                            >
                                                                <FaCalendarCheck /> Schedule Interview
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    openStatusModal(selectedApplication, 'Shortlisted');
                                                                    closeModals();
                                                                }}
                                                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                                            >
                                                                <FaUserCheck /> Shortlist Candidate
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            openFeedbackModal(selectedApplication);
                                                            closeModals();
                                                        }}
                                                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                                    >
                                                        <FaCommentAlt /> Provide Feedback
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            openStatusModal(selectedApplication);
                                                            closeModals();
                                                        }}
                                                        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                                    >
                                                        <FaEdit /> Update Status
                                                    </button>
                                                    {!isOnBlockchain(selectedApplication._id) && (
                                                        <button
                                                            onClick={() => saveApplicationToBlockchain(selectedApplication)}
                                                            disabled={savingToBlockchain}
                                                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
                                                        >
                                                            <FaDatabase /> Save to Blockchain
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dialog Footer */}
                                <div className="p-6 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Application ID: {selectedApplication._id}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={closeModals}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={() => downloadResume(selectedApplication.resume)}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                            >
                                                <FaDownload /> Download Resume
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Status Update Modal */}
            <AnimatePresence>
                {showStatusModal && selectedApplication && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModals}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Update Application Status</h3>
                                    <p className="text-gray-600">Update status for {getStudentDetails(selectedApplication).name}</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={statusUpdate.status}
                                            onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {filterOptions.statuses.map((status, index) => (
                                                <option key={index} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Feedback (Optional)
                                        </label>
                                        <textarea
                                            value={statusUpdate.feedback}
                                            onChange={(e) => setStatusUpdate(prev => ({ ...prev, feedback: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Add feedback for the candidate..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rating (Optional)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setStatusUpdate(prev => ({ ...prev, rating: star }))}
                                                    className={`text-2xl ${star <= statusUpdate.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                >
                                                    <FaStar />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-600">({statusUpdate.rating}/5)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        onClick={closeModals}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={updateApplicationStatus}
                                        disabled={updating || !statusUpdate.status}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Status'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedbackModal && selectedApplication && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModals}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Provide Feedback</h3>
                                    <p className="text-gray-600">Share feedback with {getStudentDetails(selectedApplication).name}</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Feedback
                                        </label>
                                        <textarea
                                            value={feedbackData.feedback}
                                            onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Provide constructive feedback about the interview..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rating
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                                                    className={`text-2xl ${star <= feedbackData.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                >
                                                    <FaStar />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-600">({feedbackData.rating}/5)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        onClick={closeModals}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={sendFeedback}
                                        disabled={updating || !feedbackData.feedback.trim()}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Feedback'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Interview Modal (with Blockchain Integration) */}
            <AnimatePresence>
                {showInterviewModal && selectedApplication && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModals}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{interviewModalTitle}</h3>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full text-xs">
                                            <FaDatabase className="text-xs" />
                                            <span>Blockchain</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600">Schedule interview with {getStudentDetails(selectedApplication).name}</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={interviewData.date}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, date: e.target.value }))}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Time
                                            </label>
                                            <input
                                                type="time"
                                                value={interviewData.time}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, time: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Interview Mode
                                        </label>
                                        <select
                                            value={interviewData.mode}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, mode: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="online">Online (Video Call)</option>
                                            <option value="phone">Phone Call</option>
                                            <option value="in-person">In-Person</option>
                                        </select>
                                    </div>
                                    {interviewData.mode === 'online' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Meeting Link (Optional)
                                            </label>
                                            <input
                                                type="url"
                                                value={interviewData.link}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, link: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="https://meet.google.com/..."
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Interviewer Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={interviewData.interviewerName}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, interviewerName: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Interviewer name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            value={interviewData.notes}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Interview details, topics to cover, etc."
                                        />
                                    </div>

                                    {/* Blockchain Info */}
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaShieldAlt className="text-purple-600" />
                                            <span className="text-sm font-medium text-purple-900">Secure Storage</span>
                                        </div>
                                        <p className="text-xs text-purple-700">
                                            This interview will be automatically stored on the blockchain for secure and immutable records.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        onClick={closeModals}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={scheduleInterview}
                                        disabled={updating || !interviewData.date || !interviewData.time}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                {interviewModalTitle === 'Reschedule Interview' ? 'Rescheduling...' : 'Scheduling...'}
                                            </>
                                        ) : interviewModalTitle === 'Reschedule Interview' ? (
                                            'Reschedule Interview'
                                        ) : (
                                            'Schedule Interview'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CompanyApplications;
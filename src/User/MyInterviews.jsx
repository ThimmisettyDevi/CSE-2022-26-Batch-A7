
import React, { useState, useEffect } from 'react';
import {
    FaCalendarAlt,
    FaClock,
    FaVideo,
    FaPhone,
    FaMapMarkerAlt,
    FaBuilding,
    FaUser,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationCircle,
    FaCalendarCheck,
    FaCalendarTimes,
    FaFileAlt,
    FaExternalLinkAlt,
    FaSortAmountDown,
    FaSortAmountUp,
    FaFilter,
    FaSearch,
    FaVideoSlash,
    FaPhoneSlash,
    FaLink,
    FaStickyNote,
    FaUserTie,
    FaGraduationCap,
    FaBriefcase,
    FaHistory, FaEye
} from 'react-icons/fa';
import {
    MdWork,
    MdAccessTime,
    MdDateRange,
    MdLocationOn,
    MdDescription
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';

const MyInterviews = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('interviews');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('interviewDate');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showFilters, setShowFilters] = useState(false);
    const [showInterviewDetails, setShowInterviewDetails] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [interviewNotes, setInterviewNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const [filters, setFilters] = useState({
        status: 'scheduled',
        type: '',
        mode: '',
        company: ''
    });


    const [interviews, setInterviews] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        upcoming: 0,
        past: 0
    });

    // State for filter options
    const [filterOptions, setFilterOptions] = useState({
        companies: [],
        types: [
            { value: 'technical', label: 'Technical', color: 'bg-blue-100 text-blue-800' },
            { value: 'hr', label: 'HR', color: 'bg-green-100 text-green-800' },
            { value: 'managerial', label: 'Managerial', color: 'bg-purple-100 text-purple-800' },
            { value: 'coding', label: 'Coding', color: 'bg-orange-100 text-orange-800' }
        ],
        modes: [
            { value: 'online', label: 'Online', icon: <FaVideo /> },
            { value: 'phone', label: 'Phone', icon: <FaPhone /> },
            { value: 'in-person', label: 'In-Person', icon: <FaUser /> }
        ],
        statuses: [
            { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
            { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
            { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
            { value: 'rescheduled', label: 'Rescheduled', color: 'bg-yellow-100 text-yellow-800' }
        ]
    });

    // Fetch interviews data
    const fetchInterviews = async () => {
        try {
            setLoading(true);
            // Filter applications that have interview dates
            const response = await axiosInstance.get('/applications/my-applications');
            const { applications } = response.data;

            // Filter applications with interview dates
            const applicationsWithInterviews = applications.filter(app =>
                app.interviewDate || app.status === 'Interviewed' || app.status === 'Selected'
            );

            // Transform data for interviews view
            const interviewData = applicationsWithInterviews.map(app => {
                const interviewType = app.interviewNotes?.toLowerCase().includes('technical') ? 'technical' :
                    app.interviewNotes?.toLowerCase().includes('hr') ? 'hr' :
                        app.interviewNotes?.toLowerCase().includes('coding') ? 'coding' : 'managerial';

                const interviewMode = app.interviewNotes?.toLowerCase().includes('online') ? 'online' :
                    app.interviewNotes?.toLowerCase().includes('phone') ? 'phone' : 'in-person';

                const now = new Date();
                const interviewDate = new Date(app.interviewDate || app.updatedAt);
                const isUpcoming = interviewDate > now;
                const isPast = interviewDate <= now;

                let status = 'scheduled';
                if (app.status === 'Selected') status = 'completed';
                else if (app.status === 'Rejected' && app.interviewDate) status = 'completed';
                else if (app.status === 'Withdrawn' && app.interviewDate) status = 'cancelled';
                else if (!app.interviewDate && app.status === 'Interviewed') status = 'completed';

                return {
                    _id: app._id,
                    applicationId: app._id,
                    internshipId: app.internshipId?._id || app.internship?._id,
                    title: app.internshipId?.title || app.internship?.title || 'Internship',
                    companyName: app.internshipId?.companyId?.companyName ||
                        app.internship?.companyInfo?.companyName ||
                        'Company',
                    companyLogo: app.internshipId?.companyId?.logo ||
                        app.internship?.companyInfo?.logo || '',
                    interviewDate: app.interviewDate || app.updatedAt,
                    interviewType,
                    interviewMode,
                    status,
                    duration: '45 minutes', // Default duration
                    location: app.interviewNotes?.includes('Zoom') ? 'Zoom Meeting' :
                        app.interviewNotes?.includes('Google Meet') ? 'Google Meet' :
                            app.interviewNotes?.includes('Microsoft Teams') ? 'Microsoft Teams' :
                                app.internshipId?.location || app.internship?.location || 'Remote',
                    link: app.interviewNotes?.match(/https?:\/\/[^\s]+/)?.[0] || '',
                    contactPerson: 'HR Manager', // Default
                    contactEmail: 'hr@company.com', // Default
                    notes: app.interviewNotes || '',
                    feedback: app.feedback || '',
                    rating: app.rating || null,
                    applicationStatus: app.status,
                    isUpcoming,
                    isPast,
                    createdAt: app.createdAt,
                    updatedAt: app.updatedAt
                };
            });

            // Apply filters
            let filteredData = interviewData.filter(interview => {
                if (filters.status && interview.status !== filters.status) return false;
                if (filters.type && interview.interviewType !== filters.type) return false;
                if (filters.mode && interview.interviewMode !== filters.mode) return false;
                if (filters.company && !interview.companyName.toLowerCase().includes(filters.company.toLowerCase())) return false;
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    return (
                        interview.title.toLowerCase().includes(query) ||
                        interview.companyName.toLowerCase().includes(query) ||
                        interview.interviewType.toLowerCase().includes(query) ||
                        interview.location.toLowerCase().includes(query)
                    );
                }
                return true;
            });

            // Apply sorting
            filteredData.sort((a, b) => {
                let aValue, bValue;

                switch (sortBy) {
                    case 'interviewDate':
                        aValue = new Date(a.interviewDate).getTime();
                        bValue = new Date(b.interviewDate).getTime();
                        break;
                    case 'companyName':
                        aValue = a.companyName.toLowerCase();
                        bValue = b.companyName.toLowerCase();
                        break;
                    case 'status':
                        aValue = a.status;
                        bValue = b.status;
                        break;
                    default:
                        aValue = new Date(a.interviewDate).getTime();
                        bValue = new Date(b.interviewDate).getTime();
                }

                if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            setInterviews(filteredData);

            // Calculate stats
            const total = filteredData.length;
            const scheduled = filteredData.filter(i => i.status === 'scheduled').length;
            const completed = filteredData.filter(i => i.status === 'completed').length;
            const cancelled = filteredData.filter(i => i.status === 'cancelled').length;
            const upcoming = filteredData.filter(i => i.isUpcoming).length;
            const past = filteredData.filter(i => i.isPast).length;

            setStats({ total, scheduled, completed, cancelled, upcoming, past });

            const companies = [...new Set(interviewData.map(i => i.companyName).filter(Boolean))];
            setFilterOptions(prev => ({ ...prev, companies }));

        } catch (error) {
            console.error('Error fetching interviews:', error);
            toast.error('Failed to load interviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, [filters, sortBy, sortOrder, searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchInterviews();
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const handleSortChange = (newSortBy) => {
        if (newSortBy === sortBy) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    const clearFilters = () => {
        setFilters({
            status: 'scheduled',
            type: '',
            mode: '',
            company: ''
        });
        setSearchQuery('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not scheduled';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
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

    // Format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'Not scheduled';
        return `${formatDate(dateString)} at ${formatTime(dateString)}`;
    };

    // Get days until interview
    const getDaysUntil = (dateString) => {
        if (!dateString) return null;
        const interviewDate = new Date(dateString);
        const today = new Date();
        const diffTime = interviewDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Get status info
    const getStatusInfo = (status) => {
        switch (status) {
            case 'scheduled':
                return {
                    color: 'bg-blue-100 text-blue-800',
                    icon: <FaCalendarAlt className="text-blue-500" />,
                    label: 'Scheduled'
                };
            case 'completed':
                return {
                    color: 'bg-green-100 text-green-800',
                    icon: <FaCheckCircle className="text-green-500" />,
                    label: 'Completed'
                };
            case 'cancelled':
                return {
                    color: 'bg-red-100 text-red-800',
                    icon: <FaTimesCircle className="text-red-500" />,
                    label: 'Cancelled'
                };
            case 'rescheduled':
                return {
                    color: 'bg-yellow-100 text-yellow-800',
                    icon: <FaCalendarCheck className="text-yellow-500" />,
                    label: 'Rescheduled'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800',
                    icon: <FaExclamationCircle className="text-gray-500" />,
                    label: 'Unknown'
                };
        }
    };

    // Get mode info
    const getModeInfo = (mode) => {
        switch (mode) {
            case 'online':
                return {
                    icon: <FaVideo className="text-blue-500" />,
                    label: 'Online',
                    bgColor: 'bg-blue-50',
                    textColor: 'text-blue-700'
                };
            case 'phone':
                return {
                    icon: <FaPhone className="text-green-500" />,
                    label: 'Phone',
                    bgColor: 'bg-green-50',
                    textColor: 'text-green-700'
                };
            case 'in-person':
                return {
                    icon: <FaUser className="text-purple-500" />,
                    label: 'In-Person',
                    bgColor: 'bg-purple-50',
                    textColor: 'text-purple-700'
                };
            default:
                return {
                    icon: <FaVideoSlash className="text-gray-500" />,
                    label: 'Virtual',
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-700'
                };
        }
    };

    // Get type info
    const getTypeInfo = (type) => {
        switch (type) {
            case 'technical':
                return {
                    label: 'Technical',
                    color: 'bg-blue-100 text-blue-800'
                };
            case 'hr':
                return {
                    label: 'HR',
                    color: 'bg-green-100 text-green-800'
                };
            case 'managerial':
                return {
                    label: 'Managerial',
                    color: 'bg-purple-100 text-purple-800'
                };
            case 'coding':
                return {
                    label: 'Coding',
                    color: 'bg-orange-100 text-orange-800'
                };
            default:
                return {
                    label: 'Interview',
                    color: 'bg-gray-100 text-gray-800'
                };
        }
    };

    // View interview details
    const viewInterviewDetails = (interview) => {
        setSelectedInterview(interview);
        setShowInterviewDetails(true);
    };

    // Close interview details
    const closeInterviewDetails = () => {
        setShowInterviewDetails(false);
        setSelectedInterview(null);
    };

    // Open reschedule modal
    const openRescheduleModal = (interview) => {
        setSelectedInterview(interview);
        if (interview.interviewDate) {
            const date = new Date(interview.interviewDate);
            setRescheduleDate(date.toISOString().split('T')[0]);
            setRescheduleTime(date.toTimeString().split(' ')[0].substring(0, 5));
        }
        setShowRescheduleModal(true);
    };

    // Open notes modal
    const openNotesModal = (interview) => {
        setSelectedInterview(interview);
        setInterviewNotes(interview.notes || '');
        setShowNotesModal(true);
    };

    // Reschedule interview
    const rescheduleInterview = async () => {
        if (!rescheduleDate || !rescheduleTime) {
            toast.error('Please select date and time');
            return;
        }

        const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
        if (newDateTime < new Date()) {
            toast.error('Interview date cannot be in the past');
            return;
        }

        try {
            setUpdating(true);

            // Update application with new interview date
            await axiosInstance.patch(`/applications/${selectedInterview.applicationId}/status`, {
                status: 'Interviewed',
                interviewDate: newDateTime.toISOString(),
                interviewNotes: `Rescheduled to ${formatDateTime(newDateTime.toISOString())}. ${selectedInterview.notes || ''}`
            });

            // Update local state
            setInterviews(prev => prev.map(interview =>
                interview._id === selectedInterview._id
                    ? {
                        ...interview,
                        interviewDate: newDateTime.toISOString(),
                        status: 'rescheduled',
                        notes: `Rescheduled to ${formatDateTime(newDateTime.toISOString())}. ${interview.notes || ''}`,
                        updatedAt: new Date().toISOString()
                    }
                    : interview
            ));

            toast.success('Interview rescheduled successfully');
            setShowRescheduleModal(false);
            setSelectedInterview(null);
            setRescheduleDate('');
            setRescheduleTime('');
        } catch (error) {
            console.error('Error rescheduling interview:', error);
            toast.error('Failed to reschedule interview');
        } finally {
            setUpdating(false);
        }
    };

    // Save interview notes
    const saveInterviewNotes = async () => {
        try {
            setUpdating(true);

            await axiosInstance.patch(`/applications/${selectedInterview.applicationId}/status`, {
                status: 'Interviewed',
                interviewNotes: interviewNotes
            });

            // Update local state
            setInterviews(prev => prev.map(interview =>
                interview._id === selectedInterview._id
                    ? {
                        ...interview,
                        notes: interviewNotes,
                        updatedAt: new Date().toISOString()
                    }
                    : interview
            ));

            toast.success('Notes saved successfully');
            setShowNotesModal(false);
            setSelectedInterview(null);
            setInterviewNotes('');
        } catch (error) {
            console.error('Error saving notes:', error);
            toast.error('Failed to save notes');
        } finally {
            setUpdating(false);
        }
    };

    // Join interview
    const joinInterview = (interview) => {
        if (interview.link) {
            window.open(interview.link, '_blank');
        } else if (interview.interviewMode === 'online') {
            toast.error('Meeting link not provided');
        } else if (interview.interviewMode === 'phone') {
            toast.success('Please call the provided phone number');
        } else {
            toast.success(`Please visit: ${interview.location}`);
        }
    };

    // Cancel interview
    const cancelInterview = async (interviewId) => {
        if (!window.confirm('Are you sure you want to cancel this interview?')) {
            return;
        }

        try {
            // Update application status to withdrawn
            await axiosInstance.post(`/applications/${interviewId}/withdraw`);

            // Update local state
            setInterviews(prev => prev.map(interview =>
                interview._id === interviewId
                    ? { ...interview, status: 'cancelled', updatedAt: new Date().toISOString() }
                    : interview
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                cancelled: prev.cancelled + 1,
                scheduled: prev.scheduled - 1,
                upcoming: prev.upcoming - 1
            }));

            toast.success('Interview cancelled successfully');
        } catch (error) {
            console.error('Error cancelling interview:', error);
            toast.error('Failed to cancel interview');
        }
    };

    // Prepare for interview
    const prepareForInterview = (interview) => {
        // Open preparation resources
        const prepLinks = {
            technical: 'https://www.interviewbit.com/technical-interview-questions/',
            hr: 'https://www.indeed.com/career-advice/interviewing/common-interview-questions-and-answers',
            coding: 'https://leetcode.com/',
            managerial: 'https://www.thebalancecareers.com/management-interview-questions-and-answers-2061198'
        };

        const link = prepLinks[interview.interviewType] || 'https://www.indeed.com/career-advice/interviewing';
        window.open(link, '_blank');
    };

    // Get upcoming interviews (next 7 days)
    const getUpcomingInterviews = () => {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return interviews.filter(interview => {
            const interviewDate = new Date(interview.interviewDate);
            return interview.status === 'scheduled' &&
                interviewDate > now &&
                interviewDate <= nextWeek;
        }).sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
    };

    if (loading && interviews.length === 0) {
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
                        <p className="mt-4 text-gray-600">Loading your interviews...</p>
                    </div>
                </div>
            </div>
        );
    }

    const upcomingInterviews = getUpcomingInterviews();

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
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">My Interviews</h1>
                    <p className="text-blue-100">Manage and prepare for your upcoming interviews</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
                        <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl shadow border border-blue-100">
                        <div className="text-2xl font-bold text-blue-700">{stats.scheduled || 0}</div>
                        <div className="text-sm text-blue-600">Scheduled</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl shadow border border-green-100">
                        <div className="text-2xl font-bold text-green-700">{stats.completed || 0}</div>
                        <div className="text-sm text-green-600">Completed</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl shadow border border-red-100">
                        <div className="text-2xl font-bold text-red-700">{stats.cancelled || 0}</div>
                        <div className="text-sm text-red-600">Cancelled</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl shadow border border-orange-100">
                        <div className="text-2xl font-bold text-orange-700">{stats.upcoming || 0}</div>
                        <div className="text-sm text-orange-600">Upcoming</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl shadow border border-gray-100">
                        <div className="text-2xl font-bold text-gray-700">{stats.past || 0}</div>
                        <div className="text-sm text-gray-600">Past</div>
                    </div>
                </div>

                {/* Upcoming Interviews Section */}
                {upcomingInterviews.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FaCalendarCheck className="text-blue-600" /> Upcoming This Week
                            </h2>
                            <span className="text-sm text-gray-600">{upcomingInterviews.length} interviews</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingInterviews.slice(0, 3).map((interview, index) => {
                                const daysUntil = getDaysUntil(interview.interviewDate);
                                const modeInfo = getModeInfo(interview.interviewMode);

                                return (
                                    <motion.div
                                        key={interview._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modeInfo.bgColor}`}>
                                                        {modeInfo.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{interview.companyName}</h3>
                                                        <p className="text-sm text-gray-600">{interview.title}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    <span className="font-medium">{formatDate(interview.interviewDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FaClock className="text-gray-400" />
                                                    <span className="font-medium">{formatTime(interview.interviewDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MdAccessTime className="text-gray-400" />
                                                    <span>{interview.duration}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => prepareForInterview(interview)}
                                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                                >
                                                    <FaBriefcase size={14} /> Prepare
                                                </button>
                                                <button
                                                    onClick={() => viewInterviewDetails(interview)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                                >
                                                    <FaEye size={14} /> View
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

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
                                    placeholder="Search interviews by company, type, or location..."
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </form>
                        </div>

                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => handleSortChange('interviewDate')}
                                className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                            >
                                {sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                                {sortBy === 'interviewDate' ? 'Date' : 'Company'} {sortOrder === 'desc' ? ' (Newest)' : ' (Oldest)'}
                            </button>
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                        >
                            <FaFilter /> Filters
                            {(filters.status !== 'scheduled' || filters.type || filters.mode || filters.company) && (
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
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="">All Status</option>
                                    </select>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type
                                    </label>
                                    <select
                                        value={filters.type}
                                        onChange={(e) => handleFilterChange('type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Types</option>
                                        {filterOptions.types.map((type, index) => (
                                            <option key={index} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mode Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mode
                                    </label>
                                    <select
                                        value={filters.mode}
                                        onChange={(e) => handleFilterChange('mode', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">All Modes</option>
                                        {filterOptions.modes.map((mode, index) => (
                                            <option key={index} value={mode.value}>
                                                <div className="flex items-center gap-2">
                                                    {mode.icon} {mode.label}
                                                </div>
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
                                    onClick={() => setShowFilters(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Interviews List */}
                {interviews.length > 0 ? (
                    <>
                        <div className="space-y-4 mb-8">
                            {interviews.map((interview, index) => {
                                const statusInfo = getStatusInfo(interview.status);
                                const modeInfo = getModeInfo(interview.interviewMode);
                                const typeInfo = getTypeInfo(interview.interviewType);
                                const daysUntil = getDaysUntil(interview.interviewDate);

                                return (
                                    <motion.div
                                        key={interview._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                {/* Left Section - Interview Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        {/* Company Logo */}
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                                            {interview.companyLogo ? (
                                                                <img
                                                                    src={interview.companyLogo}
                                                                    alt={interview.companyName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                                    <FaBuilding className="text-gray-400 text-2xl" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Interview Details */}
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                                        {interview.title}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="font-medium text-gray-700">
                                                                            {interview.companyName}
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                                            {typeInfo.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Interview Info */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${modeInfo.bgColor}`}>
                                                                        {modeInfo.icon}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-gray-500">Mode</div>
                                                                        <div className={`font-medium ${modeInfo.textColor}`}>
                                                                            {modeInfo.label}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <FaCalendarAlt className="text-gray-400" />
                                                                    <div>
                                                                        <div className="text-xs text-gray-500">Date</div>
                                                                        <div className="font-medium">{formatDate(interview.interviewDate)}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <FaClock className="text-gray-400" />
                                                                    <div>
                                                                        <div className="text-xs text-gray-500">Time</div>
                                                                        <div className="font-medium">{formatTime(interview.interviewDate)}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <MdAccessTime className="text-gray-400" />
                                                                    <div>
                                                                        <div className="text-xs text-gray-500">Duration</div>
                                                                        <div className="font-medium">{interview.duration}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Location/Link */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    {interview.interviewMode === 'online' ? (
                                                                        <>
                                                                            <FaLink className="text-blue-500" />
                                                                            <span>{interview.location || 'Online Meeting'}</span>
                                                                            {interview.link && (
                                                                                <a
                                                                                    href={interview.link}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-600 hover:underline"
                                                                                >
                                                                                    Join Link
                                                                                </a>
                                                                            )}
                                                                        </>
                                                                    ) : interview.interviewMode === 'phone' ? (
                                                                        <>
                                                                            <FaPhone className="text-green-500" />
                                                                            <span>Phone Interview</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FaMapMarkerAlt className="text-purple-500" />
                                                                            <span>{interview.location}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section - Status & Actions */}
                                                <div className="lg:w-72 flex flex-col gap-4">
                                                    {/* Status & Days */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className={`px-4 py-2 rounded-lg border flex items-center justify-center gap-2 ${statusInfo.color}`}>
                                                            {statusInfo.icon}
                                                            <span className="font-medium">{statusInfo.label}</span>
                                                        </div>
                                                        {interview.status === 'scheduled' && daysUntil !== null && (
                                                            <div className="text-center">
                                                                <div className="text-sm text-gray-600">
                                                                    {daysUntil === 0 ? 'Today' :
                                                                        daysUntil === 1 ? 'Tomorrow' :
                                                                            `${daysUntil} days`}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {interview.status === 'scheduled' && (
                                                            <>
                                                                <button
                                                                    onClick={() => joinInterview(interview)}
                                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                                                                >
                                                                    <FaVideo /> Join
                                                                </button>
                                                                <button
                                                                    onClick={() => prepareForInterview(interview)}
                                                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
                                                                >
                                                                    <FaBriefcase /> Prepare
                                                                </button>
                                                                <button
                                                                    onClick={() => openRescheduleModal(interview)}
                                                                    className="px-3 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition flex items-center justify-center gap-2 text-sm"
                                                                >
                                                                    <FaCalendarCheck /> Reschedule
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelInterview(interview._id)}
                                                                    className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm"
                                                                >
                                                                    <FaCalendarTimes /> Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => openNotesModal(interview)}
                                                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <FaStickyNote /> Notes
                                                        </button>
                                                        <button
                                                            onClick={() => viewInterviewDetails(interview)}
                                                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <FaExternalLinkAlt /> Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow border border-gray-100">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
                            <FaCalendarTimes className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No interviews scheduled</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            {searchQuery || Object.values(filters).some(f => f)
                                ? 'No interviews match your search criteria. Try adjusting your filters.'
                                : 'You don\'t have any scheduled interviews. Keep applying to internships!'}
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
                                onClick={() => window.location.href = '/applications'}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                            >
                                View My Applications
                            </button>
                        )}
                    </div>
                )}

                {/* Preparation Tips */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FaGraduationCap className="text-blue-600" /> Interview Preparation Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaUserTie className="text-blue-500" /> Research the Company
                            </div>
                            <p className="text-sm text-gray-600">Learn about the company's products, culture, and recent news.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaFileAlt className="text-green-500" /> Review Your Application
                            </div>
                            <p className="text-sm text-gray-600">Be prepared to discuss everything in your resume and cover letter.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                <FaVideo className="text-purple-500" /> Test Your Setup
                            </div>
                            <p className="text-sm text-gray-600">For online interviews, test your camera, microphone, and internet connection.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interview Details Modal */}
            <AnimatePresence>
                {showInterviewDetails && selectedInterview && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeInterviewDetails}
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
                                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                                                {selectedInterview.companyLogo ? (
                                                    <img
                                                        src={selectedInterview.companyLogo}
                                                        alt={selectedInterview.companyName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                                        <FaBuilding className="text-gray-400 text-3xl" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                                    {selectedInterview.title}
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-700">
                                                        {selectedInterview.companyName}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeInfo(selectedInterview.interviewType).color}`}>
                                                        {getTypeInfo(selectedInterview.interviewType).label} Interview
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeInterviewDetails}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <FaTimesCircle className="text-2xl text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Dialog Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        {/* Interview Details */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Details</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <FaCalendarAlt className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600">Date & Time</div>
                                                        <div className="font-medium">{formatDateTime(selectedInterview.interviewDate)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                        <MdAccessTime className="text-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600">Duration</div>
                                                        <div className="font-medium">{selectedInterview.duration}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg ${getModeInfo(selectedInterview.interviewMode).bgColor} flex items-center justify-center`}>
                                                        {getModeInfo(selectedInterview.interviewMode).icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-600">Mode</div>
                                                        <div className={`font-medium ${getModeInfo(selectedInterview.interviewMode).textColor}`}>
                                                            {getModeInfo(selectedInterview.interviewMode).label}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Contact */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Status & Contact</h3>
                                            <div className="space-y-3">
                                                <div className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${getStatusInfo(selectedInterview.status).color}`}>
                                                    {getStatusInfo(selectedInterview.status).icon}
                                                    <span className="font-medium">{getStatusInfo(selectedInterview.status).label}</span>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <div className="text-sm text-gray-600 mb-1">Contact Person</div>
                                                    <div className="font-medium">{selectedInterview.contactPerson}</div>
                                                    <div className="text-sm text-gray-600 mt-2 mb-1">Contact Email</div>
                                                    <div className="font-medium">{selectedInterview.contactEmail}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location/Link */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                {selectedInterview.interviewMode === 'online' ? (
                                                    <FaVideo className="text-blue-500" />
                                                ) : selectedInterview.interviewMode === 'phone' ? (
                                                    <FaPhone className="text-green-500" />
                                                ) : (
                                                    <FaMapMarkerAlt className="text-purple-500" />
                                                )}
                                                <span className="font-medium">{selectedInterview.location}</span>
                                            </div>
                                            {selectedInterview.link && (
                                                <a
                                                    href={selectedInterview.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    {selectedInterview.link}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {selectedInterview.notes && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <FaStickyNote className="text-yellow-600" /> Interview Notes
                                            </h3>
                                            <div className="bg-yellow-50 p-4 rounded-lg">
                                                <p className="text-gray-700 whitespace-pre-line">{selectedInterview.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {selectedInterview.feedback && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Feedback</h3>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <p className="text-gray-700">{selectedInterview.feedback}</p>
                                                {selectedInterview.rating && (
                                                    <div className="mt-2 flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar
                                                                key={i}
                                                                className={`text-lg ${i < selectedInterview.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                            />
                                                        ))}
                                                        <span className="ml-2 text-sm text-gray-600">
                                                            ({selectedInterview.rating}/5)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Application Status */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Status</h3>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-gray-600">Current Status</div>
                                                    <div className="font-medium">{selectedInterview.applicationStatus}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Last Updated</div>
                                                    <div className="font-medium">{formatDate(selectedInterview.updatedAt)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dialog Footer */}
                                <div className="p-6 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Interview ID: {selectedInterview._id}
                                        </div>
                                        <div className="flex gap-3">
                                            {selectedInterview.status === 'scheduled' && (
                                                <>
                                                    <button
                                                        onClick={() => joinInterview(selectedInterview)}
                                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                                    >
                                                        <FaVideo /> Join Interview
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            openRescheduleModal(selectedInterview);
                                                            closeInterviewDetails();
                                                        }}
                                                        className="px-6 py-3 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition"
                                                    >
                                                        Reschedule
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={closeInterviewDetails}
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

            {/* Reschedule Modal */}
            <AnimatePresence>
                {showRescheduleModal && selectedInterview && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRescheduleModal(false)}
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
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Reschedule Interview</h3>
                                    <p className="text-gray-600">Select new date and time for your interview</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={rescheduleDate}
                                            onChange={(e) => setRescheduleDate(e.target.value)}
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
                                            value={rescheduleTime}
                                            onChange={(e) => setRescheduleTime(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="text-sm text-gray-600 mb-1">Current Schedule</div>
                                        <div className="font-medium">{formatDateTime(selectedInterview.interviewDate)}</div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowRescheduleModal(false)}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={rescheduleInterview}
                                        disabled={updating || !rescheduleDate || !rescheduleTime}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            'Reschedule Interview'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Notes Modal */}
            <AnimatePresence>
                {showNotesModal && selectedInterview && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotesModal(false)}
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
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Interview Notes</h3>
                                    <p className="text-gray-600">Add or edit notes for this interview</p>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        value={interviewNotes}
                                        onChange={(e) => setInterviewNotes(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add your notes here... (e.g., topics to discuss, questions to ask, preparation notes)"
                                    />
                                </div>
                                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowNotesModal(false)}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveInterviewNotes}
                                        disabled={updating}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Notes'
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

export default MyInterviews;
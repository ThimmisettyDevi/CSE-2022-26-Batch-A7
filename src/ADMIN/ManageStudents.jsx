// src/components/admin/ManageStudents.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaUsers,
    FaCheckCircle,
    FaTimesCircle,
    FaUserCheck,
    FaUserTimes,
    FaClock,
    FaSearch,
    FaFilter,
    FaSync,
    FaSpinner,
    FaEye,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaGraduationCap,
    FaFileAlt,
    FaStar,
    FaExclamationTriangle
} from 'react-icons/fa';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';

const ManageStudents = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'active', 'blocked'
    const [activeTab, setActiveTab] = useState('students');

    // Students data
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        active: 0,
        blocked: 0
    });

    // Selected student for details view
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);

    // Fetch students data
    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get all users (students)
            const response = await axiosInstance.get('/auth/users');
            console.log('Students API Response:', response.data);

            const allUsers = response.data?.users || [];

            // Filter for students (non-admin users)
            const studentUsers = allUsers.filter(user =>
                !user.role || user.role === 'user' || user.role === 'USER'
            );

            console.log('Filtered Students:', studentUsers);

            // Calculate stats
            const total = studentUsers.length;
            const pending = studentUsers.filter(user =>
                user.accountStatus === 'Pending' || user.isAccepted === false
            ).length;
            const active = studentUsers.filter(user =>
                user.accountStatus === 'Active' || user.isAccepted === true
            ).length;
            const blocked = studentUsers.filter(user =>
                user.accountStatus === 'Blocked' || user.accountStatus === 'Suspended'
            ).length;

            setStudents(studentUsers);
            setStats({ total, pending, active, blocked });

        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err.response?.data?.message || 'Failed to load students data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStudents();
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Handle student approval
    const handleApproveStudent = async (studentId) => {
        try {
            setApprovingId(studentId);
            await axiosInstance.patch(`/auth/admin/approve/USER/${studentId}`, {
                status: true
            });

            // Update local state
            setStudents(prev => prev.map(student =>
                student._id === studentId
                    ? {
                        ...student,
                        isAccepted: true,
                        accountStatus: 'Active',
                        statusUpdatedAt: new Date().toISOString()
                    }
                    : student
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                pending: prev.pending - 1,
                active: prev.active + 1
            }));

            toast.success('Student approved successfully!');
        } catch (err) {
            console.error('Error approving student:', err);
            toast.error(`Failed to approve student: ${err.response?.data?.message || err.message}`);
        } finally {
            setApprovingId(null);
        }
    };

    // Handle student rejection
    const handleRejectStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to reject this student? This will block their account.')) {
            return;
        }

        try {
            setRejectingId(studentId);
            await axiosInstance.patch(`/auth/admin/approve/USER/${studentId}`, {
                status: false
            });

            // Update local state
            setStudents(prev => prev.map(student =>
                student._id === studentId
                    ? {
                        ...student,
                        isAccepted: false,
                        accountStatus: 'Blocked',
                        statusUpdatedAt: new Date().toISOString()
                    }
                    : student
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                pending: prev.pending - 1,
                blocked: prev.blocked + 1
            }));

            toast.success('Student rejected and blocked successfully!');
        } catch (err) {
            console.error('Error rejecting student:', err);
            toast.error(`Failed to reject student: ${err.response?.data?.message || err.message}`);
        } finally {
            setRejectingId(null);
        }
    };

    // Handle student activation/reactivation
    const handleActivateStudent = async (studentId) => {
        try {
            setApprovingId(studentId);
            await axiosInstance.patch(`/auth/admin/approve/user/${studentId}`, {
                status: true
            });

            // Update local state
            setStudents(prev => prev.map(student =>
                student._id === studentId
                    ? {
                        ...student,
                        isAccepted: true,
                        accountStatus: 'Active',
                        statusUpdatedAt: new Date().toISOString()
                    }
                    : student
            ));

            // Update stats
            setStats(prev => ({
                ...prev,
                blocked: prev.blocked - 1,
                active: prev.active + 1
            }));

            toast.success('Student activated successfully!');
        } catch (err) {
            console.error('Error activating student:', err);
            toast.error(`Failed to activate student: ${err.response?.data?.message || err.message}`);
        } finally {
            setApprovingId(null);
        }
    };

    // View student details
    const handleViewDetails = async (student) => {
        try {
            // Fetch detailed profile
            const response = await axiosInstance.get(`/auth/profile/${student._id}`);
            setSelectedStudent(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            console.error('Error fetching student details:', err);
            // Use basic info if detailed fetch fails
            setSelectedStudent(student);
            setShowDetailsModal(true);
        }
    };

    // Close details modal
    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedStudent(null);
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

    // Filter students based on search and status
    const filteredStudents = students.filter(student => {
        const matchesSearch =
            (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (student.mobileNumber?.includes(searchQuery)) ||
            (student._id?.includes(searchQuery));

        const matchesStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'pending' ? (student.accountStatus === 'Pending' || student.isAccepted === false) :
                    filterStatus === 'active' ? (student.accountStatus === 'Active' || student.isAccepted === true) :
                        filterStatus === 'blocked' ? (student.accountStatus === 'Blocked' || student.accountStatus === 'Suspended') :
                            true;

        return matchesSearch && matchesStatus;
    });

    // Get status badge style
    const getStatusBadge = (student) => {
        const status = student.accountStatus || (student.isAccepted ? 'Active' : 'Pending');

        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'blocked':
            case 'suspended':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // Get status text
    const getStatusText = (student) => {
        const status = student.accountStatus || (student.isAccepted ? 'Active' : 'Pending');
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (loading && !refreshing) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading students data...</p>
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
                            Manage <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Students</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Approve or reject student registrations</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or ID..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                                {stats.total}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Students</h3>
                        <p className="text-xs text-gray-500 mt-1">All registered students</p>
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
                        <h3 className="text-gray-600 text-sm font-medium">Pending Approval</h3>
                        <p className="text-xs text-gray-500 mt-1">Awaiting admin review</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <FaCheckCircle className="text-green-600 text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {stats.active}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Active Students</h3>
                        <p className="text-xs text-gray-500 mt-1">Approved and active</p>
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
                                {stats.blocked}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Blocked</h3>
                        <p className="text-xs text-gray-500 mt-1">Rejected or suspended</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <FaFilter className="text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">Filter Students</h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All Students ({stats.total})
                            </button>
                            <button
                                onClick={() => setFilterStatus('pending')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'pending'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Pending ({stats.pending})
                            </button>
                            <button
                                onClick={() => setFilterStatus('active')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'active'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Active ({stats.active})
                            </button>
                            <button
                                onClick={() => setFilterStatus('blocked')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'blocked'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Blocked ({stats.blocked})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Students ({filteredStudents.length})
                            </h2>
                            <span className="text-sm text-gray-500">
                                Showing {filteredStudents.length} of {students.length} students
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
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-600">
                                {searchQuery
                                    ? 'No students match your search criteria'
                                    : filterStatus !== 'all'
                                        ? `No ${filterStatus} students found`
                                        : 'No students have registered yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Student</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Contact</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Registration Date</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Profile</th>
                                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredStudents.map((student, index) => (
                                        <motion.tr
                                            key={student._id || index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                        {student.image ? (
                                                            <img
                                                                src={student.image}
                                                                alt={student.name}
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <FaUser className="text-white" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{student.name || 'N/A'}</p>
                                                        <p className="text-xs text-gray-500">ID: {student._id?.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaEnvelope className="text-gray-400" />
                                                        <span>{student.email || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaPhone className="text-gray-400" />
                                                        <span>{student.mobileNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    <span>{formatDate(student.accountCreatedAt || student.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(student)}`}>
                                                    {getStatusText(student)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                        <FaGraduationCap className="inline mr-1" />
                                                        {(student.education?.length || 0)} Edu
                                                    </span>
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                                        <FaStar className="inline mr-1" />
                                                        {(student.skills?.length || 0)} Skills
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs ${student.profileComplete
                                                            ? 'bg-green-50 text-green-700'
                                                            : 'bg-yellow-50 text-yellow-700'
                                                        }`}>
                                                        <FaFileAlt className="inline mr-1" />
                                                        {student.profileComplete ? 'Complete' : 'Incomplete'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(student)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    {(student.accountStatus === 'Pending' || student.isAccepted === false) && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveStudent(student._id)}
                                                                disabled={approvingId === student._id}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                                                title="Approve Student"
                                                            >
                                                                {approvingId === student._id ? (
                                                                    <FaSpinner className="animate-spin" />
                                                                ) : (
                                                                    <FaUserCheck />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectStudent(student._id)}
                                                                disabled={rejectingId === student._id}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                                title="Reject Student"
                                                            >
                                                                {rejectingId === student._id ? (
                                                                    <FaSpinner className="animate-spin" />
                                                                ) : (
                                                                    <FaUserTimes />
                                                                )}
                                                            </button>
                                                        </>
                                                    )}

                                                    {(student.accountStatus === 'Active' || student.isAccepted === true) && (
                                                        <button
                                                            onClick={() => handleRejectStudent(student._id)}
                                                            disabled={rejectingId === student._id}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                            title="Block Student"
                                                        >
                                                            {rejectingId === student._id ? (
                                                                <FaSpinner className="animate-spin" />
                                                            ) : (
                                                                <FaUserTimes />
                                                            )}
                                                        </button>
                                                    )}

                                                    {(student.accountStatus === 'Blocked' || student.accountStatus === 'Suspended') && (
                                                        <button
                                                            onClick={() => handleActivateStudent(student._id)}
                                                            disabled={approvingId === student._id}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                                            title="Activate Student"
                                                        >
                                                            {approvingId === student._id ? (
                                                                <FaSpinner className="animate-spin" />
                                                            ) : (
                                                                <FaUserCheck />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination (if needed in future) */}
                    {filteredStudents.length > 0 && (
                        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {Math.min(filteredStudents.length, 10)} students
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">Page 1</span>
                                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Student Details Modal */}
            {showDetailsModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
                            <button
                                onClick={closeDetailsModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="md:col-span-1">
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                                            {selectedStudent.image ? (
                                                <img
                                                    src={selectedStudent.image}
                                                    alt={selectedStudent.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <FaUser className="text-white text-4xl" />
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                                        <p className="text-gray-600">{selectedStudent.email}</p>
                                        <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedStudent)}`}>
                                            {getStatusText(selectedStudent)}
                                        </span>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Info</h4>
                                            <div className="space-y-2">
                                                <p className="flex items-center gap-2">
                                                    <FaPhone className="text-gray-400" />
                                                    <span className="text-gray-900">{selectedStudent.mobileNumber || 'N/A'}</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <FaEnvelope className="text-gray-400" />
                                                    <span className="text-gray-900">{selectedStudent.email}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Registration Info</h4>
                                            <div className="space-y-2">
                                                <p className="text-gray-900">
                                                    <span className="font-medium">Registered:</span> {formatDate(selectedStudent.accountCreatedAt || selectedStudent.createdAt)}
                                                </p>
                                                <p className="text-gray-900">
                                                    <span className="font-medium">Last Login:</span> {formatDate(selectedStudent.lastLogin) || 'Never'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Address</h4>
                                            <p className="text-gray-900">{selectedStudent.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Education */}
                            {selectedStudent.education && selectedStudent.education.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaGraduationCap className="text-blue-600" />
                                        Education
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedStudent.education.map((edu, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{edu.institution}</h4>
                                                        <p className="text-gray-600">{edu.degree} in {edu.fieldOfStudy}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                                                        </p>
                                                    </div>
                                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                        GPA: {edu.grade || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resume */}
                            {selectedStudent.resume && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
                                    <a
                                        href={selectedStudent.resume}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <FaFileAlt /> View Resume
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                            <button
                                onClick={closeDetailsModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                            {selectedStudent.accountStatus === 'Pending' || selectedStudent.isAccepted === false ? (
                                <>
                                    <button
                                        onClick={() => {
                                            handleApproveStudent(selectedStudent._id);
                                            closeDetailsModal();
                                        }}
                                        disabled={approvingId === selectedStudent._id}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {approvingId === selectedStudent._id ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaUserCheck />
                                        )}
                                        Approve Student
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleRejectStudent(selectedStudent._id);
                                            closeDetailsModal();
                                        }}
                                        disabled={rejectingId === selectedStudent._id}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {rejectingId === selectedStudent._id ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaUserTimes />
                                        )}
                                        Reject Student
                                    </button>
                                </>
                            ) : selectedStudent.accountStatus === 'Active' ? (
                                <button
                                    onClick={() => {
                                        handleRejectStudent(selectedStudent._id);
                                        closeDetailsModal();
                                    }}
                                    disabled={rejectingId === selectedStudent._id}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {rejectingId === selectedStudent._id ? (
                                        <FaSpinner className="animate-spin" />
                                    ) : (
                                        <FaUserTimes />
                                    )}
                                    Block Student
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        handleActivateStudent(selectedStudent._id);
                                        closeDetailsModal();
                                    }}
                                    disabled={approvingId === selectedStudent._id}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {approvingId === selectedStudent._id ? (
                                        <FaSpinner className="animate-spin" />
                                    ) : (
                                        <FaUserCheck />
                                    )}
                                    Activate Student
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ManageStudents;
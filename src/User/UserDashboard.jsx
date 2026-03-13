// src/components/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaBell,
  FaSearch,
  FaChartLine,
  FaBriefcase,
  FaCalendarAlt,
  FaGraduationCap,
  FaCertificate,
  FaUsers,
  FaChartBar,
  FaRocket,
  FaStar,
  FaTrophy,
  FaFire,
  FaCheckCircle,
  FaClock,
  FaPaperPlane,
  FaArrowRight,
  FaCalendarCheck,
  FaBuilding,
  FaNetworkWired,
  FaBolt,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaExclamationCircle,
  FaSync,
  FaFileAlt,
  FaHandshake,
  FaMapMarkerAlt,
  FaRupeeSign
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const UserDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for all dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    applications: [],
    upcomingInterviews: [],
    recommendedInternships: [],
    notifications: [],
    activityData: null,
    skillData: null,
    categoryData: null,
    profile: null
  });

  // Fetch all dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Fetch profile first
      const profileResponse = await axiosInstance.get('/auth/me');
      const profile = profileResponse.data.user;

      // Fetch applications data
      const applicationsResponse = await axiosInstance.get('/applications/my-applications');
      const applicationsData = applicationsResponse.data;

      // Fetch stats overview
      const statsResponse = await axiosInstance.get('/applications/stats/overview');
      
      // Extract data from responses
      const applications = applicationsData.applications || [];
      const statsOverview = statsResponse.data.overview || {};

      // Calculate stats
      const stats = {
        totalApplications: statsOverview.total || applications.length,
        pendingApplications: statsOverview.byStatus?.Applied || applications.filter(app => app.status === 'Applied').length,
        interviewedApplications: statsOverview.byStatus?.Interviewed || applications.filter(app => app.status === 'Interviewed').length,
        upcomingInterviews: applications.filter(app => app.interviewDate).length,
        profileCompletion: profile.profileComplete ? 100 : calculateProfileCompletion(profile),
        skillMatchScore: calculateSkillMatchScore(profile)
      };

      // Get upcoming interviews from applications
      const upcomingInterviews = applications
        .filter(app => app.interviewDate && new Date(app.interviewDate) >= new Date())
        .map(app => ({
          id: app._id,
          position: app.internshipId?.title || 'Internship Position',
          companyName: app.internshipId?.companyId?.companyName || 'Company',
          date: app.interviewDate,
          type: app.internshipId?.workMode === 'Remote' ? 'video' : 'on-site',
          duration: 45
        }));

      // Try to get recommended internships
      let recommendedInternships = [];
      try {
        const recRes = await axiosInstance.get('/internships/recommended');
        recommendedInternships = recRes.data || [];
      } catch (err) {
        console.log('Recommended internships endpoint not available, using mock data');
        recommendedInternships = getMockRecommendations();
      }

      // Generate activity data from monthly trends
      let activityData = null;
      if (statsOverview.monthlyTrends && statsOverview.monthlyTrends.length > 0) {
        const months = statsOverview.monthlyTrends.map(item => 
          new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' })
        );
        const counts = statsOverview.monthlyTrends.map(item => item.count);
        
        activityData = {
          labels: months,
          datasets: [{
            label: 'Applications',
            data: counts,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3
          }]
        };
      } else if (applications.length > 0) {
        // Fallback: Generate from applications
        const monthlyData = {};
        applications.forEach(app => {
          const date = new Date(app.applicationDate || app.createdAt);
          const month = date.toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const months = Object.keys(monthlyData);
        activityData = {
          labels: months,
          datasets: [{
            label: 'Applications',
            data: months.map(m => monthlyData[m]),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3
          }]
        };
      }

      // Generate skill data from profile
      let skillData = null;
      if (profile.skills && profile.skills.length > 0) {
        skillData = {
          labels: profile.skills.slice(0, 6),
          datasets: [{
            data: profile.skills.slice(0, 6).map(() => Math.floor(Math.random() * 40) + 60),
            backgroundColor: [
              '#6366f1',
              '#8b5cf6',
              '#ec4899',
              '#f59e0b',
              '#10b981',
              '#3b82f6'
            ],
            borderWidth: 0
          }]
        };
      }

      // Generate category distribution from applications
      let categoryData = null;
      if (applications.length > 0) {
        const categoryCount = {};
        applications.forEach(app => {
          if (app.internshipId?.category) {
            categoryCount[app.internshipId.category] = (categoryCount[app.internshipId.category] || 0) + 1;
          }
        });

        const categories = Object.keys(categoryCount).slice(0, 5);
        if (categories.length > 0) {
          categoryData = {
            labels: categories,
            datasets: [{
              label: 'Applications by Category',
              data: categories.map(c => categoryCount[c]),
              backgroundColor: categories.map((_, i) => [
                'rgba(99, 102, 241, 0.7)',
                'rgba(139, 92, 246, 0.7)',
                'rgba(236, 72, 153, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(16, 185, 129, 0.7)'
              ][i]),
              borderColor: categories.map((_, i) => [
                '#6366f1',
                '#8b5cf6',
                '#ec4899',
                '#f59e0b',
                '#10b981'
              ][i]),
              borderWidth: 1
            }]
          };
        }
      }

      setDashboardData({
        stats,
        applications: applications.slice(0, 4),
        upcomingInterviews,
        recommendedInternships,
        notifications: [], // Add real notifications if available
        activityData,
        skillData,
        categoryData,
        profile
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper functions
  const calculateProfileCompletion = (profile) => {
    const fields = [
      profile.name,
      profile.email,
      profile.mobileNumber,
      profile.address,
      profile.image,
      profile.resume,
      profile.education?.length > 0,
      profile.skills?.length > 0
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const calculateSkillMatchScore = (profile) => {
    // Calculate based on profile completeness and skill count
    const baseScore = calculateProfileCompletion(profile);
    const skillBonus = profile.skills?.length > 0 ? Math.min(30, profile.skills.length * 5) : 0;
    return Math.min(100, baseScore + skillBonus);
  };

  const getMockRecommendations = () => {
    return [
      {
        _id: '1',
        title: 'Full Stack Developer Intern',
        companyName: 'TechNova Solutions',
        location: 'Remote',
        duration: 6,
        stipend: { amount: 15000 },
        skills: ['React', 'Node.js', 'MongoDB', 'Express'],
        matchScore: 95,
        workMode: 'Remote'
      },
      {
        _id: '2',
        title: 'Data Science Intern',
        companyName: 'DataMinds Inc',
        location: 'Bangalore',
        duration: 4,
        stipend: { amount: 12000 },
        skills: ['Python', 'Machine Learning', 'Pandas', 'SQL'],
        matchScore: 88,
        workMode: 'Hybrid'
      }
    ];
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleApply = async (internshipId) => {
    try {
      setLoading(true);
      await axiosInstance.post('/applications', {
        internshipId,
        coverLetter: 'I am very interested in this position and believe my skills align well with your requirements.'
      });

      alert('Application submitted successfully!');
      fetchDashboardData(true); // Refresh data
    } catch (err) {
      console.error('Error applying:', err);
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500';

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'selected':
        return 'bg-green-500';
      case 'interviewed':
        return 'bg-blue-500';
      case 'shortlisted':
        return 'bg-purple-500';
      case 'applied':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Applied';
    return status.charAt(0).toUpperCase() + status.slice(1);
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

  const formatCurrency = (stipend) => {
    if (!stipend) return 'Negotiable';
    if (typeof stipend === 'object' && stipend.amount) {
      return `₹${stipend.amount.toLocaleString()}`;
    }
    return 'Negotiable';
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4" />
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

  const {
    stats,
    applications,
    upcomingInterviews,
    recommendedInternships,
    notifications,
    activityData,
    skillData,
    categoryData,
    profile
  } = dashboardData;

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
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-black to-black bg-clip-text text-transparent">
              Welcome back, <i className="text-3xl md:text-4xl font-black bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent" >{profile?.name?.split(' ')[0] || 'User'}!</i>
            </h1>
            <p className="text-gray-600 mt-2">Here's your internship journey overview</p>
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
              {notifications?.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications?.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                {profile?.image ? (
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FaUser className="text-white" />
                )}
              </div>
            </div>
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
                <FaPaperPlane className="text-blue-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.totalApplications || 0}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Total Applications</h3>
            <p className="text-xs text-gray-500 mt-1">Submitted internship applications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FaCalendarCheck className="text-purple-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.upcomingInterviews || 0}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Upcoming Interviews</h3>
            <p className="text-xs text-gray-500 mt-1">Scheduled interviews</p>
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
                {stats?.profileCompletion || 0}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Profile Completion</h3>
            <p className="text-xs text-gray-500 mt-1">Complete your profile for better matches</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FaFire className="text-orange-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.skillMatchScore || 0}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Skill Match Score</h3>
            <p className="text-xs text-gray-500 mt-1">Your compatibility with opportunities</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBriefcase className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
              </div>
              <button
                onClick={() => window.location.href = '/applications'}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All
              </button>
            </div>

            {applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application, index) => (
                  <motion.div
                    key={application._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        {application.internshipId?.companyId?.logo ? (
                          <img
                            src={application.internshipId.companyId.logo}
                            alt={application.internshipId.companyId.companyName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaBuilding className="text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {application.internshipId?.title || 'Internship Position'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {application.internshipId?.companyId?.companyName || 'Company'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <FaMapMarkerAlt className="text-gray-400 text-xs" />
                          <span className="text-xs text-gray-500">
                            {application.internshipId?.location || 'Location not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)} text-white`}>
                        {getStatusText(application.status)}
                      </span>
                      {application.interviewDate && (
                        <p className="text-xs text-blue-600 mt-1">
                          Interview: {formatDate(application.interviewDate)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {formatDate(application.applicationDate)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-600 mb-2">No applications yet</h3>
                <p className="text-gray-500 text-sm">Start applying to internships to see them here</p>
                <button
                  onClick={() => window.location.href = '/internships'}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Browse Internships
                </button>
              </div>
            )}
          </motion.div>

          {/* Upcoming Interviews & Profile Completion */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt className="text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Upcoming Interviews</h2>
              </div>
              <span className="text-sm text-gray-500">
                {upcomingInterviews?.length || 0} scheduled
              </span>
            </div>

            {upcomingInterviews && upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.slice(0, 3).map((interview, index) => (
                  <div key={interview.id} className="p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{interview.position}</h4>
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                        {interview.type === 'video' ? 'Video Call' : 'On-site'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{interview.companyName}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <FaClock className="mr-2" />
                      {formatDate(interview.date)} • {interview.duration || 45} min
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-600 mb-2">No upcoming interviews</h3>
                <p className="text-gray-500 text-sm">Keep applying to get interview calls</p>
              </div>
            )}

            {/* Profile Completion */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Profile Completion</h3>
                <span className="text-blue-600 font-bold">{stats?.profileCompletion || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats?.profileCompletion || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Complete your profile to increase match chances
              </p>
            </div>
          </motion.div>
        </div>

        {/* Recommended Internships */}
        {recommendedInternships && recommendedInternships.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaRocket className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
              </div>
              <button
                onClick={() => window.location.href = '/search'}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                See More
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedInternships.slice(0, 2).map((internship, index) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{internship.title}</h3>
                      <p className="text-gray-600">{internship.companyName}</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {internship.matchScore || 95}% match
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <span>{internship.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      <span>{internship.duration} months</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {internship.skills?.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        {(activityData || skillData || categoryData) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {activityData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaChartLine className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Application Activity</h2>
                </div>
                <div className="h-64">
                  <Line data={activityData} options={chartOptions} />
                </div>
              </motion.div>
            )}

            {skillData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaNetworkWired className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Skills Distribution</h2>
                </div>
                <div className="h-64">
                  <Pie data={skillData} options={chartOptions} />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/profile'}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition text-center"
            >
              <FaFileAlt className="text-blue-600 text-2xl mx-auto mb-2" />
              <p className="font-medium text-gray-900">Update Resume</p>
            </button>

            <button
              onClick={() => window.location.href = '/profile?tab=skills'}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition text-center"
            >
              <FaGraduationCap className="text-purple-600 text-2xl mx-auto mb-2" />
              <p className="font-medium text-gray-900">Add Skills</p>
            </button>

            <button
              onClick={() => window.location.href = '/applications'}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition text-center"
            >
              <FaBriefcase className="text-green-600 text-2xl mx-auto mb-2" />
              <p className="font-medium text-gray-900">My Applications</p>
            </button>

            <button
              onClick={() => window.location.href = '/internships'}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition text-center"
            >
              <HiSparkles className="text-orange-600 text-2xl mx-auto mb-2" />
              <p className="font-medium text-gray-900">Find Internships</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserDashboard;
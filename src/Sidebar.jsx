// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaChartLine,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaUser,
  FaBuilding,
  FaPaperPlane,
  FaCheckCircle,
  FaFileAlt,
  FaStar,
  FaChartPie,
  FaCalendarCheck,
  FaFileUpload,
  FaSearch as FaSearchIcon,
  FaCalendarPlus,
  FaListUl,
  FaClipboardCheck,
  FaSyncAlt,
  FaCogs,
  FaUserGraduate,
  FaPlus,
  FaEye,
  FaShieldAlt,
  FaUserCheck,
  FaUsers,
  FaBriefcase,
  FaFileContract,
  FaExclamationTriangle
} from 'react-icons/fa';
import {
  MdDashboard,
  MdVerifiedUser,
  MdWork,
  MdAssessment,
  MdBarChart,
  MdAnalytics,
  MdSupervisedUserCircle,
  MdBusiness,
  MdOutlineSchool,
  MdOutlineInsertChart,
  MdOutlineSettings,
  MdOutlineLogout
} from 'react-icons/md';
import { RiAdminLine, RiDashboardFill, RiUserSettingsLine, RiTeamLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axiosInstance from './AuthenticationPages/axiosConfig';

const Sidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('USER');
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalInternships: 0,
    pendingVerifications: 0,
    pendingUsers: 0,
    pendingCompanies: 0
  });

  useEffect(() => {
    fetchUserData();
    if (userRole === 'ADMIN') {
      fetchAdminStats();
    }
  }, [userRole]);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...');
      const response = await axiosInstance.get('/auth/me');
      console.log('API Response:', response.data);

      const responseData = response.data;

      if (responseData.user) {
        setUser(responseData.user);
        setUserRole(responseData.role || 'USER');
      } else if (responseData._id) {
        setUser(responseData);
        setUserRole(responseData.role || 'USER');
      } else {
        setUser(responseData);
        setUserRole('USER');
      }

      console.log('Set user:', user);
      console.log('Set role:', userRole);
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const [usersRes, companiesRes, internshipsRes] = await Promise.all([
        axiosInstance.get('/auth/users'),
        axiosInstance.get('/company?limit=100'),
        axiosInstance.get('/internships?limit=100')
      ]);

      const users = usersRes.data?.users || [];
      const companies = companiesRes.data?.companies || [];
      const internships = internshipsRes.data?.internships || [];

      // Calculate stats
      const totalUsers = users.length;
      const pendingUsers = users.filter(user => 
        user.accountStatus === 'Pending' || user.isAccepted === false
      ).length;

      const totalCompanies = companies.length;
      const pendingCompanies = companies.filter(company => 
        company.verificationStatus === 'Pending' || company.verified === false
      ).length;

      const totalInternships = internships.length;
      const pendingVerifications = pendingUsers + pendingCompanies;

      setAdminStats({
        totalUsers,
        totalCompanies,
        totalInternships,
        pendingVerifications,
        pendingUsers,
        pendingCompanies
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load admin statistics');
    }
  };

  const adminMenu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <RiDashboardFill className="text-xl" />,
      path: '/admin/dashboard',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'students',
      label: 'Students',
      icon: <MdOutlineSchool className="text-xl" />,
      path: '/admin/students',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'companies',
      label: 'Companies',
      icon: <MdBusiness className="text-xl" />,
      path: '/admin/companies',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'internships',
      label: 'Internships',
      icon: <MdWork className="text-xl" />,
      path: '/admin/internships',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: <MdOutlineInsertChart className="text-xl" />,
      path: '/admin/monitoring',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    }
  ];

  const studentMenu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <RiDashboardFill className="text-xl" />,
      path: '/user/dashboard',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <FaUser className="text-xl" />,
      path: '/user/profile',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'internships',
      label: 'View Internships',
      icon: <MdWork className="text-xl" />,
      path: '/user/internships',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      id: 'applications',
      label: 'My Applications',
      icon: <FaPaperPlane className="text-xl" />,
      path: '/user/applications',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      id: 'interviews',
      label: 'Interviews',
      icon: <FaCalendarCheck className="text-xl" />,
      path: '/user/interviews',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
  ];

  const companyMenu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <RiDashboardFill className="text-xl" />,
      path: '/company/dashboard',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'profile',
      label: 'Company Profile',
      icon: <FaBuilding className="text-xl" />,
      path: '/company/profile',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'manage-internships',
      label: 'Manage Internships',
      icon: <FaListUl className="text-xl" />,
      path: '/company/internships',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      id: 'applications',
      label: 'View Applications',
      icon: <FaClipboardList className="text-xl" />,
      path: '/company/applications',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <MdBarChart className="text-xl" />,
      path: '/company/reports',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    }
  ];

  const getCurrentMenu = () => {
    switch (userRole) {
      case 'ADMIN': return adminMenu;
      case 'COMPANY': return companyMenu;
      case 'USER':
      default: return studentMenu;
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'ADMIN': return 'Admin Portal';
      case 'COMPANY': return 'Company Portal';
      case 'USER': return 'Student Portal';
      default: return 'Portal';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'ADMIN': return <RiAdminLine className="text-2xl" />;
      case 'COMPANY': return <FaBuilding className="text-2xl" />;
      case 'USER': return <FaUserGraduate className="text-2xl" />;
      default: return <FaUser className="text-2xl" />;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'ADMIN': return 'from-purple-500 to-pink-500';
      case 'COMPANY': return 'from-blue-500 to-cyan-500';
      case 'USER': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNavigation = (itemId, path) => {
    setActiveTab(itemId);
    navigate(path);
  };

  const handleRefreshStats = () => {
    if (userRole === 'ADMIN') {
      fetchAdminStats();
      toast.success('Stats refreshed');
    }
  };

  if (loading) {
    console.log('Showing loading state...');
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200"></div>
          <div className="p-6">
            <div className="h-32 bg-gray-200 rounded-xl mb-6"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentMenu = getCurrentMenu();
  console.log('Current menu:', currentMenu);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col shadow-xl">
      {/* Header Section */}
      <div className={`p-6 bg-gradient-to-r ${getRoleColor()} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              {getRoleIcon()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">InternXpert</h1>
              <p className="text-xs text-white/90 font-medium">{getRoleTitle()}</p>
            </div>
          </div>

          {user ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                              </svg>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                        <FaUserCircle className="text-white text-2xl" />
                      </div>
                    )}
                  </div>
                  {userRole === 'USER' && user.resume && user.resume.trim() !== '' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <FaCheckCircle className="text-white text-xs" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-white/80 truncate">{user.email || 'user@example.com'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-white/30 rounded-full text-white">
                      {userRole === 'USER' ? 'Student' : userRole}
                    </span>
                    {userRole === 'USER' && user.resume && user.resume.trim() !== '' && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/30 rounded-full text-white">
                        Resume Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                  <FaUserCircle className="text-white text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">No User Data</p>
                  <p className="text-xs text-white/80 truncate">Please check authentication</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {currentMenu.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <button
                onClick={() => handleNavigation(item.id, item.path)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === item.path || activeTab === item.id
                  ? `${item.bgColor} ${item.color} border ${item.borderColor} shadow-sm`
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${location.pathname === item.path || activeTab === item.id
                    ? item.color
                    : 'text-gray-400'
                    }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats - Dynamic based on role */}
        <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <FaChartLine className="text-blue-500" />
              Quick Stats
            </h3>
            {userRole === 'ADMIN' && (
              <button
                onClick={handleRefreshStats}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
                title="Refresh Stats"
              >
                <FaSyncAlt className="text-gray-500 text-xs" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {userRole === 'USER' && (
              <>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {user.applications?.length || 0}
                  </div>
                  <div className="text-xs text-blue-700">Applications</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {user.interviews?.length || 0}
                  </div>
                  <div className="text-xs text-green-700">Interviews</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {user.acceptedOffers || 0}
                  </div>
                  <div className="text-xs text-purple-700">Offers</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <div className="text-lg font-bold text-amber-600">
                    {user.profileComplete ? '100%' : '0%'}
                  </div>
                  <div className="text-xs text-amber-700">Profile</div>
                </div>
              </>
            )}
            
            {userRole === 'COMPANY' && (
              <>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {user.activeInternships || 0}
                  </div>
                  <div className="text-xs text-blue-700">Internships</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {user.totalApplications || 0}
                  </div>
                  <div className="text-xs text-green-700">Applications</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {user.scheduledInterviews || 0}
                  </div>
                  <div className="text-xs text-purple-700">Interviews</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <div className="text-lg font-bold text-amber-600">
                    {user.hiredStudents || 0}
                  </div>
                  <div className="text-xs text-amber-700">Hired</div>
                </div>
              </>
            )}
            
            {userRole === 'ADMIN' && (
              <>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {adminStats.totalUsers}
                  </div>
                  <div className="text-xs text-blue-700">Students</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {adminStats.totalCompanies}
                  </div>
                  <div className="text-xs text-purple-700">Companies</div>
                </div>
                <div className="text-center p-2 bg-cyan-50 rounded-lg">
                  <div className="text-lg font-bold text-cyan-600">
                    {adminStats.totalInternships}
                  </div>
                  <div className="text-xs text-cyan-700">Internships</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <div className="text-lg font-bold text-amber-600">
                    {adminStats.pendingVerifications}
                  </div>
                  <div className="text-xs text-amber-700">Pending</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pending Alerts - Admin Only */}
        {userRole === 'ADMIN' && adminStats.pendingVerifications > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationTriangle className="text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">Pending Actions</h3>
            </div>
            <div className="space-y-2">
              {adminStats.pendingUsers > 0 && (
                <button
                  onClick={() => navigate('/admin/students')}
                  className="w-full text-left p-2 text-sm text-amber-700 hover:bg-amber-100 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-amber-600" />
                    <span>{adminStats.pendingUsers} Students</span>
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                    Pending
                  </span>
                </button>
              )}
              {adminStats.pendingCompanies > 0 && (
                <button
                  onClick={() => navigate('/admin/companies')}
                  className="w-full text-left p-2 text-sm text-amber-700 hover:bg-amber-100 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FaBuilding className="text-amber-600" />
                    <span>{adminStats.pendingCompanies} Companies</span>
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                    Verify
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {userRole === 'USER' && (
              <>
                <button
                  onClick={() => navigate('/user/internships')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                >
                  <FaStar className="text-amber-500" />
                  View Featured Internships
                </button>
                <button
                  onClick={() => navigate('/user/profile')}
                  className="w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2"
                >
                  <FaFileUpload />
                  Upload Resume
                </button>
                <button
                  onClick={() => navigate('/user/applications')}
                  className="w-full text-left p-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <FaEye />
                  Track Applications
                </button>
              </>
            )}
            
            {userRole === 'COMPANY' && (
              <>
                <button
                  onClick={() => navigate('/company/internships/add')}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                >
                  <FaPlus />
                  Post New Internship
                </button>
                <button
                  onClick={() => navigate('/company/applications/review')}
                  className="w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2"
                >
                  <FaClipboardCheck />
                  Review Applications
                </button>
                <button
                  onClick={() => navigate('/company/interviews/schedule')}
                  className="w-full text-left p-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <FaCalendarCheck />
                  Schedule Interview
                </button>
              </>
            )}
            
            {userRole === 'ADMIN' && (
              <>
                <button
                  onClick={() => navigate('/admin/students')}
                  className="w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2"
                >
                  <FaUsers />
                  Manage Students
                </button>
                <button
                  onClick={() => navigate('/admin/companies')}
                  className="w-full text-left p-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <FaBuilding />
                  Manage Companies
                </button>
                <button
                  onClick={() => navigate('/admin/internships')}
                  className="w-full text-left p-2 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg flex items-center gap-2"
                >
                  <FaBriefcase />
                  View Internships
                </button>
                <button
                  onClick={() => navigate('/admin/monitoring')}
                  className="w-full text-left p-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg flex items-center gap-2"
                >
                  <FaChartPie />
                  System Monitoring
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <FaShieldAlt className="text-blue-500" />
            <span className="text-xs font-medium text-blue-800">24/7 Support</span>
          </div>
          <p className="text-xs text-blue-600">Need help? Contact our support team</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 border border-red-200"
        >
          <FaSignOutAlt className="text-lg" />
          <span className="font-medium text-sm">Logout</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Sidebar;
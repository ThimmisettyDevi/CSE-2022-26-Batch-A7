// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaCamera,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaChartLine,
  FaHeartbeat,
  FaCheckCircle
} from 'react-icons/fa';

// API Configuration
const API_BASE_URL =  'http://localhost:5000/api';

// Types

const AuthPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Login State
  const [loginData, setLoginData] = useState({
    email: 'purushothammaipati@gmail.com',
    password: 'Password@123!',
    role: 'USER'
  });

  // Register State
  const [registerData, setRegisterData] = useState({
    name: 'Maipati Purushotham',
    email: 'purushothammaipati@gmail.com',
    password: 'Password@123!',
    mobileNumber: '8106917936',
    role: 'USER',
    image: null 
  });

  // Change Password State
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    role: 'USER'
  });

  // Errors State
  const [errors, setErrors] = useState({});

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success(response.data.msg || 'Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.msg) {
        toast.error(error.response.data.msg);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!registerData.name.trim()) newErrors.name = 'Name is required';
    if (!registerData.email.trim()) newErrors.email = 'Email is required';
    if (!registerData.password) newErrors.password = 'Password is required';
    if (!registerData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (registerData.email && !emailRegex.test(registerData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const mobileRegex = /^\d{10}$/;
    if (registerData.mobileNumber && !mobileRegex.test(registerData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', registerData.name);
      formDataToSend.append('email', registerData.email);
      formDataToSend.append('password', registerData.password);
      formDataToSend.append('mobileNumber', registerData.mobileNumber);
      formDataToSend.append('role', registerData.role);
      if (registerData.image) {
        formDataToSend.append('image', registerData.image);
      }

      const response = await axios.post(`${API_BASE_URL}/auth/register`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.msg || 'Registration successful!');
      setActiveTab('login');
      
      // Pre-fill login form with registered credentials
      setLoginData(prev => ({
        ...prev,
        email: registerData.email,
        password: registerData.password
      }));
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.msg) {
        toast.error(error.response.data.msg);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!changePasswordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!changePasswordData.newPassword) newErrors.newPassword = 'New password is required';
    if (!changePasswordData.confirmPassword) newErrors.confirmPassword = 'Please confirm new password';
    
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (changePasswordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          newPassword: changePasswordData.newPassword,
          role: changePasswordData.role
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success(response.data.msg || 'Password changed successfully!');
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        role: 'USER'
      });
      setErrors({});
      
      // Switch to login tab
      setActiveTab('login');
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        setActiveTab('login');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.msg) {
        toast.error(error.response.data.msg);
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Image Upload for Register
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error('Only JPEG, PNG images are allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setRegisterData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result );
      };
      reader.readAsDataURL(file);
    }
  };

  // Animation variants
  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Forms */}
          <div className="lg:w-1/2 p-8 md:p-12">
            <div className="mb-8">
              <Link 
                to="/" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
              >
                <FaArrowLeft className="mr-2" />
                Back to Home
              </Link>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <FaHeartbeat className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">HealthSync</h1>
                  <p className="text-gray-600">Your Personal Health Companion</p>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-gray-200 mb-8">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'login' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'register' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Register
                </button>
                <button
                  onClick={() => setActiveTab('change-password')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'change-password' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Change Password
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Login Form */}
              {activeTab === 'login' && (
                <motion.form
                  key="login"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2 text-gray-400" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaLock className="inline mr-2 text-gray-400" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors pr-12"
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <input type="hidden" value={loginData.role} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('change-password')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>

                  <p className="text-center text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      Create one here
                    </button>
                  </p>
                </motion.form>
              )}

              {/* Register Form */}
              {activeTab === 'register' && (
                <motion.form
                  key="register"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleRegister}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="inline mr-2 text-gray-400" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-300' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2 text-gray-400" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors`}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaLock className="inline mr-2 text-gray-400" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-300' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors pr-12`}
                        placeholder="Create a password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${registerData.password.length >= 8 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        8+ characters
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${/[A-Z]/.test(registerData.password) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        Uppercase
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${/[a-z]/.test(registerData.password) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        Lowercase
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${/\d/.test(registerData.password) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        Number
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${/[!@#$%^&*]/.test(registerData.password) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        Special
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaPhone className="inline mr-2 text-gray-400" />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={registerData.mobileNumber}
                      onChange={(e) => setRegisterData({...registerData, mobileNumber: e.target.value})}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.mobileNumber ? 'border-red-300' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors`}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      disabled={isLoading}
                    />
                    {errors.mobileNumber && <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaCamera className="inline mr-2 text-gray-400" />
                      Profile Image (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          {imagePreview ? (
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FaCamera className="text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block">
                          <span className="sr-only">Choose profile photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            disabled={isLoading}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          JPEG, PNG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <input type="hidden" value={registerData.role} />

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </motion.button>

                  <p className="text-center text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      Sign in here
                    </button>
                  </p>
                </motion.form>
              )}

              {/* Change Password Form */}
              {activeTab === 'change-password' && (
                <motion.form
                  key="change-password"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleChangePassword}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <FaShieldAlt />
                      <span className="font-medium">Password Requirements</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className={`text-xs ${changePasswordData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={changePasswordData.newPassword.length >= 8 ? 'text-green-700' : 'text-gray-600'}>
                          Min 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className={`text-xs ${/[A-Z]/.test(changePasswordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={/[A-Z]/.test(changePasswordData.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                          Uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className={`text-xs ${/[a-z]/.test(changePasswordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={/[a-z]/.test(changePasswordData.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                          Lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className={`text-xs ${/\d/.test(changePasswordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={/\d/.test(changePasswordData.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                          Number
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className={`text-xs ${/[!@#$%^&*]/.test(changePasswordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={/[!@#$%^&*]/.test(changePasswordData.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                          Special character
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={changePasswordData.currentPassword}
                        onChange={(e) => setChangePasswordData({...changePasswordData, currentPassword: e.target.value})}
                        className={`w-full px-4 py-3 rounded-lg border ${errors.currentPassword ? 'border-red-300' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors pr-12`}
                        placeholder="Enter current password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={changePasswordData.newPassword}
                        onChange={(e) => setChangePasswordData({...changePasswordData, newPassword: e.target.value})}
                        className={`w-full px-4 py-3 rounded-lg border ${errors.newPassword ? 'border-red-300' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors pr-12`}
                        placeholder="Enter new password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={changePasswordData.confirmPassword}
                      onChange={(e) => setChangePasswordData({...changePasswordData, confirmPassword: e.target.value})}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors`}
                      placeholder="Confirm new password"
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>

                  <input type="hidden" value={changePasswordData.role} />

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating Password...
                      </span>
                    ) : (
                      'Change Password'
                    )}
                  </motion.button>

                  <p className="text-center text-gray-600">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      Back to login
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side - Info Panel */}
          <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-600 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-48 -translate-x-48"></div>
            
            <div className="relative z-10 text-white">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-bold mb-4">Welcome to HealthSync</h2>
                  <p className="text-blue-100 mb-8">
                    Transform your health journey with AI-powered insights and comprehensive tracking
                  </p>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <FaChartLine className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">AI-Powered Analytics</h3>
                      <p className="text-blue-100">Get personalized health insights and predictions</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <FaHeartbeat className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">24/7 Health Monitoring</h3>
                      <p className="text-blue-100">Track vital signs and receive instant alerts</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <FaShieldAlt className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Secure & Private</h3>
                      <p className="text-blue-100">Military-grade encryption for your health data</p>
                    </div>
                  </div>
                </div>

                {/* Demo Credentials */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <FaCheckCircle />
                    Demo Credentials
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Email:</span>
                      <span className="font-mono bg-white/10 px-3 py-1 rounded">purushothammaipati@gmail.com</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Password:</span>
                      <span className="font-mono bg-white/10 px-3 py-1 rounded">Password@123!</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Role:</span>
                      <span className="font-mono bg-white/10 px-3 py-1 rounded">USER</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-200 mt-4">
                    All registrations are created as USER accounts with full access to health tracking features.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
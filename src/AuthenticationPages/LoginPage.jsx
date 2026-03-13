// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaGoogle,
    FaFacebookF,
    FaApple,
    FaArrowRight,
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationTriangle,
    FaUser,
    FaBuilding,
    FaUserCog,
    FaBriefcase,
    FaGraduationCap,
    FaUsers,
    FaChartLine,
    FaRocket,
    FaBrain,
    FaNetworkWired,
    FaTrophy,
    FaRobot,
    FaInfinity,
    FaKey,
    FaPhone,
    FaCheck,
    FaTimes,
    FaArrowLeft,
    FaSyncAlt
} from 'react-icons/fa';
import { HiSparkles, HiChip, HiLockClosed } from 'react-icons/hi';
import { MdOutlineMarkEmailRead } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from './axiosConfig';
import { useAuth } from './AuthProvider';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isOTPVerification, setIsOTPVerification] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState('USER');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [timer, setTimer] = useState(300); // 5 minutes
    const [canResend, setCanResend] = useState(false);
    const [emailForReset, setEmailForReset] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { loginuser,token } = useAuth();

    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },
        reset: resetLoginForm,
        setValue,
        watch
    } = useForm({
        defaultValues: {
            email: '',
            password: '',
            role: 'USER',
            rememberMe: false
        }
    });

    const {
        register: forgotPasswordRegister,
        handleSubmit: handleForgotPasswordSubmit,
        formState: { errors: forgotPasswordErrors },
        reset: resetForgotPasswordForm
    } = useForm();

    const {
        register: resetPasswordRegister,
        handleSubmit: handleResetPasswordSubmit,
        formState: { errors: resetPasswordErrors },
        reset: resetPasswordForm,
        watch: watchResetPassword
    } = useForm();

    // OTP timer effect
    useEffect(() => {
        if (isOTPVerification && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else if (timer === 0) {
            setCanResend(true);
        }
    }, [isOTPVerification, timer]);

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    const scaleIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: "backOut" }
        }
    };

    const roleOptions = [
        {
            value: 'USER',
            label: 'Student/Job Seeker',
            icon: <FaUser />,
            description: 'Find internships & build career',
            color: 'from-blue-500 to-cyan-500',
            dashboardPath: '/dashboard'
        },
        {
            value: 'ADMIN',
            label: 'Administrator',
            icon: <FaUserCog />,
            description: 'Manage platform & users',
            color: 'from-purple-500 to-pink-500',
            dashboardPath: '/admin/dashboard'
        },
        {
            value: 'COMPANY',
            label: 'Company/Recruiter',
            icon: <FaBuilding />,
            description: 'Find talent & manage interns',
            color: 'from-green-500 to-emerald-500',
            dashboardPath: '/company/dashboard'
        }
    ];


    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }

        if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
            handleOtpVerification(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleForgotPasswordSubmitForm = async (data) => {
        setResetLoading(true);
        setEmailForReset(data.email);
        try {
            await axiosInstance.post(`/auth/forgot-password`, {
                email: data.email,
                role: selectedRole
            });

            setResetSent(true);
            toast.success('OTP sent to your email!');

            // Switch to OTP verification view
            setTimeout(() => {
                setIsForgotPassword(false);
                setIsOTPVerification(true);
                setTimer(300); // Reset timer
                setCanResend(false);
            }, 1500);

        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('No account found with this email');
            } else {
                toast.error('Failed to send OTP. Please try again.');
            }
        } finally {
            setResetLoading(false);
        }
    };

    const handleOtpVerification = async (otpValue) => {
        setOtpLoading(true);
        try {
            const response = await axiosInstance.post(`/auth/verify-otp`, {
                email: emailForReset,
                otp: otpValue,
                role: selectedRole
            });

            const { resetToken, msg } = response.data;
            setResetToken(resetToken);

            toast.success(msg || 'OTP verified successfully!');

            // Switch to reset password view
            setTimeout(() => {
                setIsOTPVerification(false);
                setIsResetPassword(true);
            }, 1000);

        } catch (error) {
            if (error.response?.status === 400) {
                toast.error(error.response.data?.message || 'Invalid OTP');
            } else {
                toast.error('Failed to verify OTP. Please try again.');
            }
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResetPasswordSubmitForm = async (data) => {
        setResetPasswordLoading(true);
        try {
            await axiosInstance.post(`/auth/reset-password`, {
                resetToken,
                newPassword: data.newPassword,
                role: selectedRole
            });

            toast.success('Password reset successfully!');

            // Reset all states
            setTimeout(() => {
                setIsResetPassword(false);
                setIsForgotPassword(false);
                setIsOTPVerification(false);
                resetPasswordForm();
                setOtp(['', '', '', '', '', '']);
                setResetToken('');
                setTimer(300);
                setCanResend(false);
                setEmailForReset('');
            }, 1500);

        } catch (error) {
            if (error.response?.status === 400) {
                toast.error(error.response.data?.message || 'Password reset failed');
            } else {
                toast.error('Failed to reset password. Please try again.');
            }
        } finally {
            setResetPasswordLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResetLoading(true);
        try {
            await axiosInstance.post(`/auth/forgot-password`, {
                email: emailForReset,
                role: selectedRole
            });

            setTimer(300);
            setCanResend(false);
            toast.success('New OTP sent to your email!');

        } catch (error) {
            toast.error('Failed to resend OTP. Please try again.');
        } finally {
            setResetLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.post(`/auth/login`, {
                email: data.email,
                password: data.password,
                role: data.role
            });

            const { token, user, msg,role } = response.data;

            loginuser(user)
            toast.success(msg || 'Login successful!');

            // Check account status
            if (user.accountStatus === 'Blocked') {
                toast.error('Your account has been blocked. Please contact support.');
                return;
            }

            if (user.accountStatus === 'Pending') {
                toast.error('Your account is pending approval. Please wait for admin approval.');
                return;
            }
            console.log(user);
            
            setTimeout(() => {
                // Navigate based on role
                switch (role) {
                    case 'ADMIN':
                        navigate('/admin/dashboard');
                        break;
                    case 'COMPANY':
                        navigate('/company/dashboard');
                        break;
                    case 'USER':
                        navigate('/user/dashboard');
                        break;
                    default:
                        const from = location.state?.from?.pathname || '/login';
                        navigate(from, {
                            state: {
                                user,
                                loginTime: new Date().toISOString()
                            }
                        });
                        break;
                }
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);

            if (error.response) {
                const errorMessage = error.response.data?.message ||
                    error.response.data?.error ||
                    'Login failed';

                if (error.response.status === 401) {
                    toast.error('Invalid email or password');
                } else if (error.response.status === 403) {
                    toast.error('Account blocked or not approved');
                } else if (error.response.status === 404) {
                    toast.error('Account not found');
                } else {
                    toast.error(errorMessage);
                }
            } else if (error.request) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('An unexpected error occurred');
            }

            resetLoginForm({
                ...data,
                password: ''
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        toast.info(`${provider} login coming soon!`);
    };
    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setValue('role', role);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const newPassword = watchResetPassword('newPassword');
    const confirmPassword = watchResetPassword('confirmPassword');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <Toaster position="top-right" />

            <div className="min-h-screen flex flex-col">
                {/* Main Content */}
                <div className="flex-grow flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden h-full max-h-[90vh]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                            {/* Left Side - Forms */}
                            <div className="p-8 md:p-10 lg:p-12 overflow-y-auto h-full">
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                            <FaBrain className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-slate-900">
                                                {isForgotPassword && !resetSent ? 'Reset Password' :
                                                    isOTPVerification ? 'Verify OTP' :
                                                        isResetPassword ? 'Set New Password' :
                                                            'Welcome to InternXpert'}
                                            </h1>
                                            <p className="text-slate-600 text-sm">
                                                {isForgotPassword && !resetSent ? 'Enter your email to receive OTP' :
                                                    isOTPVerification ? 'Enter the 6-digit code sent to your email' :
                                                        isResetPassword ? 'Create a strong new password' :
                                                            'AI-powered internship platform'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Back to Login Button for password flow */}
                                {(isForgotPassword || isOTPVerification || isResetPassword) && (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => {
                                            setIsForgotPassword(false);
                                            setIsOTPVerification(false);
                                            setIsResetPassword(false);
                                            setResetSent(false);
                                            setOtp(['', '', '', '', '', '']);
                                            setResetToken('');
                                            setTimer(300);
                                            setCanResend(false);
                                            setEmailForReset('');
                                        }}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 text-sm font-medium"
                                    >
                                        <FaArrowLeft className="text-sm" />
                                        Back to Login
                                    </motion.button>
                                )}

                                <AnimatePresence mode="wait">
                                    {!isForgotPassword && !isOTPVerification && !isResetPassword ? (
                                        <motion.div
                                            key="login-form"
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            variants={fadeInUp}
                                        >
                                            {/* Role Selection */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                                    Select Login Type *
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {roleOptions.map((role) => (
                                                        <motion.button
                                                            key={role.value}
                                                            type="button"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleRoleSelect(role.value)}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedRole === role.value
                                                                ? `border-transparent bg-gradient-to-br ${role.color} text-white shadow-lg`
                                                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <div className="text-lg mb-1">{role.icon}</div>
                                                            <span className="text-xs font-medium">{role.label}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="hidden"
                                                    {...loginRegister('role', { required: true })}
                                                />
                                            </div>

                                            {/* Login Form */}
                                            <form onSubmit={handleLoginSubmit(onSubmit)} className="space-y-5">
                                                {/* Email Field */}
                                                <motion.div variants={scaleIn}>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Email Address *
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FaEnvelope className="text-slate-400" size={14} />
                                                        </div>
                                                        <input
                                                            {...loginRegister('email', {
                                                                required: 'Email is required',
                                                                pattern: {
                                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                    message: 'Invalid email address'
                                                                }
                                                            })}
                                                            type="email"
                                                            placeholder={
                                                                selectedRole === 'USER' ? 'student@example.com' :
                                                                    selectedRole === 'ADMIN' ? 'admin@example.com' :
                                                                        'company@example.com'
                                                            }
                                                            className="pl-9 w-full px-3 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                        />
                                                    </div>
                                                    {loginErrors.email && (
                                                        <p className="mt-1 text-xs text-red-600">{loginErrors.email.message}</p>
                                                    )}
                                                </motion.div>

                                                {/* Password Field */}
                                                <motion.div variants={scaleIn}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="block text-sm font-semibold text-slate-700">
                                                            Password *
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsForgotPassword(true)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Forgot Password?
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FaLock className="text-slate-400" size={14} />
                                                        </div>
                                                        <input
                                                            {...loginRegister('password', {
                                                                required: 'Password is required',
                                                                minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                                            })}
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="Enter your password"
                                                            className="pl-9 w-full px-3 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                        >
                                                            {showPassword ? (
                                                                <FaEyeSlash className="text-slate-400 hover:text-slate-600" size={14} />
                                                            ) : (
                                                                <FaEye className="text-slate-400 hover:text-slate-600" size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                    {loginErrors.password && (
                                                        <p className="mt-1 text-xs text-red-600">{loginErrors.password.message}</p>
                                                    )}
                                                </motion.div>

                                                {/* Remember Me */}
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            {...loginRegister('rememberMe')}
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-slate-700">Remember me</span>
                                                    </label>
                                                    <span className="text-xs text-slate-500">
                                                        {selectedRole === 'USER' && 'Student Portal'}
                                                        {selectedRole === 'ADMIN' && 'Admin Panel'}
                                                        {selectedRole === 'COMPANY' && 'Company Portal'}
                                                    </span>
                                                </div>

                                                {/* Security Notice */}
                                                <motion.div
                                                    variants={scaleIn}
                                                    className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FaShieldAlt className="text-blue-500" size={14} />
                                                        <span className="text-xs font-semibold text-blue-900">Secure Login</span>
                                                    </div>
                                                    <p className="text-xs text-blue-700">
                                                        Your data is protected with bank-level encryption and two-factor authentication.
                                                    </p>
                                                </motion.div>

                                                {/* Login Button */}
                                                <motion.button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    variants={scaleIn}
                                                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full py-3 bg-gradient-to-r ${roleOptions.find(r => r.value === selectedRole)?.color} text-white rounded-xl font-bold text-base hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {isLoading ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            Signing In...
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {selectedRole === 'USER' && 'Sign In as Student'}
                                                            {selectedRole === 'ADMIN' && 'Sign In as Admin'}
                                                            {selectedRole === 'COMPANY' && 'Sign In as Company'}
                                                            <FaArrowRight size={14} />
                                                        </div>
                                                    )}
                                                </motion.button>
                                            </form>

                                            {/* Social Login Divider */}
                                            <div className="my-6">
                                                <div className="flex items-center">
                                                    <div className="flex-1 h-px bg-slate-300"></div>
                                                    <span className="px-3 text-xs text-slate-500">Or continue with</span>
                                                    <div className="flex-1 h-px bg-slate-300"></div>
                                                </div>

                                                <div className="flex justify-center gap-3 mt-4">
                                                    {[
                                                        { provider: 'Google', icon: <FaGoogle />, color: 'from-red-500 to-orange-500' },
                                                        { provider: 'Facebook', icon: <FaFacebookF />, color: 'from-blue-600 to-blue-800' },
                                                        { provider: 'Apple', icon: <FaApple />, color: 'from-slate-800 to-slate-900' }
                                                    ].map((social) => (
                                                        <motion.button
                                                            key={social.provider}
                                                            type="button"
                                                            whileHover={{ scale: 1.1, y: -2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleSocialLogin(social.provider)}
                                                            className={`p-3 rounded-lg bg-gradient-to-br ${social.color} text-white shadow-lg hover:shadow-xl transition-shadow`}
                                                        >
                                                            {social.icon}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Register Link */}
                                            <div className="text-center">
                                                <p className="text-slate-600 text-sm">
                                                    Don't have an account?{' '}
                                                    <Link
                                                        to="/register"
                                                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                                                    >
                                                        Create account
                                                        <FaArrowRight className="text-xs" />
                                                    </Link>
                                                </p>
                                            </div>
                                        </motion.div>
                                    ) : isForgotPassword ? (
                                        <motion.div
                                            key="forgot-password-form"
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            variants={fadeInUp}
                                        >
                                            {resetSent ? (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-center py-6"
                                                >
                                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <MdOutlineMarkEmailRead className="text-white text-2xl" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                        Check Your Email
                                                    </h3>
                                                    <p className="text-slate-600 text-sm mb-4">
                                                        We've sent a password reset OTP to your email address.
                                                        Please check your inbox and enter the code.
                                                    </p>
                                                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                                        <p className="text-xs text-green-800">
                                                            <FaExclamationTriangle className="inline mr-2" size={12} />
                                                            The OTP will expire in 5 minutes for security reasons.
                                                        </p>
                                                    </div>
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsForgotPassword(false);
                                                            setIsOTPVerification(true);
                                                            setTimer(300);
                                                            setCanResend(false);
                                                        }}
                                                        whileHover={{ scale: 1.05 }}
                                                        className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm"
                                                    >
                                                        Enter OTP
                                                    </motion.button>
                                                </motion.div>
                                            ) : (
                                                <>
                                                    {/* Role Selection for Forgot Password */}
                                                    <div className="mb-6">
                                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                            Select Account Type
                                                        </label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {roleOptions.map((role) => (
                                                                <button
                                                                    key={role.value}
                                                                    type="button"
                                                                    onClick={() => setSelectedRole(role.value)}
                                                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs ${selectedRole === role.value
                                                                        ? `border-transparent bg-gradient-to-br ${role.color} text-white`
                                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                                        }`}
                                                                >
                                                                    <div className="mb-1">{role.icon}</div>
                                                                    <span>{role.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <form onSubmit={handleForgotPasswordSubmit(handleForgotPasswordSubmitForm)} className="space-y-5">
                                                        <motion.div variants={scaleIn}>
                                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                                Enter your {selectedRole === 'USER' ? 'student' : selectedRole.toLowerCase()} email address *
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <FaEnvelope className="text-slate-400" size={14} />
                                                                </div>
                                                                <input
                                                                    {...forgotPasswordRegister('email', {
                                                                        required: 'Email is required',
                                                                        pattern: {
                                                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                            message: 'Invalid email address'
                                                                        }
                                                                    })}
                                                                    type="email"
                                                                    placeholder={
                                                                        selectedRole === 'USER' ? 'student@example.com' :
                                                                            selectedRole === 'ADMIN' ? 'admin@example.com' :
                                                                                'company@example.com'
                                                                    }
                                                                    className="pl-10 w-full px-3 py-6 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                                />
                                                            </div>
                                                            {forgotPasswordErrors.email && (
                                                                <p className="mt-1 text-xs text-red-600">{forgotPasswordErrors.email.message}</p>
                                                            )}
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                We'll send a 6-digit OTP to this email
                                                            </p>
                                                        </motion.div>

                                                        <div className="flex gap-3">
                                                            <motion.button
                                                                type="button"
                                                                onClick={() => setIsForgotPassword(false)}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                                                            >
                                                                Cancel
                                                            </motion.button>
                                                            <motion.button
                                                                type="submit"
                                                                disabled={resetLoading}
                                                                whileHover={{ scale: resetLoading ? 1 : 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className={`flex-1 py-2.5 bg-gradient-to-r ${roleOptions.find(r => r.value === selectedRole)?.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                                                            >
                                                                {resetLoading ? (
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        Sending...
                                                                    </div>
                                                                ) : (
                                                                    'Send OTP'
                                                                )}
                                                            </motion.button>
                                                        </div>
                                                    </form>

                                                    <div className="mt-6 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                                        <div className="flex items-start gap-2">
                                                            <FaExclamationTriangle className="text-amber-500 mt-0.5" size={14} />
                                                            <div>
                                                                <h4 className="font-semibold text-amber-800 mb-1 text-sm">Important</h4>
                                                                <p className="text-xs text-amber-700">
                                                                    If you don't receive an OTP within 5 minutes, you can request a new one.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    ) : isOTPVerification ? (
                                        <motion.div
                                            key="otp-verification"
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            variants={fadeInUp}
                                            className="space-y-6"
                                        >
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FaKey className="text-white text-xl" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                    Enter Verification Code
                                                </h3>
                                                <p className="text-slate-600 text-sm mb-4">
                                                    We sent a 6-digit code to <span className="font-semibold">{emailForReset}</span>
                                                </p>
                                            </div>

                                            {/* OTP Input */}
                                            <div className="space-y-4">
                                                <div className="flex justify-center gap-2">
                                                    {otp.map((digit, index) => (
                                                        <motion.input
                                                            key={index}
                                                            id={`otp-${index}`}
                                                            type="text"
                                                            maxLength="1"
                                                            value={digit}
                                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                                            className="w-12 h-12 text-center text-xl font-bold border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                                            whileFocus={{ scale: 1.1 }}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Timer */}
                                                <div className="text-center">
                                                    <div className="text-sm text-slate-600 mb-2">
                                                        Code expires in: <span className="font-bold text-blue-600">{formatTime(timer)}</span>
                                                    </div>
                                                    {canResend && (
                                                        <motion.button
                                                            type="button"
                                                            onClick={handleResendOtp}
                                                            disabled={resetLoading}
                                                            whileHover={{ scale: 1.05 }}
                                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
                                                        >
                                                            <FaSyncAlt className="text-xs" />
                                                            Resend OTP
                                                        </motion.button>
                                                    )}
                                                </div>

                                                {/* Loading State */}
                                                {otpLoading && (
                                                    <div className="text-center">
                                                        <div className="inline-flex items-center gap-2 text-blue-600">
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                            Verifying OTP...
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Manual Verification Button */}
                                            {otp.some(digit => digit === '') && (
                                                <motion.button
                                                    type="button"
                                                    onClick={() => handleOtpVerification(otp.join(''))}
                                                    disabled={otpLoading || otp.some(digit => digit === '')}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full py-3 bg-gradient-to-r ${roleOptions.find(r => r.value === selectedRole)?.color} text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    Verify OTP
                                                </motion.button>
                                            )}

                                            {/* Wrong Email? */}
                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsOTPVerification(false);
                                                        setIsForgotPassword(true);
                                                        setResetSent(false);
                                                    }}
                                                    className="text-slate-600 hover:text-slate-800 text-sm"
                                                >
                                                    Wrong email address?
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="reset-password-form"
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            variants={fadeInUp}
                                            className="space-y-6"
                                        >
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <HiLockClosed className="text-white text-xl" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                    Set New Password
                                                </h3>
                                                <p className="text-slate-600 text-sm mb-4">
                                                    Create a strong password for your account
                                                </p>
                                            </div>

                                            <form onSubmit={handleResetPasswordSubmit(handleResetPasswordSubmitForm)} className="space-y-5">
                                                {/* New Password */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        New Password *
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FaLock className="text-slate-400" size={14} />
                                                        </div>
                                                        <input
                                                            {...resetPasswordRegister('newPassword', {
                                                                required: 'Password is required',
                                                                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                                                pattern: {
                                                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                                                    message: 'Must include uppercase, lowercase, number & special character'
                                                                }
                                                            })}
                                                            type="password"
                                                            placeholder="Enter new password"
                                                            className="pl-9 w-full px-3 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                        />
                                                    </div>
                                                    {resetPasswordErrors.newPassword && (
                                                        <p className="mt-1 text-xs text-red-600">{resetPasswordErrors.newPassword.message}</p>
                                                    )}
                                                </div>

                                                {/* Confirm Password */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Confirm Password *
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FaLock className="text-slate-400" size={14} />
                                                        </div>
                                                        <input
                                                            {...resetPasswordRegister('confirmPassword', {
                                                                required: 'Please confirm your password',
                                                                validate: value => value === newPassword || 'Passwords do not match'
                                                            })}
                                                            type="password"
                                                            placeholder="Confirm new password"
                                                            className="pl-9 w-full px-3 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                        />
                                                    </div>
                                                    {resetPasswordErrors.confirmPassword && (
                                                        <p className="mt-1 text-xs text-red-600">{resetPasswordErrors.confirmPassword.message}</p>
                                                    )}
                                                </div>

                                                {/* Password Strength */}
                                                {newPassword && (
                                                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-blue-900">Password Strength</span>
                                                            <div className="flex items-center gap-2">
                                                                {/[A-Z]/.test(newPassword) && <FaCheck className="text-green-500 text-xs" />}
                                                                {/[a-z]/.test(newPassword) && <FaCheck className="text-green-500 text-xs" />}
                                                                {/\d/.test(newPassword) && <FaCheck className="text-green-500 text-xs" />}
                                                                {/[@$!%*?&]/.test(newPassword) && <FaCheck className="text-green-500 text-xs" />}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-blue-700 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                {/[A-Z]/.test(newPassword) ? (
                                                                    <FaCheck className="text-green-500" size={10} />
                                                                ) : (
                                                                    <FaTimes className="text-red-400" size={10} />
                                                                )}
                                                                <span>At least one uppercase letter</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {/[a-z]/.test(newPassword) ? (
                                                                    <FaCheck className="text-green-500" size={10} />
                                                                ) : (
                                                                    <FaTimes className="text-red-400" size={10} />
                                                                )}
                                                                <span>At least one lowercase letter</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {/\d/.test(newPassword) ? (
                                                                    <FaCheck className="text-green-500" size={10} />
                                                                ) : (
                                                                    <FaTimes className="text-red-400" size={10} />
                                                                )}
                                                                <span>At least one number</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {/[@$!%*?&]/.test(newPassword) ? (
                                                                    <FaCheck className="text-green-500" size={10} />
                                                                ) : (
                                                                    <FaTimes className="text-red-400" size={10} />
                                                                )}
                                                                <span>At least one special character</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {newPassword.length >= 8 ? (
                                                                    <FaCheck className="text-green-500" size={10} />
                                                                ) : (
                                                                    <FaTimes className="text-red-400" size={10} />
                                                                )}
                                                                <span>Minimum 8 characters</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Submit Button */}
                                                <motion.button
                                                    type="submit"
                                                    disabled={resetPasswordLoading}
                                                    whileHover={{ scale: resetPasswordLoading ? 1 : 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full py-3 bg-gradient-to-r ${roleOptions.find(r => r.value === selectedRole)?.color} text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {resetPasswordLoading ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            Resetting Password...
                                                        </div>
                                                    ) : (
                                                        'Reset Password'
                                                    )}
                                                </motion.button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right Side - Information (Same as before, just showing the full content) */}
                            {/* ... Keep the right side content from the previous code ... */}
                            {/* Right Side - Information */}
                            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white hidden lg:flex flex-col justify-between relative overflow-hidden overflow-y-auto">
                                {/* Background Pattern */}
                                <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
                                    <div className="absolute top-5 right-5 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-5 left-5 w-48 h-48 bg-purple-300 rounded-full blur-3xl"></div>
                                </div>

                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold mb-6">
                                        Your AI Career Journey
                                    </h2>

                                    {/* Features based on selected role */}
                                    <div className="space-y-4 mb-8">
                                        {selectedRole === 'USER' && (
                                            <>
                                                {[
                                                    {
                                                        icon: <FaGraduationCap />,
                                                        title: "Smart Internship Matches",
                                                        description: "AI-powered matching with ideal companies"
                                                    },
                                                    {
                                                        icon: <FaChartLine />,
                                                        title: "Career Growth Tracking",
                                                        description: "Monitor your progress and skills development"
                                                    },
                                                    {
                                                        icon: <FaRocket />,
                                                        title: "Fast Placement",
                                                        description: "Get hired 3x faster with our network"
                                                    },
                                                    {
                                                        icon: <FaTrophy />,
                                                        title: "Achievement Badges",
                                                        description: "Earn recognition for your skills"
                                                    }
                                                ].map((feature, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="flex items-start gap-3"
                                                    >
                                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                                                            {feature.icon}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                                                            <p className="text-blue-100 text-xs">{feature.description}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </>
                                        )}

                                        {selectedRole === 'ADMIN' && (
                                            <>
                                                {[
                                                    {
                                                        icon: <FaUserCog />,
                                                        title: "User Management",
                                                        description: "Manage all users and permissions"
                                                    },
                                                    {
                                                        icon: <FaChartLine />,
                                                        title: "Platform Analytics",
                                                        description: "Real-time insights and reports"
                                                    },
                                                    {
                                                        icon: <FaShieldAlt />,
                                                        title: "Security Control",
                                                        description: "Monitor and secure the platform"
                                                    },
                                                    {
                                                        icon: <FaNetworkWired />,
                                                        title: "System Management",
                                                        description: "Configure platform settings"
                                                    }
                                                ].map((feature, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="flex items-start gap-3"
                                                    >
                                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                                                            {feature.icon}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                                                            <p className="text-blue-100 text-xs">{feature.description}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </>
                                        )}

                                        {selectedRole === 'COMPANY' && (
                                            <>
                                                {[
                                                    {
                                                        icon: <FaBriefcase />,
                                                        title: "Talent Discovery",
                                                        description: "Find pre-vetted interns and graduates"
                                                    },
                                                    {
                                                        icon: <FaUsers />,
                                                        title: "Team Management",
                                                        description: "Manage your internship programs"
                                                    },
                                                    {
                                                        icon: <FaChartLine />,
                                                        title: "Performance Analytics",
                                                        description: "Track intern progress and ROI"
                                                    },
                                                    {
                                                        icon: <FaRobot />,
                                                        title: "AI Screening",
                                                        description: "Automated candidate matching"
                                                    }
                                                ].map((feature, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="flex items-start gap-3"
                                                    >
                                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                                                            {feature.icon}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                                                            <p className="text-blue-100 text-xs">{feature.description}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <div className="text-lg font-bold mb-1">10K+</div>
                                            <div className="text-xs text-blue-200">Active Users</div>
                                        </div>
                                        <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <div className="text-lg font-bold mb-1">98%</div>
                                            <div className="text-xs text-blue-200">Success Rate</div>
                                        </div>
                                        <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <div className="text-lg font-bold mb-1">500+</div>
                                            <div className="text-xs text-blue-200">Companies</div>
                                        </div>
                                        <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <div className="text-lg font-bold mb-1">24/7</div>
                                            <div className="text-xs text-blue-200">AI Support</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <HiChip className="text-xl" />
                                            <div>
                                                <h3 className="font-bold text-sm">Neural AI Matching</h3>
                                                <p className="text-blue-100 text-xs">Powered by deep learning algorithms</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <FaCheckCircle className="text-green-300" size={12} />
                                            <span>Intelligent career matching</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs mt-1">
                                            <FaCheckCircle className="text-green-300" size={12} />
                                            <span>Real-time skill analysis</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
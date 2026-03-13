// src/components/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaMapMarkerAlt,
    FaPhone,
    FaCamera,
    FaUpload,
    FaCheck,
    FaEye,
    FaEyeSlash,
    FaArrowLeft,
    FaChartLine,
    FaNetworkWired,
    FaShieldAlt,
    FaRobot,
    FaBolt,
    FaStar,
    FaTimes,
    FaGoogle,
    FaGithub,
    FaLinkedin
} from 'react-icons/fa';
import { HiUserGroup, HiSparkles } from 'react-icons/hi';
import { TbTargetArrow } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosConfig';

const RegisterPage = () => {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        mobileNumber: '',
        image: null,
        acceptTerms: false,
        newsletter: true,
        role:"USER"
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [formErrors, setFormErrors] = useState({});
    const [step, setStep] = useState(1);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    const steps = [
        { id: 1, title: 'Personal Info', icon: <FaUser /> },
        { id: 2, title: 'Security', icon: <FaShieldAlt /> },
        { id: 3, title: 'Profile', icon: <FaCamera /> }
    ];

    // Password requirements with descriptions
    const passwordRequirements = [
        { key: 'length', label: '8+ characters', check: (pwd) => pwd.length >= 8 },
        { key: 'uppercase', label: 'Uppercase letter', check: (pwd) => /[A-Z]/.test(pwd) },
        { key: 'lowercase', label: 'Lowercase letter', check: (pwd) => /[a-z]/.test(pwd) },
        { key: 'number', label: 'Number', check: (pwd) => /[0-9]/.test(pwd) },
        { key: 'special', label: 'Special character', check: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
    ];

    const benefits = [
        { icon: <FaChartLine />, title: 'Smart Analytics', desc: 'Track your growth with insights' },
        { icon: <FaNetworkWired />, title: 'Global Network', desc: 'Connect with top companies' },
        { icon: <FaBolt />, title: 'Fast Response', desc: 'Get hired 3x faster' }
    ];

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        const length = password.length;

        if (length >= 8) strength += 20;
        if (length >= 12) strength += 10;

        if (/[A-Z]/.test(password)) strength += 15;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;

        // Bonus for variety
        const uniqueChars = new Set(password).size;
        if (uniqueChars / length > 0.7) strength += 10;

        return Math.min(strength, 100);
    };

    useEffect(() => {
        const strength = calculatePasswordStrength(formData.password);
        setPasswordStrength(strength);
    }, [formData.password]);

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                type === 'file' ? files[0] : value
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name === 'image' && files[0]) {
            const reader = new FileReader();
            reader.onloadstart = () => setUploadProgress(10);
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    setUploadProgress((e.loaded / e.total) * 100);
                }
            };
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setUploadProgress(100);
                setTimeout(() => setUploadProgress(0), 1000);
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const validateStep = (stepNumber) => {
        const errors = {};

        if (stepNumber === 1) {
            if (!formData.name.trim()) errors.name = 'Name is required';
            if (!formData.email.trim()) errors.email = 'Email is required';
            else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
            if (!formData.mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required';
            else if (!/^\d{10}$/.test(formData.mobileNumber)) errors.mobileNumber = 'Mobile number must be 10 digits';
        }

        if (stepNumber === 2) {
            if (!formData.password) errors.password = 'Password is required';
            else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
            else if (passwordStrength < 60) errors.password = 'Password is too weak';

            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        if (stepNumber === 3) {
            if (!formData.address.trim()) errors.address = 'Address is required';
            if (!formData.acceptTerms) errors.acceptTerms = 'You must accept the terms and conditions';
        }

        return errors;
    };

    const handleNextStep = () => {
        const errors = validateStep(step);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setStep(prev => Math.min(prev + 1, steps.length));
        setFormErrors({});
    };

    const handlePrevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
        setFormErrors({});
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateStep(3);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();

            Object.keys(formData).forEach(key => {
                if (key !== 'image' || formData[key]) {
                    submitData.append(key, formData[key]);
                }
            });
            console.log(submitData);

            const response = await axiosInstance.post(
                '/auth/register',
                submitData,

            );

            console.log('Registration success:', response.data);
            setShowSuccess(true);

            // Auto redirect after success
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error) {
            console.error(
                'Registration error:',
                error.response?.data || error.message
            );

            alert(
                error.response?.data?.message ||
                'Registration failed. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };


    // Get strength color and label
    const getStrengthInfo = () => {
        if (passwordStrength >= 80) return { color: 'bg-green-500', label: 'Strong', textColor: 'text-green-600' };
        if (passwordStrength >= 60) return { color: 'bg-yellow-500', label: 'Good', textColor: 'text-yellow-600' };
        if (passwordStrength >= 40) return { color: 'bg-orange-500', label: 'Fair', textColor: 'text-orange-600' };
        return { color: 'bg-red-500', label: 'Weak', textColor: 'text-red-600' };
    };

    const strengthInfo = getStrengthInfo();

    // Social login options
    const socialOptions = [
        { icon: <FaGoogle />, label: 'Google', color: 'bg-red-500 hover:bg-red-600' },
        { icon: <FaGithub />, label: 'GitHub', color: 'bg-gray-800 hover:bg-gray-900' },
        { icon: <FaLinkedin />, label: 'LinkedIn', color: 'bg-blue-600 hover:bg-blue-700' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100  flex items-center justify-center p-4 relative overflow-hidden">


            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(-1)}
                className="fixed top-6 left-6 flex items-center gap-2 px-4 py-3 bg-black/10 backdrop-blur-lg rounded-xl text-blue-600 hover:bg-black/20 transition-all z-50 border border-white/20"
            >
                <FaArrowLeft />
                <span className="font-medium">Back</span>
            </motion.button>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl relative z-10"
            >
                {/* Success Modal */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ y: 50 }}
                                animate={{ y: 0 }}
                                className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 max-w-md text-center text-white shadow-2xl"
                            >
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaCheck className="text-3xl" />
                                </div>
                                <h3 className="text-2xl font-black mb-3">Registration Successful!</h3>
                                <p className="mb-6 opacity-90">Welcome to InternXpert, {formData.name}!</p>
                                <div className="animate-pulse text-sm">
                                    Redirecting to dashboard...
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                        {/* Left Side - Info & Benefits */}
                        <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
                            </div>

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                            <HiSparkles className="text-xl" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-black">InternXpert</h1>
                                            <p className="text-white/80 text-sm">AI-Powered Career Platform</p>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black mb-4">Start Your Journey</h2>
                                    <p className="text-white/90">Join thousands who found their dream careers through intelligent matching</p>
                                </div>

                                {/* Benefits List */}
                                <div className="space-y-6 mb-8 flex-1">
                                    {benefits.map((benefit, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-center gap-4"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                                                <div className="text-xl">{benefit.icon}</div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{benefit.title}</h3>
                                                <p className="text-white/80 text-sm">{benefit.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Stats */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-black">10K+</div>
                                            <div className="text-xs text-white/70">Successful Matches</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black">98%</div>
                                            <div className="text-xs text-white/70">Satisfaction Rate</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black">500+</div>
                                            <div className="text-xs text-white/70">Partner Companies</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="lg:col-span-2 p-8 md:p-12">
                            <div className="mb-8">
                                {/* Progress Steps */}
                                <div className="flex items-center justify-between mb-8">
                                    {steps.map((s, idx) => (
                                        <div key={s.id} className="flex items-center">
                                            <div className={`relative ${step >= s.id ? 'text-white' : 'text-gray-400'}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`}>
                                                    {step > s.id ? <FaCheck /> : s.icon}
                                                </div>
                                                {idx < steps.length - 1 && (
                                                    <div className={`absolute top-1/2 left-full w-16 h-0.5 ${step > s.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`} />
                                                )}
                                            </div>
                                            <span className={`ml-2 text-sm font-medium hidden sm:block ${step >= s.id ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {s.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <h2 className="text-3xl font-black text-gray-800 mb-2">
                                    Create Your Account
                                </h2>
                                <p className="text-gray-600">Step {step} of {steps.length}</p>
                            </div>

                            {/* Step Content */}
                            <form onSubmit={handleSubmit}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Name Field */}
                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                        <FaUser className="text-blue-500" />
                                                        Full Name
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 pl-12 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.name ? 'border-red-500' : 'border-gray-200'}`}
                                                            placeholder="Full Name"
                                                        />
                                                        <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    </div>
                                                    {formErrors.name && (
                                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <FaTimes className="text-xs" /> {formErrors.name}
                                                        </motion.p>
                                                    )}
                                                </div>

                                                {/* Email Field */}
                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                        <FaEnvelope className="text-blue-500" />
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 pl-12 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.email ? 'border-red-500' : 'border-gray-200'}`}
                                                            placeholder="Enter Email address"
                                                        />
                                                        <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    </div>
                                                    {formErrors.email && (
                                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <FaTimes className="text-xs" /> {formErrors.email}
                                                        </motion.p>
                                                    )}
                                                </div>

                                                {/* Mobile Field */}
                                                <div className="md:col-span-2">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                        <FaPhone className="text-blue-500" />
                                                        Mobile Number
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="tel"
                                                            name="mobileNumber"
                                                            value={formData.mobileNumber}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-4 py-3 pl-12 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.mobileNumber ? 'border-red-500' : 'border-gray-200'}`}
                                                            placeholder="Enter Phone number"
                                                        />
                                                        <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    </div>
                                                    {formErrors.mobileNumber && (
                                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                            <FaTimes className="text-xs" /> {formErrors.mobileNumber}
                                                        </motion.p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            {/* Password Field */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                    <FaLock className="text-blue-500" />
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.password ? 'border-red-500' : 'border-gray-200'}`}
                                                        placeholder="Enter a strong password"
                                                    />
                                                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>

                                                {/* Password Strength */}
                                                <div className="mt-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-gray-700">Password Strength</span>
                                                        <span className={`text-sm font-bold ${strengthInfo.textColor}`}>
                                                            {strengthInfo.label} • {passwordStrength}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                        <motion.div
                                                            className={`h-2 rounded-full ${strengthInfo.color}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${passwordStrength}%` }}
                                                            transition={{ duration: 0.5 }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Password Requirements */}
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                                                    {passwordRequirements.map((req, idx) => {
                                                        const isValid = req.check(formData.password);
                                                        return (
                                                            <motion.div
                                                                key={req.key}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: idx * 0.05 }}
                                                                className={`flex items-center gap-2 p-2 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isValid ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                                    {isValid && <FaCheck className="text-white text-xs" />}
                                                                </div>
                                                                <span className={`text-xs font-medium ${isValid ? 'text-green-700' : 'text-gray-600'}`}>
                                                                    {req.label}
                                                                </span>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>

                                                {formErrors.password && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                        <FaTimes className="text-xs" /> {formErrors.password}
                                                    </motion.p>
                                                )}
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                    <FaLock className="text-blue-500" />
                                                    Confirm Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
                                                        placeholder="Confirm your password"
                                                    />
                                                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                                {formErrors.confirmPassword && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                        <FaTimes className="text-xs" /> {formErrors.confirmPassword}
                                                    </motion.p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            {/* Address Field */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                    <FaMapMarkerAlt className="text-blue-500" />
                                                    Address
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-4 py-3 pl-12 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.address ? 'border-red-500' : 'border-gray-200'}`}
                                                        placeholder="Enter Address"
                                                    />
                                                    <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                </div>
                                                {formErrors.address && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                        <FaTimes className="text-xs" /> {formErrors.address}
                                                    </motion.p>
                                                )}
                                            </div>

                                            {/* Profile Image */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                    <FaCamera className="text-blue-500" />
                                                    Profile Image
                                                </label>
                                                <div className="flex flex-col md:flex-row items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-blue-100 to-purple-100">
                                                            {imagePreview ? (
                                                                <img
                                                                    src={imagePreview}
                                                                    alt="Profile preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center">
                                                                    <FaUser className="text-gray-400 text-4xl mb-2" />
                                                                    <span className="text-xs text-gray-500">No image</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {uploadProgress > 0 && uploadProgress < 100 && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <div className="text-white text-sm font-medium">
                                                                    {Math.round(uploadProgress)}%
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block w-full px-6 py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors text-center">
                                                            <FaUpload className="text-gray-400 text-2xl mb-2 mx-auto" />
                                                            <span className="text-sm font-medium text-gray-600 block">
                                                                {formData.image ? formData.image.name : 'Upload Profile Picture'}
                                                            </span>
                                                            <span className="text-xs text-gray-500 mt-1 block">
                                                                PNG, JPG up to 5MB
                                                            </span>
                                                            <input
                                                                type="file"
                                                                name="image"
                                                                accept="image/*"
                                                                onChange={handleInputChange}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Terms and Newsletter */}
                                            <div className="space-y-4">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <div className="relative mt-1">
                                                        <input
                                                            type="checkbox"
                                                            name="acceptTerms"
                                                            checked={formData.acceptTerms}
                                                            onChange={handleInputChange}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center ${formData.acceptTerms ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'} transition-colors`}>
                                                            {formData.acceptTerms && <FaCheck className="text-white text-xs" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-sm text-gray-700">
                                                            I agree to the{' '}
                                                            <a href="#" className="text-blue-600 hover:underline font-medium">
                                                                Terms and Conditions
                                                            </a>
                                                            {' '}and{' '}
                                                            <a href="#" className="text-blue-600 hover:underline font-medium">
                                                                Privacy Policy
                                                            </a>
                                                        </span>
                                                        {formErrors.acceptTerms && (
                                                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                                <FaTimes className="text-xs" /> {formErrors.acceptTerms}
                                                            </motion.p>
                                                        )}
                                                    </div>
                                                </label>

                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <div className="relative mt-1">
                                                        <input
                                                            type="checkbox"
                                                            name="newsletter"
                                                            checked={formData.newsletter}
                                                            onChange={handleInputChange}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center ${formData.newsletter ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'} transition-colors`}>
                                                            {formData.newsletter && <FaCheck className="text-white text-xs" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-sm text-gray-700">
                                                            Subscribe to newsletter for career tips and opportunities
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Navigation Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={handlePrevStep}
                                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all flex-1"
                                        >
                                            Back
                                        </button>
                                    )}

                                    {step < steps.length ? (
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex-1"
                                        >
                                            Continue to {steps[step].title}
                                        </button>
                                    ) : (
                                        <motion.button
                                            type="submit"
                                            disabled={isSubmitting}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex-1 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Creating Account...
                                                </span>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </motion.button>
                                    )}
                                </div>
                            </form>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            {/* Social Login */}
                            <div className="grid grid-cols-3 gap-3">
                                {socialOptions.map((social, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ y: 0 }}
                                        type="button"
                                        className={`${social.color} text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all`}
                                    >
                                        {social.icon}
                                        <span className="hidden sm:inline">{social.label}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Login Link */}
                            <p className="text-center text-gray-600 mt-8">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                                >
                                    Sign In
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaBuilding,
    FaEdit,
    FaSave,
    FaTimes,
    FaEnvelope,
    FaPhone,
    FaGlobe,
    FaMapMarkerAlt,
    FaUsers,
    FaCalendarAlt,
    FaIndustry,
    FaBriefcase,
    FaCheckCircle,
    FaExclamationTriangle,
    FaUpload,
    FaTrash,
    FaSpinner,
    FaSync,
    FaArrowLeft,
    FaFileContract,
    FaUserTie,
    FaShieldAlt,
    FaStar,
    FaLink,
    FaGraduationCap, FaPlus
} from 'react-icons/fa';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';

const CompanyProfile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    // Company data
    const [company, setCompany] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        industry: '',
        companySize: '',
        website: '',
        foundedYear: '',
        headquarters: '',
        description: '',
        mobileNumber: '',
        address: '',
        companyEmail: '',
        hrContactName: '',
        hrContactNumber: '',
        logo: null,
        logoPreview: ''
    });

    // Stats
    const [stats, setStats] = useState({
        totalInternships: 0,
        activeInternships: 0,
        totalApplications: 0,
        hiredStudents: 0,
        rating: 0
    });

    // Fetch company data
    const fetchCompanyData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axiosInstance.get('/company/me');
            console.log('Company Profile API Response:', response.data);

            const companyData = response.data;
            setCompany(companyData);

            // Set form data
            setFormData({
                companyName: companyData.companyName || companyData.name || '',
                email: companyData.email || '',
                industry: companyData.industry || '',
                companySize: companyData.companySize || '',
                website: companyData.website || '',
                foundedYear: companyData.foundedYear || '',
                headquarters: companyData.headquarters || '',
                description: companyData.description || '',
                mobileNumber: companyData.mobileNumber || '',
                address: companyData.address || '',
                companyEmail: companyData.companyEmail || companyData.email || '',
                hrContactName: companyData.hrContactName || '',
                hrContactNumber: companyData.hrContactNumber || '',
                logo: null,
                logoPreview: companyData.logo || ''
            });

            // Fetch stats
            await fetchCompanyStats();

        } catch (err) {
            console.error('Error fetching company data:', err);
            setError(err.response?.data?.message || 'Failed to load company profile');
            toast.error('Failed to load company profile');
        } finally {
            setLoading(false);
        }
    };

    // Fetch company stats
    const fetchCompanyStats = async () => {
        try {
            const [internshipsRes, statsRes] = await Promise.all([
                axiosInstance.get('/internships/company/my-internships?limit=100'),
                axiosInstance.get('/internships/stats/company')
            ]);

            const internships = internshipsRes.data?.internships || [];
            const statsData = statsRes.data?.stats || {};

            setStats({
                totalInternships: internships.length,
                activeInternships: internships.filter(i => i.status === 'Published').length,
                totalApplications: statsData.totalApplications || 0,
                hiredStudents: statsData.filledPositions || 0,
                rating: company?.rating || 4.5
            });

        } catch (err) {
            console.error('Error fetching company stats:', err);
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            setFormData(prev => ({
                ...prev,
                logo: file,
                logoPreview: URL.createObjectURL(file)
            }));
        }
    };

    const removeLogo = () => {
        setFormData(prev => ({
            ...prev,
            logo: null,
            logoPreview: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const formDataToSend = new FormData();

            // List of all text fields to append (exclude logo and logoPreview)
            const textFields = [
                'companyName', 'email', 'industry', 'companySize',
                'website', 'foundedYear', 'headquarters', 'description',
                'mobileNumber', 'address', 'companyEmail',
                'hrContactName', 'hrContactNumber'
            ];

            // Append only text fields
            textFields.forEach(field => {
                if (formData[field] !== null && formData[field] !== '') {
                    formDataToSend.append(field, formData[field]);
                }
            });

            // Append logo ONLY if it's a File (not the preview URL string)
            if (formData.logo && formData.logo instanceof File) {
                formDataToSend.append('logo', formData.logo);
            }

            // Debug: Log what's being sent
            console.log('FormData being sent:');
            for (let pair of formDataToSend.entries()) {
                console.log(pair[0] + ': ', pair[1]);
            }

            const response = await axiosInstance.patch(
                '/company/update-profile',
                formDataToSend,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setCompany(response.data.company || response.data);
            setIsEditing(false);
            toast.success('Profile updated successfully!');
            fetchCompanyData();

        } catch (err) {
            console.error('Error updating company profile:', err);
            console.error('Error response:', err.response?.data);
            const errorMsg = err.response?.data?.message || 'Failed to update profile';
            toast.error(errorMsg);

            if (err.response?.data?.errors) {
                err.response.data.errors.forEach(error => toast.error(error.msg || error.message));
            }
        } finally {
            setSaving(false);
        }
    };


    const handleCancelEdit = () => {
        setIsEditing(false);
        if (company) {
            setFormData({
                companyName: company.companyName || company.name || '',
                email: company.email || '',
                industry: company.industry || '',
                companySize: company.companySize || '',
                website: company.website || '',
                foundedYear: company.foundedYear || '',
                headquarters: company.headquarters || '',
                description: company.description || '',
                mobileNumber: company.mobileNumber || '',
                address: company.address || '',
                companyEmail: company.companyEmail || company.email || '',
                hrContactName: company.hrContactName || '',
                hrContactNumber: company.hrContactNumber || '',
                logo: null,
                logoPreview: company.logo || ''
            });
        }
    };

    const handleRefresh = () => {
        fetchCompanyData();
        toast.success('Profile data refreshed');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getVerificationBadge = () => {
        if (company?.verified) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <FaCheckCircle /> Verified Company
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <FaExclamationTriangle /> Pending Verification
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading company profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !company) {
        return (
            <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
                        <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Profile</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                        >
                            <FaSync /> Try Again
                        </button>
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
                            Company <span className="bg-gradient-to-r from-purple-700 to-purple-600 bg-clip-text text-transparent">Profile</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Manage your company information and settings</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            <FaSync className={`${loading ? 'animate-spin' : ''} text-gray-600`} />
                        </button>

                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition flex items-center gap-2"
                            >
                                <FaEdit /> Edit Profile
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
                                >
                                    <FaTimes /> Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Status Banner */}
                <div className="mb-8">
                    <div className={`p-6 rounded-2xl ${company?.verified ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'}`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${company?.verified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                    {company?.verified ? (
                                        <FaCheckCircle className="text-green-600 text-2xl" />
                                    ) : (
                                        <FaExclamationTriangle className="text-yellow-600 text-2xl" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {company?.verified ? 'Your Company is Verified' : 'Verification Pending'}
                                    </h3>
                                    <p className="text-gray-600 mt-1">
                                        {company?.verified
                                            ? 'Your company has been verified and is eligible for all platform features.'
                                            : 'Complete your profile and await admin verification to access all features.'
                                        }
                                    </p>
                                    {company?.verified && company?.verificationStatus && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Verification status: <span className="font-medium">{company.verificationStatus}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!company?.verified && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-lg hover:from-yellow-700 hover:to-yellow-600 transition"
                                >
                                    Complete Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Left Column - Company Info & Logo */}
                    <div className="lg:col-span-2">
                        {/* Company Information Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
                                {getVerificationBadge()}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Logo Section */}
                                <div className="md:col-span-2">
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                        <div className="relative">
                                            <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                                                {formData.logoPreview ? (
                                                    <img
                                                        src={formData.logoPreview}
                                                        alt={formData.companyName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FaBuilding className="text-blue-600 text-4xl" />
                                                    </div>
                                                )}
                                            </div>
                                            {isEditing && (
                                                <div className="absolute -bottom-2 -right-2 flex gap-2">
                                                    <label className="cursor-pointer p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                                                        <FaUpload className="text-sm" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    {formData.logoPreview && (
                                                        <button
                                                            onClick={removeLogo}
                                                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                                                        >
                                                            <FaTrash className="text-sm" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Company Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="companyName"
                                                            value={formData.companyName}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Industry *
                                                        </label>
                                                        <select
                                                            name="industry"
                                                            value={formData.industry}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        >
                                                            <option value="">Select Industry</option>
                                                            <option value="Technology">Technology</option>
                                                            <option value="Finance">Finance</option>
                                                            <option value="Healthcare">Healthcare</option>
                                                            <option value="Education">Education</option>
                                                            <option value="Retail">Retail</option>
                                                            <option value="Manufacturing">Manufacturing</option>
                                                            <option value="Consulting">Consulting</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900">{company.companyName}</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <FaIndustry className="text-gray-400" />
                                                        <span className="text-gray-600">{company.industry}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <FaUsers className="text-gray-400" />
                                                        <span className="text-gray-600">{company.companySize}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaEnvelope className="text-blue-600" />
                                        Contact Information
                                    </h3>
                                    <div className="space-y-4">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Email *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Company Email *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="companyEmail"
                                                        value={formData.companyEmail}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Mobile Number *
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="mobileNumber"
                                                        value={formData.mobileNumber}
                                                        onChange={handleInputChange}
                                                        required
                                                        pattern="[0-9]{10}"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <FaEnvelope className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Email</p>
                                                        <p className="font-medium text-gray-900">{company.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <FaEnvelope className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Company Email</p>
                                                        <p className="font-medium text-gray-900">{company.companyEmail || company.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <FaPhone className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Mobile Number</p>
                                                        <p className="font-medium text-gray-900">{company.mobileNumber}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* HR Contact */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FaUserTie className="text-purple-600" />
                                        HR Contact
                                    </h3>
                                    <div className="space-y-4">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        HR Contact Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="hrContactName"
                                                        value={formData.hrContactName}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        HR Contact Number *
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="hrContactNumber"
                                                        value={formData.hrContactNumber}
                                                        onChange={handleInputChange}
                                                        required
                                                        pattern="[0-9]{10}"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <FaUserTie className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">HR Contact</p>
                                                        <p className="font-medium text-gray-900">{company.hrContactName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <FaPhone className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">HR Contact Number</p>
                                                        <p className="font-medium text-gray-900">{company.hrContactNumber}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Company Details */}
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Website
                                                    </label>
                                                    <input
                                                        type="url"
                                                        name="website"
                                                        value={formData.website}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Founded Year
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="foundedYear"
                                                        value={formData.foundedYear}
                                                        onChange={handleInputChange}
                                                        min="1900"
                                                        max={new Date().getFullYear()}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Headquarters
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="headquarters"
                                                        value={formData.headquarters}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Address
                                                    </label>
                                                    <textarea
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        rows="3"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Description *
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        required
                                                        rows="4"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Describe your company, mission, and values..."
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <FaGlobe className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Website</p>
                                                        <a
                                                            href={company.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-blue-600 hover:text-blue-700"
                                                        >
                                                            {company.website || 'Not specified'}
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Founded Year</p>
                                                        <p className="font-medium text-gray-900">{company.foundedYear || 'Not specified'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <FaMapMarkerAlt className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Headquarters</p>
                                                        <p className="font-medium text-gray-900">{company.headquarters || 'Not specified'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <FaMapMarkerAlt className="text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Address</p>
                                                        <p className="font-medium text-gray-900">{company.address || 'Not specified'}</p>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                        <p className="text-sm text-gray-600 mb-2">Company Description</p>
                                                        <p className="text-gray-900">
                                                            {company.description || 'No description provided.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Account Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <FaShieldAlt className="text-blue-600" />
                                        Account Status
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-blue-700">Account Created</p>
                                            <p className="font-medium text-blue-900">{formatDate(company.accountCreatedAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700">Last Login</p>
                                            <p className="font-medium text-blue-900">{formatDate(company.lastLogin) || 'Never'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700">Status Updated</p>
                                            <p className="font-medium text-blue-900">{formatDate(company.statusUpdatedAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 rounded-xl">
                                    <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                                        <FaFileContract className="text-green-600" />
                                        Verification Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-green-700">Verification Status</p>
                                            <p className="font-medium text-green-900">{company.verificationStatus || 'Pending'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-700">Verified</p>
                                            <p className="font-medium text-green-900">{company.verified ? 'Yes' : 'No'}</p>
                                        </div>
                                        {company.verificationNotes && (
                                            <div>
                                                <p className="text-sm text-green-700">Verification Notes</p>
                                                <p className="text-green-900 text-sm">{company.verificationNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Stats & Actions */}
                    <div>
                        {/* Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Company Stats</h2>

                            <div className="space-y-6">
                                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalInternships}</div>
                                    <div className="text-sm text-blue-700 font-medium">Total Internships</div>
                                    <div className="text-xs text-blue-600 mt-1">{stats.activeInternships} active</div>
                                </div>

                                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <div className="text-4xl font-bold text-green-600 mb-2">{stats.totalApplications}</div>
                                    <div className="text-sm text-green-700 font-medium">Total Applications</div>
                                    <div className="text-xs text-green-600 mt-1">From students</div>
                                </div>

                                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                    <div className="text-4xl font-bold text-purple-600 mb-2">{stats.hiredStudents}</div>
                                    <div className="text-sm text-purple-700 font-medium">Hired Students</div>
                                    <div className="text-xs text-purple-600 mt-1">Successful placements</div>
                                </div>

                                <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                    <div className="flex items-center justify-center gap-2">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={`text-xl ${i < Math.floor(stats.rating) ? 'text-amber-500' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-2xl font-bold text-amber-600 mt-2">{stats.rating.toFixed(1)}</div>
                                    <div className="text-sm text-amber-700 font-medium">Company Rating</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

                            <div className="space-y-3">
                                <button
                                    onClick={() => window.location.href = '/company/internships/add'}
                                    className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FaPlus className="text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-blue-900">Post New Internship</p>
                                        <p className="text-xs text-blue-700">Create internship opportunity</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => window.location.href = '/company/applications'}
                                    className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FaBriefcase className="text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-green-900">View Applications</p>
                                        <p className="text-xs text-green-700">Manage student applications</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => window.location.href = '/company/interviews'}
                                    className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <FaCalendarAlt className="text-purple-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-purple-900">Schedule Interviews</p>
                                        <p className="text-xs text-purple-700">Arrange candidate interviews</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => window.location.href = '/company/settings'}
                                    className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 transition flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <FaShieldAlt className="text-gray-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">Security Settings</p>
                                        <p className="text-xs text-gray-700">Update password & security</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Last updated: {company?.updatedAt ? formatDate(company.updatedAt) : 'N/A'} |
                        Profile completeness: <span className="font-medium text-green-600">
                            {company?.profileCompletion || 85}%
                        </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        Ensure your company information is always up-to-date for better engagement with students
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompanyProfile;
// src/components/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import {
    FaUser,
    FaEdit,
    FaSave,
    FaUpload,
    FaPlus,
    FaTrash,
    FaDownload,
    FaGraduationCap,
    FaBriefcase,
    FaTools,
    FaCalendarAlt,
    FaPhone,
    FaEnvelope,
    FaSchool,
    FaFileAlt,
    FaLink,
    FaCheckCircle
} from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';
import axiosInstance from '../AuthenticationPages/axiosConfig';
import Sidebar from '../Sidebar';
import toast from 'react-hot-toast';
import axios from 'axios';

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [blockchainSaving, setBlockchainSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [blockchainHash, setBlockchainHash] = useState('');

    // Profile data states
    const [profileData, setProfileData] = useState({
        _id: '',
        name: '',
        email: '',
        mobileNumber: '',
        address: '',
        image: '',
        resume: '',
        profileComplete: false,
        education: [],
        skills: [],
        experience: [],
        accountStatus: '',
        lastLogin: '',
        accountCreatedAt: '',
        createdAt: '',
        updatedAt: '',
        isAccepted: false
    });

    // Form states
    const [personalInfo, setPersonalInfo] = useState({
        name: '',
        mobileNumber: '',
        address: ''
    });

    const [educationForm, setEducationForm] = useState({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        grade: '',
        isCurrent: false
    });

    const [experienceForm, setExperienceForm] = useState({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
    });

    const [skillsInput, setSkillsInput] = useState('');
    const [newSkill, setNewSkill] = useState('');

    // Edit states
    const [editingEducationId, setEditingEducationId] = useState(null);
    const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);

    // Fetch profile data
    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/auth/me');
            const { user, role } = response.data;

            if (user) {
                // Fetch detailed profile
                const profileResponse = await axiosInstance.get(`/auth/profile/${user._id}`);
                const data = profileResponse.data;
                setProfileData(data);

                // Initialize form states
                setPersonalInfo({
                    name: data.name || '',
                    mobileNumber: data.mobileNumber || '',
                    address: data.address || ''
                });

                setSkillsInput(data.skills?.join(', ') || '');
                
                // Check if blockchain hash exists (you might need to fetch this from your API)
                if (data.blockchainHash) {
                    setBlockchainHash(data.blockchainHash);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    // Calculate profile completion percentage
    const calculateCompletion = () => {
        const fields = [
            profileData.name,
            profileData.email,
            profileData.mobileNumber,
            profileData.address,
            profileData.image,
            profileData.resume,
            profileData.education?.length > 0,
            profileData.skills?.length > 0
        ];

        const completed = fields.filter(Boolean).length;
        return Math.round((completed / fields.length) * 100);
    };

    // Handle image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploadingImage(true);
            const response = await axiosInstance.patch('/auth/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setProfileData(prev => ({ ...prev, image: response.data.user.image }));
            toast.success('Profile image updated successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle resume upload to blockchain API
    const handleResumeUpload = async (event) => {
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

        // Check if we have required personal info
        if (!personalInfo.name || !profileData.email) {
            toast.error('Please fill in your name and email before uploading resume');
            return;
        }

        const formData = new FormData();
        formData.append('name', personalInfo.name || profileData.name);
        formData.append('email', profileData.email);
        formData.append('number', personalInfo.mobileNumber || profileData.mobileNumber || '');
        formData.append('resume', file);

        try {
            setUploadingResume(true);
            
            // First, upload to blockchain API
            const blockchainResponse = await axios.post('http://127.0.0.1:8000/profile/store/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log('Blockchain response:', blockchainResponse.data);
            
            if (blockchainResponse.data.message && blockchainResponse.data.file_path) {
                // Store the blockchain hash
                setBlockchainHash(blockchainResponse.data.file_path);
                
                // Also upload to your local backend
                const localFormData = new FormData();
                localFormData.append('resume', file);
                
                try {
                    const localResponse = await axiosInstance.post('/auth/upload-resume', localFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    setProfileData(prev => ({
                        ...prev,
                        resume: localResponse.data.resumeUrl,
                        profileComplete: localResponse.data.profileComplete
                    }));
                    
                    toast.success('Resume uploaded to blockchain and local storage');
                } catch (localError) {
                    console.error('Local upload failed:', localError);
                    toast.success('Resume uploaded to blockchain (local upload failed)');
                }
            } else {
                toast.error('Failed to upload to blockchain');
            }
        } catch (error) {
            console.error('Error uploading resume to blockchain:', error);
            
            // Fallback: Try local upload only
            try {
                const localFormData = new FormData();
                localFormData.append('resume', file);
                
                const localResponse = await axiosInstance.post('/auth/upload-resume', localFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                setProfileData(prev => ({
                    ...prev,
                    resume: localResponse.data.resumeUrl,
                    profileComplete: localResponse.data.profileComplete
                }));
                
                toast.success('Resume uploaded locally (blockchain upload failed)');
            } catch (localError) {
                toast.error('Failed to upload resume');
            }
        } finally {
            setUploadingResume(false);
        }
    };

    // Update personal info and send to blockchain
    const handleUpdatePersonalInfo = async (sendToBlockchain = false) => {
        try {
            setSaving(true);
            
            // First update local backend
            const response = await axiosInstance.patch('/auth/update-profile', personalInfo);

            setProfileData(prev => ({
                ...prev,
                ...personalInfo,
                profileComplete: response.data.profileComplete
            }));
            
            // If resume exists and we need to update blockchain
            if (sendToBlockchain && profileData.resume) {
                setBlockchainSaving(true);
                try {
                    // We need to get the resume file to send to blockchain
                    // This is a simplified approach - you might need to adjust
                    const blockchainFormData = new FormData();
                    blockchainFormData.append('name', personalInfo.name);
                    blockchainFormData.append('email', profileData.email);
                    blockchainFormData.append('number', personalInfo.mobileNumber);
                    
                    // Note: We can't get the file from URL, so we'll only update if user uploads new resume
                    // or we have the file stored locally
                    
                    toast.success('Personal info updated locally. Upload resume separately for blockchain update.');
                    
                } catch (blockchainError) {
                    console.error('Blockchain update failed:', blockchainError);
                    toast.success('Personal info updated (blockchain update failed)');
                } finally {
                    setBlockchainSaving(false);
                }
            } else {
                toast.success('Personal information updated successfully');
            }
        } catch (error) {
            console.error('Error updating personal info:', error);
            toast.error('Failed to update personal information');
        } finally {
            setSaving(false);
        }
    };

    // Save all profile data to blockchain (including resume)
    const handleSaveToBlockchain = async () => {
        if (!profileData.resume) {
            toast.error('Please upload a resume first to save to blockchain');
            return;
        }

        try {
            setBlockchainSaving(true);
            
            // We need to get the resume file
            // This is challenging because we only have the URL
            // You might need to:
            // 1. Store the file when user uploads it
            // 2. Or fetch it from the URL (if CORS allows)
            
            toast.loading('Preparing for blockchain upload...');
            
            // For now, show message that resume needs to be re-uploaded
            toast.dismiss();
            toast.error('Please re-upload your resume to update blockchain with latest profile info');
            
            // Alternative: Show a modal to upload resume again
            document.getElementById('resume-upload-input')?.click();
            
        } catch (error) {
            console.error('Error saving to blockchain:', error);
            toast.error('Failed to save to blockchain');
        } finally {
            setBlockchainSaving(false);
        }
    };

    // Add/Update education
    const handleSaveEducation = async () => {
        try {
            const data = editingEducationId
                ? { ...educationForm, educationId: editingEducationId }
                : educationForm;

            const response = await axiosInstance.post('/auth/education', data);

            setProfileData(prev => ({ ...prev, education: response.data.education }));
            toast.success(editingEducationId ? 'Education updated successfully' : 'Education added successfully');

            // Reset form
            setEducationForm({
                institution: '',
                degree: '',
                fieldOfStudy: '',
                startDate: '',
                endDate: '',
                grade: '',
                isCurrent: false
            });
            setEditingEducationId(null);
        } catch (error) {
            console.error('Error saving education:', error);
            toast.error('Failed to save education');
        }
    };

    // Delete education
    const handleDeleteEducation = async (educationId) => {
        if (!window.confirm('Are you sure you want to delete this education entry?')) return;

        try {
            await axiosInstance.delete(`/auth/education/${educationId}`);
            const updatedEducation = profileData.education.filter(edu => edu._id !== educationId);
            setProfileData(prev => ({ ...prev, education: updatedEducation }));
            toast.success('Education deleted successfully');
        } catch (error) {
            console.error('Error deleting education:', error);
            toast.error('Failed to delete education');
        }
    };

    // Update skills
    const handleUpdateSkills = async () => {
        try {
            const skillsArray = skillsInput.split(',').map(skill => skill.trim()).filter(skill => skill);
            const response = await axiosInstance.post('/auth/skills', { skills: skillsArray, action: 'set' });

            setProfileData(prev => ({ ...prev, skills: response.data.skills }));
            toast.success('Skills updated successfully');
        } catch (error) {
            console.error('Error updating skills:', error);
            toast.error('Failed to update skills');
        }
    };

    // Add single skill
    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;

        try {
            const response = await axiosInstance.post('/auth/skills', {
                skills: [newSkill.trim()],
                action: 'add'
            });

            setProfileData(prev => ({ ...prev, skills: response.data.skills }));
            setNewSkill('');
            toast.success('Skill added successfully');
        } catch (error) {
            console.error('Error adding skill:', error);
            toast.error('Failed to add skill');
        }
    };

    // Remove skill
    const handleRemoveSkill = async (skillToRemove) => {
        try {
            const response = await axiosInstance.post('/auth/skills', {
                skills: [skillToRemove],
                action: 'remove'
            });

            setProfileData(prev => ({ ...prev, skills: response.data.skills }));
            toast.success('Skill removed successfully');
        } catch (error) {
            console.error('Error removing skill:', error);
            toast.error('Failed to remove skill');
        }
    };

    // Add/Update experience
    const handleSaveExperience = async () => {
        try {
            const formData = new FormData();
            let updatedExperience;
            
            if (editingExperienceIndex !== null) {
                // Update existing experience
                updatedExperience = [...profileData.experience];
                updatedExperience[editingExperienceIndex] = experienceForm;
                setEditingExperienceIndex(null);
            } else {
                // Add new experience
                updatedExperience = [...profileData.experience, experienceForm];
            }
            
            formData.append('experience', JSON.stringify(updatedExperience));

            const response = await axiosInstance.patch('/auth/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setProfileData(prev => ({ ...prev, experience: response.data.user.experience }));
            toast.success(editingExperienceIndex !== null ? 'Experience updated successfully' : 'Experience added successfully');
            
            // Reset form
            setExperienceForm({
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                isCurrent: false,
                description: ''
            });
        } catch (error) {
            console.error('Error saving experience:', error);
            toast.error('Failed to save experience');
        }
    };

    // Delete experience
    const handleDeleteExperience = async (index) => {
        if (!window.confirm('Are you sure you want to delete this experience?')) return;

        try {
            const updatedExperience = profileData.experience.filter((_, i) => i !== index);
            const formData = new FormData();
            formData.append('experience', JSON.stringify(updatedExperience));

            const response = await axiosInstance.patch('/auth/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setProfileData(prev => ({ ...prev, experience: response.data.user.experience }));
            toast.success('Experience deleted successfully');
        } catch (error) {
            console.error('Error deleting experience:', error);
            toast.error('Failed to delete experience');
        }
    };

    // Edit experience entry
    const handleEditExperience = (exp, index) => {
        setExperienceForm({
            company: exp.company || '',
            position: exp.position || '',
            startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
            endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
            isCurrent: exp.isCurrent || false,
            description: exp.description || ''
        });
        setEditingExperienceIndex(index);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Present';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            });
        } catch (error) {
            return dateString;
        }
    };

    // Edit education entry
    const handleEditEducation = (education) => {
        setEducationForm({
            institution: education.institution || '',
            degree: education.degree || '',
            fieldOfStudy: education.fieldOfStudy || '',
            startDate: education.startDate ? new Date(education.startDate).toISOString().split('T')[0] : '',
            endDate: education.endDate ? new Date(education.endDate).toISOString().split('T')[0] : '',
            grade: education.grade || '',
            isCurrent: education.isCurrent || false
        });
        setEditingEducationId(education._id);
    };

    // Reset education form
    const handleResetEducationForm = () => {
        setEducationForm({
            institution: '',
            degree: '',
            fieldOfStudy: '',
            startDate: '',
            endDate: '',
            grade: '',
            isCurrent: false
        });
        setEditingEducationId(null);
    };

    // Reset experience form
    const handleResetExperienceForm = () => {
        setExperienceForm({
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            description: ''
        });
        setEditingExperienceIndex(null);
    };

    // Copy blockchain hash to clipboard
    const copyBlockchainHash = () => {
        if (blockchainHash) {
            navigator.clipboard.writeText(blockchainHash);
            toast.success('Blockchain hash copied to clipboard');
        }
    };

    if (loading) {
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
                        <p className="mt-4 text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    const completionPercentage = calculateCompletion();

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="flex-1 p-4 md:p-6 overflow-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Profile Image */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-100 to-purple-100">
                                {profileData.image ? (
                                    <img
                                        src={profileData.image}
                                        alt={profileData.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `
                                                <div class="w-full h-full flex items-center justify-center">
                                                    <FaUser class="text-4xl text-gray-400" />
                                                </div>
                                            `;
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FaUser className="text-4xl text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                                <FaEdit />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>

                            {uploadingImage && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{profileData.name}</h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <MdEmail className="text-gray-500" />
                                        <span className="text-gray-600">{profileData.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MdPhone className="text-gray-500" />
                                        <span className="text-gray-600">{profileData.mobileNumber || 'Not set'}</span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${profileData.accountStatus === 'Active'
                                            ? 'bg-green-100 text-green-800'
                                            : profileData.accountStatus === 'Pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {profileData.accountStatus || 'Pending'}
                                        </span>
                                        
                                        {/* Blockchain Status */}
                                        {blockchainHash ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium cursor-pointer hover:bg-purple-200 transition"
                                                 onClick={copyBlockchainHash}
                                                 title="Click to copy blockchain hash">
                                                <FaLink className="text-sm" />
                                                <span className="font-medium">Blockchain Verified</span>
                                                <FaCheckCircle className="text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                                <span className="font-medium">Not on Blockchain</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                                        <div className="text-xs text-gray-500">Profile Complete</div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                                    <span className="text-sm font-medium text-blue-600">{completionPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${completionPercentage}%` }}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                                    <span className={`flex items-center gap-1 ${profileData.name ? 'text-green-600' : ''}`}>
                                        {profileData.name ? '✓' : '○'} Name
                                    </span>
                                    <span className={`flex items-center gap-1 ${profileData.mobileNumber ? 'text-green-600' : ''}`}>
                                        {profileData.mobileNumber ? '✓' : '○'} Mobile
                                    </span>
                                    <span className={`flex items-center gap-1 ${profileData.address ? 'text-green-600' : ''}`}>
                                        {profileData.address ? '✓' : '○'} Address
                                    </span>
                                    <span className={`flex items-center gap-1 ${profileData.image ? 'text-green-600' : ''}`}>
                                        {profileData.image ? '✓' : '○'} Photo
                                    </span>
                                    <span className={`flex items-center gap-1 ${profileData.resume ? 'text-green-600' : ''}`}>
                                        {profileData.resume ? '✓' : '○'} Resume
                                    </span>
                                    <span className={`flex items-center gap-1 ${profileData.education?.length > 0 ? 'text-green-600' : ''}`}>
                                        {profileData.education?.length > 0 ? '✓' : '○'} Education
                                    </span>
                                    <span className={`flex items-center gap-1 ${profileData.skills?.length > 0 ? 'text-green-600' : ''}`}>
                                        {profileData.skills?.length > 0 ? '✓' : '○'} Skills
                                    </span>
                                    <span className={`flex items-center gap-1 ${blockchainHash ? 'text-purple-600' : ''}`}>
                                        {blockchainHash ? '✓' : '○'} Blockchain
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['personal', 'education', 'skills', 'experience'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${activeTab === tab
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    {/* Personal Information Tab */}
                    {activeTab === 'personal' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleUpdatePersonalInfo()}
                                        disabled={saving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={handleSaveToBlockchain}
                                        disabled={blockchainSaving || !profileData.resume}
                                        className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${profileData.resume
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        <FaLink /> 
                                        {blockchainSaving ? 'Saving to Blockchain...' : 
                                         profileData.resume ? 'Save to Blockchain' : 'Upload Resume for Blockchain'}
                                    </button>
                                </div>
                            </div>

                            {/* Blockchain Info */}
                            {blockchainHash && (
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-purple-800 font-medium mb-1">
                                                <FaLink /> Blockchain Verified
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Your resume is stored on the blockchain with hash:
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <code className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded truncate max-w-xs">
                                                    {blockchainHash}
                                                </code>
                                                <button
                                                    onClick={copyBlockchainHash}
                                                    className="text-sm text-purple-600 hover:text-purple-800"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                        <FaCheckCircle className="text-green-500 text-2xl" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={personalInfo.name}
                                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={personalInfo.mobileNumber}
                                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your mobile number"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address *
                                    </label>
                                    <textarea
                                        value={personalInfo.address}
                                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your address"
                                        required
                                    />
                                </div>

                                {/* Resume Upload */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Resume (Required for Blockchain)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                                        {profileData.resume ? (
                                            <div className="space-y-4">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between bg-blue-50 p-4 rounded-lg gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <FaFileAlt className="text-blue-600 text-2xl" />
                                                        <div className="text-left">
                                                            <p className="font-medium text-gray-900">Resume uploaded</p>
                                                            <p className="text-sm text-gray-500">
                                                                {profileData.resume.split('/').pop() || 'resume.pdf'}
                                                            </p>
                                                            {blockchainHash && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <FaCheckCircle className="text-green-500 text-xs" />
                                                                    <span className="text-xs text-green-600">On Blockchain</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <a
                                                            href={profileData.resume}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                                        >
                                                            <FaDownload /> View
                                                        </a>
                                                        <label className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer flex items-center gap-2">
                                                            <FaUpload /> {blockchainHash ? 'Update Blockchain' : 'Replace'}
                                                            <input
                                                                id="resume-upload-input"
                                                                type="file"
                                                                accept=".pdf,.doc,.docx"
                                                                onChange={handleResumeUpload}
                                                                className="hidden"
                                                                disabled={uploadingResume}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                                
                                                {!blockchainHash && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                        <p className="text-yellow-800 text-sm">
                                                            <strong>Note:</strong> Your resume is stored locally. 
                                                            Click "Save to Blockchain" above to store it on the blockchain.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600 mb-2">
                                                    <strong>Required for Blockchain:</strong> Upload your resume (PDF or DOC)
                                                </p>
                                                <p className="text-xs text-gray-500 mb-4">
                                                    This will be uploaded to IPFS and stored on the blockchain
                                                </p>
                                                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
                                                    <FaUpload className="mr-2" />
                                                    Choose File
                                                    <input
                                                        id="resume-upload-input"
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={handleResumeUpload}
                                                        className="hidden"
                                                        disabled={uploadingResume}
                                                    />
                                                </label>
                                            </>
                                        )}
                                        {uploadingResume && (
                                            <div className="mt-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Uploading to blockchain...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Education Tab */}
                    {activeTab === 'education' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                                <button
                                    onClick={handleResetEducationForm}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <FaPlus /> Add Education
                                </button>
                            </div>

                            {/* Education Form */}
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {editingEducationId ? 'Edit Education' : 'Add New Education'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Institution *
                                        </label>
                                        <input
                                            type="text"
                                            value={educationForm.institution}
                                            onChange={(e) => setEducationForm(prev => ({ ...prev, institution: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="University/College name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Degree *
                                        </label>
                                        <input
                                            type="text"
                                            value={educationForm.degree}
                                            onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Bachelor's, Master's, etc."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Field of Study *
                                        </label>
                                        <input
                                            type="text"
                                            value={educationForm.fieldOfStudy}
                                            onChange={(e) => setEducationForm(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Computer Science, Business, etc."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Grade/GPA
                                        </label>
                                        <input
                                            type="text"
                                            value={educationForm.grade}
                                            onChange={(e) => setEducationForm(prev => ({ ...prev, grade: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="3.8, A+, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={educationForm.startDate}
                                            onChange={(e) => setEducationForm(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={educationForm.endDate}
                                            onChange={(e) => setEducationForm(prev => ({ ...prev, endDate: e.target.value }))}
                                            disabled={educationForm.isCurrent}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                        />
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="isCurrent"
                                                checked={educationForm.isCurrent}
                                                onChange={(e) => setEducationForm(prev => ({
                                                    ...prev,
                                                    isCurrent: e.target.checked,
                                                    endDate: e.target.checked ? '' : prev.endDate
                                                }))}
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <label htmlFor="isCurrent" className="ml-2 text-sm text-gray-700">
                                                Currently studying here
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleSaveEducation}
                                        disabled={!educationForm.institution || !educationForm.degree || !educationForm.fieldOfStudy || !educationForm.startDate}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {editingEducationId ? 'Update Education' : 'Save Education'}
                                    </button>
                                    {editingEducationId && (
                                        <button
                                            onClick={handleResetEducationForm}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Education List */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Education History</h3>
                                {profileData.education?.length > 0 ? (
                                    profileData.education.map((edu) => (
                                        <div key={edu._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <FaSchool className="text-blue-600" />
                                                        <h4 className="font-bold text-lg text-gray-900">{edu.degree}</h4>
                                                        {edu.grade && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                {edu.grade}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 mb-1">{edu.institution}</p>
                                                    <p className="text-gray-600 text-sm mb-2">{edu.fieldOfStudy}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <FaCalendarAlt className="text-gray-400" />
                                                        <span>{formatDate(edu.startDate)}</span>
                                                        <span>→</span>
                                                        <span>{edu.isCurrent ? 'Present' : formatDate(edu.endDate)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditEducation(edu)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEducation(edu._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <FaGraduationCap className="text-4xl text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No education history added yet.</p>
                                        <p className="text-gray-500 text-sm mt-1">Add your first education entry above.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Skills Tab */}
                    {activeTab === 'skills' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
                                <button
                                    onClick={handleUpdateSkills}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <FaSave /> Save All Skills
                                </button>
                            </div>

                            {/* Bulk Skills Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter your skills (comma separated)
                                </label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={skillsInput}
                                        onChange={(e) => setSkillsInput(e.target.value)}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="JavaScript, React, Node.js, Python, etc."
                                    />
                                    <button
                                        onClick={handleUpdateSkills}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Update All
                                    </button>
                                </div>
                            </div>

                            {/* Add Single Skill */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Add individual skill
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Enter a skill"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                    />
                                    <button
                                        onClick={handleAddSkill}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                        Add Skill
                                    </button>
                                </div>
                            </div>

                            {/* Skills Display */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Your Skills ({profileData.skills?.length || 0})
                                </h3>
                                {profileData.skills?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.skills.map((skill, index) => (
                                            <div
                                                key={index}
                                                className="group relative px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full flex items-center gap-2"
                                            >
                                                <FaTools className="text-blue-600" />
                                                <span className="text-blue-800 font-medium">{skill}</span>
                                                <button
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <FaTools className="text-4xl text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No skills added yet.</p>
                                        <p className="text-gray-500 text-sm mt-1">Add skills using the form above.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Experience Tab */}
                    {activeTab === 'experience' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                                <button
                                    onClick={handleResetExperienceForm}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <FaPlus /> Add Experience
                                </button>
                            </div>

                            {/* Experience Form */}
                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {editingExperienceIndex !== null ? 'Edit Experience' : 'Add New Experience'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company *
                                        </label>
                                        <input
                                            type="text"
                                            value={experienceForm.company}
                                            onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Company name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Position *
                                        </label>
                                        <input
                                            type="text"
                                            value={experienceForm.position}
                                            onChange={(e) => setExperienceForm(prev => ({ ...prev, position: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Job title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={experienceForm.startDate}
                                            onChange={(e) => setExperienceForm(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={experienceForm.endDate}
                                            onChange={(e) => setExperienceForm(prev => ({ ...prev, endDate: e.target.value }))}
                                            disabled={experienceForm.isCurrent}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                        />
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                id="expIsCurrent"
                                                checked={experienceForm.isCurrent}
                                                onChange={(e) => setExperienceForm(prev => ({
                                                    ...prev,
                                                    isCurrent: e.target.checked,
                                                    endDate: e.target.checked ? '' : prev.endDate
                                                }))}
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <label htmlFor="expIsCurrent" className="ml-2 text-sm text-gray-700">
                                                Currently working here
                                            </label>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={experienceForm.description}
                                            onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Describe your responsibilities and achievements"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleSaveExperience}
                                        disabled={!experienceForm.company || !experienceForm.position || !experienceForm.startDate}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {editingExperienceIndex !== null ? 'Update Experience' : 'Add Experience'}
                                    </button>
                                    {editingExperienceIndex !== null && (
                                        <button
                                            onClick={handleResetExperienceForm}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Experience List */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience History</h3>
                                {profileData.experience?.length > 0 ? (
                                    profileData.experience.map((exp, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <FaBriefcase className="text-blue-600" />
                                                        <h4 className="font-bold text-lg text-gray-900">{exp.position}</h4>
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                            {exp.company}
                                                        </span>
                                                    </div>
                                                    {exp.description && (
                                                        <p className="text-gray-600 text-sm mb-3">{exp.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <FaCalendarAlt className="text-gray-400" />
                                                        <span>{formatDate(exp.startDate)}</span>
                                                        <span>→</span>
                                                        <span>{exp.isCurrent ? 'Present' : formatDate(exp.endDate)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditExperience(exp, index)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExperience(index)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <FaBriefcase className="text-4xl text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No work experience added yet.</p>
                                        <p className="text-gray-500 text-sm mt-1">Add your first work experience above.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
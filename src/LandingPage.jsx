import React, { useState, useEffect } from 'react';
import {
    FaRocket, FaBrain, FaChartLine, FaRobot, FaBolt,
    FaChevronRight, FaPlay,
    FaTrophy, FaNetworkWired, FaGem, FaInfinity, FaTwitter, FaLinkedin, FaGithub, FaDiscord
} from 'react-icons/fa';
import { LuSparkles } from "react-icons/lu";
import {
    MdDashboard, MdVerifiedUser,
} from 'react-icons/md';
import {
    HiGlobeAlt, HiSparkles
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            setScrollProgress((currentScroll / totalScroll) * 100);

            if (currentScroll > lastScrollY && currentScroll > 100) {
                setIsNavVisible(false);
            } else {
                setIsNavVisible(true);
            }
            setLastScrollY(currentScroll);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 overflow-hidden">
            <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50">
                <motion.div
                    className="h-full bg-white/30"
                    style={{ width: `${scrollProgress}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                />
            </div>
            <motion.nav
                initial={{ y: 0 }}
                animate={{ y: isNavVisible ? 0 : -100 }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-xl shadow-lg z-40"
            >
                <div className="container mx-auto px-4 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <FaBrain className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    InternXpert
                                </h2>
                                <p className="text-xs text-gray-500">Powered Platform</p>
                            </div>
                        </div>
                        <div className="hidden md:flex space-x-6">
                            <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition">Features</a>
                            <a href="#cta" className="text-gray-700 hover:text-blue-600 transition">Get Started</a>
                        </div>

                        <button onClick={() => navigate("/register")} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
                            Sign In
                        </button>
                    </div>
                </div>
            </motion.nav>

            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute border-2 border-blue-300/30 rounded-full"
                                    style={{ width: `${200 + i * 60}px`, height: `${200 + i * 60}px` }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-6xl mx-auto"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-white/20 mb-8"
                        >
                            <LuSparkles className="text-blue-500 animate-pulse" />
                            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI-POWERED INTERNSHIP REVOLUTION
                            </span>
                            <LuSparkles className="text-purple-500 animate-pulse" />
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
                            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                INTERNXPERT
                            </span>
                            <span className="block text-3xl md:text-5xl lg:text-6xl text-slate-700 mt-4">
                                Where <span className="relative">
                                    Talent
                                    <motion.div
                                        className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 0.5, duration: 1 }}
                                    />
                                </span> Meets
                                <span className="relative ml-4">
                                    Opportunity
                                    <motion.div
                                        className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 0.7, duration: 1 }}
                                    />
                                </span>
                            </span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 font-light"
                        >
                            Experience the future of internships with our neural network-powered platform that
                            intelligently connects visionary students with groundbreaking companies.
                        </motion.p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center space-x-3">
                                    <span>Launch Your Journey</span>
                                    <FaRocket className="group-hover:translate-x-2 transition-transform" />
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                className="group px-10 py-5 border-2 border-slate-300 text-slate-700 font-bold text-xl rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all"
                            >
                                <span className="flex items-center space-x-3">
                                    <FaPlay className="group-hover:text-blue-500" />
                                    <span>Watch Neural Demo</span>
                                </span>
                            </motion.button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {[
                                { number: "10K+", label: "AI Matches", icon: <FaBrain />, color: "blue" },
                                { number: "98%", label: "Success Rate", icon: <FaTrophy />, color: "purple" },
                                { number: "500+", label: "Tech Partners", icon: <FaNetworkWired />, color: "pink" },
                                { number: "24/7", label: "AI Support", icon: <FaRobot />, color: "orange" }
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 + idx * 0.1 }}
                                    className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    <div className={`text-3xl text-${stat.color}-500 mb-3`}>{stat.icon}</div>
                                    <div className="text-3xl font-bold text-slate-800">{stat.number}</div>
                                    <div className="text-slate-600 text-sm font-medium">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-slate-400 rounded-full mt-2"></div>
                    </div>
                </motion.div>
            </section>



            <section className="py-24 bg-gradient-to-b from-white to-slate-50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-center mb-16">
                            <div className="bg-white rounded-2xl p-2 shadow-xl inline-flex">
                                {['students', 'companies', 'universities'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${activeTab === tab
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                            : 'text-slate-600 hover:text-blue-600'
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl overflow-hidden"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    <div className="p-12">
                                        {activeTab === 'students' && (
                                            <>
                                                <h3 className="text-4xl font-black mb-6 text-slate-800">
                                                    For <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Visionary Students</span>
                                                </h3>
                                                <p className="text-slate-600 text-lg mb-8">
                                                    Access curated opportunities matched to your unique skills,
                                                    receive AI-powered career guidance, and build your professional
                                                    network with industry leaders.
                                                </p>
                                                <div className="space-y-4 mb-10">
                                                    {['AI-Powered Career Path', 'Skill Gap Analysis', 'Mentor Network', 'Portfolio Builder'].map((feature, idx) => (
                                                        <div key={idx} className="flex items-center space-x-3">
                                                            <LuSparkles className="text-blue-500" />
                                                            <span className="font-medium text-slate-700">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all">
                                                    Start Your Journey
                                                </button>
                                            </>
                                        )}

                                        {activeTab === 'companies' && (
                                            <>
                                                <h3 className="text-4xl font-black mb-6 text-slate-800">
                                                    For <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Innovative Companies</span>
                                                </h3>
                                                <p className="text-slate-600 text-lg mb-8">
                                                    Find pre-vetted talent with our AI matching system, streamline
                                                    your hiring process, and access detailed analytics on intern
                                                    performance and program ROI.
                                                </p>
                                                <div className="space-y-4 mb-10">
                                                    {['Smart Talent Filtering', 'Performance Analytics', 'Automated Onboarding', 'ROI Tracking'].map((feature, idx) => (
                                                        <div key={idx} className="flex items-center space-x-3">
                                                            <LuSparkles className="text-purple-500" />
                                                            <span className="font-medium text-slate-700">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all">
                                                    Find Top Talent
                                                </button>
                                            </>
                                        )}

                                        {activeTab === 'universities' && (
                                            <>
                                                <h3 className="text-4xl font-black mb-6 text-slate-800">
                                                    For <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Progressive Universities</span>
                                                </h3>
                                                <p className="text-slate-600 text-lg mb-8">
                                                    Integrate with your career services, track student placements,
                                                    and access industry partnerships to enhance your institution's
                                                    placement record.
                                                </p>
                                                <div className="space-y-4 mb-10">
                                                    {['Placement Analytics', 'Industry Partnerships', 'Career Service Integration', 'Alumni Network'].map((feature, idx) => (
                                                        <div key={idx} className="flex items-center space-x-3">
                                                            <LuSparkles className="text-pink-500" />
                                                            <span className="font-medium text-slate-700">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="px-8 py-4 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-xl transition-all">
                                                    Partner With Us
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="relative min-h-[400px] bg-gradient-to-br from-blue-50 to-purple-50">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                className="relative"
                                            >
                                                <div className="w-64 h-64">
                                                    {[...Array(6)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="absolute inset-0 border-2 border-blue-300/30 rounded-full"
                                                            style={{
                                                                width: `${100 + i * 25}%`,
                                                                height: `${100 + i * 25}%`,
                                                                top: `${-i * 12.5}%`,
                                                                left: `${-i * 12.5}%`
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center mb-20">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-pink-500/10 rounded-full mb-6"
                        >
                            <HiSparkles className="text-blue-600" />
                            <span className="font-bold text-slate-700">CUTTING-EDGE FEATURES</span>
                        </motion.div>
                        <h2 className="text-5xl md:text-6xl font-black mb-8">
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Revolutionary Tools
                            </span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                icon: <FaBrain className="text-4xl" />,
                                title: "Neural AI Matching",
                                desc: "Deep learning algorithms that understand your career aspirations and match you with perfect opportunities.",
                                gradient: "from-blue-500 to-cyan-500",
                                delay: 0
                            },
                            {
                                icon: <MdVerifiedUser className="text-4xl" />,
                                title: "Blockchain Verification",
                                desc: "Immutable verification system ensuring all opportunities and credentials are authentic and secure.",
                                gradient: "from-purple-500 to-pink-500",
                                delay: 0.1
                            },
                            {
                                icon: <MdDashboard className="text-4xl" />,
                                title: "Smart Dashboard",
                                desc: "Real-time analytics and insights into your career growth and opportunity landscape.",
                                gradient: "from-pink-500 to-rose-500",
                                delay: 0.2
                            },
                            {
                                icon: <FaNetworkWired className="text-4xl" />,
                                title: "Global Network",
                                desc: "Connect with mentors, companies, and peers across the global tech ecosystem.",
                                gradient: "from-orange-500 to-amber-500",
                                delay: 0.3
                            },
                            {
                                icon: <FaChartLine className="text-4xl" />,
                                title: "Growth Analytics",
                                desc: "Predictive analytics that forecast your career trajectory and suggest skill development.",
                                gradient: "from-green-500 to-emerald-500",
                                delay: 0.4
                            },
                            {
                                icon: <HiGlobeAlt className="text-4xl" />,
                                title: "Remote Opportunities",
                                desc: "Access global internship opportunities with our remote-first platform.",
                                gradient: "from-indigo-500 to-blue-500",
                                delay: 0.5
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: feature.delay }}
                                className={`relative group ${idx === 1 || idx === 4 ? 'lg:translate-y-12' : ''
                                    }`}
                            >
                                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-200 h-full">
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                                        <div className="text-white">{feature.icon}</div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-800 mb-4">
                                        {feature.title}
                                    </h3>

                                    <p className="text-slate-600 mb-6">
                                        {feature.desc}
                                    </p>

                                    <button className="text-blue-600 font-bold flex items-center space-x-2 group-hover:text-purple-600 transition-colors">
                                        <span>Explore Feature</span>
                                        <FaChevronRight className="transform group-hover:translate-x-2 transition-transform" />
                                    </button>
                                </div>

                                <div className={`absolute -z-10 -inset-4 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="cta" className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
                    <div className="absolute inset-0">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-white rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`
                                }}
                                animate={{
                                    y: [0, -100, 0],
                                    opacity: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 5
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ type: "spring" }}
                            className="inline-block mb-8"
                        >
                            <FaGem className="text-6xl text-white/50" />
                        </motion.div>

                        <h2 className="text-5xl md:text-7xl font-black mb-8 text-white">
                            Ready to Launch Your
                            <span className="block bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">
                                Future Career?
                            </span>
                        </h2>

                        <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
                            Join the thousands who have transformed their careers with our
                            cutting-edge platform. The future of internships starts here.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group px-12 py-6 bg-white text-blue-600 font-black text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all"
                            >
                                <span className="flex items-center space-x-3">
                                    <span>Start Free Trial</span>
                                    <FaRocket className="group-hover:translate-x-2 transition-transform" />
                                </span>
                            </motion.button>

                            <button className="px-12 py-6 bg-transparent border-2 border-white/30 text-white font-bold text-xl rounded-2xl hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm">
                                Book a Demo
                            </button>
                        </div>

                        <p className="mt-12 text-white/60">
                            <FaInfinity className="inline mr-2 animate-spin" />
                            No credit card required • 30-day free trial • Cancel anytime
                        </p>
                    </div>
                </div>
            </section>

            <footer className="bg-slate-900 text-white py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col lg:flex-row justify-between items-center">
                        <div className="mb-8 lg:mb-0">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                    <FaBrain className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">InternXpert</h2>
                                    <p className="text-slate-400 text-sm">AI-Powered Internship Platform</p>
                                </div>
                            </div>
                            <p className="text-slate-400 max-w-md">
                                Revolutionizing career beginnings through intelligent technology and human connection.
                            </p>
                        </div>

                        <div className="flex space-x-6">
                            {[FaTwitter, FaLinkedin, FaGithub, FaDiscord].map((Icon, idx) => (
                                <a
                                    key={idx}
                                    href="#"
                                    className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors"
                                >
                                    <Icon className="text-slate-300" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
                        <p>&copy; {new Date().getFullYear()} InternXpert. All rights reserved.</p>
                        <p className="mt-2 text-sm">The future of internships is here.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
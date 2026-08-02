import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { useFingerprint } from "../../hooks/useFingerprint";
import api from "../../api/axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

const ExplorePage = ({ defaultModal = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, superAdminLogin } = useAuth();
  const fingerprint = useFingerprint();

  // Tutors / Communities list
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  // Filter & Search state (Skool style)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all"); // "all" | "tech" | "business" | "security" | "design"

  // Auth modals: null | "login" | "signup" | "tutor-login" | "tutor-signup" | "super-admin"
  const [authModal, setAuthModal] = useState(defaultModal);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Payment modal
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [paymentAmount] = useState(49.99);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [enrollments, setEnrollments] = useState([]);

  const [message, setMessage] = useState({ text: "", type: "" });

  // Open modal if prop changes or URL is /login
  useEffect(() => {
    if (defaultModal || location.pathname === "/login") {
      if (!user) {
        setAuthModal("login");
      } else {
        // If already logged in and visiting /login, redirect to appropriate dashboard
        if (user.role === "SUPER_ADMIN") navigate("/super-admin");
        else if (user.role === "ADMIN") navigate("/admin");
        else if (user.role === "TUTOR") navigate("/tutor");
        else navigate("/student");
      }
    }
  }, [defaultModal, location.pathname, user, navigate]);

  // Fetch all tutors publicly
  const fetchTutors = async () => {
    setLoadingTutors(true);
    try {
      const res = await axios.get(`${BASE}/api/enrollments/tutors`);
      setTutors(res.data || []);
    } catch (err) {
      console.error("Failed to load tutors:", err);
    } finally {
      setLoadingTutors(false);
    }
  };

  // Fetch student enrollments if logged in
  const fetchEnrollments = async () => {
    if (!user) return;
    try {
      const res = await api.get("/api/enrollments/my");
      setEnrollments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  useEffect(() => {
    if (user) fetchEnrollments();
  }, [user]);

  const getEnrollmentForTutor = (tutorId) => {
    return enrollments.find(e => e.tutorId === tutorId || e.tutorEmail === tutorId);
  };

  // Simulated category and community metadata generator for Skool styling
  const enrichTutorData = (tutor, index) => {
    const categories = ["tech", "security", "business", "design"];
    const category = categories[index % categories.length];
    const memberCounts = [1420, 890, 2350, 650, 3100, 1120];
    const members = memberCounts[index % memberCounts.length];
    const online = Math.floor(members * 0.12);

    const communityNames = {
      tech: "Full-Stack Software Engineering & DevOps",
      security: "Advanced Cyber Security & DRM Protection",
      business: "SaaS Scaling, AI Founders & Growth Hacks",
      design: "UI/UX Architecture & Dynamic Web Systems"
    };

    const badges = {
      tech: "💻 Engineering",
      security: "🛡️ CyberSecurity",
      business: "🚀 SaaS & AI",
      design: "🎨 UI/UX Design"
    };

    return {
      ...tutor,
      category,
      communityName: tutor.communityName || `${tutor.name}'s ${communityNames[category] || "Learning Community"}`,
      members,
      online,
      badge: badges[category] || "🎓 Academy"
    };
  };

  const enrichedTutors = useMemo(() => {
    return tutors.map((t, idx) => enrichTutorData(t, idx));
  }, [tutors]);

  const filteredTutors = useMemo(() => {
    return enrichedTutors.filter(t => {
      const matchesTab = selectedTab === "all" || t.category === selectedTab;
      const matchesSearch = searchQuery === "" || 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.communityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.bio?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [enrichedTutors, selectedTab, searchQuery]);

  // Handle auth form submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authModal === "super-admin") {
        await superAdminLogin({ email: authEmail, password: authPassword });
        setAuthModal(null);
        navigate("/super-admin");
        return;
      }

      if (authModal === "login" || authModal === "tutor-login") {
        await login({ email: authEmail, password: authPassword, fingerprint });
        setAuthModal(null);
        // User state change will automatically redirect or update navbar
      } else if (authModal === "signup" || authModal === "tutor-signup") {
        const role = authModal === "tutor-signup" ? "TUTOR" : "STUDENT";
        await axios.post(`${BASE}/api/auth/register`, {
          name: authName,
          email: authEmail,
          password: authPassword,
          role: role
        });
        // Auto log in after register
        await login({ email: authEmail, password: authPassword, fingerprint });
        setAuthModal(null);
      }
    } catch (err) {
      const errPayload = err?.response?.data;
      const msg = typeof errPayload === "string" ? errPayload : (errPayload?.message || errPayload?.error || "Authentication failed. Please verify credentials.");
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEnrollClick = (tutor) => {
    if (!user) {
      setAuthModal("login");
      return;
    }
    setSelectedTutor(tutor);
    setPaymentSuccess(null);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedTutor) return;

    setIsProcessing(true);
    setMessage({ text: "", type: "" });

    try {
      await api.post("/api/enrollments/enroll", {
        tutorId: selectedTutor.id,
        amount: paymentAmount,
        paymentReference: "PAY-" + Math.random().toString(36).substring(2, 10).toUpperCase()
      });

      setPaymentSuccess({
        tutorName: selectedTutor.name,
        communityName: selectedTutor.communityName,
        amount: paymentAmount,
        date: new Date().toLocaleDateString()
      });
      fetchEnrollments();
    } catch (err) {
      console.error(err);
      const errPayload = err.response?.data;
      const errorMessage = typeof errPayload === "string" 
        ? errPayload 
        : (errPayload?.message || errPayload?.error || err.message || "Payment processing failed. Please try again.");
      setMessage({ text: errorMessage, type: "error" });
      setSelectedTutor(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoggedInAsTutor = user?.role === "TUTOR";

  return (
    <div className="min-h-screen text-slate-100 bg-[#0c0f17] selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-[150px]" />
      </div>

      {/* Top Skool-style Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0f17]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/30">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                SecureLearn <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-emerald-400 font-bold border border-emerald-500/20">SKOOL</span>
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search communities, tutors, DRM courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold">✕</button>
            )}
          </div>

          {/* Auth & Navigation Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline font-medium">
                  Signed in as <strong className="text-emerald-300">{user.email.split('@')[0]}</strong> ({user.role})
                </span>
                <button
                  onClick={() => {
                    if (user.role === "TUTOR") navigate("/tutor");
                    else if (user.role === "ADMIN") navigate("/admin");
                    else if (user.role === "SUPER_ADMIN") navigate("/super-admin");
                    else navigate("/student");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center gap-1.5"
                >
                  <span>Go to Dashboard</span> →
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setAuthModal("tutor-signup"); setAuthError(""); }}
                  className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold rounded-xl transition-all hidden sm:block"
                >
                  ✨ Become a Tutor
                </button>
                <button
                  onClick={() => { setAuthModal("login"); setAuthError(""); }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => { setAuthModal("signup"); setAuthError(""); }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Join Community
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Skool Marketplace Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-8 text-center sm:text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">
              Discover Learning Communities
            </h1>
            <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
              Join interactive, DRM-protected video academies, discuss with verified instructors, and access exclusive PDF curriculum in one unified platform.
            </p>
          </div>

          {/* Quick Platform Stats Badge */}
          <div className="flex items-center gap-6 bg-white/[0.03] border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400 font-mono">{tutors.length || "12"}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Tutor Academies</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-black text-indigo-400 font-mono">100%</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">DRM Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Skool-style Category Tabs & Search (Mobile) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Mobile Search */}
          <div className="w-full md:hidden relative">
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {[
              { id: "all", label: "🌟 All Communities" },
              { id: "tech", label: "💻 Engineering & AI" },
              { id: "security", label: "🛡️ Cyber & DRM" },
              { id: "business", label: "🚀 SaaS & Growth" },
              { id: "design", label: "🎨 UI/UX Design" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedTab === tab.id
                    ? "bg-white text-black border-white shadow-md shadow-white/10 font-black"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium hidden lg:block">
            Showing <strong className="text-white font-mono">{filteredTutors.length}</strong> available communities
          </div>
        </div>
      </section>

      {/* Global Alert Messages */}
      {message.text && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 mb-6">
          <div className={`p-4 rounded-xl font-bold text-sm flex items-center justify-between border ${
            message.type === "success" 
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" 
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}>
            <span>{message.type === "success" ? "✅" : "⚠️"} {message.text}</span>
            <button onClick={() => setMessage({ text: "", type: "" })} className="text-slate-400 hover:text-white">&times;</button>
          </div>
        </div>
      )}

      {/* Skool Community & Tutor Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        {loadingTutors ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-400">Loading learning communities...</span>
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-16 text-center max-w-2xl mx-auto my-6">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-xl font-bold text-white mb-2">No matching learning communities found</h3>
            <p className="text-slate-400 text-sm mb-6">
              We couldn't find any communities matching your search or category filter. Try clearing your filters or create your own tutor academy today!
            </p>
            <button
              onClick={() => { setSelectedTab("all"); setSearchQuery(""); }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor, idx) => {
              const enrollment = getEnrollmentForTutor(tutor.id);
              const isApproved = enrollment?.status === "APPROVED";
              const isPending = enrollment?.status === "PENDING_PAYMENT";

              // Gradients for Skool Community banners
              const bannerGradients = [
                "from-indigo-600 to-purple-600",
                "from-emerald-600 to-teal-500",
                "from-blue-600 to-cyan-500",
                "from-rose-600 to-amber-500",
                "from-purple-600 to-pink-500"
              ];
              const bannerGrad = bannerGradients[idx % bannerGradients.length];

              return (
                <div
                  key={tutor.id}
                  className="bg-[#131722] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all group duration-300"
                >
                  {/* Skool Card Top Banner */}
                  <div>
                    <div className={`h-28 bg-gradient-to-r ${bannerGrad} relative p-4 flex items-end justify-between overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative z-10 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white border border-white/20 rounded-md text-[11px] font-bold tracking-wide">
                        {tutor.badge}
                      </span>
                      <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md text-emerald-300 rounded-md text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {tutor.online} Online
                      </div>
                    </div>

                    {/* Community Content Info */}
                    <div className="p-6 pt-0 relative">
                      {/* Avatar overlapping banner */}
                      <div className="-mt-8 mb-4 flex items-end justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-[#1b2030] border-4 border-[#131722] flex items-center justify-center font-black text-2xl text-white shadow-xl">
                          {tutor.name?.charAt(0).toUpperCase() || "T"}
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                          👥 {tutor.members.toLocaleString()} members
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors leading-snug mb-1">
                        {tutor.communityName}
                      </h3>
                      <div className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1.5">
                        By <span className="text-emerald-400 font-bold">{tutor.name}</span> • Verified Instructor ✔
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-3 mb-5 leading-relaxed">
                        {tutor.bio || "Join our interactive academy. Access DRM video lectures, protected PDF worksheets, discussions, and exam evaluations."}
                      </p>

                      {/* Content inclusions */}
                      <div className="flex flex-wrap items-center gap-2 py-3 border-t border-white/5 text-[11px] font-semibold text-slate-400">
                        <span className="flex items-center gap-1">🎬 Video Courses</span> • 
                        <span className="flex items-center gap-1">📄 Secure PDFs</span> • 
                        <span className="flex items-center gap-1">💬 Discussion Feed</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-6 py-4 bg-black/30 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Membership Tier</div>
                      <div className="text-white font-black font-mono text-base">${paymentAmount} <span className="text-[11px] text-slate-400 font-normal">/ month</span></div>
                    </div>

                    {isLoggedInAsTutor ? (
                      <span className="px-4 py-2 bg-white/5 text-slate-400 border border-white/10 rounded-xl text-xs font-bold">
                        Instructor Mode
                      </span>
                    ) : isApproved ? (
                      <button
                        onClick={() => navigate("/student")}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-black transition-all flex items-center gap-1"
                      >
                        ✓ Open Community
                      </button>
                    ) : isPending ? (
                      <span className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
                        ⏳ Verification Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEnrollClick(tutor)}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 flex items-center gap-1.5"
                      >
                        <span>🚀 Join & Unlock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================= */}
      {/* SKOOL INLINE AUTH MODAL (No standalone page) */}
      {/* ========================================= */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-[#131722] border border-white/15 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <button
              onClick={() => {
                setAuthModal(null);
                if (location.pathname === "/login") navigate("/");
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-xl ${
                authModal.includes("tutor") || authModal === "super-admin"
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                  : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
              }`}>
                {authModal.includes("tutor") ? "🎓" : authModal === "super-admin" ? "⚡" : "👤"}
              </div>
              <h3 className="text-2xl font-black text-white">
                {authModal === "login" && "Welcome back"}
                {authModal === "signup" && "Join SecureLearn Skool"}
                {authModal === "tutor-login" && "Instructor Login"}
                {authModal === "tutor-signup" && "Create Tutor Academy"}
                {authModal === "super-admin" && "Super Admin Mode"}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                {authModal === "login" && "Sign in to access your learning communities and courses"}
                {authModal === "signup" && "Create an account to join tutors, discuss, and learn"}
                {authModal === "tutor-login" && "Manage your courses, students, and subscriptions"}
                {authModal === "tutor-signup" && "Build your DRM-protected community & sell courses"}
                {authModal === "super-admin" && "Platform orchestration & tenant administration"}
              </p>
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs font-semibold mb-5 flex items-center gap-2">
                <span>⚠️ {authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {(authModal === "signup" || authModal === "tutor-signup") && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder={authModal === "tutor-signup" ? "Prof. John Doe" : "Alex Rivera"}
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-indigo-400 text-sm placeholder-slate-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder={authModal === "super-admin" ? "root@securelearn.com" : "you@example.com"}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-indigo-400 text-sm placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-indigo-400 text-sm placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className={`w-full font-black py-3.5 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 ${
                  authModal.includes("tutor") || authModal === "super-admin"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25"
                }`}
              >
                {authLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    {authModal === "login" && "Log In to Community"}
                    {authModal === "signup" && "Create Free Account"}
                    {authModal === "tutor-login" && "Log In as Tutor"}
                    {authModal === "tutor-signup" && "Launch Instructor Account"}
                    {authModal === "super-admin" && "Super Admin Sign In"}
                  </>
                )}
              </button>
            </form>

            {/* Modal Footer Switches */}
            <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-2">
              {authModal === "login" && (
                <>
                  <p className="text-xs text-slate-400">
                    Don't have an account? <button onClick={() => { setAuthModal("signup"); setAuthError(""); }} className="text-emerald-400 font-bold hover:underline">Join Free</button>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Are you an instructor? <button onClick={() => { setAuthModal("tutor-login"); setAuthError(""); }} className="text-indigo-400 font-bold hover:underline">Tutor Portal</button> • <button onClick={() => { setAuthModal("super-admin"); setAuthError(""); }} className="text-slate-400 hover:text-white">Super Admin</button>
                  </p>
                </>
              )}
              {authModal === "signup" && (
                <p className="text-xs text-slate-400">
                  Already a member? <button onClick={() => { setAuthModal("login"); setAuthError(""); }} className="text-emerald-400 font-bold hover:underline">Log in</button>
                </p>
              )}
              {(authModal === "tutor-login" || authModal === "tutor-signup") && (
                <>
                  <p className="text-xs text-slate-400">
                    {authModal === "tutor-login" ? "Need an instructor account?" : "Already an instructor?"}{" "}
                    <button onClick={() => { setAuthModal(authModal === "tutor-login" ? "tutor-signup" : "tutor-login"); setAuthError(""); }} className="text-indigo-400 font-bold hover:underline">
                      {authModal === "tutor-login" ? "Register Academy" : "Sign In"}
                    </button>
                  </p>
                  <button onClick={() => { setAuthModal("login"); setAuthError(""); }} className="text-[11px] text-slate-500 hover:text-white transition-colors">
                    ← Back to Student Login
                  </button>
                </>
              )}
              {authModal === "super-admin" && (
                <button onClick={() => { setAuthModal("login"); setAuthError(""); }} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  ← Return to regular community login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* SKOOL COURSE ENROLLMENT & PAYMENT MODAL    */}
      {/* ========================================= */}
      {selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-[#131722] border border-emerald-500/30 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <button
              onClick={() => { setSelectedTutor(null); setPaymentSuccess(null); }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>

            {paymentSuccess ? (
              <div className="text-center space-y-5 py-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-white">Welcome to the Academy!</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  You have successfully joined <strong className="text-emerald-300">{paymentSuccess.communityName}</strong>. You now have immediate access to all video lectures, DRM docs, and discussions.
                </p>
                <div className="bg-black/50 border border-white/10 p-4 rounded-2xl text-left space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Community:</span>
                    <span className="text-white font-bold">{paymentSuccess.tutorName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subscription Paid:</span>
                    <span className="text-emerald-400 font-bold">${paymentSuccess.amount}/mo</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Date:</span>
                    <span className="text-slate-200">{paymentSuccess.date}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setSelectedTutor(null); setPaymentSuccess(null); }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs"
                  >
                    Keep Exploring
                  </button>
                  <button
                    onClick={() => navigate("/student")}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Enter Classroom →
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl mb-3 shadow-md">
                    🔒
                  </div>
                  <h3 className="text-2xl font-black text-white">Unlock Learning Community</h3>
                  <p className="text-slate-400 text-xs mt-1">Instant DRM Course Access & Verified Membership</p>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 mb-6">
                  <div className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest">Joining Community</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">{selectedTutor.communityName}</div>
                  <div className="text-xs text-slate-300 mb-3">Instructed by <strong>{selectedTutor.name}</strong></div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-300">Monthly Subscription:</span>
                    <span className="text-white font-mono text-lg font-black">${paymentAmount}</span>
                  </div>
                </div>

                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Cardholder Name</label>
                    <input
                      type="text"
                      defaultValue={user?.email ? user.email.split('@')[0].toUpperCase() : "Student Member"}
                      required
                      className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Simulated Card Number</label>
                    <input
                      type="text"
                      defaultValue="4242 •••• •••• 4242"
                      readOnly
                      className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-emerald-400 font-mono text-sm outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTutor(null)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay $${paymentAmount} & Join`
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Skool Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#090b10] py-10 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} <span className="font-bold text-slate-300">SecureLearn Skool</span> — Unified DRM Community & Course Platform.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy & DRM Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Instructor Support</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ExplorePage;

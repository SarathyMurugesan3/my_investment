import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    const isMatch = path === location.pathname || (path !== "/admin" && path !== "/super-admin" && path !== "/tutor" && path !== "/student" && location.pathname.startsWith(path));
    return isMatch
      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent";
  };

  if (!user) return null;

  return (
    <div className="w-64 glass-panel h-screen flex flex-col shrink-0 relative z-20 transition-all duration-300 border-r border-emerald-500/10 bg-black/60 shadow-2xl backdrop-blur-xl">
      <div className="p-6 pb-2 text-2xl font-black tracking-tighter border-b border-white/5">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest text-lg">
          SecureLearn
        </span>
        <div className="text-[10px] text-emerald-500/50 uppercase tracking-widest mt-1 font-bold">{user.role} PORTAL</div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">

        {/* ========================= */}
        {/* STUDENT NAVIGATION        */}
        {/* ========================= */}
        {user.role === "STUDENT" && (
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Learning</h4>
            <Link to="/student" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/student")}`}>
              View Courses
            </Link>
            <Link to="/student/tutors" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/student/tutors")}`}>
              Explore Tutors & Pay
            </Link>
            <Link to="/student/exams" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/student/exams")}`}>
              Assessments
            </Link>
            <Link to="/student/profile" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/student/profile")}`}>
              My Profile
            </Link>
          </div>
        )}

        {/* ========================= */}
        {/* TUTOR NAVIGATION          */}
        {/* ========================= */}
        {user.role === "TUTOR" && (
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Instructor Tools</h4>
            <Link to="/tutor/payment" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/tutor/payment")}`}>
              💳 Subscription & Payment
            </Link>
            <Link to="/tutor/upload" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/tutor/upload")}`}>
              Upload Video / PDF
            </Link>
            <Link to="/tutor/content" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/tutor/content")}`}>
              Manage Content
            </Link>
            <Link to="/tutor/enrollments" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/tutor/enrollments")}`}>
              Enrollments & Payments
            </Link>
            <Link to="/tutor/students" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/tutor/students")}`}>
              Manage Students
            </Link>
            <Link to="/tutor/exams" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/tutor/exams")}`}>
              Create Exams
            </Link>
            <Link to="/tutor/discussions" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/tutor/discussions")}`}>
              View Discussions
            </Link>
          </div>
        )}

        {/* ========================= */}
        {/* COMPANY ADMIN NAVIGATION  */}
        {/* ========================= */}
        {user.role === "ADMIN" && (
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Entity Management</h4>
            <Link to="/admin/tutors" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/admin/tutors")}`}>
              Manage Tutors
            </Link>
            <Link to="/admin/students" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/admin/students")}`}>
              Manage Students
            </Link>
            <Link to="/admin/content" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/admin/content")}`}>
              Content Overview
            </Link>
            <Link to="/admin/keep-alive" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/admin/keep-alive")}`}>
              ⚡ Render Keep-Alive
            </Link>
          </div>
        )}

        {/* ========================= */}
        {/* SUPER ADMIN NAVIGATION    */}
        {/* ========================= */}
        {user.role === "SUPER_ADMIN" && (
          <div className="space-y-1">
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Platform Control</h4>
             <Link to="/super-admin/dashboard" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/super-admin/dashboard")}`}>
               Analytics Dashboard
             </Link>
             <Link to="/super-admin/companies" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/super-admin/companies")}`}>
               Manage Companies
             </Link>
             <Link to="/super-admin/users" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/super-admin/users")}`}>
               Manage All Users
             </Link>
             <Link to="/super-admin/manage-content" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/super-admin/manage-content")}`}>
               Global Content
             </Link>
             <Link to="/super-admin/logs" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/super-admin/logs")}`}>
               Activity Logs
             </Link>
             <Link to="/super-admin/keep-alive" className={`block p-3 rounded-lg font-medium transition-all duration-200 ${isActive("/super-admin/keep-alive")}`}>
               ⚡ Render Keep-Alive
             </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/50 p-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Secure Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
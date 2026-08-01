import { useEffect, useState, useRef } from "react";
import { getDashboardStats, getUsers } from "../../api/adminApi";


// Animated counter hook
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const STAT_CONFIGS = [
  { key: "totalUsers", label: "Total Users", icon: "👥", color: "from-indigo-500 to-indigo-700", glow: "shadow-indigo-500/20" },
  { key: "blockedUsers", label: "Blocked Users", icon: "🚫", color: "from-rose-500 to-rose-700", glow: "shadow-rose-500/20" },
  { key: "totalContent", label: "Content Items", icon: "📚", color: "from-teal-500 to-teal-700", glow: "shadow-teal-500/20" },
  { key: "totalScreenshotAttempts", label: "Screenshot Attempts", icon: "📸", color: "from-amber-500 to-amber-700", glow: "shadow-amber-500/20" },
  { key: "highRiskUsers", label: "High Risk Users", icon: "⚠️", color: "from-orange-500 to-orange-700", glow: "shadow-orange-500/20" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [screenshotUsers, setScreenshotUsers] = useState([]);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(console.error);

    getUsers(0, 100)
      .then((res) => {
        const users = res.data.content || res.data;
        const getCount = (u) => u.screenshotCount || u.screenshotAttempts || 0;
        const filtered = (Array.isArray(users) ? users : []).filter(u => getCount(u) > 0);
        setScreenshotUsers(filtered.sort((a, b) => getCount(b) - getCount(a)));
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-8 relative">

        {/* Ambient glow blobs */}
        <div className="fixed top-32 left-64 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative overflow-hidden glass-panel rounded-2xl p-8 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/5 pointer-events-none" />
          <div className="relative">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Control Center</p>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Real-time platform overview — monitor users, content, and security risk scores from one place.
            </p>
          </div>
          {/* Decorative icon */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl opacity-10 select-none">🛡️</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {STAT_CONFIGS.map((cfg, i) => (
            <StatCard
              key={cfg.key}
              label={cfg.label}
              value={stats?.[cfg.key] ?? 0}
              icon={cfg.icon}
              color={cfg.color}
              glow={cfg.glow}
              delay={i * 80}
            />
          ))}
        </div>

        {/* Screenshot Flagged Users */}
        <div style={{ animation: "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s forwards", opacity: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-rose-400 to-rose-700 rounded-full" />
            <h2 className="text-lg font-bold text-white">Users Flagged for Screenshots</h2>
            {screenshotUsers.length > 0 && (
              <span className="ml-auto px-2.5 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/20">
                {screenshotUsers.length} flagged
              </span>
            )}
          </div>
          <div className="glass-panel rounded-2xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-left border-b border-white/5">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Captures</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {screenshotUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 text-sm">
                      <span className="text-2xl block mb-2">✅</span>
                      No screenshot violations detected.
                    </td>
                  </tr>
                ) : (
                  screenshotUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                      style={{ animation: `slideUp 0.4s ease-out ${idx * 60}ms forwards`, opacity: 0 }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 border border-white/10">
                            {user.email?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-200 text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-widest ${user.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-500/20 text-slate-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 bg-rose-500/15 text-rose-300 px-3 py-1 rounded-full font-black text-sm border border-rose-500/20">
                          📸 {user.screenshotCount || user.screenshotAttempts || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.blocked
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                          {user.blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

const StatCard = ({ label, value, icon, color, glow, delay }) => {
  const count = useCountUp(value);
  return (
    <div
      className={`relative overflow-hidden glass-card p-5 flex flex-col gap-3 shadow-xl ${glow}`}
      style={{ animation: `scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards`, opacity: 0 }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-bl-full blur-xl pointer-events-none`} />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-lg`}>
        <span>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-white mt-0.5 tabular-nums">{count}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;

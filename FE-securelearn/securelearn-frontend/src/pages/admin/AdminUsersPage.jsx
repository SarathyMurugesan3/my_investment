import { useEffect, useState } from "react";
import {
  getUsers, blockUser, unblockUser, deleteUser, updateUserRole,
} from "../../api/adminApi";
import { useAuth } from "../../hooks/useAuth";

import CreateUserModal from "../../components/admin/CreateUserModal";

const getRiskColor = (score) => {
  if (score >= 50) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (score >= 20) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const isRootAdmin = currentUser?.email === "admin@securelearn.com";

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers(page, size, sortBy);
      setUsers(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, sortBy]);

  const withLoading = async (id, fn) => {
    setActionLoadingId(id);
    try { await fn(); } finally { setActionLoadingId(null); fetchUsers(); }
  };

  const handleBlockToggle = (user) =>
    withLoading(user.id, () => user.blocked ? unblockUser(user.id) : blockUser(user.id));

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Permanently delete this user?")) return;
    withLoading(userId, () => deleteUser(userId));
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(`Role update failed: ${err?.response?.data?.message || err.message}`);
      fetchUsers();
    }
  };

  const handleUserCreated = () => { setPage(0); fetchUsers(); };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in relative">

        {/* Ambient blob */}
        <div className="fixed top-40 left-64 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative overflow-hidden glass-panel rounded-2xl p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">User Management</p>
              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Manage Users
              </h1>
              <p className="text-slate-400 mt-1 text-sm">View, manage, and control all platform users and their roles.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 text-sm shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create User
            </button>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl opacity-10 select-none">👥</div>
        </div>

        <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleUserCreated} />

        {/* Filter bar */}
        <div className="flex items-center gap-3 glass-panel p-4 rounded-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Sort by</span>
          {["id", "email", "riskScore"].map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 capitalize ${sortBy === opt
                ? "bg-indigo-600 text-white shadow shadow-indigo-500/30"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}
            >
              {opt === "riskScore" ? "Risk Score" : opt}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/5">
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Risk</th>
                <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Screenshots</th>
                <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/[0.025] transition-colors group"
                    style={{ animation: `slideUp 0.35s ease-out ${idx * 45}ms forwards`, opacity: 0 }}
                  >
                    {/* User */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/40 to-purple-600/30 border border-white/10 flex items-center justify-center text-sm font-black text-slate-200 shrink-0">
                          {user.email?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200 text-sm">{user.email}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      {isRootAdmin && user.email !== "admin@securelearn.com" ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-white/5 border border-white/10 text-slate-200 p-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                        >
                          <option className="bg-slate-800" value="STUDENT">STUDENT</option>
                          <option className="bg-slate-800" value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-widest border ${user.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20' : 'bg-slate-500/20 text-slate-300 border-slate-500/20'}`}>
                          {user.role}
                        </span>
                      )}
                    </td>

                    {/* Risk Score */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border tabular-nums ${getRiskColor(user.riskScore)}`}>
                        {user.riskScore ?? 0}
                      </span>
                    </td>

                    {/* Screenshots */}
                    <td className="p-4 text-center">
                      {((user.screenshotCount || user.screenshotAttempts || 0) > 0) ? (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
                          📸 {user.screenshotCount || user.screenshotAttempts}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.blocked
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                        {user.blocked ? "Blocked" : "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleBlockToggle(user)}
                          disabled={actionLoadingId === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border ${user.blocked
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"}`}
                        >
                          {actionLoadingId === user.id ? "…" : user.blocked ? "Unblock" : "Block"}
                        </button>
                        {user.email !== "admin@securelearn.com" && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={actionLoadingId === user.id}
                            className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 pb-6">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl disabled:opacity-30 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Prev
          </button>
          <span className="px-4 py-2 glass-panel rounded-xl text-sm font-bold text-slate-300">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl disabled:opacity-30 transition-colors text-sm font-medium"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminUsersPage;

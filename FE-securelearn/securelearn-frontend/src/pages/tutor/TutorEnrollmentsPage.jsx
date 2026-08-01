import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const TutorEnrollmentsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get('/api/enrollments/tutor-requests');
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch student enrollment requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id, studentName) => {
    setError("");
    setSuccessMessage("");
    try {
      await api.post(`/api/enrollments/${id}/approve`);
      setSuccessMessage(`Approved access for ${studentName || "student"}.`);
      fetchRequests();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to approve enrollment.");
    }
  };

  const handleReject = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${studentName || "student"}?`)) return;
    setError("");
    setSuccessMessage("");
    try {
      await api.post(`/api/enrollments/${id}/reject`);
      setSuccessMessage(`Revoked access for ${studentName || "student"}.`);
      fetchRequests();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to revoke enrollment.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Enrollments & Payment Management
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Control and approve student enrollment requests and paid subscriptions for your courses.
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl mb-6 font-medium flex items-center justify-between">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl mb-6 font-medium flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md bg-black/40 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-xs tracking-wider uppercase font-bold">
              <th className="p-5">Student Name</th>
              <th className="p-5">Email</th>
              <th className="p-5">Payment Ref</th>
              <th className="p-5">Paid Amount</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">Loading enrollment requests...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">No student enrollment requests found.</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-5 font-medium text-white flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
                      {req.studentName?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div>
                      <div className="font-semibold">{req.studentName}</div>
                      <div className="text-xs text-slate-500">ID: {req.studentId}</div>
                    </div>
                  </td>
                  <td className="p-5 text-slate-300 font-mono text-sm">{req.studentEmail}</td>
                  <td className="p-5 text-cyan-300 font-mono text-xs">{req.paymentReference || "N/A"}</td>
                  <td className="p-5 font-mono text-emerald-400 font-bold">${req.amount || 0}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      req.status === 'PENDING_PAYMENT' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-5 text-right space-x-3">
                    {req.status !== 'APPROVED' && (
                      <button 
                        onClick={() => handleApprove(req.id, req.studentName)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors"
                      >
                        Approve Access
                      </button>
                    )}
                    {req.status !== 'REJECTED' && (
                      <button 
                        onClick={() => handleReject(req.id, req.studentName)}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition-colors"
                      >
                        Revoke Access
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TutorEnrollmentsPage;

import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";

const ManageTutorsPage = () => {
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTutor, setNewTutor] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filtration state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, BLOCKED

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tutorsRes, studentsRes] = await Promise.all([
        api.get('/api/admin/users/tutors'),
        api.get('/api/admin/users/students')
      ]);
      setTutors(tutorsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (err) {
      console.error("Error fetching tutors:", err);
      setError("Failed to fetch tutors data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTutor = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      await api.post('/api/admin/users', {
        name: newTutor.name,
        email: newTutor.email,
        password: newTutor.password,
        role: "TUTOR"
      });
      setShowAddForm(false);
      setNewTutor({ name: "", email: "", password: "" });
      setSuccessMessage("Tutor added successfully!");
      fetchData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Error adding tutor:", err);
      const backendErr = err.response?.data?.error || err.response?.data?.message || err.response?.data || "Failed to add tutor.";
      setError(typeof backendErr === "string" ? backendErr : "Failed to add tutor.");
    }
  };

  const handleToggleBlock = async (tutor) => {
    setError("");
    setSuccessMessage("");
    try {
      if (tutor.blocked) {
        await api.post(`/api/admin/users/${tutor.id}/unblock`);
        setSuccessMessage(`Tutor ${tutor.name} unblocked successfully.`);
      } else {
        await api.post(`/api/admin/users/${tutor.id}/block`);
        setSuccessMessage(`Tutor ${tutor.name} blocked successfully.`);
      }
      fetchData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to change tutor status.");
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete tutor ${name || ""}?`)) return;
    setError("");
    setSuccessMessage("");
    try {
      await api.delete(`/api/admin/users/${id}`);
      setSuccessMessage("Tutor deleted successfully.");
      fetchData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.error || err.response?.data?.message || err.response?.data || "Failed to remove tutor.";
      setError(typeof backendErr === "string" ? backendErr : "Failed to remove tutor.");
    }
  };

  // Compute student count per tutor
  const studentCountMap = useMemo(() => {
    const map = {};
    students.forEach(s => {
      if (s.adminId) {
        map[s.adminId] = (map[s.adminId] || 0) + 1;
      }
    });
    return map;
  }, [students]);

  // Filtered tutors based on search and status
  const filteredTutors = useMemo(() => {
    return tutors.filter(tutor => {
      // Search filter
      const matchesSearch = 
        tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = !tutor.blocked;
      if (statusFilter === "BLOCKED") matchesStatus = tutor.blocked;

      return matchesSearch && matchesStatus;
    });
  }, [tutors, searchTerm, statusFilter]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            Manage Tutors
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Manage educational staff within your organization.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2"
        >
          {showAddForm ? "Cancel" : "+ Add Tutor"}
        </button>
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

      {/* Add Tutor Form */}
      {showAddForm && (
        <form onSubmit={handleAddTutor} className="bg-slate-900/80 p-6 rounded-2xl border border-indigo-500/30 mb-8 flex flex-col md:flex-row gap-4 shadow-xl">
          <input 
            required 
            type="text" 
            placeholder="Tutor Name" 
            className="bg-black/50 border border-white/20 p-3 rounded-xl text-white outline-none focus:border-indigo-500 flex-1 placeholder:text-slate-500" 
            value={newTutor.name} 
            onChange={e => setNewTutor({...newTutor, name: e.target.value})} 
          />
          <input 
            required 
            type="email" 
            placeholder="Email Address" 
            className="bg-black/50 border border-white/20 p-3 rounded-xl text-white outline-none focus:border-indigo-500 flex-1 placeholder:text-slate-500" 
            value={newTutor.email} 
            onChange={e => setNewTutor({...newTutor, email: e.target.value})} 
          />
          <input 
            required 
            type="password" 
            placeholder="Password" 
            className="bg-black/50 border border-white/20 p-3 rounded-xl text-white outline-none focus:border-indigo-500 flex-1 placeholder:text-slate-500" 
            value={newTutor.password} 
            onChange={e => setNewTutor({...newTutor, password: e.target.value})} 
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg">
            Save Tutor
          </button>
        </form>
      )}

      {/* Advanced Filtration Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/15 pl-10 pr-4 py-2.5 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 text-sm transition-all"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs bg-white/10 rounded-full w-5 h-5">✕</button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/50 border border-white/15 px-3 py-2 rounded-xl text-white outline-none focus:border-indigo-500 text-sm cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="BLOCKED">Blocked Only</option>
            </select>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-end sm:self-center">
          Showing <span className="text-indigo-400 font-bold">{filteredTutors.length}</span> of {tutors.length} tutors
        </div>
      </div>

      {/* Tutors Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md bg-black/40 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-xs tracking-wider uppercase font-bold">
              <th className="p-5">Tutor Name</th>
              <th className="p-5">Email</th>
              <th className="p-5 text-center">Assigned Students</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">Loading tutors...</td>
              </tr>
            ) : filteredTutors.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  {tutors.length === 0 ? "No tutors found." : "No tutors match the selected filters."}
                </td>
              </tr>
            ) : (
              filteredTutors.map((tutor) => {
                const assignedCount = studentCountMap[tutor.id] || 0;
                return (
                  <tr key={tutor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-5 font-medium text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
                        {tutor.name?.charAt(0).toUpperCase() || "T"}
                      </div>
                      <div>
                        <div className="font-semibold">{tutor.name}</div>
                        <div className="text-xs text-slate-500">ID: {tutor.id}</div>
                      </div>
                    </td>
                    <td className="p-5 text-slate-300 font-mono text-sm">{tutor.email}</td>
                    <td className="p-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        👨‍🎓 {assignedCount} {assignedCount === 1 ? 'student' : 'students'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${tutor.blocked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                        {tutor.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleBlock(tutor)} 
                        className={`text-sm font-medium transition-colors ${tutor.blocked ? 'text-emerald-400 hover:text-emerald-300' : 'text-indigo-400 hover:text-indigo-300'}`}
                      >
                        {tutor.blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button 
                        onClick={() => handleRemove(tutor.id, tutor.name)} 
                        className="text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageTutorsPage;

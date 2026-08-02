import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";

const ManageStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filtration state - selectedTutor defaults to empty (no tutor selected by default)
  const [selectedTutor, setSelectedTutor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, BLOCKED
  const [riskFilter, setRiskFilter] = useState("ALL"); // ALL, LOW, HIGH

  const fetchStudentsAndTutors = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentsRes, tutorsRes] = await Promise.all([
        api.get('/api/admin/users/students'),
        api.get('/api/admin/users/tutors')
      ]);
      setStudents(studentsRes.data || []);
      setTutors(tutorsRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch student and tutor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndTutors();
  }, []);

  const handleToggleBlock = async (student) => {
    setError("");
    setSuccessMessage("");
    try {
      if (student.blocked) {
        await api.post(`/api/admin/users/${student.id}/unblock`);
        setSuccessMessage(`Student ${student.name} unblocked.`);
      } else {
        await api.post(`/api/admin/users/${student.id}/block`);
        setSuccessMessage(`Student ${student.name} blocked.`);
      }
      fetchStudentsAndTutors();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to change student status.");
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student ${name || ""}?`)) return;
    setError("");
    setSuccessMessage("");
    try {
      await api.delete(`/api/admin/users/${id}`);
      setSuccessMessage("Student removed successfully.");
      fetchStudentsAndTutors();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      const backendErr = err.response?.data?.error || err.response?.data?.message || err.response?.data || "Failed to remove student.";
      setError(typeof backendErr === "string" ? backendErr : "Failed to remove student.");
    }
  };

  // Map tutor IDs to tutor names
  const tutorMap = useMemo(() => {
    const map = {};
    tutors.forEach(t => { map[t.id] = t.name; });
    return map;
  }, [tutors]);

  // Selected tutor object
  const activeTutor = useMemo(() => {
    return tutors.find(t => t.id === selectedTutor);
  }, [tutors, selectedTutor]);

  // Filtered Students - ONLY show students if a tutor is selected!
  const filteredStudents = useMemo(() => {
    if (!selectedTutor) return [];

    return students.filter(student => {
      // Must match selected tutor
      if (student.adminId !== selectedTutor) return false;

      // Search
      const matchesSearch = 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status Filter
      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = !student.blocked;
      if (statusFilter === "BLOCKED") matchesStatus = student.blocked;

      // Risk Filter
      let matchesRisk = true;
      const score = student.riskScore || 0;
      if (riskFilter === "LOW") matchesRisk = score <= 50;
      if (riskFilter === "HIGH") matchesRisk = score > 50;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [students, selectedTutor, searchTerm, statusFilter, riskFilter]);

  // Calculate total students assigned to selected tutor
  const totalStudentsForTutor = useMemo(() => {
    if (!selectedTutor) return 0;
    return students.filter(s => s.adminId === selectedTutor).length;
  }, [students, selectedTutor]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Manage Students
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Select an instructor below to view and manage their assigned students.
          </p>
        </div>

        {/* Tutor & Student Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
            Total Tutors: <span className="text-indigo-400 font-mono text-sm ml-1">{tutors.length}</span>
          </div>
          {selectedTutor && (
            <div className="bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 text-xs font-bold text-blue-300">
              Students for {activeTutor?.name || 'Selected Tutor'}: <span className="text-white font-mono text-sm ml-1">{totalStudentsForTutor}</span>
            </div>
          )}
        </div>
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

      {/* Primary Tutor Selector & Filtration Toolbar */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/30 mb-6 backdrop-blur-md shadow-xl flex flex-col gap-4">
        
        {/* Step 1: Tutor Selection Dropdown (Highlighted) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-black/40 p-3.5 rounded-xl border border-white/10">
          <label className="text-sm font-bold text-indigo-300 whitespace-nowrap flex items-center gap-2">
            <span>👨‍🏫 Select Tutor:</span>
          </label>
          <select 
            className="bg-slate-900 border border-indigo-500/50 px-4 py-2.5 rounded-xl text-white font-semibold outline-none focus:border-indigo-400 text-sm cursor-pointer w-full flex-1"
            value={selectedTutor}
            onChange={(e) => setSelectedTutor(e.target.value)}
          >
            <option value="">-- Choose a Tutor to View Enrolled Students ({tutors.length} available) --</option>
            {tutors.map(tutor => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.name} ({tutor.email})
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Multi-criteria Filters (Active when tutor is selected) */}
        {selectedTutor && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Search Box */}
            <div className="relative w-full">
              <input 
                type="text"
                placeholder="Search student or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/15 pl-9 pr-3 py-2 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-blue-500 text-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-white outline-none focus:border-blue-500 text-sm cursor-pointer w-full"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="BLOCKED">Blocked Only</option>
            </select>

            {/* Risk Level Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-black/40 border border-white/15 px-3 py-2 rounded-xl text-white outline-none focus:border-blue-500 text-sm cursor-pointer w-full"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk (&le;50)</option>
              <option value="HIGH">High Risk (&gt;50)</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedTutor ? (
        /* Empty State: Prompt user to select a tutor */
        <div className="glass-panel rounded-2xl border border-indigo-500/20 p-12 text-center backdrop-blur-md bg-black/40 shadow-2xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-3xl mb-4">
            👈
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No Tutor Selected</h3>
          <p className="text-slate-400 max-w-md text-sm">
            Please select an instructor from the <strong className="text-indigo-300">Select Tutor</strong> dropdown menu above to view and manage their enrolled students.
          </p>
        </div>
      ) : (
        /* Students Table for Selected Tutor */
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md bg-black/40 shadow-2xl">
          <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <span className="text-sm font-bold text-indigo-300">
              Showing students enrolled under: <span className="text-white">{activeTutor?.name}</span>
            </span>
            <span className="text-xs text-slate-400">
              {filteredStudents.length} of {totalStudentsForTutor} students matched
            </span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-xs tracking-wider uppercase font-bold">
                <th className="p-5">Student Name</th>
                <th className="p-5">Email</th>
                <th className="p-5">Assigned Tutor</th>
                <th className="p-5">Risk Score</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">Loading students...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No students found for {activeTutor?.name}.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const assignedTutorName = tutorMap[student.adminId] || activeTutor?.name || "Instructor";
                  return (
                    <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-5 font-medium text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
                          {student.name?.charAt(0).toUpperCase() || "S"}
                        </div>
                        <div>
                          <div className="font-semibold">{student.name}</div>
                          <div className="text-xs text-slate-500">ID: {student.id}</div>
                        </div>
                      </td>
                      <td className="p-5 text-slate-300 font-mono text-sm">{student.email}</td>
                      <td className="p-5">
                        <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          👨‍🏫 {assignedTutorName}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${student.riskScore > 50 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                          Score: {student.riskScore || 0}
                        </span>
                        {student.blocked && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-rose-900/60 text-rose-200 uppercase border border-rose-700">Blocked</span>
                        )}
                      </td>
                      <td className="p-5 text-right space-x-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleBlock(student)} 
                          className={`text-sm font-medium transition-colors ${student.blocked ? 'text-emerald-400 hover:text-emerald-300' : 'text-indigo-400 hover:text-indigo-300'}`}
                        >
                          {student.blocked ? 'Unblock' : 'Block'}
                        </button>
                        <button 
                          onClick={() => handleRemove(student.id, student.name)} 
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
      )}
    </div>
  );
};

export default ManageStudentsPage;

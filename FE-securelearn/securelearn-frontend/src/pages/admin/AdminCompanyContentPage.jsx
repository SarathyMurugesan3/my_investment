import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const AdminCompanyContentPage = () => {
  const [contentList, setContentList] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutorEmail, setSelectedTutorEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // We fetch tutors specifically to power the "Filter by Tutor" feature
        const [contentRes, tutorsRes] = await Promise.all([
          api.get('/api/admin/manage-content'),
          api.get('/api/admin/users/tutors')
        ]);
        
        // manage-content returns an array natively, or wrapper based on version. Safely extract.
        const cData = contentRes.data?.content || contentRes.data || [];
        setContentList(cData);
        setTutors(tutorsRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredContent = selectedTutorEmail
    ? contentList.filter(c => c.uploadedBy === selectedTutorEmail)
    : contentList;

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Content Overview
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Detailed view of all course content deployed in your environment.</p>
        </div>
      </div>

      {error && <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl mb-6">{error}</div>}

      {/* Tutor Filter Section */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-slate-300 font-bold tracking-wide text-sm">Filter by Uploading Tutor:</label>
        <select 
          className="bg-black/40 border border-white/20 p-2 rounded-lg text-white outline-none focus:border-emerald-500 cursor-pointer"
          value={selectedTutorEmail}
          onChange={(e) => setSelectedTutorEmail(e.target.value)}
        >
          <option value="">All Tutors / Admins</option>
          {tutors.map(tutor => (
            <option key={tutor.id} value={tutor.email}>{tutor.name} ({tutor.email})</option>
          ))}
        </select>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-sm tracking-wider uppercase">
              <th className="p-5 font-semibold">Title</th>
              <th className="p-5 font-semibold">Type</th>
              <th className="p-5 font-semibold">Uploaded By</th>
              <th className="p-5 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">Loading content...</td>
              </tr>
            ) : filteredContent.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">No content found.</td>
              </tr>
            ) : (
              filteredContent.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-5 font-medium text-white">{item.title}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.type === 'VIDEO' ? 'bg-purple-500/20 text-purple-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-5 text-slate-300">{item.uploadedBy}</td>
                  <td className="p-5 text-slate-400 text-sm">
                    {new Date(item.uploadedAt).toLocaleDateString()}
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

export default AdminCompanyContentPage;

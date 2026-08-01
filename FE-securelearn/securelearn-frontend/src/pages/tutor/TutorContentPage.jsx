import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const TutorContentPage = () => {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/manage-content');
      const cData = res.data?.content || res.data || [];
      setContentList(cData);
    } catch (err) {
      console.error(err);
      setError("Failed to load your content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/manage-content/${id}`);
      fetchContent(); // Refresh after delete
    } catch (err) {
      alert("Failed to delete content. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Manage My Content
          </h1>
          <p className="text-slate-400 mt-2 text-lg">View and delete the videos and PDFs you've uploaded.</p>
        </div>
      </div>

      {error && <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl mb-6">{error}</div>}

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md bg-black/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-sm tracking-wider uppercase">
              <th className="p-5 font-semibold">Title</th>
              <th className="p-5 font-semibold">Type</th>
              <th className="p-5 font-semibold">Date Uploaded</th>
              <th className="p-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">Loading your content...</td>
              </tr>
            ) : contentList.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">You haven't uploaded any content yet.</td>
              </tr>
            ) : (
              contentList.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-5 font-medium text-white">{item.title}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.type === 'VIDEO' ? 'bg-purple-500/20 text-purple-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-5 text-slate-400 text-sm">
                    {new Date(item.uploadedAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-5 text-right opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(item.id, item.title)} 
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium rounded-lg text-sm border border-rose-500/20 transition-colors"
                    >
                      Delete
                    </button>
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

export default TutorContentPage;

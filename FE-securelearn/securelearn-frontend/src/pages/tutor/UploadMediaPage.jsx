import React, { useState } from "react";
import api from "../../api/axios";

const UploadMediaPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("VIDEO");
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const validateForm = () => {
    if (!title) return "Title is required.";
    // If it's a PDF, a file MUST be provided.
    if (type === "PDF" && !file) return "A PDF file is required.";
    // If it's a VIDEO, either a file or a video URL MUST be provided.
    if (type === "VIDEO" && !file && !videoUrl) return "A Video file or Video URL is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setMessage({ text: errorMsg, type: "error" });
      return;
    }

    setMessage({ text: "", type: "" });
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    formData.append("type", type);
    if (courseId) formData.append("courseId", courseId);
    if (moduleId) formData.append("moduleId", moduleId);
    
    if (file) {
      formData.append("file", file);
    }
    if (videoUrl) {
      formData.append("videoUrl", videoUrl);
    }

    try {
      await api.post("/api/admin/content/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setMessage({ text: "Content uploaded successfully!", type: "success" });
      
      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setVideoUrl("");
      setCourseId("");
      setModuleId("");
      setUploadProgress(0);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      
    } catch (err) {
      console.error("Upload failed:", err);
      const errPayload = err.response?.data;
      const errorMessage = typeof errPayload === "string" 
        ? errPayload 
        : (errPayload?.message || errPayload?.error || err.message || "Failed to upload content. Please check file size and try again.");
      setMessage({ 
        text: errorMessage, 
        type: "error" 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 animate-slide-up p-4">
      <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
        Upload Course Media
      </h1>
      <p className="text-slate-400 mb-8 text-sm">Upload encrypted Video files or DRM protected PDFs to attach to your modules.</p>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 font-bold ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl relative shadow-2xl border border-indigo-500/20 bg-black/40 backdrop-blur-xl space-y-6">
        
        {/* Type Selection */}
        <div>
          <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">Content Type</label>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setType("VIDEO")}
              className={`flex-1 py-3 rounded-lg font-bold transition-all border ${type === 'VIDEO' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
            >
              🎥 Video
            </button>
            <button 
              type="button" 
              onClick={() => setType("PDF")}
              className={`flex-1 py-3 rounded-lg font-bold transition-all border ${type === 'PDF' ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
            >
              📄 PDF Document
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">Title *</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to React Hooks"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief summary of this material..."
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">Course ID (Optional)</label>
            <input 
              type="text" 
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Attach to a course..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider">Module ID (Optional)</label>
            <input 
              type="text" 
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              placeholder="Attach to a module..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* File and URL inputs */}
        <div className="mt-8 border-t border-white/10 pt-8">
          <label className="block text-slate-300 font-bold mb-4 text-sm uppercase tracking-wider">Media Source</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* File Dropzone */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
              className="border-2 border-dashed border-indigo-500/30 rounded-xl p-8 flex flex-col items-center justify-center bg-indigo-900/10 hover:bg-indigo-900/20 transition-colors cursor-pointer group"
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept={type === 'PDF' ? ".pdf" : "video/mp4,video/mkv,video/webm"}
              />
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span className="text-indigo-200 font-medium text-center text-sm">
                {file ? <span className="text-emerald-400 font-bold">{file.name}</span> : "Drag and drop file here, or click to browse"}
              </span>
            </div>

            {/* Video URL (Only if type is VIDEO) */}
            {type === 'VIDEO' && (
              <div className="flex flex-col justify-center">
                <div className="relative">
                  <div className="absolute inset-x-0 -top-4 flex items-center justify-center">
                    <span className="bg-[#0b1120] px-3 text-xs font-bold text-slate-500 uppercase tracking-widest">OR</span>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-6">
                    <label className="block text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">External Video URL</label>
                    <input 
                      type="url" 
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col items-end pt-4">
          <button 
            type="submit" 
            disabled={uploading}
            className={`px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing & Streaming Upload: {uploadProgress}%
              </span>
            ) : "🚀 Fast Publish Content"}
          </button>
          {uploading && (
             <div className="w-full max-w-[300px] mt-4 bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-200" style={{width: `${uploadProgress}%`}}></div>
             </div>
          )}
          <p className="text-[11px] text-slate-500 mt-3 font-medium text-right">
            ⚡ Backend utilizes stream-buffered InputStream chunking for maximum speed. For instant video publishing, paste a direct Video URL!
          </p>
        </div>
      </form>
    </div>
  );
};

export default UploadMediaPage;

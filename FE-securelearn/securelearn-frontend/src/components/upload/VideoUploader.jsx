import { useState, useRef } from "react";
import { uploadContent } from "../../api/contentApi";

const VIDEO_ACCEPT = "video/mp4,video/webm,video/ogg,video/*";

const VideoUploader = () => {
    const [title, setTitle] = useState("");
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && !selected.type.startsWith("video/")) {
            setError("Please select a valid video file (MP4, WebM, etc.).");
            setFile(null);
            return;
        }
        setError(null);
        setFile(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { setError("Title is required."); return; }
        if (!file) { setError("Please select a video file."); return; }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("file", file);

        setUploading(true);
        setSuccess(false);
        setError(null);
        setProgress(0);

        try {
            await uploadContent(formData, (progressEvent) => {
                const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setProgress(pct);
            });
            setSuccess(true);
            setTitle("");
            setFile(null);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6 max-w-xl w-full">
            {success && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl px-4 py-3 text-sm">
                    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Video uploaded successfully! Students can now stream it via the secure player.
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">
                    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-300">
                    Content Title <span className="text-rose-400">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Network Security — Module 01"
                    disabled={uploading}
                    className="w-full bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-300">
                    Video File <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                    <label
                        htmlFor="video-file-input"
                        className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed transition text-sm font-medium ${file
                            ? "border-purple-400/50 bg-purple-500/10 text-purple-300"
                            : "border-white/10 text-slate-400 hover:border-purple-400/50 hover:text-purple-300"
                            } ${uploading ? "pointer-events-none opacity-50" : ""}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {file ? file.name : "Choose video file"}
                    </label>
                    <input
                        id="video-file-input"
                        ref={fileInputRef}
                        type="file"
                        accept={VIDEO_ACCEPT}
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="sr-only"
                    />
                </div>
                {file && (
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB selected</p>
                )}
                <p className="text-xs text-slate-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Large files may take a while — keep this tab open during upload.
                </p>
            </div>

            {uploading && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Uploading…</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-500 h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                    </div>
                    {progress === 100 && (
                        <p className="text-xs text-slate-400 text-center">Processing on server… please wait.</p>
                    )}
                </div>
            )}

            <button
                type="submit"
                disabled={uploading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                {uploading ? "Uploading…" : "Upload Video"}
            </button>
        </form>
    );
};

export default VideoUploader;

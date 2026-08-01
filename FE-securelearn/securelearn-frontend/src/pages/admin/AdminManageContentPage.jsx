import { useEffect, useState } from "react";
import { getAllContent, deleteContent } from "../../api/adminApi";


const AdminManageContentPage = () => {
    const [contentList, setContentList] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const res = await getAllContent();
            setContentList(res.data);
        } catch (err) {
            console.error("Failed to fetch content", err);
            setContentList([
                { id: "mock_1", title: "Introduction to Spring Security", description: "Learn about JWT and Role-based access control.", contentType: "VIDEO" },
                { id: "mock_2", title: "React Best Practices", description: "Learn how to build scalable React applications.", contentType: "PDF" }
            ]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleDelete = async (contentId) => {
        if (!window.confirm("Are you sure you want to delete this content?")) return;
        try {
            await deleteContent(contentId);
            // Remove from list
            fetchContent();
        } catch (err) {
            console.error("Failed to delete content", err);
        }
    };

    const resolveType = (item) => {
        if (item.type === "VIDEO" || item.contentType === "VIDEO") return "VIDEO";
        if (item.type === "PDF" || item.contentType === "PDF") return "PDF";
        const ext = (item.fileName || "").split(".").pop().toLowerCase();
        if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "VIDEO";
        return "PDF";
    };

    const videos = contentList.filter(c => resolveType(c) === 'VIDEO');
    const pdfs = contentList.filter(c => resolveType(c) !== 'VIDEO');

    const renderTable = (items, title, icon) => (
        <div className="mb-10 animate-slide-up">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    {icon}
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <div className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-bold ml-2">
                    {items.length}
                </div>
            </div>
            <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-left border-b border-white/10 text-slate-300">
                        <tr>
                            <th className="p-4 font-semibold tracking-wide uppercase text-xs text-slate-400">Title</th>
                            <th className="p-4 text-right font-semibold tracking-wide uppercase text-xs text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan="2" className="p-8 text-center text-slate-400">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="p-8 text-center text-slate-500 italic">
                                    No {title.toLowerCase()} found.
                                </td>
                            </tr>
                        ) : (
                            items.map((content) => (
                                <tr key={content.id} className="hover:bg-white/[0.03] transition-colors duration-200 group">
                                    <td className="p-4">
                                        <div className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                                            {content.title}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(content.id)}
                                            className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
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

    return (
        <>
            <div className="space-y-8 relative animate-fade-in w-full max-w-7xl mx-auto pb-12">
                <div className="flex justify-between items-center glass-panel p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Content Library</p>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">Manage Content</h1>
                        <p className="text-sm text-slate-400 mt-2 max-w-xl">
                            View and organize uploaded educational resources. Manage video lectures and PDF study materials separately.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {renderTable(videos, "Video Lectures", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    ))}

                    {renderTable(pdfs, "Notes / PDFs", (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    ))}
                </div>
            </div>
        </>
    );
};

export default AdminManageContentPage;

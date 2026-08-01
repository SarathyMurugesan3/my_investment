import { useEffect, useState } from "react";
import { getStudentContent } from "../../api/contentApi";
import { useNavigate } from "react-router-dom";

import { useMonitoring } from "../../hooks/useMonitoring";
import BlurOverlay from "../../components/common/BlurOverlay";
import DynamicWatermark from "../../components/watermark/DynamicWatermark";

const ContentListPage = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isBlurred } = useMonitoring();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStudentContent()
      .then((res) => {
        const contentData = res.data?.content || (Array.isArray(res.data) ? res.data : []);
        setContent(contentData);
      })
      .catch((err) => {
        console.error("Failed to load content:", err);
        const status = err.response?.status;
        if (status === 401) {
          setError("Session expired. Please login again.");
        } else if (status === 403) {
          setError("You don't have permission to view content.");
        } else {
          setError("Failed to load content. Please try again later.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Resolve content type from `type` field or fall back to fileName extension
  const resolveType = (item) => {
    if (item.type === "VIDEO") return "VIDEO";
    if (item.type === "PDF") return "PDF";
    const ext = (item.fileName || "").split(".").pop().toLowerCase();
    if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "VIDEO";
    return "PDF";
  };

  const handleOpen = (item) => {
    const type = resolveType(item);
    if (type === "VIDEO") {
      navigate(`/student/video/${item.id}`);
    } else {
      navigate(`/student/pdf/${item.id}`);
    }
  };

  return (
    <>
      <div className="relative w-full max-w-6xl mx-auto">
        {isBlurred && <BlurOverlay />}
        <DynamicWatermark />

        <div className="flex flex-col mb-10 mt-4 animate-slide-up">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Available Content
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Explore your secure learning materials
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center min-h-[200px] text-slate-400 text-lg">
            Loading content...
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-6 py-4 text-center max-w-md">
              <p className="font-bold text-lg mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            {error.includes("login") && (
              <a
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium underline"
              >
                Go to Login →
              </a>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && content.length === 0 && (
          <div className="flex justify-center items-center min-h-[200px] text-slate-400 text-lg">
            No content available yet.
          </div>
        )}

        {/* Content grid */}
        {!loading && !error && content.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleOpen(item)}
                className="glass-card p-6 flex flex-col justify-between cursor-pointer group"
                style={{ animation: `scaleIn 0.4s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest ${resolveType(item) === "VIDEO" ? "bg-indigo-500/20 text-indigo-300" : "bg-teal-500/20 text-teal-300"}`}>
                      {resolveType(item)}
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>

                  <h2 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-purple-300 transition-all duration-300 leading-snug">
                    {item.title}
                  </h2>
                </div>

                <div className="mt-6 flex items-center text-xs text-slate-400 font-medium">
                  <svg className="w-4 h-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(item.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ContentListPage;

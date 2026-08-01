import { useState, useEffect } from "react";
import DiscussionList from "../../components/discussion/DiscussionList";
import ThreadView from "../../components/discussion/ThreadView";
import api from "../../api/axios";

const CSS = `
  @keyframes tdFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .td-wrap { animation: tdFadeIn .4s ease both; }
  .td-course-tab {
    padding:8px 16px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;
    border:none; transition:all .18s; white-space:nowrap;
  }
`;

const TutorDiscussionsPage = () => {
  const [courses, setCourses] = useState([]);
  const [activeCourse,  setActiveCourse]  = useState(null);
  const [activeThread,  setActiveThread]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/api/admin/manage-content');
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        // Map content items to "courses" format
        const formatted = data.map(c => ({ id: c.id, name: c.title }));
        setCourses(formatted);
        if (formatted.length > 0) setActiveCourse(formatted[0]);
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="td-wrap" style={{ display:"flex", flexDirection:"column", height:"100%", minHeight:"600px", padding:"0" }}>

        {/* ── Page header ── */}
        <div style={{ padding:"24px 28px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <h1 style={{ fontSize:"26px", fontWeight:900, margin:"0 0 4px",
            background:"linear-gradient(135deg,#34d399,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Discussions
          </h1>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", margin:0 }}>
            Manage and participate in student threads across your courses.
          </p>

          {/* Course tabs */}
          <div style={{ display:"flex", gap:"8px", marginTop:"20px", overflowX:"auto", paddingBottom:"4px" }}>
            {loading ? <span style={{color:"rgba(255,255,255,0.4)", fontSize:"13px"}}>Loading courses...</span> : null}
            {!loading && courses.length === 0 && <span style={{color:"rgba(255,255,255,0.4)", fontSize:"13px"}}>No courses available.</span>}
            {courses.map(c => (
              <button key={c.id} className="td-course-tab"
                onClick={() => { setActiveCourse(c); setActiveThread(null); }}
                style={{
                  background: activeCourse?.id === c.id ? "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.15))" : "rgba(255,255,255,0.04)",
                  border: activeCourse?.id === c.id ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: activeCourse?.id === c.id ? "#34d399" : "rgba(255,255,255,0.45)",
                  boxShadow: activeCourse?.id === c.id ? "0 0 16px rgba(16,185,129,0.15)" : "none",
                }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main 2-column layout ── */}
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* Left — thread list */}
          <div style={{ width:"320px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)",
            padding:"16px", overflowY:"auto", background:"rgba(0,0,0,0.2)" }}>
            {activeCourse ? (
              <DiscussionList
                key={activeCourse.id}
                courseId={activeCourse.id}
                selectedThreadId={activeThread?.id}
                onSelectThread={setActiveThread}
              />
            ) : (
              <div style={{color:"rgba(255,255,255,0.3)", fontSize:"13px", textAlign:"center", marginTop:"40px"}}>
                Select or create a course first.
              </div>
            )}
          </div>

          {/* Right — thread view or empty state */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {activeThread ? (
              <ThreadView
                key={activeThread.id}
                thread={activeThread}
                onBack={() => setActiveThread(null)}
              />
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"12px", color:"rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize:"48px" }}>💬</span>
                <p style={{ fontSize:"15px", fontWeight:600 }}>Select a thread to view the discussion</p>
                <p style={{ fontSize:"12px" }}>or create a new thread from the panel on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorDiscussionsPage;

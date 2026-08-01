import { useState, useEffect } from "react";
import DiscussionList from "../../components/discussion/DiscussionList";
import ThreadView from "../../components/discussion/ThreadView";
import api from "../../api/axios";

const CSS = `
  @keyframes sdFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .sd-wrap { animation: sdFadeIn .4s ease both; }
  .sd-course-btn {
    width:100%; text-align:left; padding:10px 14px; border-radius:10px; font-size:13px;
    font-weight:600; cursor:pointer; border:none; transition:all .18s;
  }
`;

const StudentDiscussionsPage = () => {
  const [courses,       setCourses]       = useState([]);
  const [activeCourse,  setActiveCourse]  = useState(null);
  const [activeThread,  setActiveThread]  = useState(null);

  /* Fetch enrolled courses - fallback to mockdata */
  useEffect(() => {
    api.get("/api/student/courses")
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
        setCourses(data);
        if (data.length) setActiveCourse(data[0]);
      })
      .catch(() => {
        const mock = [
          { id:"course-1", title:"Spring Boot Intro" },
          { id:"course-2", title:"React Patterns" },
          { id:"course-3", title:"Exam Pre-reqs" },
        ];
        setCourses(mock);
        setActiveCourse(mock[0]);
      });
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="sd-wrap" style={{ display:"flex", flexDirection:"column", height:"100%", minHeight:"600px" }}>

        {/* Header */}
        <div style={{ padding:"24px 28px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <h1 style={{ fontSize:"26px", fontWeight:900, margin:"0 0 4px",
            background:"linear-gradient(135deg,#818cf8,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Course Discussions
          </h1>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", margin:0 }}>
            Ask questions and collaborate with your peers.
          </p>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* Sidebar — courses */}
          <div style={{ width:"200px", flexShrink:0, padding:"16px 12px", borderRight:"1px solid rgba(255,255,255,0.06)", overflowY:"auto", background:"rgba(0,0,0,0.15)", display:"flex", flexDirection:"column", gap:"4px" }}>
            <p style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:".08em", padding:"0 4px 8px", margin:0 }}>My Courses</p>
            {courses.map(c => (
              <button key={c.id} className="sd-course-btn"
                onClick={() => { setActiveCourse(c); setActiveThread(null); }}
                style={{
                  background: activeCourse?.id === c.id ? "rgba(99,102,241,0.15)" : "transparent",
                  border: activeCourse?.id === c.id ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
                  color: activeCourse?.id === c.id ? "#a5b4fc" : "rgba(255,255,255,0.45)",
                }}>
                {c.title || c.name}
              </button>
            ))}
          </div>

          {/* Thread list */}
          {activeCourse && (
            <div style={{ width:"300px", flexShrink:0, padding:"16px", borderRight:"1px solid rgba(255,255,255,0.06)", overflowY:"auto", background:"rgba(0,0,0,0.1)" }}>
              <DiscussionList
                key={activeCourse.id}
                courseId={activeCourse.id}
                selectedThreadId={activeThread?.id}
                onSelectThread={setActiveThread}
              />
            </div>
          )}

          {/* Thread view */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {activeThread ? (
              <ThreadView
                key={activeThread.id}
                thread={activeThread}
                onBack={() => setActiveThread(null)}
              />
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"12px", color:"rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize:"48px" }}>📚</span>
                <p style={{ fontSize:"15px", fontWeight:600 }}>
                  {activeCourse ? "Select a thread to read or reply" : "Choose a course from the left"}
                </p>
                <p style={{ fontSize:"12px" }}>You can also start a new thread from the thread panel.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDiscussionsPage;

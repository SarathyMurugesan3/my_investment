import { useState, useEffect, useCallback } from "react";
import { getThreads, createThread, deleteThread } from "../../api/discussionApi";
import { useAuth } from "../../hooks/useAuth";

/* ─── CSS ─────────────────────────────────────────────── */
const CSS = `
  @keyframes dlFadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .dl-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    transition: border-color .18s, background .18s;
    cursor: pointer;
    animation: dlFadeUp .4s ease both;
  }
  .dl-card:hover { background:rgba(255,255,255,0.055); border-color:rgba(16,185,129,0.35); }
  .dl-card.active { background:rgba(16,185,129,0.07); border-color:rgba(16,185,129,0.45); }
  .dl-avatar {
    width:34px; height:34px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:800; color:#fff;
  }
  .dl-tag {
    font-size:10px; font-weight:700; letter-spacing:.06em;
    padding:2px 8px; border-radius:6px; text-transform:uppercase;
  }
  .dl-input {
    width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
    border-radius:10px; padding:10px 14px; color:#fff; font-size:13px; outline:none;
    transition:border-color .18s;
  }
  .dl-input:focus { border-color:rgba(16,185,129,0.5); }
  .dl-input::placeholder { color:rgba(255,255,255,0.25); }
  .dl-btn {
    padding:8px 18px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer;
    transition:all .18s; border:none; outline:none;
  }
`;

/* ─── Helpers ─────────────────────────────────────────── */
const avatarColor = (str = "") => {
  const colors = ["#10b981","#06b6d4","#8b5cf6","#f59e0b","#f43f5e","#3b82f6"];
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
};

const relTime = (iso) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short"});
};

/* ─── New Thread Form ─────────────────────────────────── */
const NewThreadForm = ({ onSubmit, onCancel, loading }) => {
  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), content: content.trim() });
  };

  return (
    <form onSubmit={submit}
      style={{ background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.2)",
        borderRadius:"14px", padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
      <p style={{ fontSize:"13px", fontWeight:700, color:"#34d399", margin:0 }}>+ New Thread</p>
      <input
        className="dl-input"
        placeholder="Thread title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={120}
        required
      />
      <textarea
        className="dl-input"
        placeholder="Describe your question or topic… (optional)"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        style={{ resize:"vertical", fontFamily:"inherit" }}
      />
      <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
        <button type="button" className="dl-btn" onClick={onCancel}
          style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)" }}>
          Cancel
        </button>
        <button type="submit" className="dl-btn" disabled={loading || !title.trim()}
          style={{ background: title.trim() ? "linear-gradient(135deg,#059669,#0891b2)" : "rgba(255,255,255,0.1)",
            color: title.trim() ? "#fff" : "rgba(255,255,255,0.3)",
            boxShadow: title.trim() ? "0 4px 20px rgba(16,185,129,0.3)" : "none" }}>
          {loading ? "Posting…" : "Post Thread"}
        </button>
      </div>
    </form>
  );
};

/* ═════════════════════════════════════════════════════════
   DISCUSSION LIST COMPONENT
   Props: courseId, onSelectThread, selectedThreadId
════════════════════════════════════════════════════════ */
const DiscussionList = ({ courseId, onSelectThread, selectedThreadId }) => {
  const { user } = useAuth();
  const [threads,     setThreads]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState("");

  /* ── fallback mock ── */
  const MOCK_THREADS = [
    { id:"t1", title:"How does JWT token refresh work?", content:"I'm confused about the refresh flow…",
      authorName:"Alice J.", authorEmail:"alice@acme.com", createdAt: new Date(Date.now()-1800000).toISOString(), replyCount:5 },
    { id:"t2", title:"React useEffect dependency best practices", content:"When should I add to the dep array?",
      authorName:"Bob K.", authorEmail:"bob@acme.com", createdAt: new Date(Date.now()-7200000).toISOString(), replyCount:2 },
    { id:"t3", title:"Spring Boot Hibernate N+1 problem", content:"Getting slow queries on nested entities.",
      authorName:"Sara M.", authorEmail:"sara@nexus.co", createdAt: new Date(Date.now()-86400000).toISOString(), replyCount:8 },
  ];

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true); setError(null);
    try {
      const res = await getThreads(courseId);
      setThreads(Array.isArray(res.data) ? res.data : res.data?.content ?? []);
    } catch {
      setThreads(MOCK_THREADS);
      setError("Demo mode — backend not available.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (body) => {
    setSubmitting(true);
    try {
      const res = await createThread(courseId, body);
      setThreads(prev => [res.data, ...prev]);
      setShowForm(false);
    } catch {
      /* optimistic mock */
      const mock = { id:`t${Date.now()}`, title:body.title, content:body.content,
        authorName: user?.email?.split("@")[0] ?? "You", authorEmail: user?.email ?? "",
        createdAt: new Date().toISOString(), replyCount:0 };
      setThreads(prev => [mock, ...prev]);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (threadId, e) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(t => t.id !== threadId));
    try { await deleteThread(threadId); } catch {}
  };

  const filtered = threads.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", flexDirection:"column", gap:"12px", height:"100%" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px" }}>
          <p style={{ fontSize:"13px", fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:".08em", margin:0 }}>
            Threads
          </p>
          <button className="dl-btn" onClick={() => setShowForm(v => !v)}
            style={{ padding:"6px 14px", fontSize:"12px",
              background: showForm ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#059669,#0891b2)",
              color: showForm ? "rgba(255,255,255,0.5)" : "#fff",
              boxShadow: showForm ? "none" : "0 4px 14px rgba(16,185,129,0.3)" }}>
            {showForm ? "✕ Cancel" : "+ New"}
          </button>
        </div>

        {/* Search */}
        <input className="dl-input" placeholder="Search threads…"
          value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize:"12px" }} />

        {/* Warning banner */}
        {error && (
          <div style={{ fontSize:"11px", color:"#fcd34d", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:"8px", padding:"8px 12px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* New thread form */}
        {showForm && (
          <NewThreadForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={submitting} />
        )}

        {/* Thread list */}
        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"8px", paddingRight:"2px" }}>
          {loading ? (
            Array.from({length:3}).map((_,i) => (
              <div key={i} style={{ height:"72px", borderRadius:"14px", background:"rgba(255,255,255,0.04)", animationDelay:`${i*80}ms` }} className="dl-card"/>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"8px", color:"rgba(255,255,255,0.25)", paddingTop:"40px" }}>
              <span style={{ fontSize:"28px" }}>💬</span>
              <p style={{ fontSize:"13px" }}>No threads yet. Start a discussion!</p>
            </div>
          ) : filtered.map((thread, i) => {
            const color = avatarColor(thread.authorEmail || thread.authorName);
            const isActive = thread.id === selectedThreadId;
            return (
              <div key={thread.id} className={`dl-card${isActive ? " active" : ""}`}
                style={{ padding:"14px 16px", animationDelay:`${i*50}ms` }}
                onClick={() => onSelectThread(thread)}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
                  <div className="dl-avatar" style={{ background: color }}>
                    {(thread.authorName || thread.authorEmail || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:"13px", fontWeight:700, color:"#f1f5f9", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {thread.title}
                    </p>
                    <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", margin:"3px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {thread.authorName || thread.authorEmail}
                    </p>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px", flexShrink:0 }}>
                    <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)" }}>{relTime(thread.createdAt)}</span>
                    {thread.replyCount > 0 && (
                      <span className="dl-tag" style={{ background:"rgba(16,185,129,0.12)", color:"#34d399", border:"1px solid rgba(16,185,129,0.2)" }}>
                        {thread.replyCount} 💬
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default DiscussionList;

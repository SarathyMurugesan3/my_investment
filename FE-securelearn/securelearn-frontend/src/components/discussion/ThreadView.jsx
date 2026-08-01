import { useState, useEffect, useCallback } from "react";
import { getReplies, deleteReply } from "../../api/discussionApi";
import { useAuth } from "../../hooks/useAuth";
import ReplyBox from "./ReplyBox";

/* ─── CSS ─────────────────────────────────────────────── */
const CSS = `
  @keyframes tvFadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .tv-reply {
    position:relative;
    animation:tvFadeUp .35s ease both;
  }
  .tv-reply::before {
    content:'';
    position:absolute;
    left:15px; top:40px; bottom:0;
    width:1.5px;
    background:rgba(255,255,255,0.07);
    border-radius:2px;
  }
  .tv-reply.nested::before { left:11px; }

  .tv-action-btn {
    font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px;
    border:none; cursor:pointer; transition:all .15s; background:transparent;
    color:rgba(255,255,255,0.3);
  }
  .tv-action-btn:hover { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.7); }
  .tv-action-btn.del:hover { background:rgba(244,63,94,0.12); color:#f87171; }
  .tv-avatar {
    border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-weight:800; color:#fff;
  }
`;

/* ─── Helpers ──────────────────────────────────────────── */
const avatarColor = (str = "") => {
  const colors = ["#10b981","#06b6d4","#8b5cf6","#f59e0b","#f43f5e","#3b82f6","#ec4899"];
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
};

const relTime = (iso) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
};

/* ─── Flatten replies into a tree ─────────────────────── */
const buildTree = (flat) => {
  const map = {};
  flat.forEach(r => { map[r.id] = { ...r, replies: [] }; });
  const roots = [];
  flat.forEach(r => {
    if (r.parentReplyId && map[r.parentReplyId]) {
      map[r.parentReplyId].replies.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  });
  return roots;
};

const ReplyNode = ({ reply, threadId, depth = 0, onDelete, onNewReply }) => {
  const { user }              = useAuth();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const color                 = avatarColor(reply.authorEmail || reply.authorName);
  const isOwn                 = user?.email === reply.authorEmail;
  const MAX_DEPTH             = 4;

  return (
    <div
      className={`tv-reply w-full flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay:`${depth*40}ms` }}
    >
      {!isOwn && (
        <div className="tv-avatar mr-3"
          style={{ width:"36px", height:"36px", background:color, fontSize:"14px", marginTop:"auto" }}>
          {(reply.authorName || reply.authorEmail || "?")[0].toUpperCase()}
        </div>
      )}

      <div className={`max-w-[75%] rounded-2xl p-4 flex flex-col relative ${isOwn ? 'bg-indigo-500/90 text-white rounded-br-sm' : 'bg-[#1e293b] text-slate-200 border border-white/5 rounded-bl-sm'}`}>
        {/* Name + time */}
        <div className="flex items-center gap-2 mb-1">
          {!isOwn && (
            <span style={{ fontSize:"13px", fontWeight:700, color:color }}>
              {reply.authorName || reply.authorEmail?.split("@")[0] || "User"}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ fontSize:"14px", lineHeight:"1.5", wordBreak:"break-word" }}>
          {reply.content}
        </div>
        
        <div className={`flex items-center mt-2 justify-end gap-2`}>
          <span style={{ fontSize:"10px", color: isOwn ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>
            {relTime(reply.createdAt)}
          </span>
          {depth < MAX_DEPTH && !isOwn && (
             <button className="tv-action-btn ml-2! p-0!" onClick={() => setShowReplyBox(v => !v)} style={{color:"rgba(255,255,255,0.6)", fontSize:"12px"}}>
               ↻ Reply
             </button>
          )}
          {isOwn && (
             <button className="tv-action-btn del p-0!" onClick={() => onDelete(reply.id)} style={{color:"#fca5a5", fontSize:"12px"}}>
               ✕
             </button>
          )}
        </div>

        {/* Nested reply box */}
        {showReplyBox && (
          <div className="mt-4 bg-black/30 p-3 rounded-xl border border-white/10 w-full min-w-[250px]">
            <ReplyBox
              threadId={threadId}
              parentReplyId={reply.id}
              placeholder={`Reply to ${reply.authorName || reply.authorEmail?.split("@")[0] || "user"}…`}
              compact
              onSuccess={(newReply) => {
                setShowReplyBox(false);
                onNewReply(newReply);
              }}
              onCancel={() => setShowReplyBox(false)}
            />
          </div>
        )}
      </div>

      {/* Since it's WhatsApp style, we actually map the replies as flattened chronological messages below the parent in the ThreadView instead of nesting UI if possible. However, if we must nest, rendering them inline inside the flex column ruins the bubble layout. Here we render them right after the bubble but full width. */}
      {reply.replies?.length > 0 && (
         <div className="w-full mt-2 ml-4 mb-2 flex flex-col gap-2">
            {reply.replies.map(child => (
              <ReplyNode
                key={child.id}
                reply={child}
                threadId={threadId}
                depth={depth + 1}
                onDelete={onDelete}
                onNewReply={onNewReply}
              />
            ))}
         </div>
      )}
    </div>
  );
};

/* ─── Skeleton loader ─────────────────────────────────── */
const SkeletonReply = ({ delay = 0 }) => (
  <div style={{ display:"flex", gap:"10px", animationDelay:`${delay}ms` }}>
    <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:"rgba(255,255,255,0.06)", flexShrink:0 }}/>
    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"8px" }}>
      <div style={{ height:"12px", width:"120px", borderRadius:"6px", background:"rgba(255,255,255,0.06)" }}/>
      <div style={{ height:"48px", borderRadius:"10px", background:"rgba(255,255,255,0.04)" }}/>
    </div>
  </div>
);

/* ═════════════════════════════════════════════════════════
   THREAD VIEW COMPONENT
   Props: thread (object with id, title, content, authorName, createdAt)
          onBack() — called to return to listing
════════════════════════════════════════════════════════ */
const ThreadView = ({ thread, onBack }) => {
  const [replyTree,  setReplyTree]  = useState([]);
  const [flatReplies,setFlatReplies]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showTopBox, setShowTopBox] = useState(false);

  const MOCK_REPLIES = [
    { id:"r1", threadId:thread.id, parentReplyId:null, content:"Great question! The JWT refresh flow sends the refresh token to `/api/auth/refresh` and gets a new access token back.", authorName:"Bob K.", authorEmail:"bob@acme.com", createdAt:new Date(Date.now()-900000).toISOString() },
    { id:"r2", threadId:thread.id, parentReplyId:"r1", content:"That makes sense. But what if the refresh token itself expires?", authorName:"Alice J.", authorEmail:"alice@acme.com", createdAt:new Date(Date.now()-600000).toISOString() },
    { id:"r3", threadId:thread.id, parentReplyId:"r1", content:"Then the user is redirected to login. The axios interceptor handles this automatically.", authorName:"Bob K.", authorEmail:"bob@acme.com", createdAt:new Date(Date.now()-300000).toISOString() },
    { id:"r4", threadId:thread.id, parentReplyId:null, content:"Also check out the `useAuth` hook — it re-initialises auth from the refresh token on page reload.", authorName:"Sara M.", authorEmail:"sara@nexus.co", createdAt:new Date(Date.now()-120000).toISOString() },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReplies(thread.id);
      const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
      setFlatReplies(data);
      setReplyTree(buildTree(data));
    } catch {
      setFlatReplies(MOCK_REPLIES);
      setReplyTree(buildTree(MOCK_REPLIES));
    } finally {
      setLoading(false);
    }
  }, [thread.id]);

  useEffect(() => { load(); }, [load]);

  /* Insert a new reply into the flat list + rebuild tree */
  const handleNewReply = useCallback((newReply) => {
    setFlatReplies(prev => {
      const next = [...prev, newReply];
      setReplyTree(buildTree(next));
      return next;
    });
    setShowTopBox(false);
  }, []);

  const handleDelete = useCallback(async (replyId) => {
    setFlatReplies(prev => {
      const next = prev.filter(r => r.id !== replyId);
      setReplyTree(buildTree(next));
      return next;
    });
    try { await deleteReply(replyId); } catch {}
  }, []);

  const color = avatarColor(thread.authorEmail || thread.authorName);

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:"0", backgroundColor: "#0f172a" }}>

        {/* ── Thread header (Chat top bar) ── */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"#1e293b", display: "flex", flexDirection:"column" }}>
          <button onClick={onBack}
            style={{ fontSize:"13px", color:"rgba(16,185,129,0.7)", background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:"8px", fontWeight:600, display: "flex", alignItems: "center", gap: "4px" }}>
            ← <span>Back to threads</span>
          </button>
          <div className="flex w-full items-center justify-between">
            <h2 style={{ fontSize:"18px", fontWeight:800, color:"#f8fafc", margin:"0" }}>
              {thread.title}
            </h2>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div className="tv-avatar" style={{ width:"30px", height:"30px", background:color, fontSize:"12px" }}>
              {(thread.authorName || thread.authorEmail || "?")[0].toUpperCase()}
            </div>
            <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)", fontWeight:600 }}>
              {thread.authorName || thread.authorEmail?.split("@")[0]}
            </span>
            <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)" }}>·</span>
            <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)" }}>{relTime(thread.createdAt)}</span>
          </div>

          {thread.content && (
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.55)", lineHeight:"1.6", margin:"12px 0 0", background:"rgba(255,255,255,0.03)", padding:"12px 14px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.07)" }}>
              {thread.content}
            </p>
          )}
        </div>

        {/* ── Replies area ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:"16px" }}>

          {/* Reply count + action */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <p style={{ fontSize:"12px", fontWeight:700, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>
              {flatReplies.length} {flatReplies.length === 1 ? "Reply" : "Replies"}
            </p>
            <button
              onClick={() => setShowTopBox(v => !v)}
              style={{ fontSize:"12px", fontWeight:700, padding:"6px 14px", borderRadius:"8px", border:"none", cursor:"pointer", transition:"all .18s",
                background: showTopBox ? "rgba(255,255,255,0.06)" : "rgba(16,185,129,0.12)",
                color: showTopBox ? "rgba(255,255,255,0.4)" : "#34d399" }}>
              {showTopBox ? "✕ Cancel" : "↩ Write a reply"}
            </button>
          </div>

          {/* Top-level reply box */}
          {showTopBox && (
            <ReplyBox
              threadId={thread.id}
              parentReplyId={null}
              placeholder="Share your thoughts…"
              onSuccess={handleNewReply}
              onCancel={() => setShowTopBox(false)}
            />
          )}

          {/* Loading skeletons */}
          {loading && Array.from({length:3}).map((_,i) => <SkeletonReply key={i} delay={i*80}/>)}

          {/* Empty state */}
          {!loading && replyTree.length === 0 && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:"40px", gap:"10px" }}>
              <span style={{ fontSize:"32px" }}>💬</span>
              <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)" }}>No replies yet — be the first to respond!</p>
            </div>
          )}

          {/* Reply tree */}
          {!loading && replyTree.map(reply => (
            <ReplyNode
              key={reply.id}
              reply={reply}
              threadId={thread.id}
              depth={0}
              onDelete={handleDelete}
              onNewReply={handleNewReply}
            />
          ))}
        </div>

        {/* ── Sticky bottom reply box ── */}
        {!showTopBox && (
          <div style={{ padding:"16px 24px", borderTop:"1px solid rgba(255,255,255,0.07)", background:"rgba(8,20,16,0.85)", backdropFilter:"blur(12px)" }}>
            <ReplyBox
              threadId={thread.id}
              parentReplyId={null}
              placeholder="Add a reply…"
              onSuccess={handleNewReply}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ThreadView;

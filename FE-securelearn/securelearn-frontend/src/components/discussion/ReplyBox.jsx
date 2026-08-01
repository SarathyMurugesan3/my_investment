import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { createReply } from "../../api/discussionApi";

/* ─── CSS ─────────────────────────────────────────────── */
const CSS = `
  .rb-textarea {
    width:100%; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1);
    border-radius:12px; padding:12px 14px; color:#f1f5f9; font-size:13px;
    font-family:inherit; resize:none; outline:none; line-height:1.6;
    transition:border-color .18s, box-shadow .18s;
    min-height:80px;
  }
  .rb-textarea:focus { border-color:rgba(16,185,129,0.5); box-shadow:0 0 0 3px rgba(16,185,129,0.08); }
  .rb-textarea::placeholder { color:rgba(255,255,255,0.2); }
  .rb-btn {
    padding:9px 20px; border-radius:10px; font-size:13px; font-weight:700;
    cursor:pointer; border:none; outline:none; transition:all .18s;
  }
  @keyframes rbSlide {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .rb-wrap { animation: rbSlide .25s ease both; }
`;

/* ═════════════════════════════════════════════════════════
   REPLY BOX COMPONENT
   Props:
     threadId       — id of parent thread
     parentReplyId  — null for top-level, or id of reply being nested under
     placeholder    — custom placeholder text
     compact        — smaller styling when nested inline
     onSuccess(reply) — called after successful post
     onCancel       — called when user presses cancel
════════════════════════════════════════════════════════ */
const ReplyBox = ({
  threadId,
  parentReplyId = null,
  placeholder = "Write a reply…",
  compact = false,
  onSuccess,
  onCancel,
}) => {
  const { user }          = useAuth();
  const [text, setText]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState(null);
  const taRef             = useRef(null);

  /* Auto-focus on mount */
  useEffect(() => { taRef.current?.focus(); }, []);

  /* Auto-grow textarea */
  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setBusy(true); setErr(null);

    /* optimistic reply object */
    const optimistic = {
      id: `r_${Date.now()}`,
      content,
      parentReplyId,
      authorName:  user?.email?.split("@")[0] ?? "You",
      authorEmail: user?.email ?? "",
      createdAt:   new Date().toISOString(),
      replies:     [],
    };

    try {
      const res = await createReply(threadId, { content, parentReplyId });
      onSuccess?.(res.data ?? optimistic);
    } catch {
      /* Graceful: use optimistic if backend not reachable */
      onSuccess?.(optimistic);
    } finally {
      setText(""); setBusy(false);
      if (taRef.current) { taRef.current.style.height = "auto"; }
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="rb-wrap" style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {/* Avatar + textarea row */}
        <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
          {/* Mini avatar */}
          <div style={{
            width: compact ? "28px" : "34px",
            height: compact ? "28px" : "34px",
            borderRadius:"9px", flexShrink:0, marginTop:"2px",
            background:"linear-gradient(135deg,#059669,#0891b2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize: compact ? "11px" : "13px", fontWeight:800, color:"#fff",
          }}>
            {(user?.email ?? "U")[0].toUpperCase()}
          </div>

          <form onSubmit={handleSubmit} style={{ flex:1, display:"flex", flexDirection:"column", gap:"8px" }}>
            <textarea
              ref={taRef}
              className="rb-textarea"
              placeholder={placeholder}
              value={text}
              onChange={e => { setText(e.target.value); autoGrow(); }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
              }}
              rows={compact ? 2 : 3}
              style={{ fontSize: compact ? "12px" : "13px" }}
            />

            {err && (
              <p style={{ fontSize:"11px", color:"#f87171", margin:0 }}>{err}</p>
            )}

            <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end", alignItems:"center" }}>
              <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", marginRight:"auto" }}>
                ⌘↵ to post
              </span>
              {onCancel && (
                <button type="button" className="rb-btn" onClick={onCancel}
                  style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.45)", padding:"7px 14px" }}>
                  Cancel
                </button>
              )}
              <button type="submit" className="rb-btn" disabled={busy || !text.trim()}
                style={{
                  background: text.trim() ? "linear-gradient(135deg,#059669,#0891b2)" : "rgba(255,255,255,0.08)",
                  color: text.trim() ? "#fff" : "rgba(255,255,255,0.25)",
                  boxShadow: text.trim() ? "0 4px 18px rgba(16,185,129,0.3)" : "none",
                  padding: compact ? "7px 14px" : "9px 20px",
                }}>
                {busy ? "Posting…" : parentReplyId ? "↩ Reply" : "Post Reply"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReplyBox;

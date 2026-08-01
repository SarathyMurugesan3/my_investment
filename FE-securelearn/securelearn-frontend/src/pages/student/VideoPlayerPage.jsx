import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFingerprint } from "../../hooks/useFingerprint";
import { getVideoStream } from "../../api/videoApi";
import { logTabSwitch, reportScreenshot } from "../../api/monitorApi";
import BlurOverlay from "../../components/common/BlurOverlay";

/* ─────────────────────────────────────────────────────────
   Injected styles — keeps the component self-contained
───────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes gradientShift {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
    50%       { box-shadow: 0 0 40px rgba(6,182,212,0.5); }
  }
  @keyframes toastIn {
    0%   { opacity: 0; transform: translateX(-50%) translateY(-18px) scale(0.92); }
    12%  { opacity: 1; transform: translateX(-50%) translateY(0)      scale(1);    }
    88%  { opacity: 1; transform: translateX(-50%) translateY(0)      scale(1);    }
    100% { opacity: 0; transform: translateX(-50%) translateY(-8px)   scale(0.96); }
  }
  @keyframes blackoutFade {
    0%   { opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes watermarkFloat {
    0%   { opacity: 0.45; }
    50%  { opacity: 0.75; }
    100% { opacity: 0.45; }
  }
  @keyframes warningPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }

  .page-anim   { animation: fadeInUp 0.55s cubic-bezier(.22,1,.36,1) both; }
  .toast-anim  { animation: toastIn 4s ease forwards; }
  .warn-anim   { animation: toastIn 5s ease forwards; }
  .blackout-anim { animation: blackoutFade 3.2s ease forwards; }

  .shimmer-bar {
    background: linear-gradient(90deg,#052e1a 25%,#0a4a30 50%,#052e1a 75%);
    background-size: 200% auto;
    animation: shimmer 1.5s linear infinite;
    border-radius: 8px;
  }
  .gradient-title {
    background: linear-gradient(135deg, #34d399, #22d3ee, #818cf8);
    background-size: 200% 200%;
    animation: gradientShift 4s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .glass-card {
    background: rgba(4,31,26,0.55);
    border: 1px solid rgba(16,185,129,0.18);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .secure-badge {
    background: linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.12));
    border: 1px solid rgba(52,211,153,0.3);
    backdrop-filter: blur(8px);
  }
  .attempt-badge {
    background: linear-gradient(135deg,rgba(220,38,38,0.25),rgba(185,28,28,0.15));
    border: 1px solid rgba(248,113,113,0.35);
    color: #fca5a5;
    box-shadow: 0 0 12px rgba(220,38,38,0.2);
  }
  .icon-btn {
    background: linear-gradient(135deg,#059669,#0891b2);
    box-shadow: 0 4px 24px rgba(16,185,129,0.35);
    animation: pulseGlow 3s ease-in-out infinite;
  }

  /* Disable native video download controls */
  video::-webkit-media-controls-enclosure { overflow: hidden; }
  video::-webkit-media-controls-panel { background: linear-gradient(to top, rgba(2,12,16,0.95), rgba(4,31,26,0.7)); }
  video::-internal-media-controls-download-button { display: none !important; }
  video::-webkit-media-controls-overflow-button   { display: none !important; }

  /* Watermark layer */
  .wm-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    user-select: none;
    z-index: 10;
    overflow: hidden;
  }
  .wm-text {
    position: absolute;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.3px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
    white-space: nowrap;
    transform: rotate(-25deg);
    animation: watermarkFloat 4s ease-in-out infinite;
  }
`;

/* ─── Watermark positions (percentage-based grid) ─── */
const WM_POSITIONS = [
  { top: "15%", left: "10%" },
  { top: "15%", left: "55%" },
  { top: "45%", left: "30%" },
  { top: "70%", left: "8%"  },
  { top: "70%", left: "58%" },
];

/* ─── Format timestamp ─── */
const formatTs = (date) =>
  date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

/* ══════════════════════════════════════════════════════════════
   ENHANCED SECURE VIDEO PLAYER
══════════════════════════════════════════════════════════════ */
const VideoPlayerPage = () => {
  const { id }         = useParams();
  const { user }       = useAuth();
  const fingerprint    = useFingerprint();

  /* ── Refs ── */
  const videoRef             = useRef(null);
  const protectOverlayRef    = useRef(null);   // Instant DOM overlay (bypass React scheduler)
  const metaDownRef          = useRef(false);
  const shiftDownRef         = useRef(false);
  const wasKeyHeldRef        = useRef(false);
  const tabSwitchCountRef    = useRef(0);

  /* ── State ── */
  const [videoUrl,           setVideoUrl]           = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [isBlurred,          setIsBlurred]          = useState(false);

  // Watermark
  const [wmTimestamp,        setWmTimestamp]        = useState(formatTs(new Date()));

  // Toasts / overlays
  const [screenshotWarning,  setScreenshotWarning]  = useState(false);
  const [suspiciousWarning,  setSuspiciousWarning]  = useState(false);
  const [blackout,           setBlackout]           = useState(false);

  // Counters
  const [screenshotAttempts, setScreenshotAttempts] = useState(0);
  const [tabSwitchAttempts,  setTabSwitchAttempts]  = useState(0);

  /* ══════════════════════════════════════════════════════════════
     ① ROTATING WATERMARK TIMESTAMP  (every 5–10 s, random jitter)
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const schedule = () => {
      const delay = 5000 + Math.random() * 5000; // 5–10 s
      return setTimeout(() => {
        setWmTimestamp(formatTs(new Date()));
        timer = schedule();
      }, delay);
    };
    let timer = schedule();
    return () => clearTimeout(timer);
  }, []);

  /* ══════════════════════════════════════════════════════════════
     ② DevTools detection
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const check = () => {
      const threshold = 160;
      const open =
        window.outerWidth  - window.innerWidth  > threshold ||
        window.outerHeight - window.innerHeight > threshold;
      setIsBlurred(open);
      if (open && fingerprint) {
        reportScreenshot(fingerprint).catch(() => {});
      }
    };
    const iv = setInterval(check, 1000);
    return () => clearInterval(iv);
  }, [fingerprint]);

  /* ══════════════════════════════════════════════════════════════
     ③ TOAST + BLACKOUT HELPERS
  ══════════════════════════════════════════════════════════════ */
  const showOverlay = useCallback(() => {
    if (protectOverlayRef.current)
      protectOverlayRef.current.style.display = "flex";
  }, []);

  const hideOverlay = useCallback(() => {
    if (protectOverlayRef.current)
      protectOverlayRef.current.style.display = "none";
  }, []);

  const triggerWarning = useCallback(() => {
    setScreenshotWarning(false);
    requestAnimationFrame(() => {
      setScreenshotWarning(true);
      setTimeout(() => setScreenshotWarning(false), 4100);
    });
  }, []);

  const triggerSuspicious = useCallback(() => {
    setSuspiciousWarning(false);
    requestAnimationFrame(() => {
      setSuspiciousWarning(true);
      setTimeout(() => setSuspiciousWarning(false), 5100);
    });
  }, []);

  const triggerBlackout = useCallback(() => {
    setBlackout(false);
    requestAnimationFrame(() => {
      setBlackout(true);
      setTimeout(() => setBlackout(false), 3200);
    });
  }, []);

  const instantBlackout = useCallback(() => {
    showOverlay();
    setTimeout(() => {
      if (!wasKeyHeldRef.current) hideOverlay();
    }, 3200);
  }, [showOverlay, hideOverlay]);

  /* ══════════════════════════════════════════════════════════════
     ④ SECURITY LISTENERS
        • Right-click → blocked
        • Download shortcut keys → blocked
        • Win+Shift+S / PrtSc → instant overlay
        • Tab switch → log to backend + warning
        • Window blur → blackout
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const isWin = /win/i.test(navigator.platform);
    const isMac = /mac/i.test(navigator.platform);

    /* ── Win+Shift+S composite key tracking ── */
    const updateKeyHeld = () => {
      if (isWin && metaDownRef.current && shiftDownRef.current) {
        showOverlay();
        if (!wasKeyHeldRef.current) {
          wasKeyHeldRef.current = true;
          setScreenshotAttempts(n => n + 1);
          triggerWarning();
          if (fingerprint) reportScreenshot(fingerprint).catch(() => {});
        }
      } else {
        wasKeyHeldRef.current = false;
        hideOverlay();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Meta")  { metaDownRef.current  = true;  updateKeyHeld(); }
      if (e.key === "Shift") { shiftDownRef.current = true;  updateKeyHeld(); }

      const blocked =
        e.key === "PrintScreen" ||
        e.key === "Print" ||
        (isWin && e.altKey  && e.metaKey && e.key.toLowerCase() === "r") ||
        (isWin && e.metaKey && e.key.toLowerCase() === "g") ||
        (isMac && e.metaKey && e.shiftKey && ["3","4","5"].includes(e.key));

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        instantBlackout();
        setScreenshotAttempts(n => n + 1);
        triggerWarning();
        triggerBlackout();
        if (fingerprint) reportScreenshot(fingerprint).catch(() => {});
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "Meta")  { metaDownRef.current  = false; updateKeyHeld(); }
      if (e.key === "Shift") { shiftDownRef.current = false; updateKeyHeld(); }
    };

    /* ── Tab switching ── */
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        tabSwitchCountRef.current += 1;
        setTabSwitchAttempts(n => n + 1);
        triggerSuspicious();
        instantBlackout();
        triggerBlackout();

        // Log to backend
        if (fingerprint) {
          logTabSwitch({
            fingerprint,
            contentId: id,
            eventType: "TAB_SWITCH",
            count: tabSwitchCountRef.current,
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      } else {
        hideOverlay();
      }
    };

    /* ── Window blur (alt-tab, OS snipping) ── */
    const handleBlur = () => {
      instantBlackout();
      triggerBlackout();
      triggerWarning();
    };

    /* ── Block right-click ── */
    const blockCtx = (e) => e.preventDefault();

    window.addEventListener("keydown",            handleKeyDown,    true);
    window.addEventListener("keyup",              handleKeyUp,      true);
    window.addEventListener("blur",               handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("contextmenu",      blockCtx);

    return () => {
      window.removeEventListener("keydown",            handleKeyDown,    true);
      window.removeEventListener("keyup",              handleKeyUp,      true);
      window.removeEventListener("blur",               handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("contextmenu",      blockCtx);
    };
  }, [id, fingerprint, showOverlay, hideOverlay, instantBlackout,
      triggerWarning, triggerSuspicious, triggerBlackout]);

  /* ══════════════════════════════════════════════════════════════
     ⑤ FETCH VIDEO  — GET /api/video/stream/{id}
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getVideoStream(id);
        // Backend can return: plain string URL, { url }, or { signedUrl }
        const url =
          typeof res.data === "string"
            ? res.data
            : res.data?.url ?? res.data?.signedUrl ?? res.data?.streamUrl;

        if (!url) throw new Error("No stream URL returned.");
        setVideoUrl(url.trim());
      } catch (err) {
        const s = err.response?.status;
        if (s === 401) setError("Session expired. Please login again.");
        else if (s === 403) setError("You don't have permission to view this video.");
        else setError("Failed to load video. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  const userEmail = user?.email ?? "user@securelearn.app";

  return (
    <>
      <style>{CSS}</style>

      {/* ══ INSTANT DOM OVERLAY (synchronous, bypasses React scheduler) ══ */}
      <div
        ref={protectOverlayRef}
        style={{
          display: "none",
          position: "fixed", inset: 0,
          zIndex: 2147483647,
          background: "#000",
          flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "16px", userSelect: "none",
        }}
      >
        <div style={{ fontSize: "64px" }}>🛡️</div>
        <p style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}>Content Protected</p>
        <p style={{ color: "#6ee7b7", fontSize: "13px" }}>Screenshot capture is not permitted on SecureLearn.</p>
      </div>

      {/* ══ TRANSIENT BLACKOUT (React-managed, animated) ══ */}
      {blackout && (
        <div
          className="blackout-anim"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.97)", backdropFilter: "blur(24px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "16px",
          }}
        >
          <div style={{ fontSize: "64px", userSelect: "none" }}>🛡️</div>
          <p style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}>Content Protected</p>
          <p style={{ color: "#6ee7b7", fontSize: "13px" }}>Screenshots and recordings are not permitted.</p>
        </div>
      )}

      {/* ══ SCREENSHOT WARNING TOAST ══ */}
      {screenshotWarning && (
        <div
          className="toast-anim"
          style={{
            position: "fixed", top: "24px", left: "50%",
            zIndex: 9000, transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 24px", borderRadius: "16px",
            background: "linear-gradient(135deg,rgba(220,38,38,0.95),rgba(185,28,28,0.95))",
            border: "1px solid rgba(248,113,113,0.4)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(220,38,38,0.45)",
            color: "#fff", fontSize: "14px", fontWeight: 600,
            userSelect: "none", whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "20px" }}>🚫</span>
          <span>Screenshots are not allowed on this page</span>
        </div>
      )}

      {/* ══ SUSPICIOUS BEHAVIOR WARNING TOAST ══ */}
      {suspiciousWarning && (
        <div
          className="warn-anim"
          style={{
            position: "fixed", top: "88px", left: "50%",
            zIndex: 9000, transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 24px", borderRadius: "16px",
            background: "linear-gradient(135deg,rgba(245,158,11,0.95),rgba(217,119,6,0.95))",
            border: "1px solid rgba(251,191,36,0.4)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(245,158,11,0.45)",
            color: "#fff", fontSize: "14px", fontWeight: 600,
            userSelect: "none", whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <span>Suspicious activity detected &amp; logged: Tab switching ({tabSwitchAttempts}×)</span>
        </div>
      )}

      {/* ══ DEVTOOLS BLUR OVERLAY ══ */}
      {isBlurred && <BlurOverlay />}

      {/* ══ PAGE BODY ══ */}
      <div
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg,#020c10 0%,#041f1a 45%,#061510 100%)" }}
      >
        {/* Ambient glows */}
        <div className="absolute pointer-events-none"
          style={{ top:"30%", left:"20%", width:"380px", height:"380px", borderRadius:"50%",
            background:"radial-gradient(circle,rgba(16,185,129,0.10) 0%,transparent 70%)", filter:"blur(60px)" }} />
        <div className="absolute pointer-events-none"
          style={{ bottom:"25%", right:"20%", width:"300px", height:"300px", borderRadius:"50%",
            background:"radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)", filter:"blur(70px)" }} />

        <div className="page-anim w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-btn w-11 h-11 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <div>
                <h1 className="gradient-title text-xl font-bold tracking-tight">Secure Video Player</h1>
                <p style={{ fontSize:"11px", color:"rgba(52,211,153,0.5)" }}>DRM Protected · SecureLearn Platform</p>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span className="secure-badge" style={{ borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:600, display:"flex", alignItems:"center", gap:"6px", color:"#6ee7b7" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                DRM
              </span>
              <span className="secure-badge" style={{ borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:600, display:"flex", alignItems:"center", gap:"6px", color:"#67e8f9" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Encrypted
              </span>
              <span className="secure-badge" style={{ borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:600, display:"flex", alignItems:"center", gap:"6px", color:"#c4b5fd" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Monitored
              </span>
            </div>
          </div>

          {/* ── Video card ── */}
          <div className="glass-card rounded-2xl overflow-hidden"
            style={{ position:"relative", boxShadow:"0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.08)" }}>

            {/* WATERMARK LAYER — user email + rotating timestamp */}
            {!loading && !error && (
              <div className="wm-layer">
                {WM_POSITIONS.map((pos, i) => (
                  <div
                    key={i}
                    className="wm-text"
                    style={{
                      ...pos,
                      animationDelay: `${i * 0.7}s`,
                      animationDuration: `${4 + i * 0.5}s`,
                    }}
                  >
                    {userEmail} &nbsp;·&nbsp; {wmTimestamp}
                  </div>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && !error && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"96px 0", gap:"24px" }}>
                <div style={{ position:"relative", width:"64px", height:"64px" }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid rgba(16,185,129,0.12)" }}/>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid transparent", borderTopColor:"#10b981", animation:"spin 0.9s linear infinite" }}/>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(52,211,153,0.7)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                  <p style={{ fontSize:"14px", fontWeight:500, color:"#6ee7b7" }}>Loading secure stream…</p>
                  <div className="shimmer-bar" style={{ width:"192px", height:"8px" }}/>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"96px 0", gap:"16px" }}>
                <div style={{ width:"56px", height:"56px", borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p style={{ color:"#fca5a5", fontWeight:600 }}>{error}</p>
                {error.includes("login") && (
                  <a href="/login" style={{ color:"#34d399", fontSize:"13px", textDecoration:"underline" }}>Go to Login →</a>
                )}
              </div>
            )}

            {/* Video element */}
            {!loading && !error && (
              <video
                ref={videoRef}
                src={videoUrl || undefined}
                controls
                className="w-full"
                style={{ display:"block", background:"#000" }}
                onContextMenu={(e) => e.preventDefault()}
                controlsList="nodownload noremoteplayback nofullscreen"
                disablePictureInPicture
                disableRemotePlayback
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* ── Info + counters strip ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:"12px", padding:"12px 20px", background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.1)" }}>
            <p style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"12px", color:"rgba(52,211,153,0.6)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              This content is protected. Downloading, screenshots &amp; recordings are not permitted.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              {screenshotAttempts > 0 && (
                <span className="attempt-badge" style={{ display:"flex", alignItems:"center", gap:"6px", padding:"4px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:700 }}>
                  🚫 {screenshotAttempts} screenshot attempt{screenshotAttempts !== 1 ? "s" : ""}
                </span>
              )}
              {tabSwitchAttempts > 0 && (
                <span className="attempt-badge" style={{ display:"flex", alignItems:"center", gap:"6px", padding:"4px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:700 }}>
                  ⚠️ {tabSwitchAttempts} tab switch{tabSwitchAttempts !== 1 ? "es" : ""} logged
                </span>
              )}
              <span style={{ fontSize:"11px", fontFamily:"monospace", color:"rgba(16,185,129,0.35)" }}>
                ID: {id}
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default VideoPlayerPage;

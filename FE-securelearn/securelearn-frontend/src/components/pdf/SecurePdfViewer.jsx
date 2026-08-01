import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../api/axios";
import { useBehaviorMonitor } from "../../hooks/useBehaviorMonitor";
import { useWatermark } from "../../hooks/useWatermark";
import WatermarkOverlay from "../watermark/WatermarkOverlay";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/* ─── Keyframe animations ─── */
const styleSheet = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes warnSlide {
    0%   { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.92); }
    15%  { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
    85%  { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.96); }
  }
  @keyframes blackoutFade {
    0%   { opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes gradientShift {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(56px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-56px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
    50%       { box-shadow: 0 0 40px rgba(6,182,212,0.5); }
  }

  * { font-family: 'Inter', sans-serif; }

  .pdf-anim      { animation: fadeInUp 0.5s cubic-bezier(.22,1,.36,1) both; }
  .warn-toast    { animation: warnSlide 3.1s ease forwards; }
  .blackout-anim { animation: blackoutFade 3.1s ease forwards; }
  .slide-right   { animation: slideInRight 0.35s cubic-bezier(.22,1,.36,1) both; }
  .slide-left    { animation: slideInLeft  0.35s cubic-bezier(.22,1,.36,1) both; }

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
    background: rgba(4,31,26,0.5);
    border: 1px solid rgba(16,185,129,0.15);
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
  .icon-btn { background: linear-gradient(135deg,#059669,#0891b2); animation: pulseGlow 3s ease-in-out infinite; }

  .nav-btn {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .nav-btn:hover  { transform: scale(1.08); }
  .nav-btn:active { transform: scale(0.95); }
  .nav-btn:disabled { opacity: 0.25; cursor: not-allowed; transform: none; }

  .page-canvas {
    border-radius: 10px;
    box-shadow: 0 20px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.12);
    display: block;
    max-width: 100%;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
  }
`;

const SecurePdfViewer = ({ id }) => {
  const containerRef         = useRef(null);
  const protectiveOverlayRef = useRef(null); // direct DOM — instant blackout
  const metaDownRef          = useRef(false);
  const shiftDownRef         = useRef(false);
  const wasKeyHeldRef        = useRef(false);
  const pagesRef             = useRef([]);
  const animKeyRef           = useRef(0);

  const { isLocked } = useBehaviorMonitor();
  const watermark    = useWatermark();

  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [screenshotWarn,     setScreenshotWarn]     = useState(false);
  const [blackout,           setBlackout]           = useState(false);
  const [screenshotAttempts, setScreenshotAttempts] = useState(0);
  const [totalPages,         setTotalPages]         = useState(0);
  const [renderedPages,      setRenderedPages]      = useState(0);
  const [currentPage,        setCurrentPage]        = useState(1);
  const [slideDir,           setSlideDir]           = useState("right");

  /* ── Toast helpers ── */
  const triggerWarn = useCallback(() => {
    setScreenshotWarn(false);
    requestAnimationFrame(() => {
      setScreenshotWarn(true);
      setTimeout(() => setScreenshotWarn(false), 3100);
    });
  }, []);

  const triggerBlackout = useCallback(() => {
    setBlackout(false);
    requestAnimationFrame(() => {
      setBlackout(true);
      setTimeout(() => setBlackout(false), 3100);
    });
  }, []);

  /* ══════════════════════════════════════════════════════════════
     🔒  SCREENSHOT PROTECTION

     KEY FIX: protectiveOverlayRef.current.style.display is set
     synchronously inside the JS event handler — NO React render
     cycle delay. The DOM update happens in the same microtask,
     so the browser sees black BEFORE the snipping tool captures.
  ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const isWin = /win/i.test(navigator.platform);
    const isMac = /mac/i.test(navigator.platform);

    const showOverlay = () => {
      if (protectiveOverlayRef.current)
        protectiveOverlayRef.current.style.display = "flex";
    };
    const hideOverlay = () => {
      if (protectiveOverlayRef.current)
        protectiveOverlayRef.current.style.display = "none";
    };
    const instantBlackout = () => {
        showOverlay();
        setTimeout(() => {
            if (!wasKeyHeldRef.current) hideOverlay();
        }, 3100);
    };

    const updateKeyHeld = () => {
      if (isWin && metaDownRef.current && shiftDownRef.current) {
        showOverlay();
        if (!wasKeyHeldRef.current) {
          wasKeyHeldRef.current = true;
          setScreenshotAttempts(n => n + 1);
          triggerWarn();
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
        (isWin && e.altKey && e.metaKey && e.key.toLowerCase() === "r") ||
        (isWin && e.metaKey && e.key.toLowerCase() === "g") ||
        (isMac && e.metaKey && e.shiftKey && ["3","4","5"].includes(e.key));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        instantBlackout();
        setScreenshotAttempts(n => n + 1);
        triggerWarn();
        triggerBlackout();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "Meta")  { metaDownRef.current  = false; updateKeyHeld(); }
      if (e.key === "Shift") { shiftDownRef.current = false; updateKeyHeld(); }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") { instantBlackout(); triggerWarn(); triggerBlackout(); }
    };

    const handleBlur = () => { instantBlackout(); triggerBlackout(); triggerWarn(); };
    const blockCtx   = (e) => e.preventDefault();

    window.addEventListener("keydown",       handleKeyDown,   true);
    window.addEventListener("keyup",         handleKeyUp,     true);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur",          handleBlur);
    document.addEventListener("contextmenu", blockCtx);

    return () => {
      window.removeEventListener("keydown",       handleKeyDown,   true);
      window.removeEventListener("keyup",         handleKeyUp,     true);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur",          handleBlur);
      document.removeEventListener("contextmenu", blockCtx);
    };
  }, [triggerWarn, triggerBlackout]);

  /* ── Load & pre-render all pages into pagesRef ── */
  useEffect(() => {
    let pdfDoc = null, cancelled = false;
    pagesRef.current = [];

    const loadPdf = async () => {
      try {
        setLoading(true); setError(null); setRenderedPages(0); setTotalPages(0); setCurrentPage(1);

        const urlRes    = await api.get(`/api/student/pdf/url/${id}`);
        let rawUrl      = typeof urlRes.data === "string" ? urlRes.data : urlRes.data.url;
        const signedUrl = rawUrl.trim().replace(/^(https?):\s*\/\//, "$1://");
        if (cancelled) return;

        const res  = await api.get(signedUrl, { responseType: "arraybuffer", headers: { Accept: "application/pdf" } });
        if (cancelled) return;

        pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(res.data) }).promise;
        if (cancelled) return;

        setTotalPages(pdfDoc.numPages);

        for (let p = 1; p <= pdfDoc.numPages; p++) {
          if (cancelled) break;
          const page     = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas   = document.createElement("canvas");
          canvas.height  = viewport.height;
          canvas.width   = viewport.width;
          canvas.className = "page-canvas";
          canvas.addEventListener("contextmenu", e => e.preventDefault());
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
          pagesRef.current.push(canvas);
          if (!cancelled) setRenderedPages(p);
        }
        setLoading(false);
      } catch (err) {
        const s = err.response?.status;
        if (s === 401) setError("Session expired. Please login again.");
        else if (s === 403) setError("You don't have permission to view this content.");
        else setError("Failed to load PDF. Please try again.");
        setLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; if (pdfDoc) pdfDoc.destroy(); };
  }, [id]);

  /* ── Mount current page canvas on change ── */
  useEffect(() => {
    if (!containerRef.current || pagesRef.current.length === 0) return;
    const canvas = pagesRef.current[currentPage - 1];
    if (!canvas) return;
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(canvas);
  }, [currentPage, loading]);

  const goTo = (dir) => {
    const next = dir === "right" ? currentPage + 1 : currentPage - 1;
    if (next < 1 || next > totalPages) return;
    setSlideDir(dir);
    animKeyRef.current += 1;
    setCurrentPage(next);
  };

  const pct = totalPages > 0 ? Math.round((renderedPages / totalPages) * 100) : 0;

  return (
    <div className="relative min-h-screen"
      style={{ background: "linear-gradient(160deg, #020c10 0%, #041f1a 45%, #061510 100%)" }}>
      <style>{styleSheet}</style>

      {/* ── DIRECT-DOM protective overlay ── */}
      <div
        ref={protectiveOverlayRef}
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          zIndex: 2147483647,
          background: "#000",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          userSelect: "none",
        }}
      >
        <div style={{ fontSize: "64px" }}>🛡️</div>
        <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700 }}>Content Protected</p>
        <p style={{ color: "#6ee7b7", fontSize: "14px" }}>Screenshot capture is not permitted on this page.</p>
      </div>

      {/* Ambient glows */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 70%)", filter: "blur(60px)" }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(6,182,212,0.06) 0%,transparent 70%)", filter: "blur(80px)" }} />
      <div className="fixed top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.25),transparent)" }} />

      {watermark && <WatermarkOverlay text={watermark.text} />}

      {/* Transient blackout */}
      {blackout && (
        <div className="blackout-anim fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
          style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(24px)" }}>
          <div className="text-6xl select-none">🛡️</div>
          <p className="text-white text-2xl font-bold">Content Protected</p>
          <p className="text-sm" style={{ color: "#6ee7b7" }}>Screenshot capture is not permitted.</p>
        </div>
      )}

      {/* Warning toast */}
      {screenshotWarn && (
        <div className="warn-toast fixed top-6 left-1/2 z-[90] flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-semibold select-none"
          style={{
            background: "linear-gradient(135deg,rgba(220,38,38,0.95),rgba(185,28,28,0.95))",
            border: "1px solid rgba(248,113,113,0.4)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(220,38,38,0.4)",
            color: "#fff",
          }}>
          <span className="text-xl">🚫</span>
          <span>Screenshots are not allowed on this page</span>
        </div>
      )}

      {/* Behavior lock */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{ backdropFilter: "blur(20px)", background: "rgba(0,0,0,0.75)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p className="text-white text-xl font-bold">Security Lock Triggered</p>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="pdf-anim max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-btn w-11 h-11 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <h1 className="gradient-title text-xl font-bold tracking-tight">Secure PDF Viewer</h1>
              <p className="text-xs" style={{ color: "rgba(52,211,153,0.5)" }}>Content protected · SecureLearn</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="secure-badge rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5" style={{ color: "#6ee7b7" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              DRM Protected
            </span>
            {totalPages > 0 && (
              <span className="secure-badge rounded-full px-3 py-1 text-xs font-medium" style={{ color: "#67e8f9" }}>
                {totalPages} pages
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && !error && (
          <div className="glass-card flex flex-col items-center justify-center py-24 gap-6 rounded-2xl">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full" style={{ border: "3px solid rgba(16,185,129,0.12)" }}/>
              <div className="absolute inset-0 rounded-full"
                style={{ border: "3px solid transparent", borderTopColor: "#10b981", animation: "spin 0.9s linear infinite" }}/>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(52,211,153,0.7)">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <p className="text-sm font-medium" style={{ color: "#6ee7b7" }}>
                {totalPages > 0 ? `Rendering page ${renderedPages} of ${totalPages}…` : "Loading secure document…"}
              </p>
              {totalPages > 0 ? (
                <div className="w-full">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(16,185,129,0.12)" }}>
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }}/>
                  </div>
                  <p className="text-right text-xs mt-1" style={{ color: "rgba(52,211,153,0.4)" }}>{pct}%</p>
                </div>
              ) : (
                <div className="shimmer-bar w-48 h-2"/>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card flex flex-col items-center justify-center py-24 gap-4 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-rose-300 font-semibold">{error}</p>
            {error.includes("login") && (
              <a href="/login" style={{ color: "#34d399" }} className="text-sm underline hover:opacity-80">Go to Login →</a>
            )}
          </div>
        )}

        {/* ══ Horizontal Page Slider ══ */}
        {!loading && !error && totalPages > 0 && (
          <div className="flex flex-col items-center gap-5">

            {/* Page counter */}
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "rgba(52,211,153,0.5)" }}>Page</span>
              <span className="text-white font-bold text-xl">{currentPage}</span>
              <span className="text-sm" style={{ color: "rgba(52,211,153,0.35)" }}>/ {totalPages}</span>
            </div>

            {/* Slider row */}
            <div className="flex items-center gap-5 w-full justify-center">

              {/* Left */}
              <button className="nav-btn flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: currentPage <= 1
                    ? "rgba(16,185,129,0.05)"
                    : "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.2))",
                  border: "1px solid rgba(52,211,153,0.25)",
                }}
                onClick={() => goTo("left")}
                disabled={currentPage <= 1}
                aria-label="Previous page">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              {/* Canvas display */}
              <div className="glass-card relative rounded-2xl flex-1 flex justify-center overflow-hidden"
                style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.55)", padding: "24px", maxHeight: "80vh", overflowY: "auto",
                  scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.25) transparent" }}
                onContextMenu={e => e.preventDefault()}>
                <div
                  key={`${currentPage}-${animKeyRef.current}`}
                  className={slideDir === "right" ? "slide-right" : "slide-left"}
                  ref={containerRef}
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                />
              </div>

              {/* Right */}
              <button className="nav-btn flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: currentPage >= totalPages
                    ? "rgba(16,185,129,0.05)"
                    : "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.2))",
                  border: "1px solid rgba(52,211,153,0.25)",
                }}
                onClick={() => goTo("right")}
                disabled={currentPage >= totalPages}
                aria-label="Next page">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-xs">
              {Array.from({ length: Math.min(totalPages, 15) }, (_, i) => {
                const pg = i + 1;
                if (totalPages > 15 && i === 14)
                  return <span key="…" style={{ color: "rgba(52,211,153,0.35)" }} className="text-xs px-1">…{totalPages}</span>;
                return (
                  <button key={pg}
                    onClick={() => { setSlideDir(pg > currentPage ? "right" : "left"); animKeyRef.current += 1; setCurrentPage(pg); }}
                    style={{
                      width: currentPage === pg ? "24px" : "8px",
                      height: "8px", borderRadius: "4px", border: "none", cursor: "pointer", padding: 0,
                      background: currentPage === pg
                        ? "linear-gradient(90deg,#10b981,#06b6d4)"
                        : "rgba(16,185,129,0.25)",
                      transition: "all 0.25s ease",
                      boxShadow: currentPage === pg ? "0 0 8px rgba(16,185,129,0.5)" : "none",
                    }}
                    aria-label={`Go to page ${pg}`}
                  />
                );
              })}
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between w-full rounded-xl px-5 py-3"
              style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <p className="text-xs flex items-center gap-2" style={{ color: "rgba(52,211,153,0.55)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Content is protected. Screenshots &amp; copying are not permitted.
              </p>
              <div className="flex items-center gap-3">
                {screenshotAttempts > 0 && (
                  <span className="attempt-badge flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    {screenshotAttempts} attempt{screenshotAttempts !== 1 ? "s" : ""} detected
                  </span>
                )}
                <span className="text-xs font-mono" style={{ color: "rgba(16,185,129,0.3)" }}>{totalPages} pages · ID: {id}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurePdfViewer;
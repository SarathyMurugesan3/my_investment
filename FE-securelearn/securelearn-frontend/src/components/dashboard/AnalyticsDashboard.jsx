import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  @keyframes countUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes barGrow {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @keyframes ringFill {
    from { stroke-dashoffset: 283; }
  }
  @keyframes areaPath {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .dash-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    backdrop-filter: blur(16px);
    transition: border-color .2s, box-shadow .2s;
  }
  .dash-card:hover { border-color: rgba(255,255,255,0.14); }

  .kpi-emerald { border-color: rgba(16,185,129,0.25); box-shadow: 0 0 40px -12px rgba(16,185,129,0.18); }
  .kpi-cyan    { border-color: rgba(6,182,212,0.25);  box-shadow: 0 0 40px -12px rgba(6,182,212,0.18);  }
  .kpi-rose    { border-color: rgba(244,63,94,0.25);  box-shadow: 0 0 40px -12px rgba(244,63,94,0.18);  }
  .kpi-indigo  { border-color: rgba(99,102,241,0.25); box-shadow: 0 0 40px -12px rgba(99,102,241,0.18); }

  .kpi-emerald:hover { border-color: rgba(16,185,129,0.5); }
  .kpi-cyan:hover    { border-color: rgba(6,182,212,0.5);  }
  .kpi-rose:hover    { border-color: rgba(244,63,94,0.5);  }
  .kpi-indigo:hover  { border-color: rgba(99,102,241,0.5); }

  .bar-col { transform-origin: bottom; animation: barGrow .6s cubic-bezier(.22,1,.36,1) both; }
  .bar-col:hover .bar-tooltip { opacity:1; transform: translateY(0); }
  .bar-tooltip {
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity .15s, transform .15s;
    pointer-events: none;
  }
  .area-path { animation: areaPath .8s ease both; }
  .ring-circle { animation: ringFill 1.2s cubic-bezier(.22,1,.36,1) both; }

  .gradient-title {
    background: linear-gradient(135deg,#34d399,#22d3ee,#818cf8);
    background-size: 200% 200%;
    animation: gradientShift 5s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .live-dot { animation: pulse 1.8s ease-in-out infinite; }
  .fade-up  { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
`;

/* ─────────────────────────────────────────────────────────────
   ANIMATED COUNT-UP HOOK
───────────────────────────────────────────────────────────── */
const useCountUp = (target, duration = 1000) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
};

/* ─────────────────────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, unit = "", sub, icon, colorClass, glowColor, trend, delay = 0 }) => {
  const count = useCountUp(value);
  return (
    <div
      className={`dash-card ${colorClass} p-6 flex flex-col gap-4 relative overflow-hidden`}
      style={{ animation: `fadeUp .5s cubic-bezier(.22,1,.36,1) ${delay}ms both` }}
    >
      {/* glow blob */}
      <div style={{ position:"absolute", top:0, right:0, width:"100px", height:"100px",
        background:`radial-gradient(circle,${glowColor} 0%,transparent 70%)`, filter:"blur(24px)", pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <p style={{ fontSize:"12px", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", color:"rgba(255,255,255,0.45)" }}>{label}</p>
        <div style={{ fontSize:"22px" }}>{icon}</div>
      </div>

      <div>
        <p style={{ fontSize:"36px", fontWeight:900, color:"#fff", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>
          {count.toLocaleString()}<span style={{ fontSize:"20px", fontWeight:500, color:"rgba(255,255,255,0.4)", marginLeft:"2px" }}>{unit}</span>
        </p>
        {sub && <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", marginTop:"6px" }}>{sub}</p>}
      </div>

      {trend !== undefined && (
        <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px" }}>
          <span style={{ color: trend >= 0 ? "#34d399" : "#f87171", fontWeight:700 }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span style={{ color:"rgba(255,255,255,0.3)" }}>vs last week</span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   BAR CHART — Video Watch Time
───────────────────────────────────────────────────────────── */
const BarChart = ({ data, color = "#10b981" }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", height:"160px", gap:"6px", paddingBottom:"4px" }}>
      {data.map((item, i) => {
        const pct = (item.value / max) * 100;
        return (
          <div key={i} className="bar-col" style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1, height:"100%", justifyContent:"flex-end", animationDelay:`${i*60}ms`, position:"relative" }}>
            <div className="bar-tooltip" style={{ position:"absolute", top: `${100 - pct - 14}%`, background:"rgba(0,0,0,0.85)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:700, color:"#fff", whiteSpace:"nowrap" }}>
              {item.value}{item.unit || ""}
            </div>
            <div style={{ width:"100%", height:`${pct}%`, background:`linear-gradient(to top, ${color}, ${color}88)`, borderRadius:"6px 6px 3px 3px", minHeight:"4px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(255,255,255,0.1) 0%,transparent 100%)" }}/>
            </div>
            <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", marginTop:"6px", fontWeight:600 }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SPARKLINE — Active Sessions Trend (SVG area chart)
───────────────────────────────────────────────────────────── */
const Sparkline = ({ data, color = "#22d3ee" }) => {
  const W = 400, H = 90;
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * W,
    H - (d.value / max) * (H - 16),
  ]);
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"100%", overflow:"visible" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path className="area-path" d={areaD} fill="url(#areaGrad)"/>
      <path className="area-path" d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} opacity="0.8"/>
      ))}
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────
   DONUT / RING CHART — Risk Distribution
───────────────────────────────────────────────────────────── */
const DonutChart = ({ segments, size = 120 }) => {
  const r = 44, cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14"/>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            className="ring-circle"
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transform:"rotate(-90deg)", transformOrigin:"center", animationDelay:`${i*200}ms` }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900" fontFamily="Inter">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="10" fontFamily="Inter">alerts</text>
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────
   RISK EVENT ROW
───────────────────────────────────────────────────────────── */
const RiskRow = ({ event, delay }) => {
  const colors = {
    SCREENSHOT: { bg:"rgba(244,63,94,0.12)", border:"rgba(244,63,94,0.3)", text:"#fca5a5", icon:"📸" },
    TAB_SWITCH: { bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)", text:"#fcd34d", icon:"⚠️" },
    DEVTOOLS:   { bg:"rgba(168,85,247,0.12)", border:"rgba(168,85,247,0.3)", text:"#d8b4fe", icon:"🔧" },
    RECORDING:  { bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)",  text:"#fca5a5", icon:"🎥" },
  };
  const c = colors[event.type] || colors.SCREENSHOT;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", animation:`fadeUp .4s ease ${delay}ms both` }}>
      <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:c.bg, border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>{c.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:"13px", fontWeight:600, color:"#e2e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{event.userEmail || "Unknown user"}</p>
        <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", marginTop:"2px" }}>{event.type?.replace(/_/g," ")} · {event.tenantName || "—"}</p>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <span style={{ fontSize:"11px", color:c.text, fontWeight:700, background:c.bg, border:`1px solid ${c.border}`, padding:"2px 8px", borderRadius:"6px" }}>×{event.count ?? 1}</span>
        <p style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)", marginTop:"4px" }}>{event.timeAgo || "just now"}</p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────────────────────── */
const SectionHead = ({ title, sub }) => (
  <div style={{ marginBottom:"20px", display:"flex", alignItems:"baseline", gap:"12px" }}>
    <div style={{ width:"3px", height:"20px", background:"linear-gradient(to bottom,#34d399,#22d3ee)", borderRadius:"4px", flexShrink:0, alignSelf:"center" }}/>
    <div>
      <h2 style={{ fontSize:"16px", fontWeight:800, color:"#fff", margin:0 }}>{title}</h2>
      {sub && <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginTop:"3px" }}>{sub}</p>}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   MOCK FALLBACK DATA
───────────────────────────────────────────────────────────── */
const MOCK = {
  totalStudents: 2840,
  activeSessions: 317,
  riskAlerts: 24,
  weeklyWatchHours: 1140,
  studentTrend: 12,
  sessionTrend: -4,
  watchTrend: 18,
  videoWatchStats: [
    { label:"Mon", value:168, unit:"h" },
    { label:"Tue", value:214, unit:"h" },
    { label:"Wed", value:187, unit:"h" },
    { label:"Thu", value:95,  unit:"h" },
    { label:"Fri", value:276, unit:"h" },
    { label:"Sat", value:302, unit:"h" },
    { label:"Sun", value:198, unit:"h" },
  ],
  sessionsTrend: [
    { label:"6h", value:120 },
    { label:"5h", value:145 },
    { label:"4h", value:210 },
    { label:"3h", value:280 },
    { label:"2h", value:317 },
    { label:"1h", value:260 },
    { label:"Now", value:317 },
  ],
  riskDistribution: [
    { label:"Screenshot", value:14, color:"#f43f5e" },
    { label:"Tab Switch", value:7,  color:"#f59e0b" },
    { label:"DevTools",   value:3,  color:"#a855f7" },
  ],
  recentRiskEvents: [
    { type:"SCREENSHOT", userEmail:"alice@acme.com",  tenantName:"Acme Corp",  count:4,  timeAgo:"2m ago" },
    { type:"TAB_SWITCH", userEmail:"raj@globtech.in", tenantName:"GlobTech",   count:2,  timeAgo:"5m ago" },
    { type:"DEVTOOLS",   userEmail:"kim@nexus.co",    tenantName:"Nexus LLC",  count:1,  timeAgo:"11m ago" },
    { type:"SCREENSHOT", userEmail:"sara@acme.com",   tenantName:"Acme Corp",  count:3,  timeAgo:"18m ago" },
    { type:"TAB_SWITCH", userEmail:"dan@tech.io",     tenantName:"TechIO",     count:5,  timeAgo:"24m ago" },
  ],
};

/* ═════════════════════════════════════════════════════════════
   ANALYTICS DASHBOARD
═════════════════════════════════════════════════════════════ */
const AnalyticsDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [warn,    setWarn]    = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setWarn(null);
      try {
        /* ── parallel fetches ── */
        const [dashRes, riskRes, sessRes] = await Promise.allSettled([
          api.get("/api/analytics/dashboard"),
          api.get("/api/analytics/risk-events"),
          api.get("/api/analytics/sessions-trend"),
        ]);

        if (cancelled) return;

        const dash = dashRes.status === "fulfilled" ? dashRes.value.data : null;
        const risks = riskRes.status === "fulfilled" ? riskRes.value.data : null;
        const sessions = sessRes.status === "fulfilled" ? sessRes.value.data : null;

        if (!dash) {
          setData(MOCK);
          setWarn("Using mock data — analytics API endpoint not yet available.");
        } else {
          setData({
            ...MOCK,
            ...dash,
            recentRiskEvents: risks ?? MOCK.recentRiskEvents,
            sessionsTrend: sessions ?? MOCK.sessionsTrend,
          });
        }
      } catch {
        if (!cancelled) {
          setData(MOCK);
          setWarn("Could not reach backend. Displaying demo data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refresh]);

  if (!data) return null;

  return (
    <>
      <style>{CSS}</style>

      <div style={{ minHeight:"100vh", padding:"32px", background:"linear-gradient(135deg,#020c10 0%,#041f1a 50%,#061015 100%)" }}>

        {/* ── Header ── */}
        <div className="fade-up" style={{ marginBottom:"32px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"16px" }}>
          <div>
            <p style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.2em", color:"rgba(52,211,153,0.6)", textTransform:"uppercase", marginBottom:"6px" }}>Control Center</p>
            <h1 className="gradient-title" style={{ fontSize:"32px", fontWeight:900, margin:0, lineHeight:1.1 }}>Analytics Dashboard</h1>
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", marginTop:"8px" }}>Real-time telemetry · engagement · security risk monitoring</p>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            {loading ? (
              <div style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", color:"rgba(52,211,153,0.7)" }}>
                <svg style={{ width:"16px", height:"16px", animation:"spin 0.9s linear infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" opacity=".25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Syncing…
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"rgba(52,211,153,0.6)" }}>
                <span className="live-dot" style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#34d399", display:"inline-block" }}/>
                Live
              </div>
            )}
            <button
              onClick={() => setRefresh(r => r + 1)}
              style={{ padding:"8px 18px", borderRadius:"10px", border:"1px solid rgba(16,185,129,0.3)", background:"rgba(16,185,129,0.08)", color:"#34d399", fontSize:"12px", fontWeight:700, cursor:"pointer", transition:"all .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.16)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.08)"}
            >↺ Refresh</button>
          </div>
        </div>

        {/* ── Warning banner ── */}
        {warn && (
          <div style={{ marginBottom:"24px", padding:"12px 18px", borderRadius:"12px", border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.08)", color:"#fcd34d", fontSize:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
            <span>⚠️</span>{warn}
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"16px", marginBottom:"28px" }}>
          <KpiCard label="Total Students" value={data.totalStudents} icon="👥"
            colorClass="kpi-emerald" glowColor="rgba(16,185,129,0.3)"
            sub="Across all tenants" trend={data.studentTrend} delay={0} />
          <KpiCard label="Active Sessions" value={data.activeSessions} icon="⚡"
            colorClass="kpi-cyan" glowColor="rgba(6,182,212,0.3)"
            sub={<span>Live monitoring <span className="live-dot" style={{ display:"inline-block", width:"6px", height:"6px", borderRadius:"50%", background:"#22d3ee", marginLeft:"4px" }}/></span>}
            trend={data.sessionTrend} delay={80} />
          <KpiCard label="Risk Alerts" value={data.riskAlerts} icon="🚨"
            colorClass="kpi-rose" glowColor="rgba(244,63,94,0.3)"
            sub="Unresolved incidents" delay={160} />
          <KpiCard label="Weekly Watch Time" value={data.weeklyWatchHours} unit="h" icon="▶️"
            colorClass="kpi-indigo" glowColor="rgba(99,102,241,0.3)"
            sub="Aggregated consumption" trend={data.watchTrend} delay={240} />
        </div>

        {/* ── Charts row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"28px" }}>

          {/* Bar chart — Video Watch Time */}
          <div className="dash-card fade-up" style={{ padding:"24px", animationDelay:"320ms" }}>
            <SectionHead title="Video Watch Time" sub="Hours consumed per day (last 7 days)" />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", marginBottom:"16px" }}>
              <select style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"5px 12px", fontSize:"12px", color:"rgba(255,255,255,0.6)", outline:"none" }}>
                <option>Last 7 Days</option>
                <option>This Month</option>
              </select>
            </div>
            {data.videoWatchStats.length > 0 ? (
              <BarChart data={data.videoWatchStats} color="#10b981" />
            ) : (
              <div style={{ height:"160px", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.25)", fontSize:"13px" }}>No data available</div>
            )}
          </div>

          {/* Sparkline — Active Sessions Trend */}
          <div className="dash-card fade-up" style={{ padding:"24px", animationDelay:"400ms" }}>
            <SectionHead title="Sessions Trend" sub="Active sessions over the last 6 hours" />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
              <div>
                <span style={{ fontSize:"28px", fontWeight:900, color:"#22d3ee" }}>{data.activeSessions.toLocaleString()}</span>
                <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", marginLeft:"4px" }}>right now</span>
              </div>
              <span style={{ fontSize:"12px", color: data.sessionTrend >= 0 ? "#34d399" : "#f87171", fontWeight:700 }}>
                {data.sessionTrend >= 0 ? "↑" : "↓"} {Math.abs(data.sessionTrend)}%
              </span>
            </div>
            <div style={{ height:"90px" }}>
              <Sparkline data={data.sessionsTrend} color="#22d3ee" />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px" }}>
              {data.sessionsTrend.map((d, i) => (
                <span key={i} style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)", fontWeight:600 }}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Risk row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:"16px" }}>

          {/* Donut chart — Risk distribution */}
          <div className="dash-card fade-up" style={{ padding:"24px", animationDelay:"480ms" }}>
            <SectionHead title="Risk Breakdown" sub="Alert types distribution" />
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"20px" }}>
              <DonutChart segments={data.riskDistribution} size={140} />
              <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"10px" }}>
                {data.riskDistribution.map((s, i) => {
                  const total = data.riskDistribution.reduce((a, x) => a + x.value, 0) || 1;
                  const pct = Math.round((s.value / total) * 100);
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"10px", height:"10px", borderRadius:"3px", background:s.color, flexShrink:0 }}/>
                      <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", flex:1 }}>{s.label}</span>
                      <span style={{ fontSize:"12px", fontWeight:700, color:"#fff" }}>{s.value}</span>
                      <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", minWidth:"30px", textAlign:"right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent risk events feed */}
          <div className="dash-card fade-up" style={{ padding:"24px", animationDelay:"560ms" }}>
            <SectionHead title="Recent Risk Events" sub="Latest security violations across tenants" />
            <div>
              {data.recentRiskEvents.length === 0 ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 0", gap:"10px" }}>
                  <span style={{ fontSize:"32px" }}>✅</span>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"13px" }}>No risk events recorded</p>
                </div>
              ) : (
                data.recentRiskEvents.map((ev, i) => (
                  <RiskRow key={i} event={ev} delay={i * 60} />
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default AnalyticsDashboard;

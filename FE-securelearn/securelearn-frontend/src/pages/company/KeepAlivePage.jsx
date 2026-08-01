import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";

const KeepAlivePage = () => {
  const [isActive, setIsActive] = useState(true);
  const [intervalSec, setIntervalSec] = useState(30);
  const [countdown, setCountdown] = useState(30);
  const [targetEndpoint, setTargetEndpoint] = useState("/api/ping");

  // Metrics
  const [totalPings, setTotalPings] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [lastLatency, setLastLatency] = useState(null);
  const [avgLatency, setAvgLatency] = useState(null);
  const [latencies, setLatencies] = useState([]);
  const [lastPingTime, setLastPingTime] = useState(null);

  // Log entries
  const [logs, setLogs] = useState([]);

  const isPingingRef = useRef(false);

  // Function to execute a fake ping request
  const sendPing = useCallback(async () => {
    if (isPingingRef.current) return;
    isPingingRef.current = true;

    const startTime = performance.now();
    const timestamp = new Date().toLocaleTimeString();

    try {
      // Send request using configured endpoint or full Render URL
      const response = await api.get(targetEndpoint, {
        timeout: 10000
      });

      const latency = Math.round(performance.now() - startTime);

      setTotalPings(prev => prev + 1);
      setSuccessCount(prev => prev + 1);
      setLastLatency(latency);
      setLastPingTime(timestamp);

      setLatencies(prev => {
        const nextArr = [...prev, latency].slice(-20); // Keep last 20 latencies
        const sum = nextArr.reduce((a, b) => a + b, 0);
        setAvgLatency(Math.round(sum / nextArr.length));
        return nextArr;
      });

      const newLog = {
        id: Date.now(),
        time: timestamp,
        status: "SUCCESS",
        code: response.status || 200,
        latency: `${latency}ms`,
        url: targetEndpoint,
        message: "OK - Backend is alive"
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      const statusCode = err.response?.status || "ERR";

      setTotalPings(prev => prev + 1);
      setFailCount(prev => prev + 1);
      setLastLatency(latency);
      setLastPingTime(timestamp);

      const newLog = {
        id: Date.now(),
        time: timestamp,
        status: "FAILED",
        code: statusCode,
        latency: `${latency}ms`,
        url: targetEndpoint,
        message: err.message || "Ping failed"
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    } finally {
      isPingingRef.current = false;
      setCountdown(intervalSec);
    }
  }, [targetEndpoint, intervalSec]);

  // Initial ping on mount
  useEffect(() => {
    sendPing();
  }, [sendPing]);

  // Timer loop for 30-second interval countdown
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          sendPing();
          return intervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, intervalSec, sendPing]);

  const clearLogs = () => setLogs([]);

  const successRate = totalPings > 0 ? Math.round((successCount / totalPings) * 100) : 100;
  const progressPercent = Math.max(0, Math.min(100, ((intervalSec - countdown) / intervalSec) * 100));

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Render Keep-Alive
            </h1>
            <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isActive ? 'AUTOMATED PINGER ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <p className="text-slate-400 mt-2 text-base">
            Sends periodic ping requests every {intervalSec} seconds to keep your Render backend server awake.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
              isActive 
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            {isActive ? '⏸ Pause Service' : '▶ Resume Service'}
          </button>

          <button
            onClick={sendPing}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2"
          >
            ⚡ Ping Now
          </button>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/10 mb-8 backdrop-blur-md shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            ⏱ Next Ping In: <span className="text-cyan-400 font-mono text-base">{countdown}s</span>
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Target Endpoint: <code className="text-emerald-300 font-mono">{targetEndpoint}</code>
          </span>
        </div>

        <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden border border-white/10">
          <div 
            className="bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-500 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Pings</div>
          <div className="text-3xl font-black text-white mt-2 font-mono">{totalPings}</div>
          <div className="text-xs text-slate-500 mt-1">Requests sent so far</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Success Rate</div>
          <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">{successRate}%</div>
          <div className="text-xs text-emerald-500/80 mt-1">{successCount} OK / {failCount} Failed</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Last Latency</div>
          <div className="text-3xl font-black text-cyan-400 mt-2 font-mono">
            {lastLatency !== null ? `${lastLatency}ms` : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Last response time</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Latency</div>
          <div className="text-3xl font-black text-indigo-400 mt-2 font-mono">
            {avgLatency !== null ? `${avgLatency}ms` : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Rolling 20 ping average</div>
        </div>
      </div>

      {/* Settings Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/10 mb-8 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-300">Ping Interval:</label>
            <select
              value={intervalSec}
              onChange={(e) => {
                const val = Number(e.target.value);
                setIntervalSec(val);
                setCountdown(val);
              }}
              className="bg-black/50 border border-white/20 px-3 py-1.5 rounded-xl text-white outline-none focus:border-cyan-500 text-sm font-mono cursor-pointer"
            >
              <option value={15}>15 Seconds</option>
              <option value={30}>30 Seconds (Recommended)</option>
              <option value={60}>60 Seconds</option>
              <option value={120}>2 Minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-300">Endpoint Path:</label>
            <select
              value={targetEndpoint}
              onChange={(e) => setTargetEndpoint(e.target.value)}
              className="bg-black/50 border border-white/20 px-3 py-1.5 rounded-xl text-white outline-none focus:border-cyan-500 text-sm font-mono cursor-pointer"
            >
              <option value="/api/ping">/api/ping (Fast)</option>
              <option value="/api/admin/users/tutors">/api/admin/users/tutors</option>
              <option value="/actuator/health">/actuator/health</option>
            </select>
          </div>
        </div>

        <button
          onClick={clearLogs}
          className="text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors self-end md:self-center"
        >
          Clear Activity Log
        </button>
      </div>

      {/* Real-time Activity Log Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md bg-black/50 shadow-2xl">
        <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            📡 Real-Time Ping Activity Log
            <span className="text-xs font-normal text-slate-400">({logs.length} entries)</span>
          </h2>
          {lastPingTime && (
            <span className="text-xs text-slate-400">
              Last Pinged: <span className="text-white font-mono">{lastPingTime}</span>
            </span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="sticky top-0 bg-slate-900 border-b border-white/10 text-slate-400">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Endpoint</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">HTTP Code</th>
                <th className="p-3 font-semibold">Latency</th>
                <th className="p-3 font-semibold">Response Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500 font-sans">
                    Waiting for initial ping request...
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-slate-400">{log.time}</td>
                    <td className="p-3 text-cyan-300 font-semibold">{log.url}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{log.code}</td>
                    <td className="p-3 text-slate-300">{log.latency}</td>
                    <td className="p-3 text-slate-400 font-sans text-xs">{log.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KeepAlivePage;

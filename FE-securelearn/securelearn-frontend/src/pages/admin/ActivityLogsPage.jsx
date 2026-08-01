import { useEffect, useState } from "react";
import api from "../../api/axios";


const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/monitor/recent", { params: { hours: 24 } })
      .then((res) => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
        <div className="glass-panel p-6 rounded-2xl">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Activity Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">Security events from the last 24 hours.</p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-slate-400 p-4">Loading logs...</p>
          ) : logs.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center text-slate-400">
              No activity logged in the last 24 hours.
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id || index}
                className="glass-card p-5 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">User ID</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{log.userId || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Event</p>
                  <p className="text-sm font-bold text-indigo-300">{log.eventType || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">IP</p>
                  <p className="text-sm text-slate-300">{log.ip || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Time</p>
                  <p className="text-sm text-slate-400">{log.timestamp || "—"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityLogsPage;

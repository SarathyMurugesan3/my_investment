import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, AlertTriangle, ShieldAlert, FileText, Camera, ShieldCheck, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('/api/admin/dashboard/stats'),
        api.get('/api/admin/activity') // retrieves recent logs
      ]);
      setStats(statsRes.data);
      // Show most recent logs first
      const sortedLogs = logsRes.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(sortedLogs);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin stats and logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '80vh', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
        <h3>Loading Admin Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="content-container">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Monitor real-time student activities, system stats, and security alerts.</p>
        </div>
        <button onClick={() => { setLoading(true); fetchDashboardData(); }} className="btn btn-secondary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Refresh Center
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Grid of Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {/* Total Users */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '0.75rem', borderRadius: '12px' }}>
            <Users size={24} color="var(--primary)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Total Students</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{stats?.totalUsers || 0}</div>
          </div>
        </div>

        {/* High Risk Users */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', borderLeft: '3px solid var(--warning)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
            <AlertTriangle size={24} color="var(--warning)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>High Risk Users</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--warning)' }}>{stats?.highRiskUsers || 0}</div>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', borderLeft: '3px solid var(--danger)' }}>
          <div style={{ background: 'var(--danger-glow)', padding: '0.75rem', borderRadius: '12px' }}>
            <ShieldAlert size={24} color="var(--danger)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Suspended Accounts</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--danger)' }}>{stats?.blockedUsers || 0}</div>
          </div>
        </div>

        {/* Screenshot Attempts */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(157, 78, 221, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
            <Camera size={24} color="var(--secondary)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase' }}>Screenshot Flags</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--secondary)' }}>{stats?.totalScreenshotAttempts || 0}</div>
          </div>
        </div>
      </div>

      {/* Proctoring Log Activity Feed */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={22} color="var(--primary)" /> Real-Time Security Incident Stream
        </h2>

        {logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No security violations recorded on the network.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>User / Student Email</th>
                  <th style={{ padding: '1rem' }}>Action / Violation</th>
                  <th style={{ padding: '1rem' }}>Device Fingerprint</th>
                  <th style={{ padding: '1rem' }}>IP Address</th>
                  <th style={{ padding: '1rem' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{log.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${
                        log.action.includes('SCREENSHOT') || log.action.includes('VIOLATION') || log.action.includes('BLOCKED')
                          ? 'badge-danger'
                          : log.action.includes('LOGIN')
                          ? 'badge-primary'
                          : 'badge-warning'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.fingerprint || 'N/A'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{log.ipAddress || '127.0.0.1'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

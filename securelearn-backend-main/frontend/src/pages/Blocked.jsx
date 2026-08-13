import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, LogOut, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Blocked = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0c10',
      color: '#fff',
      padding: '2rem',
      position: 'relative'
    }}>
      <div className="glow-effect" style={{ top: '30%', left: '30%', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(0,0,0,0) 70%)', width: '400px', height: '400px' }}></div>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'var(--danger-glow)', marginBottom: '1.5rem' }}>
          <AlertOctagon size={48} color="var(--danger)" />
        </div>
        
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#f87171' }}>Access Suspended</h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Your account (<strong>{user?.email}</strong>) has been flagged and suspended due to multiple security violations during your exams or suspicious browser activities.
        </p>

        <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
          <Mail size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Contact your class instructor or school administrator to request an account review.
          </span>
        </div>

        <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
          <LogOut size={18} /> Sign Out of Account
        </button>
      </div>
    </div>
  );
};

export default Blocked;

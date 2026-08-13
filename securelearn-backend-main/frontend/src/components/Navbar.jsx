import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User, LayoutDashboard, FileText, BookOpen, Users } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav style={{
      background: 'var(--bg-dark-nav)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Shield size={24} color="var(--primary)" />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em'
          }}>
            SECURE<span style={{ color: 'var(--primary)' }}>LEARN</span>
          </span>
        </Link>

        {/* Links / Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user.role === 'ADMIN' ? (
            <>
              <Link to="/admin" style={navLinkStyle}><LayoutDashboard size={18} /> Dashboard</Link>
              <Link to="/admin/users" style={navLinkStyle}><Users size={18} /> Students</Link>
              <Link to="/admin/content" style={navLinkStyle}><BookOpen size={18} /> Content</Link>
              <Link to="/admin/exams" style={navLinkStyle}><FileText size={18} /> Exams</Link>
            </>
          ) : (
            <>
              <Link to="/" style={navLinkStyle}><BookOpen size={18} /> Content Library</Link>
            </>
          )}

          {/* User Widget */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{user.name || user.email}</span>
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                {user.role}
              </span>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '10px' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const navLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
  transition: 'var(--transition-smooth)'
};

export default Navbar;

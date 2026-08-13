import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserPlus, Shield, ShieldAlert, Trash2, Key, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const UserManagement = () => {
  // Paged users list
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student creation form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get paged list from manage-users endpoint
      const response = await api.get('/api/admin/manage-users', {
        params: { page, size: 10, sortBy: 'email' }
      });
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess(false);
    setSubmitting(true);

    try {
      // Endpoint is /api/admin/users
      await api.post('/api/admin/users', { name, email, password });
      setCreateSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers(); // reload list
    } catch (err) {
      setCreateError(err.response?.data || 'Failed to create student. Check if email is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockUser = async (id) => {
    if (!window.confirm('Are you sure you want to block this student? They will not be able to log in or view courses.')) return;
    try {
      await api.post(`/api/admin/manage-users/${id}/block`);
      fetchUsers();
    } catch (err) {
      alert('Failed to block user.');
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      await api.post(`/api/admin/manage-users/${id}/unblock`);
      fetchUsers();
    } catch (err) {
      alert('Failed to unblock user.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this student account? This action is irreversible.')) return;
    try {
      await api.delete(`/api/admin/manage-users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  return (
    <div className="content-container">
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem' }}>Student Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr 1.5fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Create Student Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <UserPlus size={20} color="var(--primary)" /> Add New Student
          </h2>

          {createError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {createError}
            </div>
          )}

          {createSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Student created and linked successfully!
            </div>
          )}

          <form onSubmit={handleCreateStudent}>
            <div className="form-group">
              <label className="form-label">Student Name</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Alex Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="alex@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Initial Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%' }}>
              {submitting ? 'Creating...' : 'Register Student'}
            </button>
          </form>
        </div>

        {/* Students List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Enrolled Students</h2>
            <button onClick={fetchUsers} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.75rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--primary)' }}>Loading Students...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No students enrolled under your admin account.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Student Details</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Risk Score</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((student) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{student.name || 'No Name'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: (student.riskScore || 0) >= 30 ? 'var(--danger)' : 'var(--success)' }}>
                            {student.riskScore || 0}%
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${student.blocked ? 'badge-danger' : 'badge-success'}`}>
                            {student.blocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {student.blocked ? (
                              <button onClick={() => handleUnblockUser(student.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '8px' }} title="Unblock Student & Reset Risk">
                                <Shield size={14} color="var(--success)" />
                              </button>
                            ) : (
                              <button onClick={() => handleBlockUser(student.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '8px' }} title="Block Student">
                                <ShieldAlert size={14} color="var(--danger)" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteUser(student.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '8px' }} title="Delete Account">
                              <Trash2 size={14} color="var(--text-muted)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages || 1}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

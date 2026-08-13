import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, FileText, Play, ArrowRight, Eye, User, ShieldAlert } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contents, setContents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, examRes] = await Promise.all([
          api.get('/api/student/content'),
          api.get('/api/student/exams')
        ]);
        setContents(contentRes.data);
        setExams(examRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartExam = async (examId) => {
    if (!window.confirm('Starting the exam will activate full proctoring mode. Your tab switches, exits from fullscreen, and other activities will be monitored. Do you want to proceed?')) {
      return;
    }
    
    try {
      const response = await api.post(`/api/student/exams/${examId}/start`);
      // Start response holds the exam attempt
      const attempt = response.data;
      navigate(`/exams/${examId}/active`, { state: { attemptId: attempt.id } });
    } catch (err) {
      alert(err.response?.data || 'Could not start exam. You may have an active attempt already.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '80vh', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
        <h3>Loading Student Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="content-container">
      {/* Header Profile Summary */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, {user?.name || user?.email}!</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Access your school learning material and exams securely.</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.5rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Current Risk Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: (user?.riskScore || 0) > 30 ? 'var(--danger)' : 'var(--success)', marginTop: '0.25rem' }}>
              {user?.riskScore || 0} %
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.5rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Account Status</div>
            <div style={{ marginTop: '0.25rem' }}>
              <span className={`badge ${user?.blocked ? 'badge-danger' : 'badge-success'}`}>
                {user?.blocked ? 'Suspended' : 'Good Standing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Contents Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <BookOpen color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.5rem' }}>Learning Materials</h2>
          </div>

          {contents.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No study materials have been uploaded by your instructor yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contents.map((item) => (
                <div key={item.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{item.description || 'No description provided'}</p>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className={`badge ${item.contentType === 'VIDEO' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                        {item.contentType}
                      </span>
                    </div>
                  </div>
                  <Link to={`/content/${item.id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    {item.contentType === 'VIDEO' ? <Play size={16} /> : <Eye size={16} />} Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exams Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileText color="var(--secondary)" size={24} />
            <h2 style={{ fontSize: '1.5rem' }}>Assigned Exams</h2>
          </div>

          {exams.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No active exams have been assigned to you.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {exams.map((exam) => (
                <div key={exam.id} className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--secondary)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{exam.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                    {exam.description || 'No description available.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Questions: {exam.questionIds?.length || 0} MCQs
                    </span>
                    <button onClick={() => handleStartExam(exam.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      Start Exam <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

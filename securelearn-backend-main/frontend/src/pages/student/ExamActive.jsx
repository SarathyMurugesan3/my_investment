import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const ExamActive = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  
  // attemptId is passed down in the router state from Dashboard
  const attemptId = location.state?.attemptId;

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Proctoring States
  const [riskScore, setRiskScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState([]);
  const isSubmitting = useRef(false);

  // 1. Fetch Questions
  useEffect(() => {
    if (!attemptId) {
      setError('Invalid attempt session. Please launch the exam from your dashboard.');
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/api/student/exams/${examId}/questions`);
        setQuestions(response.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data || 'Failed to load exam questions. Make sure you started the exam first.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [examId, attemptId]);

  // 2. Request and Monitor Fullscreen
  useEffect(() => {
    if (loading || error) return;

    const requestFullscreen = async () => {
      try {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.warn("Fullscreen request rejected", err);
      }
    };

    requestFullscreen();

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && !isSubmitting.current) {
        logViolation('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [loading, error]);

  // 3. Tab Switching / Blur / Loss of Focus detection
  useEffect(() => {
    if (loading || error) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isSubmitting.current) {
        logViolation('TAB_SWITCH');
      }
    };

    const handleWindowBlur = () => {
      if (!isSubmitting.current) {
        logViolation('TAB_SWITCH');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [loading, error]);

  // 4. Disable context menu, Copy, Paste, PrintScreen, developer tools
  useEffect(() => {
    if (loading || error) return;

    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => {
      e.preventDefault();
      logScreenshotAttempt();
    };
    const handlePaste = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      // Prevent devtools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        alert('Developer console access is prohibited during the exam.');
      }
      
      // Prevent Copy-Paste shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        logScreenshotAttempt();
      }

      // Check printscreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logScreenshotAttempt();
      }
    };

    // Print prevention
    const handleBeforePrint = (e) => {
      e.preventDefault();
      logScreenshotAttempt();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [loading, error]);

  // Helper: Log proctoring violation to backend
  const logViolation = async (type) => {
    try {
      const response = await api.post(`/api/student/exams/attempts/${attemptId}/log-violation`, null, {
        params: { type }
      });
      const data = response.data;
      setRiskScore(data.currentRiskScore);
      setViolations(prev => [...prev, { type, timestamp: new Date().toLocaleTimeString(), risk: data.currentRiskScore }]);

      // Check if user is blocked (threshold limit is 50 usually)
      if (data.currentRiskScore >= 50) {
        setUser(prev => ({ ...prev, blocked: true }));
        // Exit fullscreen before redirecting to blocked page
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        navigate('/blocked');
      }
    } catch (err) {
      console.error('Failed to log violation', err);
    }
  };

  // Helper: Log screenshot/print attempts to backend
  const logScreenshotAttempt = async () => {
    try {
      const fingerprint = localStorage.getItem('deviceFingerprint') || 'unknown';
      await api.post(`/api/monitor/screenshot`, null, {
        params: { fingerprint }
      });
      alert('Security Warning: Screenshot, Print, or Text copying detected. This attempt has been logged.');
      logViolation('TAB_SWITCH'); // Treat copy/screenshot as a tab switch penalty
    } catch (err) {
      console.error('Screenshot log failed', err);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Are you sure you want to submit your exam answers?')) {
      return;
    }

    isSubmitting.current = true;

    try {
      // Exit fullscreen
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
      
      await api.post(`/api/student/exams/attempts/${attemptId}/submit`, answers);
      alert('Exam submitted successfully! Returning to dashboard.');
      navigate('/');
    } catch (err) {
      alert(err.response?.data || 'Failed to submit exam.');
      isSubmitting.current = false;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c10', color: 'var(--primary)' }}>
        <h3>Loading Exam Environment...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c10', color: '#fff', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0c10', color: '#fff', padding: '2rem' }}>
      {/* Proctoring Banner */}
      <div className="proctor-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="pulse-icon"></span>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>PROCTORING ACTIVE</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
              Do not switch tabs, exit fullscreen, copy/paste, or screenshot.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {!isFullscreen && (
            <button
              onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
              className="btn btn-danger"
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              Re-enter Fullscreen
            </button>
          )}
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Risk Score: <strong style={{ color: riskScore > 30 ? 'var(--danger)' : 'var(--success)' }}>{riskScore}%</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* MCQ Workstation */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No questions found for this exam.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Question {currentIdx + 1} of {questions.length}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Answered: {Object.keys(answers).length} / {questions.length}
                </span>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '2rem', lineHeight: '1.5' }}>
                {currentQuestion?.text}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
                {currentQuestion?.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(currentQuestion.id, option)}
                      style={{
                        padding: '1.25rem 1.5rem',
                        textAlign: 'left',
                        background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        color: isSelected ? 'var(--primary)' : '#fff',
                        fontSize: '0.95rem',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <span style={{ marginRight: '1rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className="btn btn-secondary"
                >
                  <ArrowLeft size={16} /> Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="btn btn-secondary"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, var(--success), #059669)', color: '#fff', boxShadow: 'none' }}
                  >
                    <CheckCircle size={18} /> Submit Exam
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Proctoring logs panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={18} color="var(--warning)" /> Proctoring Log
            </h3>
            {violations.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No violations recorded so far. Keep it secure.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {violations.map((v, i) => (
                  <div key={i} style={{ padding: '0.5rem', borderLeft: '2px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px', fontSize: '0.75rem' }}>
                    <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{v.type}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.1rem' }}>At {v.timestamp} | Risk: {v.risk}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Question Navigator</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      aspectRatio: '1',
                      border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isAnswered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: isAnswered ? '#34d399' : '#fff',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamActive;

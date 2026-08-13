import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, PlusCircle, CheckSquare, Award, Users, Plus, RefreshCw } from 'lucide-react';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Exam builder states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // Question builder states
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');

  const [activeTab, setActiveTab] = useState('QUESTIONS'); // QUESTIONS or ATTEMPTS

  const fetchExams = async () => {
    try {
      const response = await api.get('/api/admin/exams');
      setExams(response.data);
      if (response.data.length > 0 && !selectedExam) {
        handleSelectExam(response.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    setLoading(true);
    try {
      const [questionsRes, attemptsRes] = await Promise.all([
        api.get(`/api/admin/exams/${exam.id}/questions`),
        api.get(`/api/admin/exams/${exam.id}/attempts`)
      ]);
      setQuestions(questionsRes.data);
      setAttempts(attemptsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/admin/exams', { title: newTitle, description: newDesc });
      setNewTitle('');
      setNewDesc('');
      fetchExams();
      handleSelectExam(response.data);
      alert('Exam created successfully! Now add questions to it.');
    } catch (err) {
      alert('Failed to create exam.');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) {
      alert('Please select or create an exam first.');
      return;
    }
    if (!qCorrect) {
      alert('Please select which option is correct.');
      return;
    }

    try {
      await api.post(`/api/admin/exams/${selectedExam.id}/questions`, {
        text: qText,
        options: qOptions.filter(o => o !== ''),
        correctAnswer: qCorrect
      });

      setQText('');
      setQOptions(['', '', '', '']);
      setQCorrect('');
      handleSelectExam(selectedExam); // reload questions
    } catch (err) {
      alert('Failed to add question to exam.');
    }
  };

  const handleOptionChange = (idx, value) => {
    const updated = [...qOptions];
    updated[idx] = value;
    setQOptions(updated);
  };

  return (
    <div className="content-container">
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem' }}>Exam & Question Builder</h1>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr 2.5fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Exams List Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Create Exam Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <PlusCircle size={18} color="var(--primary)" /> New Exam
            </h2>
            <form onSubmit={handleCreateExam}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Exam Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Midterm Quiz"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Description</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Short outline..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', resize: 'none' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                Create Exam
              </button>
            </form>
          </div>

          {/* Existing Exams List */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem' }}>Active Exams</h2>
              <button onClick={fetchExams} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
                <RefreshCw size={14} />
              </button>
            </div>

            {exams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No exams created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {exams.map((exam) => {
                  const isSelected = selectedExam?.id === exam.id;
                  return (
                    <button
                      key={exam.id}
                      onClick={() => handleSelectExam(exam)}
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: isSelected ? 'var(--primary)' : '#fff', fontSize: '0.9rem' }}>{exam.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Questions: {exam.questionIds?.length || 0}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Exam Workspace */}
        {selectedExam ? (
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            {/* Header Details */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>EXAM EDITOR</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.4rem' }}>{selectedExam.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{selectedExam.description || 'No description'}</p>
              </div>

              {/* Tabs switcher */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => setActiveTab('QUESTIONS')} className={`btn ${activeTab === 'QUESTIONS' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <CheckSquare size={16} /> Questions ({questions.length})
                </button>
                <button onClick={() => setActiveTab('ATTEMPTS')} className={`btn ${activeTab === 'ATTEMPTS' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Users size={16} /> Student Attempts ({attempts.length})
                </button>
              </div>
            </div>

            {/* Questions Tab */}
            {activeTab === 'QUESTIONS' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1.25fr 1fr))', gap: '2rem', alignItems: 'start' }}>
                {/* Questions List */}
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Current MCQ Bank</h3>
                  {questions.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)' }}>
                      No questions added to this exam yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {questions.map((q, i) => (
                        <div key={q.id} style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                            Q{i + 1}. {q.text}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div key={oIdx} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)', border: isCorrect ? '1px solid var(--success)' : '1px solid transparent', color: isCorrect ? '#34d399' : 'var(--text-secondary)' }}>
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Question Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    <Plus size={18} color="var(--primary)" /> Add MCQ
                  </h3>
                  <form onSubmit={handleAddQuestion}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Question Wording</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. What is the value of G?"
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: 0 }}>Multiple-Choice Options</label>
                      {qOptions.map((opt, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="radio"
                            name="correctAnswerOption"
                            checked={qCorrect === opt && opt !== ''}
                            onChange={() => setQCorrect(opt)}
                            disabled={opt === ''}
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            required
                            className="form-input"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                          />
                        </div>
                      ))}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                      Save Question
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Attempts Tab */}
            {activeTab === 'ATTEMPTS' && (
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Enrolled Student Submissions</h3>
                {attempts.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No students have attempted this exam yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem' }}>Student Reference</th>
                          <th style={{ padding: '0.75rem' }}>Score</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Tab Switches</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Fullscreen Exits</th>
                          <th style={{ padding: '0.75rem' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Submit Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((att) => (
                          <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{att.userId}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{att.score}</span> / {questions.length}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', color: att.tabSwitches > 2 ? 'var(--danger)' : '#fff' }}>
                              {att.tabSwitches || 0}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', color: att.fullscreenExits > 1 ? 'var(--danger)' : '#fff' }}>
                              {att.fullscreenExits || 0}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`badge ${
                                att.status === 'SUBMITTED' ? 'badge-success' : att.status === 'FLAGGED' ? 'badge-warning' : 'badge-danger'
                              }`} style={{ fontSize: '0.65rem' }}>
                                {att.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {att.endTime ? new Date(att.endTime).toLocaleString() : 'In Progress'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Select or create an exam from the sidebar to manage questions and track student metrics.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamManagement;

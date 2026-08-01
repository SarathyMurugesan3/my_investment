import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getExamDetails, getAdminExamQuestions, getExamAttempts, addQuestionToExam } from "../../api/examApi";

const AdminExamDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("QUESTIONS");
    const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [examRes, qRes, attRes] = await Promise.all([
                getExamDetails(id),
                getAdminExamQuestions(id),
                getExamAttempts(id)
            ]);
            setExam(examRes.data);
            setQuestions(qRes.data);
            setAttempts(attRes.data);
        } catch (error) {
            console.error("Failed to fetch exam details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionAdded = () => {
        setIsAddQuestionModalOpen(false);
        fetchData(); // refresh questions
    };

    if (loading) return <><div className="p-8 text-slate-400">Loading Exam Details...</div></>;
    if (!exam) return <><div className="p-8 text-rose-400">Failed to load exam.</div></>;

    return (
        <>
            <div className="space-y-6 relative animate-fade-in w-full max-w-7xl mx-auto">

                {/* Header glass panel */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-6 rounded-2xl gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => navigate("/admin/exams")} className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                {exam.title}
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 ml-8 max-w-2xl">{exam.description}</p>
                    </div>

                    <div className="flex gap-4 items-center shrink-0">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Duration</p>
                            <p className="text-lg font-bold text-white">{exam.durationMinutes} Mins</p>
                        </div>
                        <div className="w-px h-8 bg-white/10 mx-2"></div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Passing Score</p>
                            <p className="text-lg font-bold text-emerald-400">{exam.passingScore}%</p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 border-b border-white/5 pb-2">
                    <button
                        onClick={() => setActiveTab("QUESTIONS")}
                        className={`px-4 py-2 text-sm font-bold transition-all duration-300 relative ${activeTab === 'QUESTIONS' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Questions ({questions.length})
                        {activeTab === 'QUESTIONS' && <div className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab("ATTEMPTS")}
                        className={`px-4 py-2 text-sm font-bold transition-all duration-300 relative ${activeTab === 'ATTEMPTS' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Student Attempts ({attempts.length})
                        {activeTab === 'ATTEMPTS' && <div className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="animate-slide-up">
                    {activeTab === "QUESTIONS" && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsAddQuestionModalOpen(true)}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-indigo-500/30 transition-all text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Question
                                </button>
                            </div>

                            {questions.length === 0 ? (
                                <div className="p-12 text-center glass-panel rounded-2xl">
                                    <p className="text-slate-400">No questions added yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q, i) => (
                                        <div key={q.id} className="glass-card p-6">
                                            <h3 className="text-lg font-bold text-slate-200 mb-4">
                                                <span className="text-indigo-400 mr-2">Q{i + 1}.</span> {q.text}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                                                {q.options.map((opt, optIndex) => (
                                                    <div
                                                        key={optIndex}
                                                        className={`p-3 rounded-lg border text-sm transition-colors ${opt === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/5 text-slate-400'}`}
                                                    >
                                                        <span className="font-bold mr-2 text-slate-500">{String.fromCharCode(65 + optIndex)}.</span>
                                                        {opt}
                                                        {opt === q.correctAnswer && <span className="ml-2 text-xs uppercase tracking-widest font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 float-right">Correct</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "ATTEMPTS" && (
                        <div className="glass-panel rounded-2xl overflow-hidden mt-4">
                            <table className="min-w-full text-sm">
                                <thead className="bg-white/5 text-left border-b border-white/10 text-slate-300">
                                    <tr>
                                        <th className="p-4">Student ID</th>
                                        <th className="p-4 text-center">Score</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-center">Tab Switches</th>
                                        <th className="p-4 text-center">Fullscreen Exits</th>
                                        <th className="p-4 text-center">Risk Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.length === 0 ? (
                                        <tr><td colSpan="6" className="p-6 text-center text-slate-400">No attempts logged yet.</td></tr>
                                    ) : (
                                        attempts.map((att) => (
                                            <tr key={att.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-200">
                                                <td className="p-4 font-medium text-slate-200">{att.studentId}</td>
                                                <td className="p-4 text-center font-bold text-white">
                                                    {att.status === 'SUBMITTED' ? `${att.score}%` : '-'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-widest ${att.status === 'SUBMITTED' ? 'bg-indigo-500/20 text-indigo-300' :
                                                            att.status === 'FLAGGED' ? 'bg-rose-500/20 text-rose-300' :
                                                                'bg-teal-500/20 text-teal-300'
                                                        }`}>
                                                        {att.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center text-rose-300 font-bold">{att.tabSwitches}</td>
                                                <td className="p-4 text-center text-rose-300 font-bold">{att.fullscreenExits}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-md font-black ${att.riskScore > 20 ? 'text-rose-400 border border-rose-500/20 bg-rose-500/10' :
                                                            att.riskScore > 0 ? 'text-amber-400' : 'text-emerald-400'
                                                        }`}>
                                                        {att.riskScore}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isAddQuestionModalOpen && (
                <AddQuestionModal
                    examId={id}
                    onClose={() => setIsAddQuestionModalOpen(false)}
                    onSuccess={handleQuestionAdded}
                />
            )}
        </>
    );
};

const AddQuestionModal = ({ examId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        text: "",
        options: ["", "", "", ""],
        correctAnswer: ""
    });
    const [loading, setLoading] = useState(false);

    const handleOptionChange = (idx, val) => {
        const newOpts = [...formData.options];
        newOpts[idx] = val;
        setFormData({ ...formData, options: newOpts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.correctAnswer) return alert("Please select a correct answer");
        try {
            setLoading(true);
            await addQuestionToExam(examId, formData);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to add question");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Add Exam Question</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Question Text</label>
                        <textarea
                            required
                            rows={3}
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-medium"
                            placeholder="e.g. What annotation maps web requests?"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">Options & Correct Answer</label>
                        <div className="grid grid-cols-1 gap-3">
                            {formData.options.map((opt, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <input
                                        required
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                        placeholder={`Option ${idx + 1}`}
                                    />
                                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer shrink-0 w-24">
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            value={opt}
                                            checked={formData.correctAnswer === opt && opt !== ""}
                                            onChange={() => setFormData({ ...formData, correctAnswer: opt })}
                                            className="accent-indigo-500 w-4 h-4 cursor-pointer"
                                            disabled={!opt.trim()}
                                        />
                                        Correct
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50">
                            {loading ? "Adding..." : "Add Question"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminExamDetailsPage;

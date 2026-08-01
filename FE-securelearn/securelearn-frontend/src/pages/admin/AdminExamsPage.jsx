import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getAdminExams, createExam, getExamAttempts } from "../../api/examApi";

const AdminExamsPage = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await getAdminExams();
            const examsData = res.data;

            // Fetch attempt counts for each exam
            const examsWithAttempts = await Promise.all(
                examsData.map(async (exam) => {
                    try {
                        const attRes = await getExamAttempts(exam.id);
                        const attempts = attRes.data || [];
                        const submitted = attempts.filter(a => a.status === 'SUBMITTED');
                        const passed = submitted.filter(a => a.score >= exam.passingScore);
                        return {
                            ...exam,
                            attemptCount: attempts.length,
                            submittedCount: submitted.length,
                            passedCount: passed.length,
                            failedCount: submitted.length - passed.length,
                        };
                    } catch {
                        return { ...exam, attemptCount: 0, submittedCount: 0, passedCount: 0, failedCount: 0 };
                    }
                })
            );

            setExams(examsWithAttempts);
        } catch (error) {
            console.error("Failed to fetch exams", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setIsModalOpen(false);
        fetchExams();
    };

    return (
        <>
            <div className="space-y-6 relative animate-fade-in w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center glass-panel p-6 rounded-2xl">
                    <div>
                        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Manage Exams
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Create and monitor secure online exams.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-300 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Create Exam
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-slate-400 p-4">Loading exams...</p>
                    ) : exams.length === 0 ? (
                        <div className="col-span-full text-center p-12 glass-panel rounded-2xl">
                            <p className="text-slate-400">No exams created yet. Click 'Create Exam' to get started.</p>
                        </div>
                    ) : (
                        exams.map((exam, index) => (
                            <div
                                key={exam.id}
                                onClick={() => navigate(`/admin/exams/${exam.id}`)}
                                className="glass-card p-6 flex flex-col justify-between cursor-pointer group"
                                style={{ animation: `scaleIn 0.4s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-emerald-500/20 text-emerald-300">
                                            Duration: {exam.durationMinutes}m
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-purple-300 transition-all duration-300">
                                        {exam.title}
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                                        {exam.description}
                                    </p>
                                </div>

                                {/* Attempt Stats */}
                                <div className="mt-4 flex gap-3 flex-wrap">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs">
                                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="text-slate-300 font-bold">{exam.attemptCount || 0}</span>
                                        <span className="text-slate-500">attempted</span>
                                    </div>
                                    {(exam.submittedCount || 0) > 0 && (
                                        <>
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-xs">
                                                <span className="text-emerald-400 font-bold">{exam.passedCount}</span>
                                                <span className="text-emerald-400/70">passed</span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-xs">
                                                <span className="text-rose-400 font-bold">{exam.failedCount}</span>
                                                <span className="text-rose-400/70">failed</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-4 flex justify-between items-center text-xs text-slate-400 font-medium border-t border-white/5 pt-4">
                                    <span>Passing Score: {exam.passingScore}%</span>
                                    <span className="text-indigo-400 group-hover:text-indigo-300 flex items-center">
                                        Manage
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CreateExamModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </>
    );
};

const CreateExamModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        durationMinutes: 60,
        passingScore: 75
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createExam(formData);
            onSuccess();
        } catch (error) {
            console.error("Failed to create exam", error);
            alert("Failed to create exam");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Create New Exam</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="e.g. Java Spring Boot Networking"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            required
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                            placeholder="Describe the exam..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Duration (Mins)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Passing Score %</label>
                            <input
                                required
                                type="number"
                                min="1"
                                max="100"
                                value={formData.passingScore}
                                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Exam"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminExamsPage;

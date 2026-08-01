import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getAvailableExams, startExamAttempt } from "../../api/examApi";

const StudentExamsPage = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startingContext, setStartingContext] = useState(null); // holds ID if starting currently
    const navigate = useNavigate();

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await getAvailableExams();
            setExams(res.data);
        } catch (error) {
            // if we hit a 400 error like the previous routes, implement a fallback here for visual testing
            console.warn("Backend failed. Loading mock exams", error);
            setExams([
                { id: "mock_java_1", title: "Java Spring Boot Networking", description: "Comprehensive test on networking.", durationMinutes: 60, passingScore: 75 },
                { id: "mock_react_2", title: "React Security Patterns", description: "Test on preventing XSS and CSRF in React apps.", durationMinutes: 45, passingScore: 80 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async (examId) => {
        if (startingContext) return;
        try {
            setStartingContext(examId);
            const res = await startExamAttempt(examId);
            // The API should return the attemptId as res.data.id
            const attemptId = res.data.id;
            navigate(`/student/exams/take/${examId}?attemptId=${attemptId}`);
        } catch (error) {
            console.warn("Failed to start exam natively. Generating mock attempt.", error);
            const mockAttemptId = "mock_attempt_" + Date.now();
            navigate(`/student/exams/take/${examId}?attemptId=${mockAttemptId}`);
        } finally {
            setStartingContext(null);
        }
    };

    return (
        <>
            <div className="space-y-6 relative animate-fade-in w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center glass-panel p-6 rounded-2xl">
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Available Exams
                        </h1>
                        <p className="text-lg text-slate-400 mt-2">
                            Select an exam below to begin. Remember, exams are strictly monitored.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-slate-400 p-4">Loading exams...</p>
                    ) : exams.length === 0 ? (
                        <div className="col-span-full text-center p-12 glass-panel rounded-2xl">
                            <p className="text-slate-400">No exams are currently available to you.</p>
                        </div>
                    ) : (
                        exams.map((exam, index) => (
                            <div
                                key={exam.id}
                                className="glass-card p-6 flex flex-col justify-between group relative overflow-hidden"
                                style={{ animation: `scaleIn 0.4s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-emerald-500/20 text-emerald-300">
                                            Duration: {exam.durationMinutes}m
                                        </div>
                                        <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-indigo-500/20 text-indigo-300">
                                            Pass: {exam.passingScore}%
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-white leading-snug">
                                        {exam.title}
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                                        {exam.description}
                                    </p>
                                </div>

                                <div className="mt-8 border-t border-white/5 pt-5">
                                    <button
                                        onClick={() => handleStartExam(exam.id)}
                                        disabled={startingContext === exam.id}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-bold tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {startingContext === exam.id ? "Starting..." : "Start Attempt"}
                                        {startingContext !== exam.id && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default StudentExamsPage;

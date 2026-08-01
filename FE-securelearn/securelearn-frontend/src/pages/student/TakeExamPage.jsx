import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getStudentExamQuestions, logSecurityViolation, submitExam } from "../../api/examApi";
import { useBehaviorMonitor } from "../../hooks/useBehaviorMonitor";

const styleSheet = `
  @keyframes warnSlide {
    0%   { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.92); }
    15%  { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
    85%  { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.96); }
  }
  @keyframes blackoutFade {
    0%   { opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .warn-toast   { animation: warnSlide 3.1s ease forwards; }
  .blackout-anim{ animation: blackoutFade 3.1s ease forwards; }
  .attempt-badge {
    background: linear-gradient(135deg,rgba(220,38,38,0.25),rgba(185,28,28,0.15));
    border: 1px solid rgba(248,113,113,0.35);
    color: #fca5a5;
    box-shadow: 0 0 12px rgba(220,38,38,0.2);
  }
`;

const TakeExamPage = () => {
    const { id: examId } = useParams();
    const [searchParams] = useSearchParams();
    const attemptId = searchParams.get("attemptId");
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [examStarted, setExamStarted] = useState(false);
    const [examSubmitted, setExamSubmitted] = useState(false);
    const [scoreResult, setScoreResult] = useState(null);

    // Persisted State to prevent refresh exploit
    const [answers, setAnswers] = useState(() => {
        const saved = sessionStorage.getItem(`exam_answers_${attemptId}`);
        return saved ? JSON.parse(saved) : {};
    });
    
    // Timer persisted state (Default 30 Mins)
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = sessionStorage.getItem(`exam_time_${attemptId}`);
        return saved ? parseInt(saved, 10) : 1800; 
    });

    const [viewMode, setViewMode] = useState(() => sessionStorage.getItem(`exam_view_${attemptId}`) || "ONE"); 
    const [currentIndex, setCurrentIndex] = useState(() => parseInt(sessionStorage.getItem(`exam_index_${attemptId}`) || "0", 10));

    const containerRef = useRef(null);
    const protectiveOverlayRef = useRef(null);
    const metaDownRef = useRef(false);
    const shiftDownRef = useRef(false);
    const wasKeyHeldRef = useRef(false);

    const [screenshotWarning, setScreenshotWarning] = useState(false);
    const [blackout, setBlackout] = useState(false);
    const [screenshotAttempts, setScreenshotAttempts] = useState(0);

    // Save state continuously to sessionStorage to survive page refresh
    useEffect(() => {
        if (examStarted && !examSubmitted) {
            sessionStorage.setItem(`exam_answers_${attemptId}`, JSON.stringify(answers));
            sessionStorage.setItem(`exam_time_${attemptId}`, timeLeft.toString());
            sessionStorage.setItem(`exam_view_${attemptId}`, viewMode);
            sessionStorage.setItem(`exam_index_${attemptId}`, currentIndex.toString());
        }
    }, [answers, timeLeft, viewMode, currentIndex, examStarted, examSubmitted, attemptId]);

    // Timer Auto-Submit Logic
    useEffect(() => {
        if (!examStarted || examSubmitted || timeLeft <= 0) return;
        
        const tick = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(tick);
                    forceSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(tick);
    }, [examStarted, examSubmitted]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const triggerWarning = useCallback(() => {
        setScreenshotWarning(false);
        requestAnimationFrame(() => {
            setScreenshotWarning(true);
            setTimeout(() => setScreenshotWarning(false), 3100);
        });
    }, []);

    const triggerBlackout = useCallback(() => {
        setBlackout(false);
        requestAnimationFrame(() => {
            setBlackout(true);
            setTimeout(() => setBlackout(false), 3100);
        });
    }, []);

    // 🔒 Global screenshot + behavior detection
    useBehaviorMonitor();

    const tabViolationLock = useRef(false);
    const fullscreenViolationLock = useRef(false);
    const screenshotViolationLock = useRef(false);

    useEffect(() => {
        if (!attemptId) {
            alert("No active attempt found. Redirecting.");
            navigate("/student/exams");
            return;
        }

        const fetchQuestions = async () => {
            try {
                const res = await getStudentExamQuestions(examId);
                setQuestions(res.data);
            } catch (error) {
                console.warn("Failed to fetch questions natively. Loading mock data.");
                setQuestions([
                    { id: "q1", text: "What annotation maps web requests in Spring?", options: ["@Controller", "@RequestMapping", "@RequestBody", "@PathVariable"] },
                    { id: "q2", text: "Which React hook manages state in functional components?", options: ["useEffect", "useState", "useRef", "useMemo"] },
                    { id: "q3", text: "What is the primary key mapping annotation in JPA?", options: ["@Id", "@PrimaryKey", "@Column", "@Entity"] }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [examId, attemptId, navigate]);

    // Security Listeners
    useEffect(() => {
        if (!examStarted || examSubmitted) return;

        const isWin = /win/i.test(navigator.platform);
        const isMac = /mac/i.test(navigator.platform);

        const showOverlay = () => {
            if (protectiveOverlayRef.current) protectiveOverlayRef.current.style.display = "flex";
        };
        const hideOverlay = () => {
            if (protectiveOverlayRef.current) protectiveOverlayRef.current.style.display = "none";
        };
        const instantBlackout = () => {
            showOverlay();
            setTimeout(() => {
                if (!wasKeyHeldRef.current) hideOverlay();
            }, 3100);
        };

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                instantBlackout();
                triggerBlackout();
                if (!tabViolationLock.current) {
                    tabViolationLock.current = true;
                    console.warn("SECURITY VIOLATION: Tab switched.");
                    try {
                        await logSecurityViolation(attemptId, "TAB_SWITCH");
                    } catch (e) {}
                    alert("Security Violation: Switching tabs is not allowed during an exam. This incident has been recorded.");
                    setTimeout(() => tabViolationLock.current = false, 3000);
                }
            }
        };

        const handleFullscreenChange = async () => {
            if (!document.fullscreenElement && !fullscreenViolationLock.current) {
                fullscreenViolationLock.current = true;
                console.warn("SECURITY VIOLATION: Exited fullscreen.");
                try {
                    await logSecurityViolation(attemptId, "FULLSCREEN_EXIT");
                } catch (e) {}
                alert("Security Violation: Exiting fullscreen is not allowed during an exam. This incident has been recorded.");
                setTimeout(() => fullscreenViolationLock.current = false, 3000);
            }
        };

        const updateKeyHeld = async () => {
            if (isWin && metaDownRef.current && shiftDownRef.current) {
                showOverlay(); 
                if (!wasKeyHeldRef.current) {
                    wasKeyHeldRef.current = true;
                    setScreenshotAttempts(n => n + 1);
                    triggerWarning();
                    if (!screenshotViolationLock.current) {
                        screenshotViolationLock.current = true;
                        try { await logSecurityViolation(attemptId, "SCREENSHOT_ATTEMPT"); } catch {}
                        setTimeout(() => { screenshotViolationLock.current = false; }, 2000);
                    }
                }
            } else {
                wasKeyHeldRef.current = false;
                hideOverlay();
            }
        };

        const handleKeyDown = async (e) => {
            if (e.key === "Meta") { metaDownRef.current = true; updateKeyHeld(); }
            if (e.key === "Shift") { shiftDownRef.current = true; updateKeyHeld(); }

            const blocked =
                e.key === "PrintScreen" || e.key === "Print" ||
                (isWin && e.altKey && e.metaKey && e.key.toLowerCase() === "r") || 
                (isWin && e.metaKey && e.key.toLowerCase() === "g") || 
                (isMac && e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key));

            if (blocked) {
                e.preventDefault();
                e.stopPropagation();
                instantBlackout();
                setScreenshotAttempts(n => n + 1);
                triggerWarning();
                triggerBlackout();
                if (!screenshotViolationLock.current) {
                    screenshotViolationLock.current = true;
                    try { await logSecurityViolation(attemptId, "SCREENSHOT_ATTEMPT"); } catch {}
                    setTimeout(() => { screenshotViolationLock.current = false; }, 2000);
                }
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === "Meta") { metaDownRef.current = false; updateKeyHeld(); }
            if (e.key === "Shift") { shiftDownRef.current = false; updateKeyHeld(); }
        };

        const handleBlur = () => {
            instantBlackout();
            triggerBlackout();
            triggerWarning();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("keyup", handleKeyUp, true);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keyup", handleKeyUp, true);
            window.removeEventListener("blur", handleBlur);
        };
    }, [examStarted, examSubmitted, attemptId]);

    const handleStartExam = async () => {
        try {
            if (containerRef.current) {
                await containerRef.current.requestFullscreen();
            }
            // Auto resume if time is left and we have answers
            setExamStarted(true);
        } catch (err) {
            alert("Fullscreen is required to take this exam. Please allow fullscreen access.");
            console.error(err);
        }
    };

    const handleOptionSelect = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const forceSubmit = async () => {
        try {
            setLoading(true);
            const res = await submitExam(attemptId, answers);
            setScoreResult(res.data);
            finishExam();
        } catch (error) {
            mockSubmit();
        }
    };

    const mockSubmit = () => {
        console.warn("Mocking grading locally.");
        let correctCount = 0;
        const correctMap = {};
        questions.forEach(q => {
            const correctOpt = q.options[0]; // mock behavior: index 0 is always correct
            correctMap[q.id] = correctOpt;
            if (answers[q.id] === correctOpt) correctCount++;
        });
        setScoreResult({ score: correctCount, total: questions.length, correctMap });
        finishExam();
    };

    const handleSubmitClick = async () => {
        if (!window.confirm("Are you sure you want to submit? You cannot change your answers.")) return;
        
        try {
            setLoading(true);
            const res = await submitExam(attemptId, answers);
            setScoreResult(res.data);
            finishExam();
        } catch (error) {
            mockSubmit();
        }
    };

    const finishExam = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log(err));
        }
        setExamSubmitted(true);
        setLoading(false);
        sessionStorage.removeItem(`exam_answers_${attemptId}`);
        sessionStorage.removeItem(`exam_time_${attemptId}`);
        sessionStorage.removeItem(`exam_view_${attemptId}`);
        sessionStorage.removeItem(`exam_index_${attemptId}`);
    };

    if (loading && !examStarted) {
        return <div className="min-h-screen bg-[#0f111a] text-slate-400 flex items-center justify-center font-bold">Loading secure environment...</div>;
    }

    // Submitted view + Score
    if (examSubmitted && scoreResult) {
        const pct = Math.round((scoreResult.score / scoreResult.total) * 100);
        return (
            <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-6 text-slate-200">
                <div className="glass-panel w-full max-w-4xl p-8 rounded-2xl">
                    <div className="text-center mb-10">
                        <div className="w-24 h-24 mb-6 rounded-full flex flex-col items-center justify-center mx-auto shadow-2xl relative" style={{ background: `conic-gradient(#10b981 ${pct}%, #1e293b ${pct}%)` }}>
                            <div className="w-20 h-20 bg-[#0f111a] rounded-full flex items-center justify-center absolute">
                                <span className="text-2xl font-black text-white">{pct}%</span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">Exam Complete</h1>
                        <p className="text-slate-400">You scored <span className="text-emerald-400 font-bold">{scoreResult.score}</span> out of <span className="text-white font-bold">{scoreResult.total}</span></p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-bold border-b border-white/10 pb-2">Review Answers</h2>
                        {questions.map((q, i) => {
                            const studentAns = answers[q.id];
                            const correctAns = scoreResult.correctMap?.[q.id] || q.options[0]; // fallback to mock correct
                            const isCorrect = studentAns === correctAns;

                            return (
                                <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/5 relative">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-6 h-6 rounded bg-indigo-600 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                                            <p className="font-medium text-slate-200">{q.text}</p>
                                        </div>
                                        {isCorrect ? (
                                            <span className="text-emerald-400 px-2 py-1 bg-emerald-400/10 rounded font-bold text-xs shrink-0 whitespace-nowrap">Correct ✓</span>
                                        ) : (
                                            <span className="text-rose-400 px-2 py-1 bg-rose-400/10 rounded font-bold text-xs shrink-0 whitespace-nowrap">Incorrect ✗</span>
                                        )}
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-lg">
                                         <div>
                                            <span className="text-slate-500 block mb-1">Your Answer:</span>
                                            <span className={isCorrect ? "text-emerald-300" : "text-rose-300"}>{studentAns || "Not answered"}</span>
                                         </div>
                                         <div>
                                            <span className="text-slate-500 block mb-1">Correct Answer:</span>
                                            <span className="text-emerald-300">{correctAns}</span>
                                         </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 text-center">
                        <button onClick={() => navigate("/student/exams")} className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold transition-colors w-full sm:w-auto">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderQuestion = (q, i) => {
        return (
            <div key={q.id} className="glass-panel p-8 rounded-2xl relative mb-12">
                <div className="absolute -left-4 -top-4 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">
                    {i + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-6 ml-2 leading-relaxed">
                    {q.text}
                </h3>
                <div className="space-y-3">
                    {q.options.map((opt, optIndex) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                            <label
                                key={optIndex}
                                className={`flex items-center w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                                    ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={opt}
                                    checked={isSelected}
                                    onChange={() => handleOptionSelect(q.id, opt)}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected ? 'border-indigo-400' : 'border-slate-500'}`}>
                                    {isSelected && <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full"></div>}
                                </div>
                                <span className={`text-base font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-300'}`}>
                                    {opt}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`h-screen overflow-y-auto transition-colors duration-500 ${examStarted ? "bg-[#0f111a] selection:bg-rose-500/30" : "bg-[#1a1c29]"}`}
            style={{ userSelect: "none" }}
            onContextMenu={(e) => { e.preventDefault(); return false; }} 
        >
            <style>{styleSheet}</style>

            <div ref={protectiveOverlayRef} style={{ display: "none", position: "fixed", inset: 0, zIndex: 2147483647, background: "#000", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", userSelect: "none" }}>
                <div style={{ fontSize: "64px" }}>🛡️</div>
                <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px" }}>Content Protected</p>
                <p style={{ color: "#6ee7b7", fontSize: "14px" }}>Screenshot capture is not permitted on this page.</p>
            </div>

            {blackout && (
                <div className="blackout-anim fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(24px)" }}>
                    <div className="text-6xl select-none">🛡️</div><p className="text-white text-2xl font-bold">Content Protected</p><p style={{ color: "#6ee7b7" }} className="text-sm">Screenshot capture is not permitted.</p>
                </div>
            )}

            {screenshotWarning && (
                <div className="warn-toast fixed top-6 left-1/2 z-[90] flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-semibold select-none bg-rose-600 border border-rose-400 text-white shadow-rose-500">
                    <span className="text-xl">🚫</span><span>Screenshots are not allowed</span>
                </div>
            )}

            {!examStarted ? (
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-fade-in">
                    <div className="p-8 max-w-xl">
                        <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-4">Secure Examination Protocol</h1>
                        <p className="text-lg text-slate-400 mb-6">
                            You are about to enter a highly secure testing environment.
                        </p>

                        <ul className="text-left text-slate-300 space-y-3 mb-10 bg-white/5 p-6 rounded-2xl border border-rose-500/10 shadow-lg">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-3 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                The exam will launch in Fullscreen Mode and a strict timer will begin.
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-3 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <strong>Do not exit fullscreen.</strong> Doing so will penalize your attempt.
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-3 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <strong>Tab switching is tracked natively.</strong> Don't try it.
                            </li>
                        </ul>

                        <button
                            onClick={handleStartExam}
                            className="w-full py-4 text-lg bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all font-black tracking-widest uppercase"
                        >
                            Acknowledge & Start Exam
                        </button>
                        
                        {Object.keys(answers).length > 0 && (
                            <p className="mt-4 text-emerald-400 text-sm font-semibold">Previous progress detected. Resume safely!</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-4xl mx-auto p-6 md:p-12 animate-fade-in relative">

                    {/* Navbar / Timer */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/5 p-4 rounded-xl mb-10 sticky top-6 z-50 backdrop-blur-xl shadow-2xl gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black text-white hidden sm:block">Live Exam</h2>
                            <button 
                                onClick={() => setViewMode(prev => prev === "ALL" ? "ONE" : "ALL")} 
                                className="text-xs font-bold uppercase tracking-wide bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors"
                            >
                                View: {viewMode === "ALL" ? "Scroll View" : "Page View"}
                            </button>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-2">
                                <div className={`text-xl font-mono font-bold tracking-widest px-4 py-1.5 rounded-lg border shadow-lg ${timeLeft < 300 ? 'bg-rose-900/40 text-rose-400 border-rose-500/30 shadow-rose-500/20' : 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20'} `}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Question Rendering */}
                    <div>
                        {viewMode === "ALL" ? (
                            <div>
                                {questions.map((q, i) => renderQuestion(q, i))}
                            </div>
                        ) : (
                            <div>
                                {questions.length > 0 && renderQuestion(questions[currentIndex], currentIndex)}
                            </div>
                        )}
                    </div>

                    {/* Pagination / Submit Container */}
                    <div className="mt-12 text-center pb-12">
                        {viewMode === "ONE" && (
                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 mb-8">
                                <button 
                                    onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
                                    disabled={currentIndex === 0}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-20 rounded-xl font-bold text-white transition-all"
                                >
                                    Previous
                                </button>
                                <span className="text-slate-400 font-bold tracking-widest">{currentIndex + 1} / {questions.length}</span>
                                <button 
                                    onClick={() => setCurrentIndex(c => Math.min(questions.length - 1, c + 1))}
                                    disabled={currentIndex === questions.length - 1}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-20 rounded-xl font-bold text-white transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {(viewMode === "ALL" || currentIndex === questions.length - 1) && (
                            <button
                                onClick={handleSubmitClick}
                                disabled={loading}
                                className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-lg rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all font-black tracking-widest uppercase hover:-translate-y-1 w-full sm:w-auto"
                            >
                                {loading ? "Evaluating..." : "Submit Examination"}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeExamPage;

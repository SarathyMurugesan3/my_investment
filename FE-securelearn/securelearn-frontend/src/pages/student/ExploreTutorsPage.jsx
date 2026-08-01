import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";

const ExploreTutorsPage = () => {
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(49.99);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tutorsRes, myEnrollmentsRes] = await Promise.all([
        api.get('/api/enrollments/tutors'),
        api.get('/api/enrollments/my')
      ]);
      setTutors(tutorsRes.data || []);
      setEnrollments(myEnrollmentsRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to load tutors data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEnrollmentForTutor = (tutorId) => {
    return enrollments.find(e => e.tutorId === tutorId || e.tutorEmail === tutorId);
  };

  const handleEnrollClick = (tutor) => {
    setSelectedTutor(tutor);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedTutor) return;

    setIsProcessing(true);
    setMessage({ text: "", type: "" });

    try {
      await api.post('/api/enrollments/enroll', {
        tutorId: selectedTutor.id,
        amount: paymentAmount,
        paymentReference: "PAY-" + Math.random().toString(36).substring(2, 10).toUpperCase()
      });

      setMessage({ 
        text: `Successfully enrolled with ${selectedTutor.name}! You now have full access to their courses.`, 
        type: "success" 
      });

      setSelectedTutor(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data || "Payment failed. Please try again.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 animate-slide-up pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
          Explore Tutors & Instructors
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Enroll with individual tutors to access their exclusive courses, videos, and PDFs without overlapping content.
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-xl mb-6 font-bold flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
          <span>{message.type === 'success' ? '✅' : '⚠️'} {message.text}</span>
          <button onClick={() => setMessage({ text: "", type: "" })} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Tutors Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading available tutors...</div>
      ) : tutors.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">No tutors available for enrollment at this moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor) => {
            const enrollment = getEnrollmentForTutor(tutor.id);
            const isApproved = enrollment?.status === 'APPROVED';
            const isPending = enrollment?.status === 'PENDING_PAYMENT';

            return (
              <div 
                key={tutor.id} 
                className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all backdrop-blur-md bg-black/40 shadow-xl group"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                      {tutor.name?.charAt(0).toUpperCase() || "T"}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">{tutor.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{tutor.email}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-6 line-clamp-3">
                    {tutor.bio || `Certified instructor providing high-quality protected courses, DRM video lectures, and secure PDF materials.`}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400">
                    Price: <span className="text-emerald-400 font-mono text-sm font-bold">$49.99</span>
                  </div>

                  {isApproved ? (
                    <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      ✓ Enrolled & Active
                    </span>
                  ) : isPending ? (
                    <span className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
                      ⏳ Pending Approval
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEnrollClick(tutor)}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      💳 Enroll & Pay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simulated Payment Modal */}
      {selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                💳 Tutor Access Payment
              </h3>
              <button 
                onClick={() => setSelectedTutor(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/10 mb-6">
              <div className="text-xs text-slate-400 uppercase font-semibold">Selected Instructor</div>
              <div className="text-lg font-bold text-emerald-300 mt-1">{selectedTutor.name}</div>
              <div className="text-xs text-slate-400 font-mono">{selectedTutor.email}</div>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-300">Enrollment Fee:</span>
                <span className="text-emerald-400 font-mono">${paymentAmount}</span>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Cardholder Name</label>
                <input 
                  type="text" 
                  defaultValue={user?.name || "Student User"}
                  required 
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Simulated Card Number</label>
                <input 
                  type="text" 
                  defaultValue="4242 •••• •••• 4242" 
                  readOnly 
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-emerald-400 font-mono text-sm outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTutor(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? "Processing..." : `Pay $${paymentAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreTutorsPage;

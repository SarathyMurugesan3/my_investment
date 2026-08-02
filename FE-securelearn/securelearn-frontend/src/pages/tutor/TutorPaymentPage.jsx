import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const TutorPaymentPage = () => {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Payment Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CARD"); // CARD, UPI, NETBANKING
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/tutor/billing/summary");
      setBilling(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load tutor billing information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError("");

    try {
      const refId = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await api.post("/api/tutor/billing/pay", {
        paymentMethod,
        paymentReference: refId,
        amount: billing?.totalAmountDue || 0
      });

      setBilling(res.data);
      setPaymentSuccess({
        reference: refId,
        amount: billing?.totalAmountDue || 0,
        date: new Date().toLocaleDateString(),
        method: paymentMethod
      });
      
      // Reset form
      setCardName("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setUpiId("");
    } catch (err) {
      console.error(err);
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-emerald-400 font-bold">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        Loading billing details...
      </div>
    );
  }

  const isPaid = billing?.paymentStatus === "PAID";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-slide-up pb-16">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-cyan-950/40 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
              💳 SecureLearn Tutor Billing
            </div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Subscription & Usage Payment
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Your platform access fee is calculated based on your active student headcount and cloud media storage usage.
            </p>
          </div>

          {/* Account Status Badge */}
          <div className="bg-slate-900/90 border border-white/15 p-5 rounded-2xl flex items-center gap-4 shrink-0 shadow-xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold ${isPaid ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
              {isPaid ? "✅" : "⚠️"}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Access Status</div>
              <div className={`text-lg font-black ${isPaid ? "text-emerald-400" : "text-amber-400"}`}>
                {isPaid ? "Active Subscribed" : "Payment Due"}
              </div>
              <div className="text-xs text-slate-500 font-medium">Valid until: <strong className="text-white">{billing?.paidUntil}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center justify-between font-medium">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Students Count */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">👥</span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                Student Headcount
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono mb-1">{billing?.studentCount || 0}</div>
            <div className="text-xs text-slate-400 font-medium">Active Enrolled Students</div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-400">Rate: ₹{billing?.perStudentRate}/student</span>
            <span className="text-indigo-300 font-mono font-bold">₹{billing?.studentSubtotal || 0}</span>
          </div>
        </div>

        {/* Card 2: Cloud Content Storage */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-cyan-500/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">☁️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                Cloud Media Assets
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono mb-1">{billing?.contentCount || 0}</div>
            <div className="text-xs text-slate-400 font-medium">Uploaded Videos & PDFs</div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-400">Rate: ₹{billing?.perContentRate}/asset</span>
            <span className="text-cyan-300 font-mono font-bold">₹{billing?.contentSubtotal || 0}</span>
          </div>
        </div>

        {/* Card 3: Base Platform Fee */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">⚡</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                Platform Standard Access
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono mb-1">₹{billing?.baseFee || 500}</div>
            <div className="text-xs text-slate-400 font-medium">Monthly Infrastructure Base</div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-400">Fixed Fee</span>
            <span className="text-emerald-300 font-mono font-bold">₹{billing?.baseFee || 500}</span>
          </div>
        </div>

      </div>

      {/* Invoice Calculation & Pay Trigger Section */}
      <div className="glass-panel p-8 rounded-3xl border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 w-full md:w-1/2">
          <h3 className="text-2xl font-black text-white">Monthly Subscription Summary</h3>
          <p className="text-slate-400 text-sm">
            Total calculation combines base access fee, student counts, and Cloudinary media bandwidth.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Base Platform Access</span>
              <span className="font-mono">₹{billing?.baseFee}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300">
              <span>Student Usage ({billing?.studentCount} × ₹{billing?.perStudentRate})</span>
              <span className="font-mono">₹{billing?.studentSubtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300">
              <span>Cloud Content ({billing?.contentCount} × ₹{billing?.perContentRate})</span>
              <span className="font-mono">₹{billing?.contentSubtotal}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-black text-emerald-400">
              <span>Total Amount Due</span>
              <span className="font-mono text-xl">₹{billing?.totalAmountDue}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end w-full md:w-auto gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block">Total Payable Now</span>
            <span className="text-4xl font-black text-emerald-400 font-mono">₹{billing?.totalAmountDue}</span>
          </div>
          <button
            onClick={() => { setPaymentSuccess(null); setIsModalOpen(true); }}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 text-base flex items-center justify-center gap-3"
          >
            <span>💳</span>
            <span>{isPaid ? "Renew / Pay Next Billing" : "Pay Now & Unlock Full Access"}</span>
          </button>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📜</span> Billing & Payment History
        </h3>

        {!billing?.paymentHistory || billing.paymentHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No previous payment records found. Your first payment will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Valid Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {billing.paymentHistory.map((item) => (
                  <tr key={item.id || item.paymentReference} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono text-emerald-300 font-bold">{item.paymentReference}</td>
                    <td className="p-3 text-slate-300">{new Date(item.paidAt).toLocaleDateString()}</td>
                    <td className="p-3 font-mono font-bold text-white">₹{item.amount}</td>
                    <td className="p-3 text-slate-400 uppercase text-xs font-bold">{item.paymentMethod}</td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {item.paidUntil ? new Date(item.paidUntil).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Gateway Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl text-white space-y-6">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>

            {paymentSuccess ? (
              /* Success View */
              <div className="text-center space-y-5 py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-white">Payment Successful!</h3>
                <p className="text-slate-300 text-sm">
                  Your tutor subscription payment has been processed and your access is updated.
                </p>
                <div className="bg-black/50 border border-white/10 p-4 rounded-2xl text-left space-y-2 text-sm font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Reference ID:</span>
                    <span className="text-emerald-400 font-bold">{paymentSuccess.reference}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount Paid:</span>
                    <span className="text-white font-bold">₹{paymentSuccess.amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Method:</span>
                    <span className="text-slate-200">{paymentSuccess.method}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Date:</span>
                    <span className="text-slate-200">{paymentSuccess.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all text-sm"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            ) : (
              /* Payment Checkout Form */
              <form onSubmit={handleProcessPayment} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <span>🔒</span> Checkout Payment
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Amount to pay: <strong className="text-emerald-400 font-mono text-base">₹{billing?.totalAmountDue}</strong>
                  </p>
                </div>

                {/* Method selector */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "CARD", label: "Credit/Debit Card", icon: "💳" },
                    { id: "UPI", label: "UPI / QR", icon: "📲" },
                    { id: "NETBANKING", label: "NetBanking", icon: "🏛️" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === m.id
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Card Fields */}
                {paymentMethod === "CARD" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-emerald-400 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        placeholder="4532 •••• •••• 8892"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-emerald-400 text-sm font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-black/50 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-emerald-400 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-black/50 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-emerald-400 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Fields */}
                {paymentMethod === "UPI" && (
                  <div className="space-y-4 text-center">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center">
                      <div className="w-36 h-36 bg-white p-2 rounded-xl mb-3 flex items-center justify-center">
                        {/* Simulated QR Code SVG */}
                        <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                          <path fill="currentColor" d="M10,10 h30 v30 h-30 z M20,20 h10 v10 h-10 z M60,10 h30 v30 h-30 z M70,20 h10 v10 h-10 z M10,60 h30 v30 h-30 z M20,70 h10 v10 h-10 z M50,50 h10 v10 h-10 z M70,50 h20 v10 h-20 z M50,70 h20 v20 h-20 z M80,80 h10 v10 h-10 z" />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Scan QR with GPay / PhonePe / Paytm</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Or enter VPA / UPI ID</label>
                      <input
                        type="text"
                        placeholder="tutor@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-black/50 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-emerald-400 text-sm font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* NetBanking Option */}
                {paymentMethod === "NETBANKING" && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Bank</label>
                    <select className="w-full bg-black/50 border border-white/15 px-4 py-3 rounded-xl text-white outline-none focus:border-emerald-400 text-sm cursor-pointer">
                      <option className="bg-slate-900">HDFC Bank</option>
                      <option className="bg-slate-900">ICICI Bank</option>
                      <option className="bg-slate-900">State Bank of India</option>
                      <option className="bg-slate-900">Axis Bank</option>
                      <option className="bg-slate-900">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{billing?.totalAmountDue}</span>
                      <span>&rarr;</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default TutorPaymentPage;

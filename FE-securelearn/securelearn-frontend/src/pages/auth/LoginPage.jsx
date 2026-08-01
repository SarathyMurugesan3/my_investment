import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useFingerprint } from "../../hooks/useFingerprint";

const LoginPage = () => {
  const { login, superAdminLogin, user } = useAuth();
  const navigate = useNavigate();
  const fingerprint = useFingerprint();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === "SUPER_ADMIN") navigate("/super-admin");
      else if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "COMPANY") navigate("/company");
      else if (user.role === "TUTOR") navigate("/tutor");
      else navigate("/student");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fingerprint && !isSuperAdminMode) return; // Allow super admin without fingerprint temporarily if needed
    setError("");
    setLoading(true);
    try {
      if (isSuperAdminMode) {
        await superAdminLogin({ email, password });
      } else {
        await login({ email, password, fingerprint });
      }
    } catch (err) {
      setError("Invalid credentials or blocked user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(circle at top left, #1a1c29 0%, #0f111a 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="fixed top-[-20%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
            SecureLearn
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {isSuperAdminMode ? "Enter orchestration credentials" : "Sign in to your account"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Email address</label>
            <input
              type="email"
              placeholder={isSuperAdminMode ? "root@securelearn.com" : "admin@company.com"}
              className="w-full bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${isSuperAdminMode ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'} text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 mt-2 disabled:opacity-60`}
          >
            {loading ? "Signing in..." : (isSuperAdminMode ? "Super Admin Login" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsSuperAdminMode(!isSuperAdminMode)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isSuperAdminMode ? "Return to standard user login" : "Super Admin Mode"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

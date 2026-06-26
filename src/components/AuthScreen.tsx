import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  BrainCircuit, 
  KeyRound, 
  Mail, 
  User, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Database, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function AuthScreen() {
  const { signIn, signUp, error, loading, isDemoMode, supabaseConfigured, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);

    if (!email || !password) {
      return;
    }

    if (isLogin) {
      await signIn(email, password);
    } else {
      if (!fullName) {
        return;
      }
      const success = await signUp(email, password, fullName);
      if (success) {
        if (!supabaseConfigured) {
          setSuccessMsg("Account created! Logging in...");
          setTimeout(() => {
            signIn(email, password);
          }, 1500);
        } else {
          setSuccessMsg("Check your email for a verification link to confirm registration.");
        }
      }
    }
  };

  const handleUseDemo = () => {
    setEmail("demo@memora.ai");
    setPassword("demo123");
    setIsLogin(true);
    clearError();
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col justify-center items-center p-4 selection:bg-[#8B5CF6]/30">
      {/* Decorative blurred background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0F0F0F] border border-white/5 rounded-2xl p-8 relative shadow-2xl overflow-hidden z-10">
        
        {/* Environment Mode Status */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent" />
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>{supabaseConfigured ? "Supabase Live" : "Offline Demo Mode"}</span>
          </div>
          {!supabaseConfigured && (
            <button 
              type="button"
              onClick={() => setShowSqlSetup(!showSqlSetup)}
              className="text-[10px] text-[#8B5CF6] hover:underline"
            >
              How to go Live?
            </button>
          )}
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl flex items-center justify-center mb-4 shadow-inner">
            <BrainCircuit className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Memora Notes</h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
            Your collaborative, highly organized markdown second-brain with AI augmentation.
          </p>
        </div>

        {/* Live SQL / Setup Guide if clicked */}
        {showSqlSetup && (
          <div className="mb-6 p-4 bg-[#151515] border border-amber-500/10 rounded-xl text-xs text-zinc-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Connect Live Supabase API</span>
            </div>
            <p className="mb-2">
              Add secrets in the <strong>Secrets panel</strong> under the Settings menu in AI Studio:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] mb-3 text-zinc-500">
              <li><code>VITE_SUPABASE_URL</code></li>
              <li><code>VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
            <p className="text-[11px] text-zinc-500">
              Run this SQL in your Supabase SQL Editor to make the profile table work:
            </p>
            <pre className="mt-2 bg-black/60 p-2 rounded text-[10px] overflow-x-auto text-[#8B5CF6]">
{`create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  updated_at timestamp with time zone
);`}
            </pre>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-start gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="E.g., Angela Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#151515] border border-white/5 focus:border-[#8B5CF6] focus:outline-none rounded-lg px-9 py-2 text-sm placeholder-zinc-600 transition-colors"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#151515] border border-white/5 focus:border-[#8B5CF6] focus:outline-none rounded-lg px-9 py-2 text-sm placeholder-zinc-600 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#151515] border border-white/5 focus:border-[#8B5CF6] focus:outline-none rounded-lg px-9 py-2 text-sm placeholder-zinc-600 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.99] text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-[#8B5CF6]/15 hover:shadow-[#8B5CF6]/25 border border-white/5 mt-6 disabled:opacity-50"
            id="auth-submit-btn"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Bottom Toggle */}
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center gap-4 text-xs">
          <div className="text-zinc-500">
            {isLogin ? "Don't have an account?" : "Already registered?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                clearError();
                setSuccessMsg(null);
              }}
              className="text-[#8B5CF6] hover:underline font-bold"
              type="button"
            >
              {isLogin ? "Create an account" : "Sign In instead"}
            </button>
          </div>

          {!supabaseConfigured && isLogin && (
            <button
              onClick={handleUseDemo}
              type="button"
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-[#151515] border border-white/5 text-zinc-400 hover:text-white rounded-lg hover:border-[#8B5CF6]/40 transition-all font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Use Demo Account (demo@memora.ai / demo123)</span>
            </button>
          )}
        </div>

      </div>

      {/* Humble credit footer */}
      <p className="text-[10px] text-zinc-600 mt-8">
        Crafted with full-stack security & offline-safe fallback protection.
      </p>
    </div>
  );
}

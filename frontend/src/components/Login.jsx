import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, ShieldAlert, Key, UserPlus, LogIn } from 'lucide-react';

export default function Login() {
  const { login, signup, error } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer'); // Default role
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    
    setLoading(true);
    let success = false;
    if (isSignup) {
      success = await signup(username, password, role);
    } else {
      success = await login(username, password);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#09090e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-[#09090e] to-black flex items-center justify-center p-4 font-mono relative overflow-hidden">
      {/* Background Matrix/Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-8 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]">
        {/* Glow corner accents */}
        <div className="absolute -top-px -left-px w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl pointer-events-none"></div>
        <div className="absolute -bottom-px -right-px w-8 h-8 border-b-2 border-r-2 border-fuchsia-500 rounded-br-xl pointer-events-none"></div>

        {/* Title / Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-[0_0_15px_rgba(6,182,212,0.1)] mb-4 animate-pulse">
            <Shield className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            CYBERGUARD PRO
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
            AI Threat Monitoring Telemetry
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Terminal Identity
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                &gt;_
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono placeholder-slate-600"
                placeholder="analyst_name"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Signature Code
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all font-mono placeholder-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Role selector if Signup */}
          {isSignup && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Access Security Clearance
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Viewer')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    role === 'Viewer'
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                      : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  VIEWER
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Admin')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    role === 'Admin'
                      ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.1)]'
                      : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  ADMIN
                </button>
              </div>
            </div>
          )}

          {/* Error Message Feed */}
          {error && (
            <div className="text-xs bg-red-950/40 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-start gap-2">
              <span className="font-bold text-sm">🚨</span>
              <span>Authentication Error: {error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.1)] text-black ${
              isSignup
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 hover:brightness-110'
                : 'bg-cyan-400 hover:bg-cyan-300'
            } disabled:opacity-50`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : isSignup ? (
              <>
                <UserPlus className="w-4 h-4" />
                Initialize Identity
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Authenticate Terminal
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center mt-6 pt-6 border-t border-slate-900">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setUsername('');
              setPassword('');
            }}
            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
          >
            {isSignup
              ? 'Already registered? Return to Authentication'
              : 'Create new CyberGuard Credentials'}
          </button>
        </div>
      </div>
    </div>
  );
}

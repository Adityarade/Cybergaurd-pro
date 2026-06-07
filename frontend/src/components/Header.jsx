import React from 'react';
import { Shield, RefreshCw, Database, Trash2, Cpu, Activity, LogOut, User } from 'lucide-react';

export default function Header({ 
  dbConnected, 
  simulatorActive, 
  onRefresh, 
  onClearLogs, 
  isRefreshing,
  user,
  onLogout
}) {
  const isAdmin = user?.role === 'Admin';

  return (
    <header className="border-b border-cyber-border bg-cyber-card/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Logo & Name */}
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyber-accent/15 border border-cyber-accent/35 rounded-lg shadow-neon-purple animate-pulse overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="CyberGuard" className="w-full h-full object-cover" />
            </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent via-cyber-cyan to-white">
              CYBERGUARD
            </h1>
            <p className="text-xs font-mono tracking-widest text-cyber-muted">
              AI-POWERED DEV-SEC-OPS INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Middle: System Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          {/* User Profile Info */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 text-slate-300">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase text-[11px] font-bold text-cyan-400">
              {user?.username} <span className="text-slate-500 font-normal">({user?.role})</span>
            </span>
          </div>

          {/* DB Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${
            dbConnected 
              ? 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green' 
              : 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>MONGO: {dbConnected ? "ONLINE" : "OFFLINE"}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-cyber-green animate-ping' : 'bg-cyber-red'}`} />
          </div>

          {/* Engine Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${
            simulatorActive 
              ? 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan' 
              : 'bg-cyber-yellow/10 border-cyber-yellow/30 text-cyber-yellow'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>SIMULATOR: {simulatorActive ? "RUNNING" : "STANDBY"}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${simulatorActive ? 'bg-cyber-cyan animate-ping' : 'bg-cyber-yellow'}`} />
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-md border border-cyber-border bg-cyber-bg hover:bg-cyber-border text-cyber-text transition duration-200 disabled:opacity-50"
            title="Force refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
          
          {isAdmin && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-md border border-cyber-red/30 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20 transition duration-200 shadow-sm hover:shadow-neon-red"
              title="Wipe database data collection"
            >
              <Trash2 className="w-3.5 h-3.5" />
              WIPE LOGS
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/25 transition duration-200"
            title="Terminate analyst session"
          >
            <LogOut className="w-3.5 h-3.5" />
            LOGOUT
          </button>
        </div>

      </div>
    </header>
  );
}

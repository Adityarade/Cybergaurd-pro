import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Cpu, Clock } from 'lucide-react';

export default function StatsGrid({ 
  totalLogs = 0, 
  cleanLogs = 0, 
  totalThreats = 0, 
  predictionAccuracy = 95.0 
}) {
  const [uptime, setUptime] = useState(0);

  // Simulate server uptime ticking up
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 max-w-7xl mx-auto">
      
      {/* Total Threats */}
      <div className="cyber-panel p-5 overflow-hidden group hover:border-cyber-red/30 transition-colors duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
          <AlertTriangle className="w-16 h-16 text-cyber-red" />
        </div>
        <p className="text-xs font-mono text-cyber-muted tracking-widest uppercase">
          Threats Blocked
        </p>
        <h3 className="text-3xl font-black text-cyber-red mt-2 tracking-tight neon-text-red">
          {totalThreats.toLocaleString()}
        </h3>
        <div className="flex items-center gap-1 mt-2 text-xs font-mono text-cyber-red">
          <span className="w-2 h-2 bg-cyber-red rounded-full animate-ping" />
          <span>ACTIVE DETECTION IN PROGRESS</span>
        </div>
      </div>

      {/* Clean Traffic */}
      <div className="cyber-panel p-5 overflow-hidden group hover:border-cyber-green/30 transition-colors duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
          <ShieldCheck className="w-16 h-16 text-cyber-green" />
        </div>
        <p className="text-xs font-mono text-cyber-muted tracking-widest uppercase">
          Safe Requests
        </p>
        <h3 className="text-3xl font-black text-cyber-green mt-2 tracking-tight neon-text-green">
          {cleanLogs.toLocaleString()}
        </h3>
        <div className="mt-2 text-xs font-mono text-cyber-muted">
          <span>{totalLogs > 0 ? ((cleanLogs / totalLogs) * 100).toFixed(1) : 0}% OF LOG FLUX</span>
        </div>
      </div>

      {/* AI Confidence */}
      <div className="cyber-panel p-5 overflow-hidden group hover:border-cyber-cyan/30 transition-colors duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
          <Cpu className="w-16 h-16 text-cyber-cyan" />
        </div>
        <p className="text-xs font-mono text-cyber-muted tracking-widest uppercase">
          Prediction Confidence
        </p>
        <h3 className="text-3xl font-black text-cyber-cyan mt-2 tracking-tight neon-text-cyan">
          {predictionAccuracy}%
        </h3>
        <div className="mt-2 text-xs font-mono text-cyber-muted">
          <span>STATISTICAL CRITICAL FIT SCORE</span>
        </div>
      </div>

      {/* System Uptime */}
      <div className="cyber-panel p-5 overflow-hidden group hover:border-cyber-accent/30 transition-colors duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
          <Clock className="w-16 h-16 text-cyber-accent" />
        </div>
        <p className="text-xs font-mono text-cyber-muted tracking-widest uppercase">
          Telemetry Uptime
        </p>
        <h3 className="text-3xl font-black text-cyber-accent mt-2 tracking-tight neon-text-purple">
          {formatUptime(uptime)}
        </h3>
        <div className="mt-2 text-xs font-mono text-cyber-muted">
          <span>STEADY STATE TICK TIMER</span>
        </div>
      </div>

    </div>
  );
}

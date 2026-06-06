import React, { useState } from 'react';
import { Play, Square, Settings, Send, ShieldAlert } from 'lucide-react';

export default function SimulatorControls({ 
  isActive, 
  frequency, 
  onToggle, 
  onFrequencyChange, 
  onManualClassify,
  user
}) {
  const isAdmin = user?.role === 'Admin';
  
  const [sliderVal, setSliderVal] = useState(frequency);
  const [manualIp, setManualIp] = useState("198.51.100.42");
  const [manualMethod, setManualMethod] = useState("POST");
  const [manualPath, setManualPath] = useState("/login");
  const [manualPayload, setManualPayload] = useState('{"username": "admin", "password": "\' OR 1=1 --"}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classifyResult, setClassifyResult] = useState(null);

  const handleSliderChange = (e) => {
    if (!isAdmin) return;
    const val = parseFloat(e.target.value);
    setSliderVal(val);
  };

  const handleSliderRelease = () => {
    if (!isAdmin) return;
    onFrequencyChange(sliderVal);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);
    setClassifyResult(null);
    try {
      const res = await onManualClassify({
        ip: manualIp,
        method: manualMethod,
        path: manualPath,
        payload: manualPayload
      });
      setClassifyResult(res);
    } catch (err) {
      console.error(err);
      setClassifyResult({ error: "Failed to classify request parameters." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">
      
      {/* Box 1: Simulator Settings */}
      <div className="cyber-panel p-6 flex flex-col justify-between relative overflow-hidden">
        {/* Overlay shield indicator for Viewers */}
        {!isAdmin && (
          <div className="absolute top-0 right-0 bg-fuchsia-500/20 border-b border-l border-fuchsia-500/50 text-fuchsia-400 px-3 py-1 font-mono text-[9px] tracking-wider uppercase flex items-center gap-1.5 z-10 shadow-sm shadow-neon-purple">
            <ShieldAlert className="w-3.5 h-3.5" />
            Clearance: READ_ONLY
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-cyber-cyan" />
            <h3 className="text-md font-bold tracking-wider uppercase text-cyber-text">
              TRAFFIC SIMULATOR TELEMETRY
            </h3>
          </div>
          
          <p className="text-xs text-cyber-muted mb-6 leading-relaxed">
            Toggle the automated mock traffic loop on or off. Adjust the slider to throttle generated throughput. The generator feeds normal traffic along with randomized SQL Injections, Brute Force attempts, and high-volume DDoS floods.
          </p>

          {/* Toggle and State Info */}
          <div className="flex items-center justify-between p-4 bg-cyber-bg/50 border border-cyber-border rounded-lg mb-6">
            <div>
              <span className="text-xs font-mono text-cyber-muted block">CURRENT STATE:</span>
              <span className={`text-sm font-mono font-bold uppercase tracking-wider ${
                isActive ? "text-cyber-cyan neon-text-cyan" : "text-cyber-yellow"
              }`}>
                {isActive ? "ACTIVE TRANSMISSION" : "STANDBY TELEMETRY"}
              </span>
            </div>
            
            <button
              onClick={onToggle}
              disabled={!isAdmin}
              className={`flex items-center gap-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-md transition duration-300 shadow-md ${
                !isAdmin
                  ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                  : isActive 
                    ? "bg-cyber-red/20 border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/30 shadow-neon-red" 
                    : "bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 shadow-neon-cyan"
              }`}
            >
              {isActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-cyber-red" />
                  SHUT DOWN
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-cyber-cyan" />
                  INITIALIZE
                </>
              )}
            </button>
          </div>

          {/* Slider Config */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-cyber-muted">THROUGHPUT FREQUENCY:</span>
              <span className="text-cyber-cyan font-bold">{sliderVal} LOGS / MIN</span>
            </div>
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              disabled={!isAdmin}
              value={sliderVal}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              className={`w-full h-1.5 bg-cyber-border rounded-lg appearance-none accent-cyber-cyan ${
                !isAdmin ? "cursor-not-allowed opacity-40" : "cursor-pointer"
              }`}
            />
            <div className="flex justify-between text-[10px] font-mono text-cyber-muted mt-1">
              <span>5 logs/min</span>
              <span>120 logs/min</span>
              <span>240 logs/min</span>
            </div>
          </div>
        </div>

        {/* Quick Speed Selection Tags */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-cyber-border">
          <span className="text-[10px] font-mono text-cyber-muted uppercase">Quick Presets:</span>
          {[30, 60, 120, 180].map((val) => (
            <button
              key={val}
              disabled={!isAdmin}
              onClick={() => {
                setSliderVal(val);
                onFrequencyChange(val);
              }}
              className={`px-2.5 py-1 text-[10px] font-mono border rounded transition-colors ${
                !isAdmin
                  ? "border-slate-800 text-slate-600 cursor-not-allowed"
                  : frequency === val 
                    ? "bg-cyber-cyan/15 border-cyber-cyan/40 text-cyber-cyan" 
                    : "border-cyber-border hover:bg-cyber-border/50 text-cyber-muted"
              }`}
            >
              {val}/m
            </button>
          ))}
        </div>
      </div>

      {/* Box 2: Manual Inoculation Form */}
      <div className="cyber-panel p-6 relative overflow-hidden">
        {/* Overlay shield indicator for Viewers */}
        {!isAdmin && (
          <div className="absolute top-0 right-0 bg-fuchsia-500/20 border-b border-l border-fuchsia-500/50 text-fuchsia-400 px-3 py-1 font-mono text-[9px] tracking-wider uppercase flex items-center gap-1.5 z-10 shadow-sm shadow-neon-purple">
            <ShieldAlert className="w-3.5 h-3.5" />
            Clearance: READ_ONLY
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-cyber-accent" />
          <h3 className="text-md font-bold tracking-wider uppercase text-cyber-text">
            MANUAL INTELLIGENCE PROBING
          </h3>
        </div>
        
        <p className="text-xs text-cyber-muted mb-4 leading-relaxed">
          Inject manual HTTP log parameters to verify detection accuracy. Submit your raw inputs to trigger direct AI threat analysis metrics.
        </p>

        <form onSubmit={handleManualSubmit} className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-cyber-muted mb-1 text-[10px]">SOURCE IP</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={manualIp}
                onChange={(e) => setManualIp(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-cyber-text focus:outline-none focus:border-cyber-cyan transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                required
              />
            </div>
            <div>
              <label className="block text-cyber-muted mb-1 text-[10px]">METHOD</label>
              <select
                disabled={!isAdmin}
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-cyber-text focus:outline-none focus:border-cyber-cyan transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-cyber-muted mb-1 text-[10px]">TARGET PATH</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-cyber-text focus:outline-none focus:border-cyber-cyan transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              required
            />
          </div>

          <div>
            <label className="block text-cyber-muted mb-1 text-[10px]">PAYLOAD DATA / QUERY STRINGS</label>
            <textarea
              rows="2"
              disabled={!isAdmin}
              value={manualPayload}
              onChange={(e) => setManualPayload(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-cyber-text focus:outline-none focus:border-cyber-cyan transition-colors font-mono resize-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-4 items-center pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isAdmin}
              className={`px-4 py-2 rounded font-bold uppercase transition duration-200 shadow-sm ${
                !isAdmin
                  ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed shadow-none"
                  : "bg-cyber-accent/20 border border-cyber-accent/40 text-cyber-accent hover:bg-cyber-accent/30 hover:shadow-neon-purple"
              } disabled:opacity-50`}
            >
              {isSubmitting ? "CLASSIFYING..." : "ANALYZE PAYLOAD"}
            </button>
            
            {/* Show Result Details */}
            {classifyResult && (
              <div className={`flex-1 px-3 py-2 rounded border text-xs leading-relaxed font-sans ${
                classifyResult.error 
                  ? "bg-cyber-red/10 border-cyber-red/30 text-cyber-red"
                  : classifyResult.data?.classification === "Normal"
                    ? "bg-cyber-green/10 border-cyber-green/30 text-cyber-green"
                    : "bg-cyber-red/10 border-cyber-red/30 text-cyber-red"
              }`}>
                {classifyResult.error ? (
                  <span>{classifyResult.error}</span>
                ) : (
                  <div className="font-mono text-[10px]">
                    <span className="font-bold">RESULT:</span>{" "}
                    <span className="uppercase">{classifyResult.data?.classification}</span>{" "}
                    ({(classifyResult.data?.confidence * 100).toFixed(0)}% Conf)
                    <span className="block text-cyber-muted mt-0.5 leading-snug">{classifyResult.data?.reason}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}

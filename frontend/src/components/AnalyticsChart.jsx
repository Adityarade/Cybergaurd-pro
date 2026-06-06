import React from 'react';
import { BarChart3, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function AnalyticsChart({ threatCounts = {}, totalLogs = 0, cleanLogs = 0 }) {
  // Extract threat metrics safely
  const sqli = threatCounts["SQL Injection"] || 0;
  const ddos = threatCounts["DDoS Attempt"] || 0;
  const brute = threatCounts["Brute Force"] || 0;
  const totalThreats = sqli + ddos + brute;

  // Pie chart variables
  const data = [
    { name: 'Normal Traffic', value: cleanLogs, color: '#10b981', labelColor: 'text-cyber-green' },
    { name: 'SQL Injection', value: sqli, color: '#ef4444', labelColor: 'text-cyber-red' },
    { name: 'DDoS Attempt', value: ddos, color: '#f43f5e', labelColor: 'text-rose-500' },
    { name: 'Brute Force', value: brute, color: '#f59e0b', labelColor: 'text-cyber-yellow' }
  ].filter(item => item.value > 0);

  // Compute angles for Donut Chart
  let accumulatedPercent = 0;
  const donutSlices = data.map((item) => {
    const percent = totalLogs > 0 ? (item.value / totalLogs) * 100 : 0;
    const startPercent = accumulatedPercent;
    accumulatedPercent += percent;
    return {
      ...item,
      percent,
      startPercent,
      endPercent: accumulatedPercent
    };
  });

  // Calculate SVG arc path helper
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const createArcPath = (startPercent, endPercent) => {
    // If it's a full circle, SVG stroke behaves weirdly. Cap it close to 100%
    const adjustedEndPercent = endPercent === 100 ? 0.9999 : endPercent;
    
    const [startX, startY] = getCoordinatesForPercent(startPercent / 100);
    const [endX, endY] = getCoordinatesForPercent(adjustedEndPercent / 100);
    
    const largeArcFlag = adjustedEndPercent - startPercent > 50 ? 1 : 0;
    
    // Scale and translate coordinates to match center
    const radius = 70;
    const cx = 100;
    const cy = 100;
    
    const sx = cx + startX * radius;
    const sy = cy + startY * radius;
    const ex = cx + endX * radius;
    const ey = cy + endY * radius;

    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${ex} ${ey}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto pt-0">
      
      {/* Box 1: SVG Donut Threat Breakdown */}
      <div className="cyber-panel p-6 md:col-span-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyber-cyan" />
            <h3 className="text-sm font-bold tracking-wider uppercase text-cyber-text">
              THREAT DISTRIBUTION
            </h3>
          </div>
          
          <div className="relative flex justify-center py-6">
            {totalLogs === 0 ? (
              <div className="w-48 h-48 rounded-full border border-dashed border-cyber-border flex items-center justify-center text-xs font-mono text-cyber-muted">
                WAITING FOR FLUX
              </div>
            ) : (
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Track ring */}
                  <circle cx="100" cy="100" r="70" fill="transparent" stroke="#1e1e2f" strokeWidth="20" />
                  
                  {/* Arc sectors */}
                  {donutSlices.map((slice, i) => {
                    const pathData = createArcPath(slice.startPercent, slice.endPercent);
                    return (
                      <path
                        key={i}
                        d={pathData}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="20"
                        className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                        title={`${slice.name}: ${slice.value}`}
                      />
                    );
                  })}
                </svg>
                {/* Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-[10px] text-cyber-muted uppercase tracking-widest">THREAT RATIO</span>
                  <span className="text-2xl font-black text-cyber-text">
                    {totalLogs > 0 ? ((totalThreats / totalLogs) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 mt-4 font-mono text-xs pt-4 border-t border-cyber-border/50">
          <div className="flex justify-between items-center text-cyber-green">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-cyber-green rounded-sm" />
              <span>Normal Traffic</span>
            </div>
            <span className="font-bold">{cleanLogs} ({totalLogs > 0 ? ((cleanLogs / totalLogs) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="flex justify-between items-center text-cyber-red">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-cyber-red rounded-sm" />
              <span>SQL Injection</span>
            </div>
            <span className="font-bold">{sqli} ({totalLogs > 0 ? ((sqli / totalLogs) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="flex justify-between items-center text-rose-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
              <span>DDoS Attack</span>
            </div>
            <span className="font-bold">{ddos} ({totalLogs > 0 ? ((ddos / totalLogs) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="flex justify-between items-center text-cyber-yellow">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-cyber-yellow rounded-sm" />
              <span>Brute Force</span>
            </div>
            <span className="font-bold">{brute} ({totalLogs > 0 ? ((brute / totalLogs) * 100).toFixed(0) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Box 2: SVG Area Timeline Simulation */}
      <div className="cyber-panel p-6 md:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyber-cyan" />
            <h3 className="text-sm font-bold tracking-wider uppercase text-cyber-text">
              THREAT INTENSITY OVER TIME (ROLLING TELEMETRY)
            </h3>
          </div>
          
          <div className="h-44 w-full relative mt-4">
            {/* Draw a gorgeous, modern SVG line chart with a gradient fill */}
            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="37" x2="500" y2="37" stroke="#1e1e2f" strokeWidth="0.5" strokeDasharray="5,5" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#1e1e2f" strokeWidth="0.5" strokeDasharray="5,5" />
              <line x1="0" y1="112" x2="500" y2="112" stroke="#1e1e2f" strokeWidth="0.5" strokeDasharray="5,5" />
              <line x1="0" y1="145" x2="500" y2="145" stroke="#1e1e2f" strokeWidth="1" />

              {/* Normal Flow Area (Simulated Wave) */}
              <path
                d="M0 145 C 50 120, 100 130, 150 110 C 200 90, 250 100, 300 80 C 350 60, 400 90, 450 110 C 475 120, 500 130, 500 145 Z"
                fill="url(#normalGrad)"
              />
              <path
                d="M0 145 C 50 120, 100 130, 150 110 C 200 90, 250 100, 300 80 C 350 60, 400 90, 450 110 C 475 120, 500 130, 500 145"
                fill="transparent"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeOpacity="0.5"
              />

              {/* Attack Flow Area (Simulated Wave - higher peaks) */}
              {totalThreats > 0 ? (
                <>
                  <path
                    d="M0 145 C 40 140, 80 80, 120 70 C 160 60, 200 140, 240 130 C 280 120, 320 30, 360 40 C 400 50, 440 140, 480 135 C 490 134, 500 142, 500 145 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M0 145 C 40 140, 80 80, 120 70 C 160 60, 200 140, 240 130 C 280 120, 320 30, 360 40 C 400 50, 440 140, 480 135 C 490 134, 500 142, 500 145"
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    className="shadow-neon-purple"
                  />
                  {/* Peak Indicators */}
                  <circle cx="120" cy="70" r="4" fill="#ef4444" className="animate-ping" />
                  <circle cx="120" cy="70" r="3" fill="#ef4444" />
                  
                  <circle cx="320" cy="30" r="4" fill="#ef4444" className="animate-ping" />
                  <circle cx="320" cy="30" r="3" fill="#ef4444" />
                </>
              ) : (
                <text x="250" y="80" textAnchor="middle" fill="#94a3b8" className="text-xs font-mono select-none">
                  NO DETECTED ATTACK FLOODS YET
                </text>
              )}
            </svg>
            <div className="absolute top-2 left-2 text-[8px] font-mono text-cyber-muted space-y-1 bg-cyber-bg/70 p-1.5 border border-cyber-border rounded">
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full"></span> NORMAL TRAFFIC (Hz)</div>
              {totalThreats > 0 && <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-cyber-accent rounded-full"></span> THREAT WAVE (Hz)</div>}
            </div>
          </div>
        </div>

        {/* Diagnostic Metrics footer */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-cyber-border font-mono text-[10px] text-cyber-muted text-center">
          <div>
            <span>ATTACK INTENSITY</span>
            <span className="block text-xs font-bold text-cyber-text mt-0.5">
              {totalLogs > 0 ? (totalThreats / totalLogs * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div>
            <span>CRITICAL EVENTS</span>
            <span className="block text-xs font-bold text-cyber-red mt-0.5">
              {sqli + ddos}
            </span>
          </div>
          <div>
            <span>TELEMETRY LEVEL</span>
            <span className="block text-xs font-bold text-cyber-cyan mt-0.5">
              NOMINAL
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

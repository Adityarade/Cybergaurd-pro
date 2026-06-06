import React, { useState } from 'react';
import { Eye, ShieldAlert, ShieldCheck, Terminal, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function ThreatLogFeed({ 
  logs = [], 
  totalCount = 0,
  filter, 
  setFilter, 
  ipSearch, 
  setIpSearch,
  page, 
  setPage,
  limit 
}) {
  const [selectedLog, setSelectedLog] = useState(null);

  // Helper to format timestamps beautifully
  const formatTime = (ts) => {
    if (!ts) return "N/A";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
    } catch {
      return ts;
    }
  };

  const getThreatBadge = (classification) => {
    switch (classification) {
      case "Normal":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyber-green/10 border border-cyber-green/30 text-cyber-green shadow-neon-green/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            SAFE
          </span>
        );
      case "Brute Force":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyber-yellow/10 border border-cyber-yellow/30 text-cyber-yellow shadow-neon-yellow/10">
            <ShieldAlert className="w-3.5 h-3.5" />
            WARNING
          </span>
        );
      case "SQL Injection":
      case "DDoS Attempt":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyber-red/10 border border-cyber-red/30 text-cyber-red shadow-neon-red/10 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
            CRITICAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyber-muted/10 border border-cyber-muted/30 text-cyber-muted">
            UNKNOWN
          </span>
        );
    }
  };

  // Check if we can paginate further
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="cyber-panel p-6">
        
        {/* Top Section: Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-md font-bold tracking-wider uppercase text-cyber-text">
              REAL-TIME TELEMETRY LOG FLOW
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* IP Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-cyber-muted" />
              <input
                type="text"
                placeholder="Search source IP..."
                value={ipSearch}
                onChange={(e) => {
                  setIpSearch(e.target.value);
                  setPage(1); // Reset page on filter
                }}
                className="bg-cyber-bg border border-cyber-border rounded px-9 py-2 text-xs font-mono text-cyber-text focus:outline-none focus:border-cyber-cyan transition-colors placeholder:text-cyber-muted/50 w-full sm:w-64"
              />
            </div>

            {/* Classification Filters */}
            <div className="flex items-center gap-1.5 bg-cyber-bg border border-cyber-border rounded p-1">
              {[
                { label: "ALL", val: "" },
                { label: "SAFE", val: "Normal" },
                { label: "SQLi", val: "SQL Injection" },
                { label: "DDoS", val: "DDoS Attempt" },
                { label: "BRUTE", val: "Brute Force" }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setFilter(item.val);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded transition-all duration-200 ${
                    filter === item.val
                      ? "bg-cyber-accent/25 text-white border border-cyber-accent/40"
                      : "text-cyber-muted hover:text-cyber-text border border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Section: Table View */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-cyber-border/70 text-cyber-muted uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Source IP</th>
                <th className="py-3.5 px-4 font-semibold">Method</th>
                <th className="py-3.5 px-4 font-semibold">Endpoint Path</th>
                <th className="py-3.5 px-4 font-semibold">AI Prediction</th>
                <th className="py-3.5 px-4 font-semibold">Confidence</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-cyber-muted italic">
                    No matching traffic telemetry logs detected. Initialize the simulator above to feed flow records.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log._id} 
                    className="border-b border-cyber-border/40 hover:bg-cyber-card/45 transition-colors group"
                  >
                    <td className="py-3 px-4 text-cyber-muted whitespace-nowrap">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-cyber-text font-bold whitespace-nowrap">
                      {log.ip}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.method === 'POST' ? 'bg-cyber-purple/20 text-cyber-accent' : 'bg-cyber-bg text-cyber-muted border border-cyber-border'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-cyber-muted" title={log.path}>
                      {log.path}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getThreatBadge(log.classification)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-cyber-border h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              log.classification === 'Normal' ? 'bg-cyber-green' : 'bg-cyber-red'
                            }`}
                            style={{ width: `${(log.confidence || 0.95) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-cyber-text">
                          {((log.confidence || 0.95) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 px-2.5 border border-cyber-border hover:border-cyber-cyan hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan rounded flex items-center gap-1.5 text-[10px] ml-auto transition duration-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        INSPECT
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-cyber-border text-xs font-mono">
            <span className="text-cyber-muted">
              Showing page <span className="text-cyber-text font-bold">{page}</span> of{" "}
              <span className="text-cyber-text font-bold">{totalPages}</span> ({totalCount} entries)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-cyber-border rounded hover:bg-cyber-border text-cyber-text transition disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-cyber-border rounded hover:bg-cyber-border text-cyber-text transition disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Inspection Modal Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="cyber-panel max-w-2xl w-full border border-cyber-accent/30 overflow-hidden shadow-neon-purple/20">
            {/* Header */}
            <div className="px-6 py-4 bg-cyber-card border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyber-cyan" />
                <h4 className="font-bold text-cyber-text uppercase tracking-wider text-sm">
                  Threat Classification Analytics
                </h4>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-cyber-muted hover:text-white font-mono text-sm px-2 py-1 rounded bg-cyber-bg border border-cyber-border"
              >
                ESC
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-cyber-muted block uppercase">TIMESTAMP:</span>
                  <span className="text-cyber-text font-bold">{formatTime(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyber-muted block uppercase">SOURCE IP ADDRESS:</span>
                  <span className="text-cyber-cyan font-bold">{selectedLog.ip}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-cyber-muted block uppercase">REQUEST METHOD:</span>
                  <span className="px-2 py-0.5 bg-cyber-border rounded text-[10px] text-cyber-text font-bold">{selectedLog.method}</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyber-muted block uppercase">TARGET ENDPOINT PATH:</span>
                  <span className="text-cyber-text font-bold truncate block" title={selectedLog.path}>{selectedLog.path}</span>
                </div>
              </div>

              <div className="p-4 bg-cyber-bg rounded border border-cyber-border">
                <span className="text-[10px] text-cyber-muted block uppercase mb-1">RAW DATA PAYLOAD / QUERY PARAMETERS:</span>
                <pre className="text-cyber-cyan bg-black/45 p-3 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all border border-cyber-border">
                  {selectedLog.payload || "[Empty Payload]"}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-cyber-muted block uppercase">CLASSIFICATION DIAGNOSIS:</span>
                  <div className="mt-1">{getThreatBadge(selectedLog.classification)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-cyber-muted block uppercase">PREDICTION STRENGTH:</span>
                  <span className="text-cyber-text font-bold text-sm">
                    {((selectedLog.confidence || 0.95) * 100).toFixed(1)}% Confidence
                  </span>
                </div>
              </div>

              <div className="p-4 bg-cyber-accent/5 rounded border border-cyber-accent/20">
                <span className="text-[10px] text-cyber-accent block uppercase mb-1 font-bold">ANALYSIS SUMMARY / DIAGNOSTIC CRITERIA:</span>
                <p className="text-cyber-text leading-relaxed font-sans text-xs">
                  {selectedLog.reason}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-cyber-bg border-t border-cyber-border text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-cyber-border text-cyber-text hover:bg-cyber-card border border-cyber-border rounded font-bold uppercase transition duration-200 text-xs"
              >
                Close Diagnosis
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import SimulatorControls from './components/SimulatorControls';
import AnalyticsChart from './components/AnalyticsChart';
import ThreatLogFeed from './components/ThreatLogFeed';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import { AlertOctagon, Terminal } from 'lucide-react';
import NotificationSystem from './components/NotificationSystem';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
const rawApiUrl = isElectron ? 'http://127.0.0.1:8000' : (import.meta.env.VITE_API_URL || "");
const API_BASE = rawApiUrl.replace(/\/$/, "");

function DashboardContent() {
  const { user, token, logout, isAdmin } = useAuth();

  // Application Data States
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total_logs: 0,
    clean_logs: 0,
    total_threats: 0,
    prediction_accuracy: 95.0,
    threat_counts: {
      "SQL Injection": 0,
      "DDoS Attempt": 0,
      "Brute Force": 0
    },
    simulator_active: false,
    simulator_frequency: 60.0
  });

  // UI Control States
  const [filter, setFilter] = useState("");
  const [ipSearch, setIpSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dbConnected, setDbConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const limit = 10;

  // Set Authorization headers for API calls
  const getAuthHeaders = (extraHeaders = {}) => {
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
    return {
      ...authHeader,
      ...extraHeaders
    };
  };

  // Fetch Stats and Logs from FastAPI Backend
  const fetchData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      // 1. Fetch system statistics
      const statsRes = await fetch(`${API_BASE}/api/v1/stats`, {
        headers: getAuthHeaders()
      });
      if (!statsRes.ok) throw new Error("API stats unreachable");
      const statsData = await statsRes.json();
      setStats(statsData.data);
      setDbConnected(true);

      // 2. Fetch logs (filtered by classification if set)
      let logsUrl = `${API_BASE}/api/v1/logs?limit=100&skip=0`;
      if (filter) {
        logsUrl += `&classification=${encodeURIComponent(filter)}`;
      }
      const logsRes = await fetch(logsUrl, {
        headers: getAuthHeaders()
      });
      if (!logsRes.ok) throw new Error("API logs unreachable");
      const logsData = await logsRes.json();
      setLogs(logsData.data || []);

    } catch (err) {
      console.error("Telemetry fetch error:", err);
      setDbConnected(false);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Run initial polling and establish WebSocket connection for real-time telemetry stream
  useEffect(() => {
    if (!token) return;
    fetchData(true); // Initial silent fetch

    // Determine the correct WebSocket protocol and endpoint
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost = API_BASE ? API_BASE.replace(/^http:\/\//, '').replace(/^https:\/\//, '') : window.location.host;
    if (!wsHost) {
      wsHost = 'localhost:8000'; // Default local fallback
    }
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/threats/ws`;

    let socket = null;
    let reconnectTimeout = null;
    let isComponentMounted = true;

    const connectWebSocket = () => {
      console.log(`Connecting to WebSocket stream at: ${wsUrl}`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Telemetry WebSocket channel established.");
      };

      socket.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);
          console.log("Real-time telemetry event received:", newLog);

          // Prepend new logs instantly to feed and cap at 200 logs to prevent rendering lag
          setLogs((prevLogs) => {
            // Check if log already exists to avoid duplicates
            if (prevLogs.some((l) => l._id === newLog._id)) return prevLogs;
            
            // Apply filter if one is active
            if (filter && newLog.classification !== filter) return prevLogs;
            
            return [newLog, ...prevLogs].slice(0, 200);
          });

          // Increment stats counters dynamically in real-time
          setStats((prevStats) => {
            const isThreat = newLog.classification !== "Normal";
            const updatedThreatCounts = { ...prevStats.threat_counts };
            
            if (isThreat && newLog.classification in updatedThreatCounts) {
              updatedThreatCounts[newLog.classification] += 1;
            }

            const newTotal = prevStats.total_logs + 1;
            const newClean = prevStats.clean_logs + (isThreat ? 0 : 1);
            const newThreats = prevStats.total_threats + (isThreat ? 1 : 0);

            // Update accuracy with simple running average representation
            const confidence = newLog.confidence || 0.95;
            const newAccuracy = ((prevStats.prediction_accuracy * prevStats.total_logs) + (confidence * 100)) / newTotal;

            return {
              ...prevStats,
              total_logs: newTotal,
              clean_logs: newClean,
              total_threats: newThreats,
              prediction_accuracy: parseFloat(newAccuracy.toFixed(2)),
              threat_counts: updatedThreatCounts
            };
          });
        } catch (err) {
          console.error("Failed to parse WebSocket packet payload:", err);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket connection failure:", err);
      };

      socket.onclose = (e) => {
        console.log("WebSocket telemetry channel closed. Reconnecting in 3s...", e.reason);
        if (isComponentMounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [filter, token]);

  const handleRefresh = () => {
    fetchData(false);
  };

  // Toggle Threat Simulator (Start / Stop) - Admin Only
  const handleToggleSimulator = async () => {
    if (!isAdmin) return;
    try {
      const endpoint = stats.simulator_active ? "stop" : "start";
      const res = await fetch(`${API_BASE}/api/v1/simulator/${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to toggle simulator");
      const data = await res.json();
      
      setStats(prev => ({
        ...prev,
        simulator_active: data.simulator_active
      }));
    } catch (err) {
      alert("Simulator command failed. Verify backend connectivity.");
    }
  };

  // Update simulator frequency slider values - Admin Only
  const handleFrequencyChange = async (newFreq) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/simulator/config`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ frequency: newFreq })
      });
      if (!res.ok) throw new Error("Failed to config simulator");
      const data = await res.json();
      
      setStats(prev => ({
        ...prev,
        simulator_frequency: data.frequency
      }));
    } catch (err) {
      alert("Failed to modify simulator frequency.");
    }
  };

  // Submit manual classification query parameters - Admin Only
  const handleManualClassify = async (payload) => {
    if (!isAdmin) return;
    const res = await fetch(`${API_BASE}/api/v1/threats/classify`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Classification failed");
    const data = await res.json();
    fetchData(true); // Silent reload data stream
    return data;
  };

  // Clear Database log stream - Admin Only
  const handleClearLogs = async () => {
    if (!isAdmin) return;
    if (!window.confirm("ARE YOU SURE? This will permanently wipe all logs and reset metrics telemetry.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/logs/clear`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to clear database");
      setLogs([]);
      setStats(prev => ({
        ...prev,
        total_logs: 0,
        clean_logs: 0,
        total_threats: 0,
        threat_counts: {
          "SQL Injection": 0,
          "DDoS Attempt": 0,
          "Brute Force": 0
        }
      }));
      setPage(1);
    } catch (err) {
      alert("Failed to clear logs collection.");
    }
  };

  // Perform Client-side search and pagination logic over fetched logs
  const filteredLogs = logs.filter(log => {
    if (!ipSearch) return true;
    return log.ip.includes(ipSearch);
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * limit, page * limit);
  const totalCount = filteredLogs.length;

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text cyber-grid relative pb-12">
      {/* CRT Monitor scanline overlay */}
      <div className="scanline" />

      {/* Navigation Header */}
      <Header
        dbConnected={dbConnected}
        simulatorActive={stats.simulator_active}
        onRefresh={handleRefresh}
        onClearLogs={handleClearLogs}
        isRefreshing={isRefreshing}
        user={user}
        onLogout={logout}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto space-y-6 mt-6">
        
        {/* Offline Warning banner if database is unreachable */}
        {!dbConnected && (
          <div className="mx-6 p-4 bg-cyber-red/10 border border-cyber-red/30 text-cyber-red rounded-lg flex items-center gap-3 font-mono text-xs shadow-neon-red">
            <AlertOctagon className="w-5 h-5 animate-bounce shrink-0" />
            <div>
              <span className="font-bold">CRITICAL SIGNAL LOSS:</span> Cannot connect to backend API server at '{API_BASE || "localhost"}'. Verify that the backend is running on port 8000 and MongoDB is listening on port 27017.
            </div>
          </div>
        )}

        {/* 1. Global Metrics Telemetry Widget Grid */}
        <StatsGrid
          totalLogs={stats.total_logs}
          cleanLogs={stats.clean_logs}
          totalThreats={stats.total_threats}
          predictionAccuracy={stats.prediction_accuracy}
        />

        {/* 2. Charts and Visualization Analysis */}
        <AnalyticsChart
          threatCounts={stats.threat_counts}
          totalLogs={stats.total_logs}
          cleanLogs={stats.clean_logs}
        />

        {/* 3. Simulator Controls & Manual Inoculator */}
        <SimulatorControls
          isActive={stats.simulator_active}
          frequency={stats.simulator_frequency}
          onToggle={handleToggleSimulator}
          onFrequencyChange={handleFrequencyChange}
          onManualClassify={handleManualClassify}
          user={user}
        />

        {/* 4. Real-time Threat Logs Feed */}
        <ThreatLogFeed
          logs={paginatedLogs}
          totalCount={totalCount}
          filter={filter}
          setFilter={setFilter}
          ipSearch={ipSearch}
          setIpSearch={setIpSearch}
          page={page}
          setPage={setPage}
          limit={limit}
        />

              {/* Notification System */}
        <NotificationSystem logs={logs} stats={stats} />
        </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto text-center border-t border-cyber-border mt-12 pt-6 px-6 text-[10px] font-mono text-cyber-muted tracking-widest flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span>CYBERGUARD TELEMETRY SYSTEM v1.0.0</span>
        </div>
        <span>SECURE GATEWAY ENCRYPTED</span>
      </footer>
    </div>
  );
}

// NotificationSystem will be rendered inside DashboardContent

export default function App() {
  return (
    <PrivateRoute>
      <DashboardContent />
    </PrivateRoute>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, Shield, ShieldAlert, ShieldCheck, X, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';

// ── Notification Sound Generator ────────────────────────────────────────────────
// Uses Web Audio API for crisp, futuristic notification sounds
function playNotificationSound(type = 'threat') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'threat') {
      // Urgent alert — descending tone
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } else {
      // Safe/success — pleasant ascending tone
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(784, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    // Silently fail if audio isn't available
  }
}

// ── Send Native Desktop/Browser Notification ────────────────────────────────────
function sendDesktopNotification(title, body, icon, tag) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: tag || 'cyberguard-' + Date.now(),
        silent: false,
        requireInteraction: false,
      });
    } catch (e) {
      // Fallback: Electron uses its own notification API via ipcRenderer
    }
  }
  // Also use Electron native notifications if available
  if (window.electronAPI?.sendNotification) {
    window.electronAPI.sendNotification(title, body);
  }
}

// ── Notification Item Component ─────────────────────────────────────────────────
function NotificationItem({ notification, onDismiss }) {
  const isThreat = notification.type === 'threat';
  const borderColor = isThreat ? 'border-red-500/40' : 'border-emerald-500/40';
  const bgColor = isThreat ? 'bg-red-950/40' : 'bg-emerald-950/40';
  const iconColor = isThreat ? 'text-red-400' : 'text-emerald-400';
  const glowClass = isThreat ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'shadow-[0_0_15px_rgba(16,185,129,0.15)]';

  return (
    <div className={`relative flex items-start gap-3 p-3 rounded-lg border ${borderColor} ${bgColor} ${glowClass} transition-all duration-300 animate-slideIn group`}>
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
        {isThreat ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-bold uppercase tracking-wider ${iconColor}`}>
            {notification.title}
          </span>
          {isThreat && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
              ALERT
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-snug font-mono">{notification.message}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[9px] text-slate-600 font-mono">{notification.time}</span>
          {notification.ip && (
            <span className="text-[9px] text-slate-500 font-mono">IP: {notification.ip}</span>
          )}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(notification.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-800"
      >
        <X className="w-3.5 h-3.5 text-slate-500" />
      </button>
    </div>
  );
}

// ── Main Notification System Component ──────────────────────────────────────────
export default function NotificationSystem({ logs, stats }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const processedIdsRef = useRef(new Set());
  const lastSafeCheckRef = useRef(Date.now());
  const panelRef = useRef(null);
  const maxNotifications = 50;

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasPermission(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setHasPermission(permission === 'granted');
        });
      }
    }
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add a notification entry
  const addNotification = useCallback((notif) => {
    if (!isEnabled) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const entry = {
      id: Date.now() + Math.random(),
      ...notif,
      time: timeStr,
      timestamp: now,
    };

    setNotifications(prev => [entry, ...prev].slice(0, maxNotifications));
    setUnreadCount(prev => prev + 1);

    // Play sound
    if (soundEnabled) {
      playNotificationSound(notif.type);
    }

    // Send desktop/browser notification
    sendDesktopNotification(
      notif.type === 'threat' ? '⚠️ THREAT DETECTED' : '✅ System Secure',
      notif.message,
      null,
      notif.type === 'threat' ? `threat-${entry.id}` : `safe-${entry.id}`
    );
  }, [isEnabled, soundEnabled]);

  // Monitor incoming logs for threats
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    for (const log of logs) {
      const logId = log._id || log.id;
      if (!logId || processedIdsRef.current.has(logId)) continue;
      processedIdsRef.current.add(logId);

      // Only keep track of last 500 IDs to prevent memory leak
      if (processedIdsRef.current.size > 500) {
        const arr = Array.from(processedIdsRef.current);
        processedIdsRef.current = new Set(arr.slice(-250));
      }

      if (log.classification && log.classification !== 'Normal') {
        addNotification({
          type: 'threat',
          title: log.classification,
          message: `${log.classification} detected from ${log.ip} → ${log.method} ${log.path}${log.confidence ? ` (${(log.confidence * 100).toFixed(0)}% confidence)` : ''}`,
          ip: log.ip,
          classification: log.classification,
        });
      }
    }
  }, [logs, addNotification]);

  // Periodic "system safe" notification when no threats for 60 seconds
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSafe = now - lastSafeCheckRef.current;

      // Only send safe notification every 60 seconds
      if (timeSinceLastSafe >= 60000) {
        // Check if there are zero threats in recent notifications
        const recentThreats = notifications.filter(n => {
          const age = now - n.timestamp.getTime();
          return n.type === 'threat' && age < 60000;
        });

        if (recentThreats.length === 0 && stats?.total_logs > 0) {
          addNotification({
            type: 'safe',
            title: 'System Secure',
            message: `All clear — No threats detected in the last 60s. ${stats.clean_logs} clean requests processed. System integrity maintained.`,
          });
        }
        lastSafeCheckRef.current = now;
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isEnabled, notifications, stats, addNotification]);

  // Reset unread when panel is opened
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const threatCount = notifications.filter(n => n.type === 'threat').length;
  const safeCount = notifications.filter(n => n.type === 'safe').length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-2 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-md border transition-all duration-300 ${
          isEnabled
            ? unreadCount > 0
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            : 'border-slate-700 bg-slate-900/50 text-slate-500 hover:bg-slate-800/50'
        }`}
        title={isEnabled ? 'Notifications active' : 'Notifications disabled'}
      >
        {isEnabled ? (
          <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        ) : (
          <BellOff className="w-4 h-4" />
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        <span className="hidden md:inline">
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-[#0c0c14]/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col animate-fadeInScale">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">Notifications</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {notifications.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-md transition-colors ${
                  soundEnabled ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-slate-600 hover:bg-slate-800'
                }`}
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              {/* Enable/Disable */}
              <button
                onClick={() => setIsEnabled(!isEnabled)}
                className={`p-1.5 rounded-md transition-colors ${
                  isEnabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-600 hover:bg-slate-800'
                }`}
                title={isEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                {isEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>
              {/* Clear all */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800/50 bg-slate-900/30">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-mono text-red-400">{threatCount} threats</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400">{safeCount} safe</span>
            </div>
            {!hasPermission && (
              <button
                onClick={() => Notification.requestPermission().then(p => setHasPermission(p === 'granted'))}
                className="ml-auto text-[9px] font-mono text-amber-400 hover:underline"
              >
                Enable Desktop Alerts
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: '380px' }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <ShieldCheck className="w-10 h-10 mb-3 opacity-40" />
                <span className="text-xs font-mono">No notifications yet</span>
                <span className="text-[10px] font-mono text-slate-700 mt-1">Threat alerts will appear here</span>
              </div>
            ) : (
              notifications.map(notif => (
                <NotificationItem key={notif.id} notification={notif} onDismiss={handleDismiss} />
              ))
            )}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95) translateY(-5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-fadeInScale { animation: fadeInScale 0.2s ease-out; }
      `}</style>
    </div>
  );
}

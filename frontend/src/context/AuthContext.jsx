import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// In Electron, point to the direct backend, otherwise use dynamic config or Vite proxy
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
const API_BASE = isElectron ? 'http://127.0.0.1:8000' : (import.meta.env.VITE_API_URL || '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('cg_token');
    const savedUser = localStorage.getItem('cg_user');
    const savedRole = localStorage.getItem('cg_role');

    if (savedToken && savedUser && savedRole) {
      setToken(savedToken);
      setUser({ username: savedUser, role: savedRole });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      localStorage.setItem('cg_token', data.access_token);
      localStorage.setItem('cg_user', data.username);
      localStorage.setItem('cg_role', data.role);

      setToken(data.access_token);
      setUser({ username: data.username, role: data.role });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const signup = async (username, password, role = 'Viewer') => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Auto login after successful signup
      return await login(username, password);
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
    localStorage.removeItem('cg_role');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    signup,
    logout,
    isAdmin: user?.role === 'Admin',
    isViewer: user?.role === 'Viewer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

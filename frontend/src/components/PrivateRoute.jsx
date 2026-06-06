import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090e] flex flex-col items-center justify-center font-mono">
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-r-2 border-l-2 border-fuchsia-500 rounded-full animate-spin-reverse"></div>
        </div>
        <p className="text-cyan-400 text-sm tracking-widest uppercase animate-pulse">
          Decrypting Session Credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return children;
}

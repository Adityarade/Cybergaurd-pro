/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#09090e",
          card: "#12121a",
          border: "#1e1e2f",
          accent: "#8b5cf6", // Purple accent
          cyan: "#06b6d4",   // Cyber neon blue
          green: "#10b981",  // Safe emerald
          yellow: "#f59e0b", // Warning amber
          red: "#ef4444",    // Alert crimson
          text: "#e2e8f0",
          muted: "#94a3b8"
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(6, 182, 212, 0.4)',
        'neon-red': '0 0 10px rgba(239, 68, 68, 0.4)',
        'neon-green': '0 0 10px rgba(16, 185, 129, 0.4)',
        'neon-yellow': '0 0 10px rgba(245, 158, 11, 0.4)',
        'neon-purple': '0 0 10px rgba(139, 92, 246, 0.4)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}

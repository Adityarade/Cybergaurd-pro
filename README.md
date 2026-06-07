# 🚀 CyberGuard Pro
**AI‑Powered DevSecOps Threat Monitoring Platform.**

## 📋 Table of Contents
---
- [Description](#-description)
- [Demo Video](#-demo-video)
- [Features](#-features)
- [User Journey](#%EF%B8%8F-user-journey)
- [Project Structure](#-project-structure)
- [Built With](#%EF%B8%8F-built-with)
- [Documentation](#-documentation)
- [Installation & Setup](#-installation--setup)

## 📚 Description
---
CyberGuard Pro is a next‑generation, intelligent threat monitoring suite that empowers security analysts by decoding live telemetry. It uses advanced simulation and real-time WebSocket streaming to deeply analyze network traffic, monitor database health, and provide actionable, instant alerts. Whether you're actively monitoring threats or training your team via the built-in simulator, CyberGuard Pro tells you exactly what vulnerabilities are being targeted and how to respond.

## 🎥 Demo Video
---
See CyberGuard Pro in Action!

📺 [Watch Demo Video](#)

*Experience the power of real-time monitoring, AI-driven threat logging, and dynamic security alerts.*

## ✨ Features
---
- 🔐 **Secure JWT Authentication & RBAC**: Granular role‑based access, cryptographically signed tokens, 30‑minute expiry.
- ⚡ **Real‑Time WebSocket Streaming**: Live threat feed, ultra‑low latency, auto‑reconnect.
- 🔔 **Dynamic Notification System**: Desktop and browser alerts with custom sounds, safe‑status heartbeat, and sleek UI.
- 🎯 **Simulator Engine**: On‑demand attack simulation (SQL‑Injection, DDoS, Brute‑Force) for training and testing.
- 🤖 **Automated Incident Response Webhooks**: Seamless integration with Slack, Teams, and custom endpoints.
- 🎨 **Rich UI/UX**: Glass‑morphism, neon gradients, scanline CRT overlay, and responsive design.

## 🗺️ User Journey
---
**Authenticate Terminal → View System Health → Start Simulator Engine → Monitor Live Threat Feed → Receive Desktop Alerts → Analyze Attack Vectors → Secure System**

The journey transforms security monitoring from a reactive chore into a proactive science. Analysts log into the terminal, instantly see the health of the MongoDB connection and Simulator Engine, and launch a barrage of test attacks. The system categorizes every attack based on threat level, triggering native desktop notifications, and visually logging them in real-time.

## 📁 Project Structure
---
```text
CyberGuard-Pro/
├── 🎨 Frontend/           # React application (Vite + Tailwind)
│   ├── src/components/   # Reusable UI components (Lucide React)
│   ├── src/context/      # Authentication Context
│   └── dist/             # Production build artifacts
├── ⚙️ Backend/            # FastAPI Server (Python)
│   ├── app/api/          # REST Endpoints & WebSockets
│   ├── app/core/         # Security & Dependencies
│   ├── app/utils/        # Webhook & Notification Logic
│   └── app/simulator.py  # Threat Simulation Engine
├── 📦 Desktop/           # Desktop Application Logic
│   ├── electron/         # Electron Main & Preload Scripts
│   └── main.cjs          # Native Notification Bridge
└── 🐳 DevOps/            # Containerization & CI/CD
    ├── docker-compose.yml# Multi-container orchestration
    └── .github/          # Automated Deployment Workflows
```

## 🛠️ Built With
---
Here are the major tools and technologies used to build CyberGuard Pro:

**🧩 Backend & Core**  
FastAPI | Python | MongoDB | Uvicorn | Passlib

**⚙️ Frontend & Desktop**  
React | Vite | Tailwind CSS | Electron | Lucide

## 📖 Documentation
---
- ⚙️ **Backend Documentation** - API architecture and endpoints (`backend/docs/api.md`).
- 🎨 **Frontend Documentation** - UI components and dashboard logic (`frontend/README.md`).
- 🤝 **Contributing Guidelines** - See `CONTRIBUTING.md`.

### Key Features Documentation
- 🔍 **Threat Classification** - How we categorize SQLi, XSS, and DDoS.
- 🤖 **Simulator Engine** - The randomized attack generation system.
- 🕸️ **Real-Time Telemetry** - Techniques used for low-latency WebSocket streaming.

## 📦 Installation & Setup
---
You can run CyberGuard Pro easily:

### Option A: The One-Click Script (Easiest) 🚀
Simply run the included batch script for Windows. No manual configuration required.

1. Clone or download the repository.
2. Double-click `start.bat`.
3. The script will install all dependencies and start both servers automatically!

---

### Option B: Run from Source (For Developers) 🐍
If you want to modify the code or run it on Mac/Linux:

1. Clone the repository:
```bash
git clone https://github.com/Adityarade/Cybergaurd-pro.git
cd Cybergaurd-pro
```

2. Start the Backend (Python 3.12+):
```bash
python -m venv .venv
source .venv/bin/activate  # on Windows: .\.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

3. Start the Frontend (Node 18+):
```bash
cd frontend
npm install
npm run dev
```

---

<p align="center">
  <b>Built with ❤️ by Aditya</b>
</p>

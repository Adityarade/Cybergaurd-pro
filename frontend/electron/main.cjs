const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

// ── Configuration ──────────────────────────────────────────────────────────────
const BACKEND_PORT = 8000
const FRONTEND_PORT = 5180
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Python paths to try (in order of preference)
const PYTHON_PATHS = [
  'C:\\Users\\adity\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
  'python3',
  'python',
]

let mainWindow = null
let backendProcess = null

// ── Find Python ────────────────────────────────────────────────────────────────
function findPython() {
  for (const py of PYTHON_PATHS) {
    try {
      const result = require('child_process').spawnSync(py, ['--version'], { timeout: 2000 })
      if (result.status === 0) return py
    } catch {}
  }
  return null
}

// ── Start Python Backend ───────────────────────────────────────────────────────
function startBackend() {
  const python = findPython()
  if (!python) {
    console.error('Python not found. Backend will not start.')
    return null
  }

  const backendDir = isDev
    ? path.join(__dirname, '..', '..', 'backend')
    : path.join(process.resourcesPath, 'backend')

  console.log(`Starting backend with: ${python} at ${backendDir}`)

  const proc = spawn(
    python,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(BACKEND_PORT)],
    {
      cwd: backendDir,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
      windowsHide: true,   // Don't show a console window on Windows
    }
  )

  proc.stdout.on('data', (d) => console.log('[Backend]', d.toString().trim()))
  proc.stderr.on('data', (d) => console.log('[Backend]', d.toString().trim()))

  proc.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`)
  })

  return proc
}

// ── Wait for backend to be ready ───────────────────────────────────────────────
function waitForBackend(retries = 30, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/`, (res) => {
        resolve()
      })
      req.on('error', () => {
        if (n <= 0) return reject(new Error('Backend did not start in time'))
        setTimeout(() => attempt(n - 1), delay)
      })
      req.setTimeout(1000, () => {
        req.destroy()
        if (n <= 0) return reject(new Error('Backend timed out'))
        setTimeout(() => attempt(n - 1), delay)
      })
    }
    attempt(retries)
  })
}

// ── Create Main Window ─────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'CyberGuard — AI Threat Monitoring',
    backgroundColor: '#09090e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    show: false,
  })

  const url = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, '..', 'dist', 'index.html')}`

  mainWindow.loadURL(url)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── App Lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  backendProcess = startBackend()
  createWindow()

  try {
    await waitForBackend()
    console.log('Backend is ready.')
  } catch (err) {
    console.warn('Backend not ready:', err.message, '— continuing in memory mode.')
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('Shutting down backend...')
    backendProcess.kill('SIGTERM')
    backendProcess = null
  }
})

// ── IPC Handlers ───────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('get-backend-url', () => `http://127.0.0.1:${BACKEND_PORT}`)

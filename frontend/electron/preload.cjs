const { contextBridge, ipcRenderer } = require('electron')

// Expose a safe API to the React app via window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  sendNotification: (title, body) => ipcRenderer.invoke('send-notification', title, body),
})

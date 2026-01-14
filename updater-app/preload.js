const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runPnpmUpdate: () => ipcRenderer.invoke('run-pnpm-update'),
  runPnpmSelfUpdate: () => ipcRenderer.invoke('run-pnpm-self-update'),
  runOpencodeUpgrade: () => ipcRenderer.invoke('run-opencode-upgrade')
});
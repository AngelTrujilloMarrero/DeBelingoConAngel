const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      shell: true,
      cwd: path.dirname(__dirname),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0
      });
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

ipcMain.handle('run-pnpm-update', async () => {
  try {
    const result = await executeCommand('pnpm', ['update']);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('run-pnpm-self-update', async () => {
  try {
    const result = await executeCommand('pnpm', ['self-update']);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('run-opencode-upgrade', async () => {
  try {
    const result = await executeCommand('opencode', ['upgrade']);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 598,
    height: 938,
    resizable: false,
    fullscreen: false,
    frame: false, // matches decorations: false in Tauri
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Simplified for this kiosk app
    }
  });

  win.loadFile(path.join(__dirname, 'src/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

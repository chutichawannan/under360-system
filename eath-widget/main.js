const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let win;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const W = 168, H = 228;

  win = new BrowserWindow({
    width: W,
    height: H,
    x: workArea.x + workArea.width - W - 16,   // มุมขวาล่าง
    y: workArea.y + workArea.height - H - 16,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,                              // ให้ preload อ่าน fs (status.json) ได้
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');   // ลอยเหนือทุกหน้าต่าง
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

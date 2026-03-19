import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { createWsServer } from './wsServer';
import { registerIpcHandlers } from './ipcHandlers';

let mainWindow: BrowserWindow | null = null;

const BOUNDS_FILE = path.join(app.getPath('userData'), 'window-bounds.json');

function loadBounds(): { x?: number; y?: number; width: number; height: number; maximized?: boolean } | null {
  try {
    if (fs.existsSync(BOUNDS_FILE)) {
      return JSON.parse(fs.readFileSync(BOUNDS_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

function saveBounds(win: BrowserWindow) {
  try {
    const bounds = win.getBounds();
    const maximized = win.isMaximized();
    fs.writeFileSync(BOUNDS_FILE, JSON.stringify({ ...bounds, maximized }));
  } catch { /* ignore */ }
}

function createWindow() {
  const savedBounds = loadBounds();
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    minWidth: 900,
    minHeight: 600,
    title: 'Table Tamer',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  if (savedBounds) {
    windowOptions.x = savedBounds.x;
    windowOptions.y = savedBounds.y;
    windowOptions.width = savedBounds.width;
    windowOptions.height = savedBounds.height;
  } else {
    // Default: maximize
    windowOptions.width = screenW;
    windowOptions.height = screenH;
  }

  mainWindow = new BrowserWindow(windowOptions);

  if (savedBounds?.maximized || !savedBounds) {
    mainWindow.maximize();
  }

  const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
  mainWindow.loadFile(rendererPath);

  // Save bounds on resize/move
  mainWindow.on('resize', () => { if (mainWindow) saveBounds(mainWindow); });
  mainWindow.on('move', () => { if (mainWindow) saveBounds(mainWindow); });
  mainWindow.on('maximize', () => { if (mainWindow) saveBounds(mainWindow); });
  mainWindow.on('unmaximize', () => { if (mainWindow) saveBounds(mainWindow); });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createWsServer((event, ...args) => {
    mainWindow?.webContents.send(event, ...args);
  });
  registerIpcHandlers();

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

import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';
import { loadWindowPrefs, saveWindowPrefs, type WindowPrefs } from './window-prefs';

export function createMainWindow(opts: {
  prefsPath: string;
  preloadPath: string;
  pageUrl: string;
}): BrowserWindow {
  const prefs = loadWindowPrefs(opts.prefsPath);
  const win = new BrowserWindow({
    width: prefs.width,
    height: prefs.height,
    x: prefs.x,
    y: prefs.y,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: opts.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setOpacity(prefs.opacity);

  const persist = () => {
    if (win.isDestroyed()) return;
    const b = win.getBounds();
    const next: WindowPrefs = {
      width: b.width,
      height: b.height,
      x: b.x,
      y: b.y,
      opacity: win.getOpacity(),
    };
    saveWindowPrefs(opts.prefsPath, next);
  };

  win.on('resize', persist);
  win.on('move', persist);
  win.on('close', (e) => {
    // 隐藏到托盘而非退出（由 main 决定是否真正退出）
    if (!(global as unknown as { __aqdmForceQuit?: boolean }).__aqdmForceQuit) {
      e.preventDefault();
      win.hide();
      persist();
    }
  });

  void win.loadURL(opts.pageUrl);
  return win;
}

export function setWindowOpacity(win: BrowserWindow, opacity: number, prefsPath: string): void {
  win.setOpacity(Math.min(1, Math.max(0.3, opacity)));
  const b = win.getBounds();
  saveWindowPrefs(prefsPath, {
    width: b.width,
    height: b.height,
    x: b.x,
    y: b.y,
    opacity: win.getOpacity(),
  });
}

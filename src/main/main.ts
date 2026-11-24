import {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  safeStorage,
} from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createMainWindow, setWindowOpacity } from './window';
import { createTray } from './tray';
import { SecretStore } from './secrets/store';
import {
  createAdapterRegistry,
  type AdapterMode,
} from './adapters/registry';
import { QuotaScheduler } from './poll/scheduler';
import { ThresholdNotifier } from './alerts/threshold-notifier';
import type { AuthKind, AuthProfile, PlatformId } from '../shared/types';
import { loadWindowPrefs } from './window-prefs';

let mainWindow: BrowserWindow | null = null;
let mode: AdapterMode = (process.env.AQDM_ADAPTER_MODE as AdapterMode) || 'fake';
let registry = createAdapterRegistry(mode);
let threshold = 0.2;

const userData = () => app.getPath('userData');
const prefsPath = () => join(userData(), 'window-prefs.json');
const secretsPath = () => join(userData(), 'secrets.json');

let secretStore: SecretStore;
let scheduler: QuotaScheduler;
let notifier: ThresholdNotifier;

function resolveAuth(id: PlatformId): AuthProfile | null {
  if (mode === 'fake') {
    return { platformId: id, kind: 'api_key', secret: 'demo' };
  }
  if (!secretStore.has(id)) return null;
  const raw = secretStore.get(id);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { kind: AuthKind; secret: string; meta?: Record<string, string> };
    return {
      platformId: id,
      kind: parsed.kind,
      secret: parsed.secret,
      meta: parsed.meta,
    };
  } catch {
    return { platformId: id, kind: 'api_key', secret: raw };
  }
}

function wireScheduler(): void {
  scheduler?.stop();
  registry = createAdapterRegistry(mode);
  scheduler = new QuotaScheduler({
    registry,
    resolveAuth,
    intervalMs: 300_000,
    onSnapshots: (snaps) => {
      notifier.observe(snaps);
      mainWindow?.webContents.send('quota:snapshots', snaps);
    },
  });
  scheduler.start();
}

function registerIpc(): void {
  ipcMain.handle('quota:refreshAll', async () => scheduler.refreshAll());
  ipcMain.handle('quota:refreshOne', async (_e, id: PlatformId) => scheduler.refreshOne(id));
  ipcMain.handle('quota:getSnapshots', async () => scheduler.getLatest());
  ipcMain.handle('prefs:get', async () => {
    const p = loadWindowPrefs(prefsPath());
    return { opacity: p.opacity, width: p.width, height: p.height };
  });
  ipcMain.handle('prefs:setOpacity', async (_e, opacity: number) => {
    if (mainWindow) setWindowOpacity(mainWindow, opacity, prefsPath());
  });
  ipcMain.handle('secrets:has', async (_e, platformId: PlatformId) => secretStore.has(platformId));
  ipcMain.handle(
    'secrets:set',
    async (_e, payload: { platformId: PlatformId; kind: AuthKind; secret: string }) => {
      secretStore.set(
        payload.platformId,
        JSON.stringify({ kind: payload.kind, secret: payload.secret }),
      );
    },
  );
  ipcMain.handle('secrets:delete', async (_e, platformId: PlatformId) => {
    secretStore.delete(platformId);
  });
  ipcMain.handle('alerts:getThreshold', async () => threshold);
  ipcMain.handle('alerts:setThreshold', async (_e, t: number) => {
    threshold = t;
    notifier.setThreshold(t);
  });
  ipcMain.handle('adapters:getMode', async () => mode);
  ipcMain.handle('adapters:setMode', async (_e, m: AdapterMode) => {
    mode = m;
    wireScheduler();
  });
}

app.whenReady().then(() => {
  secretStore = new SecretStore({
    filePath: secretsPath(),
    safeStorage: {
      isEncryptionAvailable: () => safeStorage.isEncryptionAvailable(),
      encryptString: (s) => safeStorage.encryptString(s),
      decryptString: (b) => safeStorage.decryptString(b),
    },
  });

  notifier = new ThresholdNotifier({
    threshold,
    notify: (title, body) => {
      if (Notification.isSupported()) {
        new Notification({ title, body }).show();
      }
    },
  });

  registerIpc();
  wireScheduler();

  const preloadPath = join(__dirname, 'preload.js');
  const pageUrl = pathToFileURL(join(__dirname, '../renderer/index.html')).href;
  mainWindow = createMainWindow({
    prefsPath: prefsPath(),
    preloadPath,
    pageUrl,
  });

  createTray({
    iconPath: join(__dirname, '../assets/tray-icon.png'),
    getMainWindow: () => mainWindow,
    onRefresh: () => {
      void scheduler.refreshAll();
    },
    onQuit: () => {
      (global as unknown as { __aqdmForceQuit?: boolean }).__aqdmForceQuit = true;
      scheduler.stop();
      app.quit();
    },
  });
});

app.on('window-all-closed', () => {
  // 托盘常驻：故意不 quit
});

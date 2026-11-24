import { contextBridge, ipcRenderer } from 'electron';

export type AqdmApi = {
  refreshAll: () => Promise<unknown>;
  refreshOne: (id: string) => Promise<unknown>;
  getSnapshots: () => Promise<unknown>;
  onSnapshots: (cb: (snaps: unknown) => void) => () => void;
  getPrefs: () => Promise<{ opacity: number }>;
  setOpacity: (opacity: number) => Promise<void>;
  secretsHas: (platformId: string) => Promise<boolean>;
  secretsSet: (platformId: string, kind: string, secret: string) => Promise<void>;
  secretsDelete: (platformId: string) => Promise<void>;
  getThreshold: () => Promise<number>;
  setThreshold: (t: number) => Promise<void>;
  getMode: () => Promise<'fake' | 'live'>;
  setMode: (m: 'fake' | 'live') => Promise<void>;
};

const api: AqdmApi = {
  refreshAll: () => ipcRenderer.invoke('quota:refreshAll'),
  refreshOne: (id) => ipcRenderer.invoke('quota:refreshOne', id),
  getSnapshots: () => ipcRenderer.invoke('quota:getSnapshots'),
  onSnapshots: (cb) => {
    const listener = (_: unknown, snaps: unknown) => cb(snaps);
    ipcRenderer.on('quota:snapshots', listener);
    return () => ipcRenderer.removeListener('quota:snapshots', listener);
  },
  getPrefs: () => ipcRenderer.invoke('prefs:get'),
  setOpacity: (opacity) => ipcRenderer.invoke('prefs:setOpacity', opacity),
  secretsHas: (platformId) => ipcRenderer.invoke('secrets:has', platformId),
  secretsSet: (platformId, kind, secret) =>
    ipcRenderer.invoke('secrets:set', { platformId, kind, secret }),
  secretsDelete: (platformId) => ipcRenderer.invoke('secrets:delete', platformId),
  getThreshold: () => ipcRenderer.invoke('alerts:getThreshold'),
  setThreshold: (t) => ipcRenderer.invoke('alerts:setThreshold', t),
  getMode: () => ipcRenderer.invoke('adapters:getMode'),
  setMode: (m) => ipcRenderer.invoke('adapters:setMode', m),
};

contextBridge.exposeInMainWorld('aqdm', api);

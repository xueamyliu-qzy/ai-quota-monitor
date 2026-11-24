import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface WindowPrefs {
  width: number;
  height: number;
  opacity: number;
  x?: number;
  y?: number;
}

const DEFAULTS: WindowPrefs = { width: 420, height: 560, opacity: 0.92 };

export function loadWindowPrefs(filePath: string): WindowPrefs {
  if (!existsSync(filePath)) return { ...DEFAULTS };
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<WindowPrefs>;
    return {
      width: Number(raw.width) || DEFAULTS.width,
      height: Number(raw.height) || DEFAULTS.height,
      opacity: clampOpacity(Number(raw.opacity) || DEFAULTS.opacity),
      x: raw.x,
      y: raw.y,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveWindowPrefs(filePath: string, prefs: WindowPrefs): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const out = {
    width: prefs.width,
    height: prefs.height,
    opacity: clampOpacity(prefs.opacity),
    x: prefs.x,
    y: prefs.y,
  };
  writeFileSync(filePath, JSON.stringify(out, null, 2), 'utf8');
}

function clampOpacity(n: number): number {
  if (Number.isNaN(n)) return DEFAULTS.opacity;
  return Math.min(1, Math.max(0.3, n));
}

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadWindowPrefs, saveWindowPrefs } from './window-prefs';

describe('window-prefs', () => {
  let dir: string;
  let file: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'aqdm-prefs-'));
    file = join(dir, 'window.json');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('保存后可恢复且无密钥字段', () => {
    saveWindowPrefs(file, { width: 500, height: 600, opacity: 0.8 });
    const loaded = loadWindowPrefs(file);
    expect(loaded.width).toBe(500);
    expect(loaded.opacity).toBe(0.8);
    const raw = readFileSync(file, 'utf8');
    expect(raw).not.toMatch(/secret|token|api[_-]?key/i);
  });
});

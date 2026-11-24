import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SecretStore, type SafeStorageLike } from './store';

function mockSafeStorage(): SafeStorageLike {
  return {
    isEncryptionAvailable: () => true,
    encryptString: (plain: string) => Buffer.from(`ENC:${plain}`, 'utf8'),
    decryptString: (blob: Buffer) => {
      const s = blob.toString('utf8');
      if (!s.startsWith('ENC:')) throw new Error('bad');
      return s.slice(4);
    },
  };
}

describe('SecretStore', () => {
  let dir: string;
  let store: SecretStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'aqdm-sec-'));
    store = new SecretStore({
      filePath: join(dir, 'secrets.json'),
      safeStorage: mockSafeStorage(),
    });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('加密后落盘且不含明文', () => {
    store.set('chatgpt', 'sk-secret-plain');
    const raw = store.readRawFile()!;
    expect(raw).not.toContain('sk-secret-plain');
    expect(store.get('chatgpt')).toBe('sk-secret-plain');
  });

  it('加密不可用时抛出中文错误', () => {
    const bad = new SecretStore({
      filePath: join(dir, 'x.json'),
      safeStorage: {
        isEncryptionAvailable: () => false,
        encryptString: () => Buffer.alloc(0),
        decryptString: () => '',
      },
    });
    expect(() => bad.set('k', 'v')).toThrow(/系统加密不可用/);
  });

  it('delete 后无法读取', () => {
    store.set('grok', 'abc');
    store.delete('grok');
    expect(store.get('grok')).toBeNull();
  });
});

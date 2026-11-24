/**
 * 本地加密凭据存储（T1.5）— 基于 Electron safeStorage
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

export interface SafeStorageLike {
  isEncryptionAvailable(): boolean;
  encryptString(plain: string): Buffer;
  decryptString(blob: Buffer): string;
}

export interface SecretStoreOptions {
  filePath: string;
  safeStorage: SafeStorageLike;
}

type SecretFile = {
  version: 1;
  entries: Record<string, string>; // base64 ciphertext
};

export class SecretStore {
  constructor(private readonly opts: SecretStoreOptions) {}

  private ensureCrypto(): void {
    if (!this.opts.safeStorage.isEncryptionAvailable()) {
      throw new Error('系统加密不可用：无法使用本地加密存储（请确认 Windows DPAPI / safeStorage）');
    }
  }

  private read(): SecretFile {
    if (!existsSync(this.opts.filePath)) {
      return { version: 1, entries: {} };
    }
    const raw = readFileSync(this.opts.filePath, 'utf8');
    const parsed = JSON.parse(raw) as SecretFile;
    if (parsed.version !== 1 || typeof parsed.entries !== 'object') {
      throw new Error('凭据文件格式无效');
    }
    return parsed;
  }

  private write(file: SecretFile): void {
    mkdirSync(dirname(this.opts.filePath), { recursive: true });
    writeFileSync(this.opts.filePath, JSON.stringify(file), 'utf8');
  }

  set(key: string, plain: string): void {
    this.ensureCrypto();
    const file = this.read();
    const enc = this.opts.safeStorage.encryptString(plain);
    file.entries[key] = enc.toString('base64');
    this.write(file);
  }

  get(key: string): string | null {
    this.ensureCrypto();
    const file = this.read();
    const b64 = file.entries[key];
    if (!b64) return null;
    return this.opts.safeStorage.decryptString(Buffer.from(b64, 'base64'));
  }

  delete(key: string): void {
    const file = this.read();
    if (!(key in file.entries)) return;
    delete file.entries[key];
    this.write(file);
  }

  has(key: string): boolean {
    const file = this.read();
    return key in file.entries;
  }

  /** 测试辅助：读取落盘原文（应为密文 JSON，不含明文 secret） */
  readRawFile(): string | null {
    if (!existsSync(this.opts.filePath)) return null;
    return readFileSync(this.opts.filePath, 'utf8');
  }

  destroyFile(): void {
    if (existsSync(this.opts.filePath)) unlinkSync(this.opts.filePath);
  }
}

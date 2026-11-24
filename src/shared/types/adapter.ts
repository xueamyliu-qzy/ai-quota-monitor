/**
 * 适配器与鉴权画像（schema/type-first，T1.1）
 * 适配器只通过 `fetchQuota` 拉额度；不得读写磁盘密钥。
 */

import type { PlatformId, QuotaSnapshot } from './quota.js';

/** 混合鉴权种类（按平台按需选用） */
export type AuthKind = 'api_key' | 'session' | 'oauth';

/**
 * 主进程注入适配器的内存态鉴权材料。
 * 密文落盘 / `safeStorage` 属于后续凭据存储任务，不在本接口内。
 */
export interface AuthProfile {
  platformId: PlatformId;
  kind: AuthKind;
  /** 解密后的密钥或会话材料；仅存主进程内存 */
  secret: string;
  /** 非密钥元数据（如账号标签） */
  meta?: Readonly<Record<string, string>>;
}

/** `fetchQuota` 调用上下文 */
export interface FetchQuotaContext {
  auth: AuthProfile;
  signal?: AbortSignal;
}

/**
 * 平台额度适配器。
 * 仅允许网络拉取与纯计算；禁止磁盘 I/O、禁止写日志密钥。
 */
export interface QuotaAdapter {
  readonly platformId: PlatformId;
  fetchQuota(ctx: FetchQuotaContext): Promise<QuotaSnapshot>;
}

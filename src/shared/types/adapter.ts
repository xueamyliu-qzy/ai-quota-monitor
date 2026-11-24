/**
 * 适配器与鉴权画像（T1.1）
 */

import type { PlatformId, QuotaSnapshot } from './quota';

export type AuthKind = 'api_key' | 'session' | 'oauth';

export interface AuthProfile {
  platformId: PlatformId;
  kind: AuthKind;
  secret: string;
  meta?: Readonly<Record<string, string>>;
}

export interface FetchQuotaContext {
  auth: AuthProfile;
  signal?: AbortSignal;
}

export interface QuotaAdapter {
  readonly platformId: PlatformId;
  fetchQuota(ctx: FetchQuotaContext): Promise<QuotaSnapshot>;
}

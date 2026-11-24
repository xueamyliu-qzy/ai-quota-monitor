/**
 * 额度快照与窗口模型（schema/type-first，T1.1）
 */

export type PlatformId = 'chatgpt' | 'grok' | 'gemini';

export type QuotaStatus =
  | 'ok'
  | 'stale'
  | 'auth_error'
  | 'rate_limited'
  | 'unavailable'
  | 'unknown';

export interface QuotaWindow {
  remainingRatio: number;
  remainingLabel?: string;
  resetsAt?: string;
}

export interface QuotaSnapshot {
  platformId: PlatformId;
  windows: {
    fiveHour: QuotaWindow;
    weekly: QuotaWindow;
  };
  status: QuotaStatus;
  fetchedAt: string;
  errorMessage?: string;
}

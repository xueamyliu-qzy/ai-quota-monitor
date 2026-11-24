/**
 * 额度快照与窗口模型（schema/type-first，T1.1）
 * 语义对齐 ADR-0003 / PRD：每平台 5 小时 + 周窗口。
 */

/** v1 已锁定平台 */
export type PlatformId = 'chatgpt' | 'grok' | 'gemini';

/** 拉取 / 展示状态（失败须诚实，不编造数字） */
export type QuotaStatus =
  | 'ok'
  | 'stale'
  | 'auth_error'
  | 'rate_limited'
  | 'unavailable'
  | 'unknown';

/**
 * 单个额度窗口。
 * `remainingRatio` 约定为 0–1（1 = 满额，0 = 耗尽）。
 */
export interface QuotaWindow {
  remainingRatio: number;
  /** 可选展示文案，例如「剩余 42%」 */
  remainingLabel?: string;
  /** 窗口重置时间（ISO 8601），未知则可省略 */
  resetsAt?: string;
}

/** 统一额度快照：适配器输出、UI 与调度器共用 */
export interface QuotaSnapshot {
  platformId: PlatformId;
  windows: {
    fiveHour: QuotaWindow;
    weekly: QuotaWindow;
  };
  status: QuotaStatus;
  /** 成功拉取或生成快照的时间（ISO 8601） */
  fetchedAt: string;
  /** 面向用户的中文短句；禁止包含密钥 */
  errorMessage?: string;
}

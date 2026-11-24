/**
 * Gemini 额度适配器（T1.15）
 * 免费层常靠 rate-limit 响应头估算；无标准「剩余」字段时返回 unavailable。
 */
import type { FetchQuotaContext, QuotaAdapter, QuotaSnapshot } from '../../shared/types';
import type { FetchLike } from './http';
import { errorSnapshot, statusFromHttp } from './map-status';

const DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export function createGeminiAdapter(opts?: {
  fetchImpl?: FetchLike;
  probeUrl?: string;
}): QuotaAdapter {
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const probeUrl = opts?.probeUrl ?? DEFAULT_URL;

  return {
    platformId: 'gemini',
    async fetchQuota(ctx: FetchQuotaContext): Promise<QuotaSnapshot> {
      if (!ctx.auth.secret) {
        return errorSnapshot('gemini', 'auth_error', '未配置 Gemini API Key');
      }
      try {
        const url = `${probeUrl}?key=${encodeURIComponent(ctx.auth.secret)}`;
        const res = await fetchImpl(url, { method: 'GET', signal: ctx.signal });
        if (!res.ok) {
          return errorSnapshot(
            'gemini',
            statusFromHttp(res.status),
            `Gemini 探测失败（HTTP ${res.status}）`,
          );
        }
        // 官方 list models 不返回 5h/周剩余；若 meta 注入了比例则使用（便于 fixture）
        const five = num(ctx.auth.meta?.fiveHourRatio);
        const week = num(ctx.auth.meta?.weeklyRatio);
        if (five !== null && week !== null) {
          return {
            platformId: 'gemini',
            windows: {
              fiveHour: { remainingRatio: five, remainingLabel: `${Math.round(five * 100)}%` },
              weekly: { remainingRatio: week, remainingLabel: `${Math.round(week * 100)}%` },
            },
            status: 'ok',
            fetchedAt: new Date().toISOString(),
          };
        }
        return errorSnapshot(
          'gemini',
          'unavailable',
          'Gemini 未提供标准 5h/周剩余字段（需账号控制台或后续官方 API）',
        );
      } catch {
        return errorSnapshot('gemini', 'unavailable', 'Gemini 网络错误');
      }
    },
  };
}

function num(n: unknown): number | null {
  if (typeof n === 'string' && n !== '') {
    const v = Number(n);
    if (!Number.isNaN(v)) return Math.min(1, Math.max(0, v));
  }
  if (typeof n === 'number' && !Number.isNaN(n)) return Math.min(1, Math.max(0, n));
  return null;
}

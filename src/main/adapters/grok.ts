/**
 * Grok / xAI 额度适配器（T1.14）
 */
import type { FetchQuotaContext, QuotaAdapter, QuotaSnapshot } from '../../shared/types';
import { getJson, type FetchLike } from './http';
import { errorSnapshot, statusFromHttp } from './map-status';

export type GrokUsageResponse = {
  remaining_5h?: number;
  remaining_weekly?: number;
  resets_5h?: string;
  resets_weekly?: string;
};

const DEFAULT_URL = 'https://api.x.ai/v1/usage';

export function createGrokAdapter(opts?: {
  fetchImpl?: FetchLike;
  usageUrl?: string;
}): QuotaAdapter {
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const usageUrl = opts?.usageUrl ?? DEFAULT_URL;

  return {
    platformId: 'grok',
    async fetchQuota(ctx: FetchQuotaContext): Promise<QuotaSnapshot> {
      if (!ctx.auth.secret) {
        return errorSnapshot('grok', 'auth_error', '未配置 Grok 凭据');
      }
      try {
        const { ok, status, json } = await getJson(
          usageUrl,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${ctx.auth.secret}`,
            },
            signal: ctx.signal,
          },
          fetchImpl,
        );
        if (!ok) {
          return errorSnapshot('grok', statusFromHttp(status), `Grok 拉取失败（HTTP ${status}）`);
        }
        const body = json as GrokUsageResponse;
        const five = num(body.remaining_5h);
        const week = num(body.remaining_weekly);
        if (five === null || week === null) {
          return errorSnapshot('grok', 'unavailable', 'Grok 响应缺少额度字段');
        }
        return {
          platformId: 'grok',
          windows: {
            fiveHour: {
              remainingRatio: five,
              remainingLabel: `${Math.round(five * 100)}%`,
              resetsAt: body.resets_5h,
            },
            weekly: {
              remainingRatio: week,
              remainingLabel: `${Math.round(week * 100)}%`,
              resetsAt: body.resets_weekly,
            },
          },
          status: 'ok',
          fetchedAt: new Date().toISOString(),
        };
      } catch {
        return errorSnapshot('grok', 'unavailable', 'Grok 网络错误');
      }
    },
  };
}

function num(n: unknown): number | null {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  return Math.min(1, Math.max(0, n));
}

/**
 * ChatGPT 额度适配器（T1.13）
 * 真实会话额度多依赖 chatgpt.com 私有接口；此处实现可测的拉取骨架 + Bearer/session。
 */
import type { FetchQuotaContext, QuotaAdapter, QuotaSnapshot } from '../../shared/types';
import { getJson, type FetchLike } from './http';
import { errorSnapshot, statusFromHttp } from './map-status';

export type ChatGptUsageResponse = {
  five_hour_remaining_ratio?: number;
  weekly_remaining_ratio?: number;
  five_hour_resets_at?: string;
  weekly_resets_at?: string;
};

const DEFAULT_URL = 'https://chatgpt.com/backend-api/usage';

export function createChatGptAdapter(opts?: {
  fetchImpl?: FetchLike;
  usageUrl?: string;
}): QuotaAdapter {
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const usageUrl = opts?.usageUrl ?? DEFAULT_URL;

  return {
    platformId: 'chatgpt',
    async fetchQuota(ctx: FetchQuotaContext): Promise<QuotaSnapshot> {
      if (!ctx.auth.secret) {
        return errorSnapshot('chatgpt', 'auth_error', '未配置 ChatGPT 凭据');
      }
      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
        };
        if (ctx.auth.kind === 'api_key') {
          headers.Authorization = `Bearer ${ctx.auth.secret}`;
        } else {
          headers.Authorization = `Bearer ${ctx.auth.secret}`;
          headers.Cookie = ctx.auth.meta?.cookie ?? '';
        }
        const { ok, status, json } = await getJson(
          usageUrl,
          { method: 'GET', headers, signal: ctx.signal },
          fetchImpl,
        );
        if (!ok) {
          return errorSnapshot(
            'chatgpt',
            statusFromHttp(status),
            `ChatGPT 拉取失败（HTTP ${status}）`,
          );
        }
        const body = json as ChatGptUsageResponse;
        const five = clamp(body.five_hour_remaining_ratio);
        const week = clamp(body.weekly_remaining_ratio);
        if (five === null || week === null) {
          return errorSnapshot('chatgpt', 'unavailable', 'ChatGPT 响应缺少额度字段');
        }
        return {
          platformId: 'chatgpt',
          windows: {
            fiveHour: {
              remainingRatio: five,
              remainingLabel: `${Math.round(five * 100)}%`,
              resetsAt: body.five_hour_resets_at,
            },
            weekly: {
              remainingRatio: week,
              remainingLabel: `${Math.round(week * 100)}%`,
              resetsAt: body.weekly_resets_at,
            },
          },
          status: 'ok',
          fetchedAt: new Date().toISOString(),
        };
      } catch {
        return errorSnapshot('chatgpt', 'unavailable', 'ChatGPT 网络错误');
      }
    },
  };
}

function clamp(n: unknown): number | null {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  return Math.min(1, Math.max(0, n));
}

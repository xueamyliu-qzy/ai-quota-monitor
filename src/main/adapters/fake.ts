import type { AuthProfile, FetchQuotaContext, QuotaAdapter, QuotaSnapshot, PlatformId } from '../../shared/types';

export function createFakeAdapter(
  platformId: PlatformId,
  ratios: { fiveHour: number; weekly: number } = { fiveHour: 0.72, weekly: 0.55 },
): QuotaAdapter {
  return {
    platformId,
    async fetchQuota(ctx: FetchQuotaContext): Promise<QuotaSnapshot> {
      if (!ctx.auth?.secret) {
        return {
          platformId,
          windows: {
            fiveHour: { remainingRatio: 0 },
            weekly: { remainingRatio: 0 },
          },
          status: 'auth_error',
          fetchedAt: new Date().toISOString(),
          errorMessage: '未配置凭据',
        };
      }
      return {
        platformId,
        windows: {
          fiveHour: {
            remainingRatio: ratios.fiveHour,
            remainingLabel: `${Math.round(ratios.fiveHour * 100)}%`,
          },
          weekly: {
            remainingRatio: ratios.weekly,
            remainingLabel: `${Math.round(ratios.weekly * 100)}%`,
          },
        },
        status: 'ok',
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}

export function demoAuth(platformId: PlatformId): AuthProfile {
  return { platformId, kind: 'api_key', secret: 'demo' };
}

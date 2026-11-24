import type { QuotaSnapshot, PlatformId, QuotaStatus } from '../../shared/types';

export function emptyWindows() {
  return {
    fiveHour: { remainingRatio: 0 },
    weekly: { remainingRatio: 0 },
  };
}

export function errorSnapshot(
  platformId: PlatformId,
  status: QuotaStatus,
  errorMessage: string,
): QuotaSnapshot {
  return {
    platformId,
    windows: emptyWindows(),
    status,
    fetchedAt: new Date().toISOString(),
    errorMessage,
  };
}

export function statusFromHttp(code: number): QuotaStatus {
  if (code === 401 || code === 403) return 'auth_error';
  if (code === 429) return 'rate_limited';
  if (code >= 500) return 'unavailable';
  return 'unknown';
}

import { describe, expect, it, vi } from 'vitest';
import { createGeminiAdapter } from './gemini';

describe('gemini adapter', () => {
  it('无比例 meta 时 unavailable', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"models":[]}', { status: 200 }));
    const a = createGeminiAdapter({ fetchImpl: fetchImpl as never });
    const snap = await a.fetchQuota({
      auth: { platformId: 'gemini', kind: 'api_key', secret: 'AIza' },
    });
    expect(snap.status).toBe('unavailable');
  });

  it('fixture meta 可出 ok', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const a = createGeminiAdapter({ fetchImpl: fetchImpl as never });
    const snap = await a.fetchQuota({
      auth: {
        platformId: 'gemini',
        kind: 'api_key',
        secret: 'AIza',
        meta: { fiveHourRatio: '0.5', weeklyRatio: '0.25' },
      },
    });
    expect(snap.status).toBe('ok');
    expect(snap.windows.fiveHour.remainingRatio).toBeCloseTo(0.5);
  });
});

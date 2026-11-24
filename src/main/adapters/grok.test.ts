import { describe, expect, it, vi } from 'vitest';
import { createGrokAdapter } from './grok';

describe('grok adapter', () => {
  it('mock 成功', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ remaining_5h: 0.2, remaining_weekly: 0.1 }), { status: 200 }),
    );
    const a = createGrokAdapter({ fetchImpl: fetchImpl as never });
    const snap = await a.fetchQuota({
      auth: { platformId: 'grok', kind: 'api_key', secret: 'xai-key' },
    });
    expect(snap.status).toBe('ok');
    expect(snap.windows.weekly.remainingRatio).toBeCloseTo(0.1);
  });

  it('429 → rate_limited', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 429 }));
    const a = createGrokAdapter({ fetchImpl: fetchImpl as never });
    const snap = await a.fetchQuota({
      auth: { platformId: 'grok', kind: 'api_key', secret: 'x' },
    });
    expect(snap.status).toBe('rate_limited');
  });
});

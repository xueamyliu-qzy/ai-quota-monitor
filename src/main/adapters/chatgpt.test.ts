import { describe, expect, it, vi } from 'vitest';
import { createChatGptAdapter } from './chatgpt';

describe('chatgpt adapter', () => {
  it('mock 成功映射快照', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          five_hour_remaining_ratio: 0.66,
          weekly_remaining_ratio: 0.4,
        }),
        { status: 200 },
      ),
    );
    const a = createChatGptAdapter({ fetchImpl: fetchImpl as never });
    const snap = await a.fetchQuota({
      auth: { platformId: 'chatgpt', kind: 'session', secret: 'tok' },
    });
    expect(snap.status).toBe('ok');
    expect(snap.windows.fiveHour.remainingRatio).toBeCloseTo(0.66);
  });

  it('401 → auth_error', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 401 }));
    const a = createChatGptAdapter({ fetchImpl: fetchImpl as never });
    const snap = await a.fetchQuota({
      auth: { platformId: 'chatgpt', kind: 'api_key', secret: 'x' },
    });
    expect(snap.status).toBe('auth_error');
  });
});

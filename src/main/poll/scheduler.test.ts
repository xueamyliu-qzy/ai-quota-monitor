import { describe, expect, it, vi } from 'vitest';
import { QuotaScheduler } from './scheduler';
import { createAdapterRegistry } from '../adapters/registry';
import { demoAuth } from '../adapters/fake';
import type { PlatformId } from '../../shared/types';

describe('QuotaScheduler', () => {
  it('假时钟下按间隔触发', async () => {
    const registry = createAdapterRegistry('fake');
    let now = 0;
    const timers: Array<{ fn: () => void; ms: number }> = [];
    const onSnapshots = vi.fn();
    const sched = new QuotaScheduler({
      registry,
      resolveAuth: (id) => demoAuth(id),
      intervalMs: 300_000,
      now: () => now,
      setTimer: (fn, ms) => {
        timers.push({ fn, ms });
        return timers.length;
      },
      clearTimer: () => undefined,
      onSnapshots,
    });
    sched.start();
    expect(timers[0]?.ms).toBe(300_000);
    await vi.waitFor(() => expect(onSnapshots).toHaveBeenCalled());
    const calls = onSnapshots.mock.calls.length;
    timers[0].fn();
    await vi.waitFor(() => expect(onSnapshots.mock.calls.length).toBeGreaterThan(calls));
    sched.stop();
  });

  it('单适配器失败不影响其他', async () => {
    const registry = createAdapterRegistry('fake');
    registry.set('chatgpt', {
      platformId: 'chatgpt',
      fetchQuota: async () => {
        throw new Error('boom');
      },
    });
    const sched = new QuotaScheduler({
      registry,
      resolveAuth: (id: PlatformId) => demoAuth(id),
    });
    const snaps = await sched.refreshAll();
    const chatgpt = snaps.find((s) => s.platformId === 'chatgpt');
    const grok = snaps.find((s) => s.platformId === 'grok');
    expect(chatgpt?.status).toBe('unavailable');
    expect(grok?.status).toBe('ok');
  });
});

import { describe, expect, it } from 'vitest';
import { createAdapterRegistry, getAdapter, PLATFORM_IDS } from './registry';
import { demoAuth } from './fake';

describe('adapter registry', () => {
  it('fake 模式含三平台', async () => {
    const reg = createAdapterRegistry('fake');
    for (const id of PLATFORM_IDS) {
      const a = getAdapter(reg, id);
      const snap = await a.fetchQuota({ auth: demoAuth(id) });
      expect(snap.platformId).toBe(id);
      expect(snap.status).toBe('ok');
      expect(snap.windows.fiveHour.remainingRatio).toBeGreaterThanOrEqual(0);
    }
  });

  it('未知 id 抛错', () => {
    const reg = createAdapterRegistry('fake');
    expect(() => getAdapter(reg, 'nope' as never)).toThrow(/未知平台/);
  });
});

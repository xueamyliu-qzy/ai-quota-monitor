import { describe, expect, it, vi } from 'vitest';
import { ThresholdNotifier } from './threshold-notifier';
import type { QuotaSnapshot } from '../../shared/types';

function snap(platformId: 'chatgpt', ratio: number): QuotaSnapshot {
  return {
    platformId,
    windows: {
      fiveHour: { remainingRatio: ratio },
      weekly: { remainingRatio: 1 },
    },
    status: 'ok',
    fetchedAt: new Date().toISOString(),
  };
}

describe('ThresholdNotifier', () => {
  it('连续低于阈值不重复通知', () => {
    const notify = vi.fn();
    const n = new ThresholdNotifier({ threshold: 0.3, notify, window: 'fiveHour' });
    n.observe([snap('chatgpt', 0.2)]);
    n.observe([snap('chatgpt', 0.1)]);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('回升再跌才第二次', () => {
    const notify = vi.fn();
    const n = new ThresholdNotifier({ threshold: 0.3, notify, window: 'fiveHour' });
    n.observe([snap('chatgpt', 0.2)]);
    n.observe([snap('chatgpt', 0.5)]);
    n.observe([snap('chatgpt', 0.2)]);
    expect(notify).toHaveBeenCalledTimes(2);
  });
});

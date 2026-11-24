import type { PlatformId, QuotaSnapshot } from '../../shared/types';

export type NotifyFn = (title: string, body: string) => void;

export interface ThresholdNotifierOptions {
  /** 0–1，剩余低于该值触发 */
  threshold: number;
  notify: NotifyFn;
  /** 选用 fiveHour 或 weekly，或两者都看（取更低） */
  window?: 'fiveHour' | 'weekly' | 'min';
}

/**
 * 边沿触发：跌破阈值通知一次；回升越过后再允许下一次（T1.16）
 */
export class ThresholdNotifier {
  private armed = new Map<string, boolean>();

  constructor(private readonly opts: ThresholdNotifierOptions) {}

  setThreshold(t: number): void {
    this.opts.threshold = t;
  }

  observe(snapshots: QuotaSnapshot[]): void {
    for (const snap of snapshots) {
      this.observeOne(snap);
    }
  }

  private ratio(snap: QuotaSnapshot): number {
    const a = snap.windows.fiveHour.remainingRatio;
    const b = snap.windows.weekly.remainingRatio;
    const w = this.opts.window ?? 'min';
    if (w === 'fiveHour') return a;
    if (w === 'weekly') return b;
    return Math.min(a, b);
  }

  private key(id: PlatformId, which: string): string {
    return `${id}:${which}`;
  }

  private observeOne(snap: QuotaSnapshot): void {
    if (snap.status !== 'ok' && snap.status !== 'stale') return;
    const r = this.ratio(snap);
    const k = this.key(snap.platformId, this.opts.window ?? 'min');
    const below = r < this.opts.threshold;
    const wasArmed = this.armed.get(k) ?? true;
    if (below && wasArmed) {
      this.opts.notify(
        '额度偏低',
        `${snap.platformId} 剩余 ${(r * 100).toFixed(0)}%（阈值 ${(this.opts.threshold * 100).toFixed(0)}%）`,
      );
      this.armed.set(k, false);
    } else if (!below) {
      this.armed.set(k, true);
    }
  }
}

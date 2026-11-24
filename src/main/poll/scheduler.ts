import type { PlatformId, QuotaAdapter, QuotaSnapshot, AuthProfile } from '../../shared/types';

export type AuthResolver = (id: PlatformId) => AuthProfile | null;

export interface SchedulerOptions {
  registry: Map<PlatformId, QuotaAdapter>;
  resolveAuth: AuthResolver;
  intervalMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (id: unknown) => void;
  onSnapshots?: (snaps: QuotaSnapshot[]) => void;
}

const DEFAULT_MS = 300_000;

export class QuotaScheduler {
  private timer: unknown = null;
  private readonly intervalMs: number;
  private readonly now: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (id: unknown) => void;
  private last: Map<PlatformId, QuotaSnapshot> = new Map();

  constructor(private readonly opts: SchedulerOptions) {
    this.intervalMs = opts.intervalMs ?? DEFAULT_MS;
    this.now = opts.now ?? Date.now;
    this.setTimer = opts.setTimer ?? ((fn, ms) => setInterval(fn, ms));
    this.clearTimer =
      opts.clearTimer ?? ((id) => clearInterval(id as NodeJS.Timeout));
  }

  start(): void {
    if (this.timer != null) return;
    void this.refreshAll();
    this.timer = this.setTimer(() => {
      void this.refreshAll();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer != null) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
  }

  getLatest(): QuotaSnapshot[] {
    return [...this.last.values()];
  }

  async refreshOne(id: PlatformId): Promise<QuotaSnapshot> {
    const adapter = this.opts.registry.get(id);
    if (!adapter) {
      throw new Error(`未知平台：${id}`);
    }
    const auth = this.opts.resolveAuth(id);
    let snap: QuotaSnapshot;
    try {
      if (!auth) {
        snap = {
          platformId: id,
          windows: { fiveHour: { remainingRatio: 0 }, weekly: { remainingRatio: 0 } },
          status: 'auth_error',
          fetchedAt: new Date(this.now()).toISOString(),
          errorMessage: '未配置凭据',
        };
      } else {
        snap = await adapter.fetchQuota({ auth });
      }
    } catch {
      snap = {
        platformId: id,
        windows: { fiveHour: { remainingRatio: 0 }, weekly: { remainingRatio: 0 } },
        status: 'unavailable',
        fetchedAt: new Date(this.now()).toISOString(),
        errorMessage: '适配器异常',
      };
    }
    this.last.set(id, snap);
    this.opts.onSnapshots?.(this.getLatest());
    return snap;
  }

  async refreshAll(): Promise<QuotaSnapshot[]> {
    const ids = [...this.opts.registry.keys()];
    await Promise.all(ids.map((id) => this.refreshOne(id)));
    return this.getLatest();
  }
}

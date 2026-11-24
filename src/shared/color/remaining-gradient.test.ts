import { describe, expect, it } from 'vitest';
import {
  clampRatio,
  remainingRatioToCss,
  remainingRatioToHex,
  remainingRatioToRgb,
} from './remaining-gradient';

describe('remaining-gradient', () => {
  it('满额偏蓝', () => {
    const { r, g, b } = remainingRatioToRgb(1);
    expect(b).toBeGreaterThan(r);
    expect(remainingRatioToHex(1)).toBe('#2563eb');
  });

  it('耗尽偏红', () => {
    const { r, g, b } = remainingRatioToRgb(0);
    expect(r).toBeGreaterThan(b);
    expect(remainingRatioToHex(0)).toBe('#dc2626');
  });

  it('0.5 介于蓝红之间', () => {
    const mid = remainingRatioToRgb(0.5);
    const full = remainingRatioToRgb(1);
    const empty = remainingRatioToRgb(0);
    expect(mid.r).toBeGreaterThan(full.r);
    expect(mid.r).toBeLessThan(empty.r);
    expect(mid.b).toBeLessThan(full.b);
    expect(mid.b).toBeGreaterThan(empty.b);
  });

  it('边界不产生 NaN', () => {
    for (const v of [0, 1, -1, 2, Number.NaN]) {
      const { r, g, b } = remainingRatioToRgb(v);
      expect(Number.isFinite(r)).toBe(true);
      expect(Number.isFinite(g)).toBe(true);
      expect(Number.isFinite(b)).toBe(true);
      expect(remainingRatioToCss(v)).toMatch(/^rgb\(/);
    }
    expect(clampRatio(Number.NaN)).toBe(0);
  });
});

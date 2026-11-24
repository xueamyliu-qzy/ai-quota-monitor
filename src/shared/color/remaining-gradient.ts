/**
 * 剩余比例 → 蓝→红连续渐变（T1.2）
 * remainingRatio: 1 = 满额（蓝），0 = 耗尽（红）
 */

export function clampRatio(ratio: number): number {
  if (Number.isNaN(ratio)) return 0;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 蓝 #2563EB → 红 #DC2626，按「已消耗」插值（满额偏蓝） */
export function remainingRatioToRgb(remainingRatio: number): { r: number; g: number; b: number } {
  const remaining = clampRatio(remainingRatio);
  const spent = 1 - remaining;
  const r = Math.round(lerp(0x25, 0xdc, spent));
  const g = Math.round(lerp(0x63, 0x26, spent));
  const b = Math.round(lerp(0xeb, 0x26, spent));
  return { r, g, b };
}

export function remainingRatioToCss(remainingRatio: number): string {
  const { r, g, b } = remainingRatioToRgb(remainingRatio);
  return `rgb(${r}, ${g}, ${b})`;
}

export function remainingRatioToHex(remainingRatio: number): string {
  const { r, g, b } = remainingRatioToRgb(remainingRatio);
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

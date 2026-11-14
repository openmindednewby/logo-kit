import { fmt } from './num';
import type { Pt } from './types';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Returns a closed path d for polygons, numbers written with three decimals at most. */
export function polygonsToD(polys: readonly Pt[][]): string {
  const point = (p: Pt): string => `${fmt(p.x)} ${fmt(p.y)}`;
  const ring = (poly: readonly Pt[]): string => poly.map(point).join('L');
  return polys.map((poly) => `M${ring(poly)}Z`).join('');
}

/** Returns the polygon resampled to n points evenly spaced by length. */
export function resample(poly: readonly Pt[], n: number): Pt[] {
  const first = poly[0] ?? { x: 0, y: 0 };
  const closed = [...poly, first];
  const lengths = closed.slice(1).map((p, k) => Math.hypot(p.x - (closed[k]?.x ?? 0), p.y - (closed[k]?.y ?? 0)));
  const total = lengths.reduce((a, b) => a + b, 0);
  const out: Pt[] = [];
  let seg = 0;
  let walked = 0;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / n;
    while (seg < lengths.length - 1 && walked + (lengths[seg] ?? 0) < target) {
      walked += lengths[seg] ?? 0;
      seg++;
    }
    const a = closed[seg] ?? first;
    const b = closed[seg + 1] ?? a;
    const len = lengths[seg] ?? 0;
    const t = len > 0 ? (target - walked) / len : 0;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

/** Returns the bounding box of polygons. */
export function bounds(polys: readonly Pt[][]): Box {
  const pts = polys.flat();
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Returns n points on a circle, starting at the top and going clockwise. */
export function circlePoints(c: Pt, r: number, n: number): Pt[] {
  return Array.from({ length: n }, (_, k) => {
    const t = -Math.PI / 2 + (2 * Math.PI * k) / n;
    return { x: c.x + r * Math.cos(t), y: c.y + r * Math.sin(t) };
  });
}

/** Returns the mean of the points. */
export function centroid(pts: readonly Pt[]): Pt {
  const n = Math.max(1, pts.length);
  return { x: pts.reduce((s, p) => s + p.x, 0) / n, y: pts.reduce((s, p) => s + p.y, 0) / n };
}

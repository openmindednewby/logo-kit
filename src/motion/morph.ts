import { flattenPath } from '../core/path';
import { centroid, circlePoints, polygonsToD, resample } from '../core/polygon';
import type { Pt } from '../core/types';

const POINTS = 96;

function startAtTop(poly: Pt[], c: Pt): Pt[] {
  let best = 0;
  let bestScore = Infinity;
  poly.forEach((p, k) => {
    const score = Math.abs(Math.atan2(p.x - c.x, -(p.y - c.y)));
    if (score < bestScore) {
      bestScore = score;
      best = k;
    }
  });
  return [...poly.slice(best), ...poly.slice(0, best)];
}

const signedArea = (poly: readonly Pt[]): number =>
  poly.reduce((s, p, k) => {
    const q = poly[(k + 1) % poly.length] ?? p;
    return s + p.x * q.y - q.x * p.y;
  }, 0);

/** Returns the start (circles) and end (the layer's own outline) path d with matching point counts, for a CSS d morph. */
export function morphPair(d: string): { from: string; to: string } {
  const subs = flattenPath(d);
  const to: Pt[][] = [];
  const from: Pt[][] = [];
  for (const sub of subs) {
    const c = centroid(sub);
    const r = Math.max(...sub.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
    const oriented = signedArea(sub) < 0 ? [...sub].reverse() : sub;
    to.push(startAtTop(resample(oriented, POINTS), c));
    from.push(circlePoints(c, r, POINTS));
  }
  return { from: polygonsToD(from), to: polygonsToD(to) };
}

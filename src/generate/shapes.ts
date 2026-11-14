import { circlePoints } from '../core/polygon';
import type { Pt } from '../core/types';

export type Polys = Pt[][];

const CIRCLE_N = 48;
const ORIGIN = { x: 0, y: 0 };
const SQRT3_2 = Math.sqrt(3) / 2;
const FACE_SHRINK = 0.9;

const ngon = (n: number, r: number, start = -Math.PI / 2): Pt[] =>
  Array.from({ length: n }, (_, k) => ({ x: r * Math.cos(start + (2 * Math.PI * k) / n), y: r * Math.sin(start + (2 * Math.PI * k) / n) }));

const shrink = (poly: Pt[], s: number): Pt[] => {
  const c = poly.reduce((a, p) => ({ x: a.x + p.x / poly.length, y: a.y + p.y / poly.length }), ORIGIN);
  return poly.map((p) => ({ x: c.x + (p.x - c.x) * s, y: c.y + (p.y - c.y) * s }));
};

const arcPts = (r: number, from: number, to: number, n: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, k) => ({ x: r * Math.cos(from + ((to - from) * k) / n), y: r * Math.sin(from + ((to - from) * k) / n) }));

/** Returns a crescent opening to the right: a unit circle minus a circle of radius r shifted right by dx. */
export function crescent(dx = 0.36, r = 0.83): Polys {
  const ix = (1 - r * r + dx * dx) / (2 * dx);
  const theta = Math.acos(Math.min(1, ix));
  const phi = Math.atan2(Math.sin(theta), ix - dx);
  const outer = arcPts(1, theta, 2 * Math.PI - theta, CIRCLE_N);
  const inner = arcPts(r, 2 * Math.PI - phi, phi, CIRCLE_N).map((p) => ({ x: p.x + dx, y: p.y }));
  return [[...outer, ...inner]];
}

/** Returns the three faces of an isometric cube (top, left, right), each slightly inset. */
export function cubeFaces(): Polys {
  const top = [{ x: 0, y: -1 }, { x: SQRT3_2, y: -0.5 }, { x: 0, y: 0 }, { x: -SQRT3_2, y: -0.5 }];
  const left = [{ x: -SQRT3_2, y: -0.5 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: -SQRT3_2, y: 0.5 }];
  const right = [{ x: SQRT3_2, y: -0.5 }, { x: SQRT3_2, y: 0.5 }, { x: 0, y: 1 }, { x: 0, y: 0 }];
  return [top, left, right].map((f) => shrink(f, FACE_SHRINK));
}

const band = (outer: number, inner: number, start: number, end: number): Polys => [[...arcPts(outer, start, end, CIRCLE_N), ...arcPts(inner, end, start, CIRCLE_N)]];
const rect = (x: number, y: number, w: number, h: number): Pt[] => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
const star = (n: number, inner: number): Pt[] => ngon(2 * n, 1).map((p, k) => (k % 2 === 1 ? { x: p.x * inner, y: p.y * inner } : p));
const wave = (): Pt[] => {
  const xs = Array.from({ length: 25 }, (_, k) => -1 + k / 12);
  const back = [...xs];
  back.reverse();
  return [...xs.map((x) => ({ x, y: -0.3 + 0.22 * Math.sin(x * Math.PI * 1.5) })), ...back.map((x) => ({ x, y: 0.3 + 0.22 * Math.sin(x * Math.PI * 1.5) }))];
};
const grid = (): Polys => [-0.7, 0, 0.7].flatMap((y) => [-0.7, 0, 0.7].map((x) => rect(x - 0.24, y - 0.24, 0.48, 0.48)));

/** Shape builders in a unit frame (about -1..1), one entry per primitive; multi-part shapes return one polygon per part. */
export const PRIMITIVES: Readonly<Record<string, () => Polys>> = {
  disc: () => [circlePoints(ORIGIN, 1, CIRCLE_N)],
  ring: () => [circlePoints(ORIGIN, 1, CIRCLE_N), circlePoints(ORIGIN, 0.6, CIRCLE_N)],
  crescent: () => crescent(),
  cube: cubeFaces,
  hexagon: () => [ngon(6, 1)],
  arc: () => band(1, 0.62, Math.PI * 0.75, Math.PI * 2.25),
  star4: () => [star(4, 0.42)],
  star8: () => [star(8, 0.62)],
  square: () => [rect(-0.85, -0.85, 1.7, 1.7)],
  triangle: () => [ngon(3, 1)],
  diamond: () => [ngon(4, 1)],
  wave: () => [wave()],
  grid,
  bars: () => [rect(-1, -0.8, 2, 0.4), rect(-1, -0.2, 1.5, 0.4), rect(-1, 0.4, 1, 0.4)],
};

/** Primitives whose parts are separate layers rather than one compound path. */
export const SPLIT_PARTS = new Set(['cube']);

/** Primitives drawn with the even-odd rule (holes). */
export const EVEN_ODD = new Set(['ring']);

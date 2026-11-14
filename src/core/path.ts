import type { Pt } from './types';

const CMD = /^[A-Za-z]$/;
const CURVE_STEPS = 12;
const ARC_STEPS = 24;
const CURVES = new Set(['c', 's', 'q', 't']);

interface Cursor {
  tokens: string[];
  i: number;
  cur: Pt;
  start: Pt;
  ctrl: Pt | null;
  sub: Pt[];
  subs: Pt[][];
}

const more = (c: Cursor): boolean => c.i < c.tokens.length && !CMD.test(c.tokens[c.i] ?? 'Z');
const num = (c: Cursor): number => Number(c.tokens[c.i++]);
const pt = (c: Cursor, rel: boolean): Pt => {
  const x = num(c);
  const y = num(c);
  return rel ? { x: c.cur.x + x, y: c.cur.y + y } : { x, y };
};
const push = (c: Cursor, p: Pt): void => {
  c.sub.push(p);
  c.cur = p;
};
const bez = (pts: Pt[], t: number): Pt => {
  let level = pts;
  while (level.length > 1) {
    const prev = level;
    level = prev.slice(1).map((p, k) => {
      const q = prev[k] ?? p;
      return { x: q.x + (p.x - q.x) * t, y: q.y + (p.y - q.y) * t };
    });
  }
  return level[0] ?? { x: 0, y: 0 };
};
const curve = (c: Cursor, ctrl: Pt[], end: Pt): void => {
  const pts = [c.cur, ...ctrl, end];
  for (let k = 1; k <= CURVE_STEPS; k++) {
    push(c, bez(pts, k / CURVE_STEPS));
  }
  c.ctrl = ctrl[ctrl.length - 1] ?? null;
};
const reflect = (c: Cursor): Pt => (c.ctrl ? { x: 2 * c.cur.x - c.ctrl.x, y: 2 * c.cur.y - c.ctrl.y } : c.cur);

const SEPARATORS = new Set([' ', ',', '\n', '\r', '\t']);
const isCommand = (ch: string): boolean => ch !== 'e' && ch !== 'E' && CMD.test(ch);
const startsNumber = (cur: string, ch: string): boolean => {
  const afterExponent = cur.endsWith('e') || cur.endsWith('E');
  return (ch === '-' && cur !== '' && !afterExponent) || (ch === '.' && cur.includes('.'));
};

/** Splits path data into commands and numbers. */
export function tokenizePath(d: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of d) {
    const separator = SEPARATORS.has(ch) || isCommand(ch) || startsNumber(cur, ch);
    if (separator && cur !== '') {
      out.push(cur);
      cur = '';
    }
    if (isCommand(ch)) {
      out.push(ch);
    } else if (!SEPARATORS.has(ch)) {
      cur += ch;
    }
  }
  return cur !== '' ? [...out, cur] : out;
}

function vecAngle(ux: number, uy: number, vx: number, vy: number): number {
  return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
}

interface ArcSpec {
  radii: Pt;
  phiDeg: number;
  large: boolean;
  sweep: boolean;
}

/** Returns points along an SVG elliptical arc from p0 to p1 (SVG 1.1 F.6.5). */
export function arcPoints(p0: Pt, arc: ArcSpec, p1: Pt): Pt[] {
  if (arc.radii.x === 0 || arc.radii.y === 0) {
    return [p1];
  }
  const phi = (arc.phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const x1 = (cos * (p0.x - p1.x)) / 2 + (sin * (p0.y - p1.y)) / 2;
  const y1 = (-sin * (p0.x - p1.x)) / 2 + (cos * (p0.y - p1.y)) / 2;
  const lambda = Math.max(1, Math.sqrt((x1 * x1) / (arc.radii.x * arc.radii.x) + (y1 * y1) / (arc.radii.y * arc.radii.y)));
  const rx = Math.abs(arc.radii.x) * lambda;
  const ry = Math.abs(arc.radii.y) * lambda;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const co = Math.sqrt(Math.max(0, (rx * rx * ry * ry - den) / den)) * (arc.large === arc.sweep ? -1 : 1);
  const cx1 = (co * rx * y1) / ry;
  const cy1 = (-co * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (p0.x + p1.x) / 2;
  const cy = sin * cx1 + cos * cy1 + (p0.y + p1.y) / 2;
  const t1 = vecAngle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = vecAngle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!arc.sweep && dt > 0) {
    dt -= 2 * Math.PI;
  } else if (arc.sweep && dt < 0) {
    dt += 2 * Math.PI;
  }
  return Array.from({ length: ARC_STEPS }, (_, k) => {
    const t = t1 + (dt * (k + 1)) / ARC_STEPS;
    return { x: cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, y: cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos };
  });
}

type Handler = (c: Cursor, rel: boolean) => void;

const moveTo: Handler = (c, rel) => {
  if (c.sub.length > 1) {
    c.subs.push(c.sub);
  }
  const p = pt(c, rel);
  c.sub = [p];
  c.cur = p;
  c.start = p;
  while (more(c)) {
    push(c, pt(c, rel));
  }
};

const arcTo: Handler = (c, rel) => {
  const radii = { x: num(c), y: num(c) };
  const phiDeg = num(c);
  const large = num(c) !== 0;
  const sweep = num(c) !== 0;
  const end = pt(c, rel);
  for (const p of arcPoints(c.cur, { radii, phiDeg, large, sweep }, end)) {
    push(c, p);
  }
};

const HANDLERS: Readonly<Record<string, Handler>> = {
  m: moveTo,
  l: (c, rel) => push(c, pt(c, rel)),
  h: (c, rel) => {
    const x = num(c);
    push(c, { x: rel ? c.cur.x + x : x, y: c.cur.y });
  },
  v: (c, rel) => {
    const y = num(c);
    push(c, { x: c.cur.x, y: rel ? c.cur.y + y : y });
  },
  c: (c, rel) => {
    const a = pt(c, rel);
    const b = pt(c, rel);
    curve(c, [a, b], pt(c, rel));
  },
  s: (c, rel) => {
    const a = reflect(c);
    const b = pt(c, rel);
    curve(c, [a, b], pt(c, rel));
  },
  q: (c, rel) => {
    const a = pt(c, rel);
    curve(c, [a], pt(c, rel));
  },
  t: (c, rel) => curve(c, [reflect(c)], pt(c, rel)),
  a: arcTo,
};

function closePath(c: Cursor): void {
  c.subs.push(c.sub);
  c.sub = [c.start];
  c.cur = c.start;
}

function step(c: Cursor, cmd: string): void {
  const lower = cmd.toLowerCase();
  if (lower === 'z') {
    closePath(c);
    return;
  }
  const handler = HANDLERS[lower];
  if (!handler) {
    throw new Error(`unsupported path command ${cmd}`);
  }
  do {
    handler(c, cmd === lower);
    if (!CURVES.has(lower)) {
      c.ctrl = null;
    }
  } while (lower !== 'm' && more(c));
}

/** Returns the path as closed polygons (one per subpath), arcs and curves flattened. */
export function flattenPath(d: string): Pt[][] {
  const c: Cursor = { tokens: tokenizePath(d), i: 0, cur: { x: 0, y: 0 }, start: { x: 0, y: 0 }, ctrl: null, sub: [], subs: [] };
  while (c.i < c.tokens.length) {
    step(c, c.tokens[c.i++] ?? 'Z');
  }
  if (c.sub.length > 1) {
    c.subs.push(c.sub);
  }
  return c.subs.filter((s) => s.length > 2);
}

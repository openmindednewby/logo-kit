import { pick, seededRandom } from '../core/rng';
import { polygonsToD } from '../core/polygon';
import type { Mark, MarkLayer, Pt } from '../core/types';
import { EVEN_ODD, PRIMITIVES, SPLIT_PARTS } from './shapes';
import type { Polys } from './shapes';

export interface Variant {
  id: string;
  recipe: string;
  mark: Mark;
}

interface Placed {
  name: string;
  polys: Polys;
  role: string;
  evenOdd: boolean;
}

const VIEW = 64;
const HALF = VIEW / 2;
const UNIT = 28;
const NAMES = Object.keys(PRIMITIVES);
const ANGLES = [0, 0, 0, 15, 30, 45, 90];

const map = (polys: Polys, f: (p: Pt) => Pt): Polys => polys.map((poly) => poly.map(f));
const place = (polys: Polys, s: number, cx: number, cy: number): Polys => map(polys, (p) => ({ x: cx + p.x * s, y: cy + p.y * s }));
const rotate = (polys: Polys, deg: number): Polys => {
  const a = (deg * Math.PI) / 180;
  return map(polys, (p) => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) }));
};
const mirrorX = (polys: Polys): Polys => map(polys, (p) => ({ x: -p.x, y: p.y })).map((poly) => [...poly].reverse());

function parts(name: string, s: number, cx: number, cy: number, role: string): Placed[] {
  const builder = PRIMITIVES[name];
  if (!builder) {
    throw new Error(`unknown primitive ${name}`);
  }
  const polys = place(builder(), s, cx, cy);
  if (SPLIT_PARTS.has(name)) {
    return polys.map((poly, k) => ({ name: `${name}-${k}`, polys: [poly], role: k === 0 ? 'a' : 'b', evenOdd: false }));
  }
  return [{ name, polys, role, evenOdd: EVEN_ODD.has(name) }];
}

type Combinator = (r: () => number, a: string, b: string) => Placed[];

const COMBINATORS: Readonly<Record<string, Combinator>> = {
  single: (_r, a) => parts(a, 1, 0, 0, 'a'),
  overlap: (_r, a, b) => [...parts(a, 0.68, -0.3, 0, 'a'), ...parts(b, 0.68, 0.3, 0, 'b')],
  nest: (_r, a, b) => [...parts(a, 1, 0, 0, 'a'), ...parts(b, 0.42, 0, 0, 'b')],
  orbit: (r, a, b) => {
    const t = pick(r, [0, 45, 90, 135, 180, 225, 270, 315]) * (Math.PI / 180);
    return [...parts(a, 0.72, 0, 0, 'a'), ...parts(b, 0.24, 0.82 * Math.cos(t), 0.82 * Math.sin(t), 'b')];
  },
  repeat: (r, a) => {
    const n = pick(r, [3, 4, 5, 6]);
    return Array.from({ length: n }, (_, k) => {
      const t = -Math.PI / 2 + (2 * Math.PI * k) / n;
      return parts(a, 0.34, 0.6 * Math.cos(t), 0.6 * Math.sin(t), k % 2 === 0 ? 'a' : 'b').map((p) => ({ ...p, name: `${p.name}-${k}` }));
    }).flat();
  },
  mirror: (_r, a) => {
    const left = parts(a, 0.5, -0.45, 0, 'a');
    return [...left, ...left.map((p) => ({ ...p, name: `${p.name}-m`, polys: mirrorX(p.polys), role: 'b' }))];
  },
  cut: (_r, a, b) => {
    const pa = parts(a, 1, 0, 0, 'a');
    const pb = parts(b, 0.5, 0.25, -0.2, 'a');
    return [{ name: `${a}-cut-${b}`, polys: [...pa.flatMap((p) => p.polys), ...pb.flatMap((p) => p.polys)], role: 'a', evenOdd: true }];
  },
};

const COMBINATOR_NAMES = Object.keys(COMBINATORS);

function toLayer(p: Placed, deg: number): MarkLayer {
  const polys = place(rotate(p.polys, deg), UNIT, HALF, HALF);
  const paint = { light: [{ fill: p.role }], dark: [{ fill: p.role }] };
  return { name: p.name, d: polygonsToD(polys), paint, ...(p.evenOdd ? { evenOdd: true } : {}) };
}

function oneVariant(r: () => number, id: string): Variant {
  const combinator = pick(r, COMBINATOR_NAMES);
  const a = pick(r, NAMES);
  const b = pick(r, NAMES);
  const deg = pick(r, ANGLES);
  const build = COMBINATORS[combinator] ?? COMBINATORS['single'];
  const placed = build ? build(r, a, b) : [];
  const unary = combinator === 'single' || combinator === 'repeat' || combinator === 'mirror';
  const args = (unary ? [a] : [a, b]).join(',');
  const recipe = `${combinator}(${args}) rotate ${deg}`;
  return { id, recipe, mark: { id, viewBox: `0 0 ${VIEW} ${VIEW}`, layers: placed.map((p) => toLayer(p, deg)) } };
}

/** Returns count mark variants built from primitives and combinators; the same seed gives the same marks. */
export function generateVariants(seed: number, count: number): Variant[] {
  const r = seededRandom(seed);
  return Array.from({ length: count }, (_, k) => oneVariant(r, `s${seed}-${String(k).padStart(3, '0')}`));
}

/** Returns a mark made of one primitive at full size. */
export function primitiveMark(name: string): Mark {
  return { id: name, viewBox: `0 0 ${VIEW} ${VIEW}`, layers: parts(name, 1, 0, 0, 'a').map((p) => toLayer(p, 0)) };
}

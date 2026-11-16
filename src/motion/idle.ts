import { flattenPath } from '../core/path';
import { centroid } from '../core/polygon';
import { markSizeOf, viewBoxOf } from '../core/svg';
import type { Mark } from '../core/types';
import { cssAnim, IN_OUT, SETTLE_OUT } from './cssAnim';
import type { Frame } from './cssAnim';
import { IdleRecipe } from './IdleRecipe';
import type { MotionRoles } from './recipes';

export interface IdleContext {
  mark: Mark;
  roles?: Partial<MotionRoles>;
  prefix?: string;
  trigger?: string;
  colour?: string;
}

export interface IdleMotion {
  recipe: IdleRecipe;
  durationMs: number;
  css: string;
  overlay: string;
}

interface Part {
  name: string;
  dx: number;
  dy: number;
}

interface Ctx {
  p: string;
  on: string;
  colour: string;
  cx: number;
  cy: number;
  top: number;
  size: number;
  k: number;
  parts: Part[];
}

type Built = Omit<IdleMotion, 'recipe'>;

const REFERENCE_SIZE = 64;
const RIM_SHARE = 0.425;
const PART_STEP = 1.2;
const n = (v: number): string => String(Number(v.toFixed(2)));

function rimGlint(c: Ctx): Built {
  const overlay = `<circle class="${c.p}-s" cx="${n(c.cx)}" cy="${n(c.cy)}" r="${n(RIM_SHARE * c.size)}" fill="none" stroke="${c.colour}" stroke-width="${n(1.6 * c.k)}" stroke-linecap="round" pathLength="100" stroke-dasharray="14 86" style="opacity:0"/>`;
  const frames: Frame[] = [[0, 'stroke-dashoffset:100;opacity:0'], [20, 'opacity:0.9'], [80, 'opacity:0.9'], [100, 'stroke-dashoffset:0;opacity:0']];
  return { durationMs: 520, css: cssAnim(`${c.p}-s`, `.${c.on} .${c.p}-s`, frames, { durationMs: 520, easing: SETTLE_OUT }), overlay };
}

function facesPart(c: Ctx): Built {
  const one = (part: Part, i: number): string => {
    const frames: Frame[] = [[0, 'transform:none'], [45, `transform:translate(${part.dx.toFixed(2)}px,${part.dy.toFixed(2)}px)`], [100, 'transform:none']];
    return cssAnim(`${c.p}-p${i}`, `.${c.on} #mark-${part.name}`, frames, { durationMs: 420, easing: IN_OUT });
  };
  return { durationMs: 420, css: c.parts.map(one).join(''), overlay: '' };
}

function breath(c: Ctx): Built {
  const origin = `.${c.on} #mark{transform-box:view-box;transform-origin:${n(c.cx)}px ${n(c.cy)}px}`;
  const frames: Frame[] = [[0, 'transform:none'], [50, 'transform:scale(1.05)'], [100, 'transform:none']];
  return { durationMs: 600, css: cssAnim(`${c.p}-b`, `.${c.on} #mark`, frames, { durationMs: 600, easing: IN_OUT }) + origin, overlay: '' };
}

function orbitSpark(c: Ctx): Built {
  const spark = `<circle cx="${n(c.cx)}" cy="${n(c.top + 1.6 * c.k)}" r="${n(1.8 * c.k)}" fill="${c.colour}"/>`;
  const overlay = `<g class="${c.p}-o" style="transform-box:view-box;transform-origin:${n(c.cx)}px ${n(c.cy)}px;opacity:0">${spark}</g>`;
  const frames: Frame[] = [[0, 'transform:rotate(0deg);opacity:0'], [12, 'opacity:1'], [85, 'opacity:1'], [100, 'transform:rotate(360deg);opacity:0']];
  return { durationMs: 600, css: cssAnim(`${c.p}-o`, `.${c.on} .${c.p}-o`, frames, { durationMs: 600, easing: 'cubic-bezier(0.45,0,0.55,1)' }), overlay };
}

const RECIPES: Readonly<Record<string, (c: Ctx) => Built>> = {
  [IdleRecipe.RimGlint]: rimGlint,
  [IdleRecipe.FacesPart]: facesPart,
  [IdleRecipe.Breath]: breath,
  [IdleRecipe.OrbitSpark]: orbitSpark,
};

function context(ctx: IdleContext): Ctx {
  const vb = viewBoxOf(ctx.mark);
  const size = markSizeOf(ctx.mark);
  const k = size / REFERENCE_SIZE;
  const cx = vb.x + vb.w / 2;
  const cy = vb.y + vb.h / 2;
  const names = ctx.roles?.parts ?? ctx.mark.layers.slice(1).map((l) => l.name);
  const parts = ctx.mark.layers
    .filter((l) => names.includes(l.name))
    .map((l) => {
      const c = centroid(flattenPath(l.d).flat());
      const len = Math.hypot(c.x - cx, c.y - cy) || 1;
      return { name: l.name, dx: ((c.x - cx) / len) * PART_STEP * k, dy: ((c.y - cy) / len) * PART_STEP * k };
    });
  return { p: ctx.prefix ?? 'lki', on: ctx.trigger ?? 'lk-idle', colour: ctx.colour ?? 'currentColor', cx, cy, top: vb.y, size, k, parts };
}

/** Returns the CSS and SVG overlay of an idle recipe, played while the trigger class is on, or null for an unknown name. */
export function idleRecipe(name: string, ctx: IdleContext): IdleMotion | null {
  const build = RECIPES[name];
  if (!build) {
    return null;
  }
  const c = context(ctx);
  const b = build(c);
  return { recipe: name as IdleRecipe, durationMs: b.durationMs, overlay: b.overlay, css: `${b.css}@media (prefers-reduced-motion:reduce){.${c.on} *{animation:none!important}}` };
}

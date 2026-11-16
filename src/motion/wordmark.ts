import { cssAnim, SETTLE_OUT } from './cssAnim';
import type { Frame } from './cssAnim';
import { WordmarkRecipe } from './WordmarkRecipe';

export interface WordmarkOptions {
  advances: readonly number[];
  startMs?: number;
  prefix?: string;
  fontSize?: number;
}

export interface WordmarkMotion {
  recipe: WordmarkRecipe;
  startMs: number;
  durationMs: number;
  classes: string[];
  css: string;
}

interface Ctx {
  p: string;
  at: number;
  k: number;
  n: number;
  xs: number[];
  width: number;
}

interface Built {
  durationMs: number;
  letters: boolean;
  shown: string[];
  hidden: string[];
  css: string;
}

const REFERENCE_FONT = 17;
const TYPE_SHARE = 0.7;
const TYPE_STEP = 16;
const STAGGER_STEP = 12;
const STAGGER_MS = 240;

const px = (v: number): string => `${Number(v.toFixed(1))}px`;

const letterCss = (c: Ctx, frames: (i: number) => Frame[], durationMs: number, step: number, easing: string): string =>
  c.xs.map((_, i) => cssAnim(`${c.p}-l${i}`, `.${c.p}-l${i}`, frames(i), { durationMs, delayMs: c.at + i * step, easing })).join('');

function stagger(c: Ctx): Built {
  const rise = px(7 * c.k);
  const css = letterCss(c, () => [[0, `opacity:0;transform:translateY(${rise})`], [100, 'opacity:1;transform:none']], STAGGER_MS, STAGGER_STEP, SETTLE_OUT);
  return { durationMs: (c.n - 1) * STAGGER_STEP + STAGGER_MS, letters: true, shown: [], hidden: [], css };
}

function slide(c: Ctx): Built {
  const frames: Frame[] = [[0, `opacity:0;transform:translateX(${px(-56 * c.k)})`], [35, 'opacity:1'], [100, 'opacity:1;transform:none']];
  const css = cssAnim(`${c.p}-g`, `.${c.p}-g`, frames, { durationMs: 420, delayMs: c.at, easing: SETTLE_OUT });
  return { durationMs: 420, letters: false, shown: [`${c.p}-g`], hidden: [], css };
}

function typewriter(c: Ctx): Built {
  const durationMs = Math.round((c.n * TYPE_STEP) / TYPE_SHARE);
  const end = px(c.width);
  const steps: Frame[] = c.xs.map((x, i) => [(i / c.n) * TYPE_SHARE * 100, `transform:translateX(${px(x)});opacity:1`]);
  const caret: Frame[] = [[0, 'transform:translateX(0);opacity:1'], ...steps, [TYPE_SHARE * 100, `transform:translateX(${end});opacity:1`], [100, `transform:translateX(${end});opacity:0`]];
  const letters = letterCss(c, () => [[0, 'opacity:0'], [100, 'opacity:1']], 1, TYPE_STEP, 'linear');
  const css = letters + cssAnim(`${c.p}-k`, `.${c.p}-k`, caret, { durationMs, delayMs: c.at, easing: 'step-end' });
  return { durationMs, letters: true, shown: [], hidden: [`${c.p}-k`], css };
}

function wipe(c: Ctx): Built {
  const end = px(c.width);
  const rect = cssAnim(`${c.p}-r`, `.${c.p}-r`, [[0, 'transform:scaleX(0)'], [100, 'transform:scaleX(1)']], { durationMs: 380, delayMs: c.at, easing: SETTLE_OUT });
  const edgeFrames: Frame[] = [[0, 'transform:translateX(0);opacity:1'], [73, `transform:translateX(${end});opacity:1`], [100, `transform:translateX(${end});opacity:0`]];
  const edge = cssAnim(`${c.p}-e`, `.${c.p}-e`, edgeFrames, { durationMs: 520, delayMs: c.at, easing: SETTLE_OUT });
  return { durationMs: 520, letters: false, shown: [`${c.p}-r`], hidden: [`${c.p}-e`], css: rect + edge };
}

function tracking(c: Ctx): Built {
  const css = letterCss(c, (i) => [[0, `opacity:0;transform:translateX(${px(i * 2.2 * c.k)})`], [100, 'opacity:1;transform:none']], 440, 0, SETTLE_OUT);
  return { durationMs: 440, letters: true, shown: [], hidden: [], css };
}

const RECIPES: Readonly<Record<string, (c: Ctx) => Built>> = {
  [WordmarkRecipe.LetterStagger]: stagger,
  [WordmarkRecipe.SlideFromMark]: slide,
  [WordmarkRecipe.Typewriter]: typewriter,
  [WordmarkRecipe.MaskWipe]: wipe,
  [WordmarkRecipe.TrackingSettle]: tracking,
};

function reduced(c: Ctx, b: Built): string {
  const shown = [...(b.letters ? c.xs.map((_, i) => `${c.p}-l${i}`) : []), ...b.shown].map((s) => `.${s}`).join(',');
  const hidden = b.hidden.map((s) => `.${s}`).join(',');
  const show = shown !== '' ? `${shown}{animation:none!important;opacity:1!important;transform:none!important}` : '';
  const hide = hidden !== '' ? `${hidden}{animation:none!important;opacity:0!important}` : '';
  return `@media (prefers-reduced-motion:reduce){${show}${hide}}`;
}

const offsets = (advances: readonly number[]): number[] => advances.map((_, i) => advances.slice(0, i).reduce((s, a) => s + a, 0));

/** Returns the reveal CSS for letters classed `<prefix>-l<i>`, or null for an unknown recipe. */
export function wordmarkReveal(name: string, options: WordmarkOptions): WordmarkMotion | null {
  const build = RECIPES[name];
  if (!build) {
    return null;
  }
  const startMs = options.startMs ?? 0;
  const width = options.advances.reduce((s, a) => s + a, 0);
  const k = (options.fontSize ?? REFERENCE_FONT) / REFERENCE_FONT;
  const c: Ctx = { p: options.prefix ?? 'lkw', at: startMs, k, n: options.advances.length, xs: offsets(options.advances), width };
  const b = build(c);
  return { recipe: name as WordmarkRecipe, startMs, durationMs: b.durationMs, classes: [...b.shown, ...b.hidden], css: b.css + reduced(c, b) };
}

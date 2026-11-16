import { Mode } from '../core/Mode';
import type { Mark, MotionBeat, Palette } from '../core/types';
import { markSizeOf, viewBoxOf } from '../core/svg';
import { MARK_TARGET } from './defaults';
import { MotionPreset } from './MotionPreset';
import { presetFrames } from './presets';
import { schedule } from './timeline';
import type { Slot } from './timeline';

export interface MotionStyle {
  style: string;
  overlay: string;
  drawLayers: Set<string>;
  microWrap: boolean;
}

export const REDUCED_MOTION = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

interface Rule {
  selector: string;
  animations: string[];
  extras: string[];
  supportsD: boolean;
}

const sweepClass = (index: number, hover: boolean): string => `${hover ? 'lkms' : 'lks'}${index}`;

const selectorOf = (target: string, index: number, hover: boolean, sweep: boolean): string => {
  if (sweep) {
    return `${hover ? 'svg:hover' : 'svg'} .${sweepClass(index, hover)}`;
  }
  if (target === MARK_TARGET) {
    return hover ? 'svg:hover .lkmm' : 'svg #mark';
  }
  return hover ? `svg:hover .lkm${index}` : `svg .l${index}`;
};

function sweepOverlay(mark: Mark, index: number, beat: MotionBeat, colour: string, hover: boolean): string {
  const layer = mark.layers[index];
  if (!layer) {
    return '';
  }
  const attrs = [`class="${sweepClass(index, hover)}"`, `d="${layer.d}"`, 'fill="none"', `stroke="${colour}"`, `stroke-width="${beat.width ?? 2}"`, 'stroke-linecap="round"', 'pathLength="1"', `stroke-dasharray="${beat.share ?? 0.12} 1"`, 'opacity="0"'];
  if (layer.transform !== undefined) {
    attrs.push(`transform="${layer.transform}"`);
  }
  return `<path ${attrs.join(' ')}/>`;
}

function render(rules: Map<string, Rule>, keyframes: { body: string; supportsD: boolean }[]): string {
  const plain = keyframes.filter((k) => !k.supportsD).map((k) => k.body).join('');
  const morph = keyframes.filter((k) => k.supportsD).map((k) => k.body).join('');
  const decls = (r: Rule): string => [...r.extras, 'animation:'.concat(r.animations.join(','))].join(';');
  const css = (list: Rule[]): string => list.map((r) => `${r.selector}{${decls(r)}}`).join('');
  const all = [...rules.values()];
  const supports = all.filter((r) => r.supportsD);
  const wrapped = supports.length > 0 ? `@supports (d:path("M0 0")){${morph}${css(supports)}}` : '';
  return `${plain}${css(all.filter((r) => !r.supportsD))}${wrapped}${REDUCED_MOTION}`;
}

interface Build {
  mark: Mark;
  names: string[];
  markCentre: { x: number; y: number };
  markSize: number;
  colour: (role: string | undefined) => string;
  hover: boolean;
  rules: Map<string, Rule>;
  keyframes: { body: string; supportsD: boolean }[];
  drawLayers: Set<string>;
  overlay: string[];
}

function addSlot(ctx: Build, beat: MotionBeat, b: number, slot: Slot): void {
  const sweep = beat.preset === MotionPreset.Sweep;
  const index = ctx.names.indexOf(slot.target);
  const frames = presetFrames(beat, { layer: ctx.mark.layers[index] ?? null, markCentre: ctx.markCentre, markSize: ctx.markSize });
  const suffix = slot.target === MARK_TARGET ? 'm' : String(index);
  const name = `lk${ctx.hover ? 'm' : 'i'}${b}-${suffix}`;
  const selector = selectorOf(slot.target, index, ctx.hover, sweep);
  const rule = ctx.rules.get(selector) ?? { selector, animations: [], extras: [], supportsD: false };
  const delay = slot.delayMs > 0 ? ` ${slot.delayMs}ms` : '';
  const fill = ctx.hover ? '' : ' backwards';
  rule.animations.push(`${name} ${slot.durationMs}ms ${frames.timing}${delay} 1${fill}`);
  if (frames.extra !== undefined && !rule.extras.includes(frames.extra)) {
    rule.extras.push(frames.extra);
  }
  rule.supportsD = rule.supportsD || frames.supportsD === true;
  ctx.rules.set(selector, rule);
  ctx.keyframes.push({ body: `@keyframes ${name}{${frames.keyframes}}`, supportsD: frames.supportsD === true });
  if (beat.preset === MotionPreset.Draw) {
    ctx.drawLayers.add(slot.target);
  }
  if (sweep) {
    ctx.overlay.push(sweepOverlay(ctx.mark, index, beat, ctx.colour(beat.colour), ctx.hover));
  }
}

/** Returns the CSS, sweep overlays and draw layers for beats on a mark; hover beats target micro wrappers, never intro elements. */
export function motionCss(mark: Mark, beats: readonly MotionBeat[], palette: Palette, mode: Mode, hover: boolean): MotionStyle {
  const vb = viewBoxOf(mark);
  const colours = mode === Mode.Dark ? palette.dark : palette.light;
  const ctx: Build = {
    mark,
    names: mark.layers.map((l) => l.name),
    markCentre: { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 },
    markSize: markSizeOf(mark),
    colour: (role) => colours[role ?? 'text'] ?? '#ffffff',
    hover,
    rules: new Map(),
    keyframes: [],
    drawLayers: new Set(),
    overlay: [],
  };
  beats.forEach((beat, b) => schedule(beat, ctx.names).forEach((slot) => addSlot(ctx, beat, b, slot)));
  return { style: render(ctx.rules, ctx.keyframes), overlay: ctx.overlay.join(''), drawLayers: ctx.drawLayers, microWrap: hover };
}

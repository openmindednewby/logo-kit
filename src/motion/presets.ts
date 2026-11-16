import { flattenPath } from '../core/path';
import { centroid } from '../core/polygon';
import type { MarkLayer, MotionBeat } from '../core/types';
import { EASE, EASE_IN_FIRST } from './defaults';
import { BOLD_PRESET_FRAMES } from './boldPresets';
import { morphPair } from './morph';
import { MotionPreset } from './MotionPreset';

export interface PresetContext {
  layer: MarkLayer | null;
  markCentre: { x: number; y: number };
  markSize: number;
}

export interface PresetFrames {
  keyframes: string;
  timing: string;
  extra?: string;
  supportsD?: boolean;
}

const fillBox = 'transform-box:fill-box;transform-origin:center';

function morphFrames(beat: MotionBeat, ctx: PresetContext): string {
  const layer = ctx.layer;
  if (!layer) {
    throw new Error('morph-from-circle needs a layer, not the whole mark');
  }
  const { from, to } = morphPair(layer.d);
  const fade = beat.fadeIn?.includes(layer.name) === true;
  const stops = beat.stops ?? [0, 40, 100];
  return stops
    .map((stop, k) => {
      const first = k === 0;
      const d = first ? from : to;
      const opacity = first && fade ? 0 : 1;
      const easing = first ? (beat.easing ?? EASE_IN_FIRST) : (beat.settleEasing ?? EASE);
      return `${stop.toFixed(2)}%{d:path("${d}");opacity:${opacity};animation-timing-function:${easing}}`;
    })
    .join('');
}

function spreadFrames(beat: MotionBeat, ctx: PresetContext): string {
  const pts = ctx.layer ? flattenPath(ctx.layer.d).flat() : [];
  const c = pts.length > 0 ? centroid(pts) : ctx.markCentre;
  const dx = c.x - ctx.markCentre.x;
  const dy = c.y - ctx.markCentre.y;
  const len = Math.hypot(dx, dy) || 1;
  const dist = beat.distance ?? 1.6;
  const tx = ((dx / len) * dist).toFixed(2);
  const ty = ((dy / len) * dist).toFixed(2);
  return `0%{transform:translate(0,0)}50%{transform:translate(${tx}px,${ty}px);animation-timing-function:${beat.easing ?? EASE}}100%{transform:translate(0,0)}`;
}

type PresetFn = (beat: MotionBeat, ctx: PresetContext) => PresetFrames;

const PRESETS: Readonly<Record<string, PresetFn>> = {
  [MotionPreset.Draw]: (b) => ({ keyframes: '0%{stroke-dasharray:1 1;stroke-dashoffset:1}100%{stroke-dasharray:1 1;stroke-dashoffset:0}', timing: b.easing ?? EASE }),
  [MotionPreset.Flood]: (b) => ({ keyframes: '0%{fill-opacity:0}100%{fill-opacity:1}', timing: b.easing ?? EASE }),
  [MotionPreset.StaggerRise]: (b) => ({ keyframes: `0%{opacity:0;transform:translateY(${b.distance ?? 4}px)}100%{opacity:1;transform:none}`, timing: b.easing ?? EASE }),
  [MotionPreset.ScalePop]: (b) => ({ keyframes: '0%{opacity:0;transform:scale(0.6)}70%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}', timing: b.easing ?? EASE, extra: fillBox }),
  [MotionPreset.Orbit]: (b, ctx) => ({
    keyframes: '0%{opacity:0;transform:rotate(-90deg)}100%{opacity:1;transform:rotate(0deg)}',
    timing: b.easing ?? EASE,
    extra: `transform-box:view-box;transform-origin:${ctx.markCentre.x}px ${ctx.markCentre.y}px`,
  }),
  [MotionPreset.Wipe]: (b) => ({ keyframes: '0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}', timing: b.easing ?? EASE }),
  [MotionPreset.MorphFromCircle]: (b, ctx) => ({ keyframes: morphFrames(b, ctx), timing: 'linear', supportsD: true }),
  [MotionPreset.Sweep]: (b) => ({ keyframes: `0%{stroke-dashoffset:${b.share ?? 0.12};opacity:1}99%{stroke-dashoffset:-1;opacity:1}100%{stroke-dashoffset:-1;opacity:0}`, timing: b.easing ?? 'linear' }),
  [MotionPreset.Pulse]: (b) => ({ keyframes: `0%{transform:scale(1)}50%{transform:scale(${b.scale ?? 1.07})}100%{transform:scale(1)}`, timing: b.easing ?? 'ease-in-out', extra: fillBox }),
  [MotionPreset.Spread]: (b, ctx) => ({ keyframes: spreadFrames(b, ctx), timing: 'linear' }),
  ...BOLD_PRESET_FRAMES,
};

/** Returns the keyframes and timing function of one preset for one target. */
export function presetFrames(beat: MotionBeat, ctx: PresetContext): PresetFrames {
  const fn = PRESETS[beat.preset];
  if (!fn) {
    throw new Error(`unknown motion preset "${beat.preset}"`);
  }
  return fn(beat, ctx);
}

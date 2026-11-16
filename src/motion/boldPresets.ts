import { flattenPath } from '../core/path';
import { centroid } from '../core/polygon';
import type { MotionBeat } from '../core/types';
import { EASE } from './defaults';
import { MotionPreset } from './MotionPreset';
import type { PresetContext, PresetFrames } from './presets';

const fillBox = 'transform-box:fill-box;transform-origin:center';
const px = (n: number): string => `${n.toFixed(2)}px`;
const frames = (stops: readonly [number, string][]): string => stops.map(([at, body]) => `${at}%{${body}}`).join('');

function outward(ctx: PresetContext): { x: number; y: number } {
  const pts = ctx.layer ? flattenPath(ctx.layer.d).flat() : [];
  const c = pts.length > 0 ? centroid(pts) : ctx.markCentre;
  const dx = c.x - ctx.markCentre.x;
  const dy = c.y - ctx.markCentre.y;
  const len = Math.hypot(dx, dy);
  return len > 0 ? { x: dx / len, y: dy / len } : { x: -1, y: 0 };
}

function flyIn(beat: MotionBeat, ctx: PresetContext): PresetFrames {
  const u = outward(ctx);
  const d = beat.distance ?? ctx.markSize * 0.5;
  const at = (k: number): string => `transform:translate(${px(u.x * d * k)},${px(u.y * d * k)})`;
  const keyframes = frames([[0, `opacity:0;${at(1)}`], [60, `opacity:1;${at(-0.08)}`], [80, `opacity:1;${at(0.03)}`], [100, `opacity:1;${at(0)}`]]);
  return { keyframes, timing: beat.easing ?? EASE };
}

function spinAssemble(beat: MotionBeat): PresetFrames {
  const keyframes = frames([[0, 'opacity:0;transform:rotate(-540deg) scale(0.2)'], [75, 'opacity:1;transform:rotate(12deg) scale(1.06)'], [100, 'opacity:1;transform:rotate(0deg) scale(1)']]);
  return { keyframes, timing: beat.easing ?? EASE, extra: fillBox };
}

function dropBounce(beat: MotionBeat, ctx: PresetContext): PresetFrames {
  const h = beat.distance ?? ctx.markSize * 0.6;
  const y = (k: number): string => `transform:translateY(${px(-h * k)})`;
  const keyframes = frames([[0, `opacity:0;${y(1)}`], [45, `opacity:1;${y(0)}`], [60, `opacity:1;${y(0.18)}`], [75, `opacity:1;${y(0)}`], [87, `opacity:1;${y(0.05)}`], [100, `opacity:1;${y(0)}`]]);
  return { keyframes, timing: beat.easing ?? 'ease-in-out' };
}

function flip(beat: MotionBeat): PresetFrames {
  const keyframes = frames([[0, 'opacity:0;transform:scale(0,1)'], [35, 'opacity:1;transform:scale(-1,1)'], [65, 'opacity:1;transform:scale(0,1)'], [100, 'opacity:1;transform:scale(1,1)']]);
  return { keyframes, timing: beat.easing ?? EASE, extra: fillBox };
}

function slamShake(beat: MotionBeat, ctx: PresetContext): PresetFrames {
  const s = beat.distance ?? ctx.markSize * 0.04;
  const at = (k: number, scale: number): string => `transform:translate(${px(s * k)},0px) scale(${scale})`;
  const keyframes = frames([
    [0, `opacity:0;${at(0, beat.scale ?? 2.4)}`],
    [40, `opacity:1;${at(0, 0.94)}`],
    [50, `opacity:1;${at(-1, 1)}`],
    [62, `opacity:1;${at(1, 1)}`],
    [74, `opacity:1;${at(-0.6, 1)}`],
    [86, `opacity:1;${at(0.3, 1)}`],
    [100, `opacity:1;${at(0, 1)}`],
  ]);
  return { keyframes, timing: beat.easing ?? 'cubic-bezier(0.5,0,0.75,0)', extra: fillBox };
}

type PresetFn = (beat: MotionBeat, ctx: PresetContext) => PresetFrames;

export const BOLD_PRESET_FRAMES: Readonly<Record<string, PresetFn>> = {
  [MotionPreset.FlyIn]: flyIn,
  [MotionPreset.SpinAssemble]: spinAssemble,
  [MotionPreset.DropBounce]: dropBounce,
  [MotionPreset.Flip]: flip,
  [MotionPreset.SlamShake]: slamShake,
};

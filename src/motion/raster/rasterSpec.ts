import { RasterLayer } from './RasterLayer';

export interface RasterAnim {
  layer: RasterLayer;
  frames: string;
  ms: number;
  ease: string;
  delayMs?: number;
  stepMs?: number;
  loop?: boolean;
  rest?: string;
}

export interface RasterSpec {
  anims: RasterAnim[];
  periodMs?: number;
}

export const RASTER_EASE = {
  out: 'cubic-bezier(.2,.8,.2,1)',
  spring: 'cubic-bezier(.34,1.4,.64,1)',
  inOut: 'cubic-bezier(.65,0,.35,1)',
  linear: 'linear',
} as const;

export const SPARK_COUNT = 12;
export const SPARK_GROUPS = 4;
export const FADE_IN = 'from{opacity:0}to{opacity:1}';

const PERCENT = 100;
const START_SHARE = 1.5;
const n = (v: number): string => String(Number(v.toFixed(2)));

const travel = (width: number): string => `translateX(${n(((1 + 2 * width) / width) * PERCENT)}%)`;
const bandRest = (width: number, opacity: number): string => `left:${n(-START_SHARE * width * PERCENT)}%;width:${n(width * PERCENT)}%;opacity:${n(opacity)}`;

/** Returns a band of light that crosses the logo once; width is a share of the logo width. */
export function sweep(layer: RasterLayer, band: { width: number; opacity: number }, ms: number, delayMs: number): RasterAnim {
  const frames = `from{transform:translateX(0)}to{transform:${travel(band.width)}}`;
  return { layer, frames, ms, delayMs, ease: RASTER_EASE.inOut, rest: bandRest(band.width, band.opacity) };
}

/** Returns a looping band that rests, crosses the logo between two percent stops of the period, then rests again. */
export function drift(layer: RasterLayer, band: { width: number; opacity: number }, periodMs: number, stops: readonly [number, number]): RasterAnim {
  const to = travel(band.width);
  const frames = `0%{transform:translateX(0)}${stops[0]}%{transform:translateX(0);animation-timing-function:${RASTER_EASE.inOut}}${stops[1]}%{transform:${to}}100%{transform:${to}}`;
  return { layer, frames, ms: periodMs, ease: RASTER_EASE.linear, loop: true, rest: bandRest(band.width, band.opacity) };
}

/** Returns a looping swell: the declaration at rest at both ends, the peak at half the period. */
export function swell(layer: RasterLayer, rest: string, peak: string, periodMs: number): RasterAnim {
  const ease = `animation-timing-function:${RASTER_EASE.inOut}`;
  return { layer, frames: `0%,100%{${rest};${ease}}50%{${peak};${ease}}`, ms: periodMs, ease: RASTER_EASE.linear, loop: true };
}

/** Returns when the animation's last run ends, in ms, counting the spark stagger. */
export function animEndMs(anim: RasterAnim): number {
  return (anim.delayMs ?? 0) + (anim.stepMs ?? 0) * (SPARK_GROUPS - 1) + anim.ms;
}

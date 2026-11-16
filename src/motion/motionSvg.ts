import { Mode } from '../core/Mode';
import { markSvg } from '../core/svg';
import type { Mark, MotionBeat, Palette } from '../core/types';
import { motionCss, REDUCED_MOTION } from './motionCss';

export interface MotionSvgOptions {
  label: string;
  size?: number;
}

/** Returns the mark with its intro motion; with reduced motion, or in a static renderer, it shows the final still. */
export function introSvg(mark: Mark, palette: Palette, mode: Mode, beats: readonly MotionBeat[], opts: MotionSvgOptions): string {
  const m = motionCss(mark, beats, palette, mode, false);
  return markSvg(mark, palette, mode, { ...opts, style: m.style, overlay: m.overlay, drawLayers: m.drawLayers });
}

/** Returns the mark with its hover micro-interaction. */
export function microSvg(mark: Mark, palette: Palette, mode: Mode, beats: readonly MotionBeat[], opts: MotionSvgOptions): string {
  const m = motionCss(mark, beats, palette, mode, true);
  return markSvg(mark, palette, mode, { ...opts, style: m.style, overlay: m.overlay, drawLayers: m.drawLayers, microWrap: m.microWrap });
}

/** Returns the mark with the intro and the hover micro together. */
export function animatedSvg(mark: Mark, palette: Palette, mode: Mode, motion: { intro: readonly MotionBeat[]; micro: readonly MotionBeat[] }, opts: MotionSvgOptions): string {
  const intro = motionCss(mark, motion.intro, palette, mode, false);
  const micro = motionCss(mark, motion.micro, palette, mode, true);
  const style = `${intro.style.replace(REDUCED_MOTION, '')}${micro.style}`;
  const drawLayers = new Set([...intro.drawLayers, ...micro.drawLayers]);
  return markSvg(mark, palette, mode, { ...opts, style, overlay: intro.overlay + micro.overlay, drawLayers, microWrap: true });
}

export { Mode };

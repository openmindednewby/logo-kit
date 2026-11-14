import { Mode } from '../core/Mode';
import { markBody } from '../core/svg';
import type { Mark, MotionBeat, Palette } from '../core/types';
import { motionCss } from '../motion/motionCss';

export const FRAME = { w: 360, h: 640 };
export const TARGET_BOX = { x: 80, y: 180, w: 200, h: 200 };

/** Returns a 360 x 640 phone frame with the mark centred in the target box, optionally with intro motion. */
export function frameSvg(mark: Mark, palette: Palette, beats: readonly MotionBeat[] = []): string {
  const bg = palette.light['background'] ?? '#ffffff';
  const motion = beats.length > 0 ? motionCss(mark, beats, palette, Mode.Light, false) : null;
  const style = motion ? `<style>${motion.style}</style>` : '';
  const body = markBody(mark, palette, Mode.Light, motion ? { drawLayers: motion.drawLayers } : {});
  const b = TARGET_BOX;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME.w}" height="${FRAME.h}" viewBox="0 0 ${FRAME.w} ${FRAME.h}">${style}<rect width="${FRAME.w}" height="${FRAME.h}" fill="${bg}"/><svg x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" viewBox="${mark.viewBox}">${body}${motion?.overlay ?? ''}</svg></svg>`;
}

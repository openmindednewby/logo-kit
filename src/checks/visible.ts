import { alphaMask } from '../core/raster';
import type { Bitmap } from '../core/raster';

const SEEN = 60;

/** Returns the share of the mark's ink pixels that stand out from the background in a rendered tile. */
export function visibleShare(tile: Bitmap, ink: Bitmap): number {
  const mask = alphaMask(ink);
  const ground = [0, 1, 2].map((k) => tile.data[k] ?? 0);
  let total = 0;
  let seen = 0;
  mask.forEach((v, p) => {
    if (v === 1) {
      total++;
      const diff = ground.reduce((s, g, k) => s + Math.abs((tile.data[p * 4 + k] ?? 0) - g), 0);
      seen += diff > SEEN ? 1 : 0;
    }
  });
  return total > 0 ? seen / total : 0;
}

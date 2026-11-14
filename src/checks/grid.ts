import type { Box } from '../core/polygon';

export const GRID = 24;
const SAMPLES = 3;
const MAJORITY = 5;

/** Returns the bounding box of the set pixels of a mask, or null when it is empty. */
export function maskBox(mask: Uint8Array, w: number, h: number): Box | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] === 1) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Returns the mask cropped to its ink, fitted (aspect kept, centred) into a GRID x GRID cell grid. */
export function normalise(mask: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(GRID * GRID);
  const box = maskBox(mask, w, h);
  if (!box) {
    return out;
  }
  const side = Math.max(box.w, box.h);
  const ox = box.x - (side - box.w) / 2;
  const oy = box.y - (side - box.h) / 2;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let hits = 0;
      for (let s = 0; s < SAMPLES * SAMPLES; s++) {
        const px = Math.floor(ox + ((gx + ((s % SAMPLES) + 0.5) / SAMPLES) * side) / GRID);
        const py = Math.floor(oy + ((gy + (Math.floor(s / SAMPLES) + 0.5) / SAMPLES) * side) / GRID);
        hits += px >= 0 && py >= 0 && px < w && py < h ? (mask[py * w + px] ?? 0) : 0;
      }
      out[gy * GRID + gx] = hits >= MAJORITY ? 1 : 0;
    }
  }
  return out;
}

const rot90 = (g: Uint8Array): Uint8Array => g.map((_, i) => g[(GRID - 1 - (i % GRID)) * GRID + Math.floor(i / GRID)] ?? 0);
const mirror = (g: Uint8Array): Uint8Array => g.map((_, i) => g[Math.floor(i / GRID) * GRID + (GRID - 1 - (i % GRID))] ?? 0);

/** Returns the eight rotations and reflections of a grid. */
export function orientations(g: Uint8Array): Uint8Array[] {
  const out: Uint8Array[] = [];
  let cur = g;
  for (let k = 0; k < 4; k++) {
    out.push(cur, mirror(cur));
    cur = rot90(cur);
  }
  return out;
}

const cell = (g: Uint8Array, x: number, y: number): number => (x >= 0 && y >= 0 && x < GRID && y < GRID ? (g[y * GRID + x] ?? 0) : 0);

function iouAt(a: Uint8Array, b: Uint8Array, dx: number, dy: number): number {
  let inter = 0;
  let union = 0;
  for (let i = 0; i < GRID * GRID; i++) {
    const va = a[i] ?? 0;
    const vb = cell(b, (i % GRID) + dx, Math.floor(i / GRID) + dy);
    inter += va & vb;
    union += va | vb;
  }
  return union > 0 ? inter / union : 0;
}

/** Returns the best intersection-over-union of two grids over shifts of one cell. */
export function bestIou(a: Uint8Array, b: Uint8Array): number {
  let best = 0;
  for (let k = 0; k < 9; k++) {
    best = Math.max(best, iouAt(a, b, (k % 3) - 1, Math.floor(k / 3) - 1));
  }
  return best;
}

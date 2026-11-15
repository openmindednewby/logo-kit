import { Mode } from '../core/Mode';
import { alphaMask, renderSvg } from '../core/raster';
import { markBody } from '../core/svg';
import type { Mark, Palette } from '../core/types';
import { bestIou, maskBox, normalise, orientations } from './grid';
import { SYMBOLS } from './symbols';

export interface SymbolMatch {
  symbol: string;
  score: number;
}

export const LOOKALIKE_THRESHOLD = 0.7;
const RENDER = 96;
const INK = '#000000';
const INK_PALETTE: Palette = { name: 'ink', light: {}, dark: {}, mono: INK };

const symbolGrids = new Map<string, Uint8Array[]>();

function gridOf(svg: string): { grid: Uint8Array; mask: Uint8Array } {
  const mask = alphaMask(renderSvg(svg, RENDER));
  return { grid: normalise(mask, RENDER, RENDER), mask };
}

function gridsFor(id: string, silhouettes: readonly string[]): Uint8Array[] {
  const cached = symbolGrids.get(id);
  if (cached) {
    return cached;
  }
  const grids = silhouettes.map((s) => gridOf(s).grid);
  symbolGrids.set(id, grids);
  return grids;
}

const scoreAgainst = (grid: Uint8Array, targets: readonly Uint8Array[]): number =>
  Math.max(0, ...orientations(grid).flatMap((o) => targets.map((t) => bestIou(o, t))));

/** Returns the mark drawn in one ink colour, every layer filled or stroked as designed. */
export function inkSvg(mark: Mark, only?: number): string {
  const layers = only === undefined ? mark.layers : mark.layers.filter((_, i) => i === only);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}">${markBody({ ...mark, layers }, INK_PALETTE, Mode.Light, { colourOverride: INK })}</svg>`;
}

function crescentWithObject(mark: Mark): number {
  const crescents = gridsFor('red-crescent', SYMBOLS.find((s) => s.id === 'red-crescent')?.silhouettes ?? []);
  const layers = mark.layers.map((_, i) => gridOf(inkSvg(mark, i)));
  let best = 0;
  layers.forEach((layer, i) => {
    const score = scoreAgainst(layer.grid, crescents);
    const box = maskBox(layer.mask, RENDER, RENDER);
    const holdsObject = layers.some((other, j) => {
      const ob = maskBox(other.mask, RENDER, RENDER);
      if (j === i || !ob || !box) {
        return false;
      }
      const cx = ob.x + ob.w / 2;
      const cy = ob.y + ob.h / 2;
      return cx > box.x && cx < box.x + box.w && cy > box.y && cy < box.y + box.h && layer.mask[Math.floor(cy) * RENDER + Math.floor(cx)] === 0;
    });
    best = holdsObject ? Math.max(best, score) : best;
  });
  return best;
}

/** Returns how much a one-colour SVG silhouette resembles each sensitive symbol (0..1), in library order. */
export function svgSymbolScores(svg: string): SymbolMatch[] {
  const whole = gridOf(svg).grid;
  return SYMBOLS.map((s) => ({ symbol: s.id, score: scoreAgainst(whole, gridsFor(s.id, s.silhouettes)) }));
}

/** Returns how much the mark resembles each sensitive symbol (0..1), highest first. */
export function symbolScores(mark: Mark): SymbolMatch[] {
  const scores = svgSymbolScores(inkSvg(mark));
  const compound = crescentWithObject(mark);
  const cs = scores.find((s) => s.symbol === 'crescent-star');
  if (cs && compound > cs.score) {
    cs.score = compound;
  }
  return scores.sort((a, b) => b.score - a.score);
}

/** Returns the sensitive symbols the mark resembles at or over the lookalike threshold. */
export function symbolMatches(mark: Mark): SymbolMatch[] {
  return symbolScores(mark).filter((s) => s.score >= LOOKALIKE_THRESHOLD);
}

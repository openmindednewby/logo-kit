import { contrast } from '../core/colour';
import { alphaMask, renderSvg } from '../core/raster';
import type { Mark, Palette } from '../core/types';
import { contrastFailures, cvdFailures, MIN_CONTRAST } from '../palette/paletteChecks';
import { rolesOf } from '../palette/roles';
import { Mode } from '../core/Mode';
import { markBody, viewBoxOf } from '../core/svg';
import { maskBox } from './grid';
import { visibleShare } from './visible';
import { inkSvg, symbolMatches } from './lookalike';

export interface CheckResult {
  pass: boolean;
  reasons: string[];
}

const MIN_LAYER_PX: Readonly<Record<number, number>> = { 16: 2, 32: 6 };
const MIN_COVER = 0.06;
const MAX_COVER = 0.9;
const MIN_BOX_FILL = 0.12;
const MAX_BOX_FILL = 0.92;
const ONE_COLOUR_SIZE = 64;

const ink = (mask: Uint8Array): number => mask.reduce((s, v) => s + v, 0);

function legibility(mark: Mark, size: number): string[] {
  const out: string[] = [];
  const cover = ink(alphaMask(renderSvg(inkSvg(mark), size))) / (size * size);
  if (cover < MIN_COVER || cover > MAX_COVER) {
    out.push(`legible${size}: ink covers ${(cover * 100).toFixed(0)}% of the ${size} px tile`);
  }
  mark.layers.forEach((layer, i) => {
    const px = ink(alphaMask(renderSvg(inkSvg(mark, i), size)));
    if (px < (MIN_LAYER_PX[size] ?? 1)) {
      out.push(`legible${size}: layer "${layer.name}" is ${px} px, lost at ${size} px`);
    }
  });
  return out;
}

function oneColour(mark: Mark): string[] {
  const mask = alphaMask(renderSvg(inkSvg(mark), ONE_COLOUR_SIZE));
  const box = maskBox(mask, ONE_COLOUR_SIZE, ONE_COLOUR_SIZE);
  const fill = box ? ink(mask) / (box.w * box.h) : 0;
  return fill < MIN_BOX_FILL || fill > MAX_BOX_FILL ? [`oneColour: one colour fills ${(fill * 100).toFixed(0)}% of its box, reads as ${fill > MAX_BOX_FILL ? 'a solid block' : 'dust'}`] : [];
}

const MIN_REVERSED_SHOWN = 0.9;

function reversed(mark: Mark, palette: Palette): string[] {
  const ink2 = palette.light['background'] ?? '#ffffff';
  const bg = palette.dark['background'] ?? '#000000';
  const vb = viewBoxOf(mark);
  const body = markBody(mark, palette, Mode.Light, { colourOverride: ink2 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}"><rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="${bg}"/>${body}</svg>`;
  const shown = visibleShare(renderSvg(svg, ONE_COLOUR_SIZE), renderSvg(inkSvg(mark), ONE_COLOUR_SIZE));
  const out = contrast(ink2, bg) < MIN_CONTRAST ? [`reversed: ${ink2} on ${bg} is under 3:1`] : [];
  return shown < MIN_REVERSED_SHOWN ? [...out, `reversed: only ${(shown * 100).toFixed(0)}% of the mark shows on ${bg}`] : out;
}

/** Runs every check on a mark in a palette: 16/32 px, one colour, reversed, contrast, colour-blind and symbol lookalike. */
export function runChecks(mark: Mark, palette: Palette): CheckResult {
  const roles = rolesOf(mark);
  const symbols = symbolMatches(mark).map((m) => `symbol: looks like ${m.symbol} (${m.score.toFixed(2)})`);
  const reasons = [...legibility(mark, 16), ...legibility(mark, 32), ...oneColour(mark), ...reversed(mark, palette), ...contrastFailures(palette, roles), ...cvdFailures(palette, roles), ...symbols];
  return { pass: reasons.length === 0, reasons };
}

export interface ChecksReport {
  seed: number;
  count: number;
  passed: string[];
  dropped: { id: string; recipe: string; reasons: string[] }[];
}

/** Returns the checks report for generated variants: passing ids, and each dropped id with its reasons. */
export function checkVariants(seed: number, variants: readonly { id: string; recipe: string; mark: Mark }[], palette: Palette): ChecksReport {
  const report: ChecksReport = { seed, count: variants.length, passed: [], dropped: [] };
  for (const v of variants) {
    const result = runChecks(v.mark, palette);
    if (result.pass) {
      report.passed.push(v.id);
    } else {
      report.dropped.push({ id: v.id, recipe: v.recipe, reasons: result.reasons });
    }
  }
  return report;
}

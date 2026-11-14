import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { runChecks } from '../checks/runChecks';
import { renderPng } from '../core/raster';
import type { Brand, Mark, MotionBeat, Palette } from '../core/types';
import { generateVariants } from '../generate/generate';
import { INTRO_CAP_MS, PRESET_DEFAULTS } from '../motion/defaults';
import { MotionPreset } from '../motion/MotionPreset';
import { fitBeat } from '../motion/timeline';
import { generatorPalette, paletteVariants } from '../palette/variants';
import { FRAME, frameSvg, TARGET_BOX } from './frames';

export interface PickOption {
  name: string;
  why: string;
  image: string;
  inventory: string;
  aligned: string;
  targetBox?: typeof TARGET_BOX;
  motion?: string;
}

export interface PickStep {
  screen: string;
  viewport: string;
  target: string;
  title: string;
  question: string;
  kind?: string;
  options: PickOption[];
}

export interface PickSpec {
  docKey: string;
  title: string;
  brand: string;
  intro: string;
  beforeAfter: string;
  noloss: string;
  steps: PickStep[];
}

const MAX_OPTIONS = 5;
const MIN_OPTIONS = 3;
const MOTION_OPTIONS = [MotionPreset.StaggerRise, MotionPreset.ScalePop, MotionPreset.Orbit, MotionPreset.Wipe, MotionPreset.MorphFromCircle];

function frame(outDir: string, file: string, mark: Mark, palette: Palette): string {
  const rel = `frames/${file}.png`;
  fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true });
  fs.writeFileSync(path.join(outDir, rel), renderPng(frameSvg(mark, palette), FRAME.w));
  return rel;
}

const option = (name: string, why: string, image: string, extra: Partial<PickOption> = {}): PickOption => ({ name, why, image, inventory: '1/1', aligned: 'pass', targetBox: TARGET_BOX, ...extra });
const need = (list: readonly unknown[], what: string): void => {
  if (list.length < MIN_OPTIONS) {
    throw new Error(`pick: only ${list.length} ${what} passed the checks, need ${MIN_OPTIONS}`);
  }
};

function shapeStep(brand: Brand, outDir: string): { step: PickStep; chosen: Mark } {
  const palette = generatorPalette(brand.tokens);
  const passing = generateVariants(brand.generate.seed, brand.generate.count).filter((v) => runChecks(v.mark, palette).pass).slice(0, MAX_OPTIONS - 1);
  need(passing, 'shapes');
  const options = passing.map((v) => option(v.id, `Generated from ${v.recipe}; passes every check.`, frame(outDir, `shape-${v.id}`, v.mark, palette)));
  const first = passing[0];
  if (!first) {
    throw new Error('pick: no shape');
  }
  return { step: { screen: 'logo-shape', viewport: 'mobile', target: '#mark', title: 'Shape', question: 'Which shape should the mark have?', options }, chosen: first.mark };
}

function colourStep(brand: Brand, mark: Mark, outDir: string): { step: PickStep; palette: Palette } {
  const byLight = new Map<string, Palette>();
  for (const p of paletteVariants(mark, brand.tokens, MAX_OPTIONS * 3)) {
    const key = JSON.stringify(p.light);
    if (!byLight.has(key)) {
      byLight.set(key, p);
    }
  }
  const palettes = [...byLight.values()].slice(0, MAX_OPTIONS);
  need(palettes, 'palettes');
  const options = palettes.map((p) => option(p.name, `Colours from the ${brand.tokens} tokens; 3:1 on light and dark and colour-blind safe.`, frame(outDir, `colour-${p.name}`, mark, p)));
  const first = palettes[0];
  if (!first) {
    throw new Error('pick: no palette');
  }
  return { step: { screen: 'logo-colour', viewport: 'mobile', target: '#mark', title: 'Colour', question: 'Which colours should the mark use?', options }, palette: first };
}

function motionStep(mark: Mark, palette: Palette, outDir: string): PickStep {
  const still = frame(outDir, 'motion-still', mark, palette);
  fs.mkdirSync(path.join(outDir, 'motion'), { recursive: true });
  const n = mark.layers.length;
  const options = MOTION_OPTIONS.map((preset) => {
    const base = PRESET_DEFAULTS[preset] ?? { preset, durationMs: 600 };
    const beat: MotionBeat = preset === MotionPreset.MorphFromCircle ? { ...base, fadeIn: mark.layers.slice(1).map((l) => l.name) } : fitBeat(base, n, INTRO_CAP_MS);
    const rel = `motion/${preset}.svg`;
    fs.writeFileSync(path.join(outDir, rel), frameSvg(mark, palette, [beat]));
    return option(preset, `The ${preset} intro, ${beat.durationMs} ms per layer, ends on the still.`, still, { motion: rel, targetBox: undefined });
  });
  return { screen: 'logo-motion', viewport: 'mobile', kind: 'motion', target: 'n/a -- the options differ over time; every still frame is the same end frame', title: 'Motion', question: 'Which intro should the mark play?', options };
}

/** Writes the frames and spec.json of a three-step pick (shape, then colour, then motion) and returns the spec. */
export function buildPickSpec(brand: Brand, outDir: string): PickSpec {
  fs.mkdirSync(outDir, { recursive: true });
  const shape = shapeStep(brand, outDir);
  const colour = colourStep(brand, shape.chosen, outDir);
  const motion = motionStep(shape.chosen, colour.palette, outDir);
  const spec: PickSpec = {
    docKey: `logo-kit-${brand.slug}-pick`,
    title: `${brand.name}: pick the mark`,
    brand: `${brand.name}: logo pick`,
    intro: 'Pick the shape first, then its colours, then how it moves. Every option already passed the size, contrast, colour-blind and symbol checks.',
    beforeAfter: 'none -- new marks generated by logo-kit; no live screen is replaced on this page',
    noloss: 'noloss: allow new screen -- a logo pick page has no screen fields',
    steps: [shape.step, colour.step, motion],
  };
  fs.writeFileSync(path.join(outDir, 'spec.json'), `${JSON.stringify(spec, null, 2)}\n`);
  return spec;
}

/** Builds the pick page with the house builder (build-pick-page.mjs) from a written spec. */
export function buildPickPage(builder: string, outDir: string): string {
  const html = path.join(outDir, 'index.html');
  execFileSync(process.execPath, [builder, path.join(outDir, 'spec.json'), html], { stdio: 'inherit' });
  return html;
}

import { describe, expect, it } from 'vitest';

import { loadBrand } from '../config/loadBrand';
import { Mode } from '../core/Mode';
import { pixelDiff, renderSvg } from '../core/raster';
import { markSvg } from '../core/svg';
import type { Brand } from '../core/types';
import { introSvg } from '../motion/motionSvg';
import { parseTiming } from '../motion/parseTiming';
import type { TimingMap } from '../motion/parseTiming';
import { FINREG, MOONCUBE, readRoot } from '../testing/paths';

const MAX_DIFF = 0.02;
const SIZE = 64;
const still = (brand: Brand, mode: Mode): string => markSvg(brand.mark, brand.palette, mode, { label: brand.name });
const intro = (brand: Brand, mode: Mode): string => introSvg(brand.mark, brand.palette, mode, brand.motion.intro, { label: brand.name });
const diff = (a: string, b: string): number => pixelDiff(renderSvg(a, SIZE), renderSvg(b, SIZE));
const shape = (t: TimingMap): TimingMap =>
  Object.fromEntries(Object.entries(t).map(([k, list]) => [k, list.map((a) => ({ ...a, stops: a.stops.map((s) => ({ ...s, easing: s.easing?.replace(/\s/g, '') ?? null })) }))]));

function constant(src: string, name: string): Record<string, string | number> {
  const body = new RegExp(`const ${name} = \\{([^}]*)\\}`).exec(src)?.[1] ?? '';
  return Object.fromEntries([...body.matchAll(/(\w+): ('[^']*'|[\d.]+)/g)].map((m) => [m[1] ?? '', (m[2] ?? '').startsWith("'") ? (m[2] ?? '').slice(1, -1) : Number(m[2])]));
}

describe('Moon Cube parity', () => {
  const brand = loadBrand(MOONCUBE);

  it('with the light still at 64 px, is within 2% of export/mark.svg', () => {
    const today = readRoot('fixtures', 'mooncube', 'mark.svg');

    const share = diff(still(brand, Mode.Light), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });

  it('with the dark still at 64 px, is within 2% of export/mark-dark.svg', () => {
    const today = readRoot('fixtures', 'mooncube', 'mark-dark.svg');

    const share = diff(still(brand, Mode.Dark), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });

  it('with the intro end frame, is within 2% of export/intro-light.svg', () => {
    const today = readRoot('fixtures', 'mooncube', 'intro-light.svg');

    const share = diff(intro(brand, Mode.Light), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });

  it('with the intro timing, matches export/intro-light.svg per layer: duration, delay and keyframe stops', () => {
    const today = shape(parseTiming(readRoot('fixtures', 'mooncube', 'intro-light.svg')));

    const ours = shape(parseTiming(intro(brand, Mode.Light)));

    expect(ours).toEqual(today);
  });
});

describe('FinReg parity', () => {
  const brand = loadBrand(FINREG);
  const src = readRoot('fixtures', 'finreg', 'intro.ts.txt');

  it('with the dark still at 64 px, is within 2% of finalLogo/finreg-icon-on-dark.svg', () => {
    const today = readRoot('fixtures', 'finreg', 'finreg-icon-on-dark.svg');

    const share = diff(still(brand, Mode.Dark), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });

  it('with the light still at 64 px, is within 2% of finalLogo/finreg-icon-on-light.svg', () => {
    const today = readRoot('fixtures', 'finreg', 'finreg-icon-on-light.svg');

    const share = diff(still(brand, Mode.Light), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });

  it('with the intro end frame, is within 2% of the icon the intro settles on', () => {
    const today = readRoot('fixtures', 'finreg', 'finreg-icon-on-dark.svg');

    const share = diff(intro(brand, Mode.Dark), today);

    expect(share).toBeLessThanOrEqual(MAX_DIFF);
  });

  it('with the intro beats, match RING_DRAW, PULSE and RING_SWEEP in hero-mark/intro.ts', () => {
    const draw = constant(src, 'RING_DRAW');
    const pulse = constant(src, 'PULSE');
    const sweep = constant(src, 'RING_SWEEP');
    const style = constant(src, 'SWEEP_STYLE');
    const scale = Number(/PULSE_SCALE = '([\d.]+)'/.exec(src)?.[1]);

    const [d, p, s] = brand.motion.intro;

    expect([d?.delayMs, d?.durationMs, d?.stepMs, d?.easing]).toEqual([draw['delayMs'], draw['durationMs'], draw['stepMs'], draw['easing']]);
    expect([p?.delayMs, p?.durationMs, p?.easing, p?.scale]).toEqual([pulse['delay'], pulse['duration'], pulse['easing'], scale]);
    expect([s?.delayMs, s?.durationMs, s?.stepMs, s?.easing, s?.share, s?.width]).toEqual([sweep['delayMs'], sweep['durationMs'], sweep['stepMs'], sweep['easing'], style['dashShare'], style['width']]);
  });

  it('with the emitted intro SVG, staggers the rings and sweeps on the live schedule', () => {
    const timing = parseTiming(intro(brand, Mode.Dark));

    const at = (k: string): [number, number] => [timing[k]?.[0]?.delayMs ?? -1, timing[k]?.[0]?.durationMs ?? -1];

    expect(['l0', 'l1', 'l2', 'mark', 'lks0', 'lks1', 'lks2'].map(at)).toEqual([[0, 520], [140, 520], [280, 520], [800, 400], [1200, 800], [1290, 800], [1380, 800]]);
  });
});

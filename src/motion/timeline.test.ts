import { describe, expect, it } from 'vitest';

import { Mode } from '../core/Mode';
import { pixelDiff, renderSvg } from '../core/raster';
import { markSvg } from '../core/svg';
import { primitiveMark } from '../generate/generate';
import { generatorPalette } from '../palette/variants';
import { INTRO_CAP_MS, MICRO_CAP_MS, MICRO_DEFAULTS, PRESET_DEFAULTS } from './defaults';
import { INTRO_PRESETS, MICRO_PRESETS, MotionPreset } from './MotionPreset';
import { introSvg } from './motionSvg';
import { schedule, totalMs, validateMotion } from './timeline';

const FOUR = ['a', 'b', 'c', 'd'];
const palette = generatorPalette('flier');

describe('INTRO_PRESETS', () => {
  it('with intro and micro lists, offers at least 6 presets', () => {
    const all = new Set([...INTRO_PRESETS, ...MICRO_PRESETS]);

    const count = all.size;

    expect(count).toBeGreaterThanOrEqual(6);
  });
});

describe('totalMs', () => {
  it('with each intro preset default on four layers, ends within 1200 ms', () => {
    const ends = INTRO_PRESETS.map((p) => totalMs([PRESET_DEFAULTS[p] ?? { preset: p, durationMs: 0 }], FOUR));

    const over = ends.filter((ms) => ms > INTRO_CAP_MS);

    expect(over).toEqual([]);
  });

  it('with each micro preset default on four layers, ends within 300 ms', () => {
    const ends = MICRO_PRESETS.map((p) => totalMs([MICRO_DEFAULTS[p] ?? { preset: p, durationMs: 0 }], FOUR));

    const over = ends.filter((ms) => ms > MICRO_CAP_MS);

    expect(over).toEqual([]);
  });
});

describe('schedule', () => {
  it('with a 140 ms step on three named layers, starts them at 0, 140 and 280 ms', () => {
    const beat = { preset: MotionPreset.Draw, durationMs: 520, stepMs: 140, layers: ['b', 'c', 'd'] };

    const slots = schedule(beat, FOUR);

    expect(slots.map((s) => [s.target, s.delayMs])).toEqual([['b', 0], ['c', 140], ['d', 280]]);
  });
});

describe('validateMotion', () => {
  it('with a 1300 ms intro and no reason, reports an error', () => {
    const config = { intro: [{ preset: MotionPreset.Draw, durationMs: 1300 }], micro: [] };

    const report = validateMotion(config, FOUR);

    expect(report.errors).toEqual(['intro runs 1300 ms, cap 1200 ms']);
  });

  it('with a 1300 ms intro and allowLongIntro, reports a warning only', () => {
    const config = { intro: [{ preset: MotionPreset.Draw, durationMs: 1300 }], micro: [], allowLongIntro: 'parity' };

    const report = validateMotion(config, FOUR);

    expect([report.errors.length, report.warnings.length]).toEqual([0, 1]);
  });

  it('with a 400 ms micro, reports an error', () => {
    const config = { intro: [], micro: [{ preset: MotionPreset.Spread, durationMs: 400 }] };

    const report = validateMotion(config, FOUR);

    expect(report.errors).toEqual(['micro runs 400 ms, cap 300 ms']);
  });
});

describe('introSvg', () => {
  it('with every intro preset, a static render (reduced motion) equals the still', () => {
    const cube = primitiveMark('cube');
    const still = renderSvg(markSvg(cube, palette, Mode.Light, { label: 'still' }), 64);

    const diffs = INTRO_PRESETS.map((p) => pixelDiff(renderSvg(introSvg(cube, palette, Mode.Light, [PRESET_DEFAULTS[p] ?? { preset: p, durationMs: 1 }], { label: p }), 64), still));

    expect(diffs.every((d) => d === 0)).toBe(true);
  });

  it('with any preset, carries the reduced-motion rule', () => {
    const cube = primitiveMark('cube');

    const svg = introSvg(cube, palette, Mode.Light, [PRESET_DEFAULTS[MotionPreset.ScalePop] ?? { preset: MotionPreset.ScalePop, durationMs: 1 }], { label: 'x' });

    expect(svg).toContain('@media (prefers-reduced-motion:reduce){*{animation:none!important}}');
  });
});

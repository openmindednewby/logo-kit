import { describe, expect, it } from 'vitest';

import { INTRO_CAP_MS, MICRO_CAP_MS } from '../defaults';
import { RASTER_IDLES, RASTER_LOOP_MAX_MS, RASTER_LOOP_MIN_MS, RasterIdle } from './RasterIdle';
import { RASTER_INTROS, RasterIntro } from './RasterIntro';
import { RASTER_MICROS, RasterMicro } from './RasterMicro';
import { rasterIdle, rasterIntro, rasterMicro, rasterMotion } from './rasterPresets';

const runs = (css: string): string[] => css.match(/animation:[^;}]+/g) ?? [];

describe('rasterIntro', () => {
  it('with each of the ten intros, ends at its reference time and inside the intro cap', () => {
    const expected = { 'fade-up': 600, 'scale-settle': 700, 'mask-wipe': 800, 'light-sweep': 1100, 'focus-in': 700, 'glow-sweep': 1100, 'punch-sweep': 1120, 'double-sweep': 1140, 'burst-settle': 1140, 'tilt-sweep': 1140 };

    const ends = Object.fromEntries(RASTER_INTROS.map((name) => [name, rasterIntro(name)?.durationMs]));

    expect([ends, Object.values(ends).every((ms) => (ms ?? Infinity) <= INTRO_CAP_MS)]).toEqual([expected, true]);
  });

  it('with glow sweep, plays each layer once and only under the play-intro class', () => {
    const css = rasterIntro(RasterIntro.GlowSweep)?.css ?? '';

    const rules = css.match(/\.lkr\.lkr-play-intro \.lkr-(img|glow|in|s0)\{animation:[^}]+ 1 both\}/g) ?? [];

    expect(rules).toHaveLength(4);
  });

  it('with burst settle, staggers the sparks 40 ms apart from 120 ms', () => {
    const css = rasterIntro(RasterIntro.BurstSettle)?.css ?? '';

    const stagger = css.includes('.lkr-spark{animation:lkr-intro-burst-settle-3 720ms cubic-bezier(.2,.8,.2,1) 120ms 1 both;animation-delay:calc(120ms + var(--k) * 40ms)}');

    expect(stagger).toBe(true);
  });

  it('with an unknown name, returns null', () => {
    const preset = rasterIntro('spin-wildly');

    expect(preset).toBeNull();
  });
});

describe('rasterMicro', () => {
  it('with each of the four micros, ends at its reference time and inside the micro cap', () => {
    const expected = { pulse: 240, glint: 280, nudge: 200, 'underline-draw': 260 };

    const ends = Object.fromEntries(RASTER_MICROS.map((name) => [name, rasterMicro(name)?.durationMs]));

    expect([ends, Object.values(ends).every((ms) => (ms ?? Infinity) <= MICRO_CAP_MS)]).toEqual([expected, true]);
  });

  it('with glint, sweeps a 35% band from 52.5% left of the logo across it', () => {
    const css = rasterMicro(RasterMicro.Glint)?.css ?? '';

    const band = [css.includes('to{transform:translateX(485.71%)}'), css.includes('.lkr .lkr-m0{left:-52.5%;width:35%;opacity:0.9}')];

    expect(band).toEqual([true, true]);
  });
});

describe('rasterIdle', () => {
  it('with each of the five idles, loops forever on a 6-8 s period', () => {
    const expected = { 'slow-glint': 7000, 'glow-breathe': 6000, 'sheen-drift': 8000, 'soft-lift': 6500, 'twin-shimmer': 8000 };

    const presets = RASTER_IDLES.map((name) => rasterIdle(name));

    const periods = Object.fromEntries(presets.map((x) => [x?.name ?? '', x?.periodMs] as const));
    const inRange = presets.every((x) => (x?.periodMs ?? 0) >= RASTER_LOOP_MIN_MS && (x?.periodMs ?? 0) <= RASTER_LOOP_MAX_MS);
    const allInfinite = presets.every((x) => runs(x?.css ?? '').every((r) => r.includes(' infinite both')));
    expect([periods, inRange, allInfinite]).toEqual([expected, true, true]);
  });

  it('with idleStartMs 1100, delays the slow glint loop by 1100 ms', () => {
    const css = rasterIdle(RasterIdle.SlowGlint, { idleStartMs: 1100 })?.css ?? '';

    const run = runs(css);

    expect(run).toEqual(['animation:lkr-idle-slow-glint-0 7000ms linear 1100ms infinite both']);
  });
});

describe('rasterMotion', () => {
  it('with glow sweep, glint and slow glint, starts the idle loop when the intro ends', () => {
    const selection = { intro: RasterIntro.GlowSweep, micro: RasterMicro.Glint, idle: RasterIdle.SlowGlint };

    const motion = rasterMotion(selection);

    expect([motion.introMs, motion.microMs, motion.periodMs, motion.unknown, motion.css.includes('7000ms linear 1100ms infinite')]).toEqual([1100, 280, 7000, [], true]);
  });

  it('with reduced motion asked by the browser, holds every layer still', () => {
    const motion = rasterMotion({ intro: RasterIntro.TiltSweep, idle: RasterIdle.SoftLift }, { prefix: 'brand' });

    const still = motion.css.includes('@media (prefers-reduced-motion:reduce){.brand,.brand *,.brand *::after{animation:none!important}}');

    expect(still).toBe(true);
  });

  it('with no play class on the host, has no animation outside a play-class rule', () => {
    const motion = rasterMotion({ intro: RasterIntro.BurstSettle, micro: RasterMicro.Pulse, idle: RasterIdle.TwinShimmer });

    const loose = motion.css.replace(/@media[^{]+\{[^}]+\}\}/, '').split('}').filter((rule) => rule.includes('animation:') && !rule.includes('-play-'));

    expect(loose).toEqual([]);
  });

  it('with a hidden tab, pauses every running layer through the paused class', () => {
    const motion = rasterMotion({ idle: RasterIdle.SlowGlint });

    const paused = motion.css.includes('.lkr-paused,.lkr-paused *,.lkr-paused *::after{animation-play-state:paused!important}');

    expect(paused).toBe(true);
  });

  it('with unknown names, lists each one', () => {
    const motion = rasterMotion({ intro: 'nope', micro: RasterMicro.Nudge, idle: 'never' });

    const unknown = motion.unknown;

    expect(unknown).toEqual(['nope', 'never']);
  });
});

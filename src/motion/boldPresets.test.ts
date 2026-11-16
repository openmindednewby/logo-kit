import { describe, expect, it } from 'vitest';

import { INTRO_CAP_MS, PRESET_DEFAULTS } from './defaults';
import { BOLD_PRESETS, INTRO_PRESETS, MotionPreset } from './MotionPreset';
import { presetFrames } from './presets';
import { totalMs } from './timeline';

const FOUR = ['a', 'b', 'c', 'd'];
const layer = { name: 'a', d: 'M40 8L56 16L40 24L24 16Z', paint: { light: [], dark: [] } };
const ctx = { layer, markCentre: { x: 32, y: 32 }, markSize: 64 };

describe('BOLD_PRESETS', () => {
  it('with the bold list, has five intro presets', () => {
    const intro = BOLD_PRESETS.filter((p) => INTRO_PRESETS.includes(p));

    expect(intro).toEqual([MotionPreset.FlyIn, MotionPreset.SpinAssemble, MotionPreset.DropBounce, MotionPreset.Flip, MotionPreset.SlamShake]);
  });

  it('with each bold default on four layers, ends within 1200 ms', () => {
    const ends = BOLD_PRESETS.map((p) => totalMs([PRESET_DEFAULTS[p] ?? { preset: p, durationMs: 99999 }], FOUR));

    const over = ends.filter((ms) => ms > INTRO_CAP_MS);

    expect(over).toEqual([]);
  });
});

describe('presetFrames', () => {
  it('with fly-in, starts hidden away from the centre and overshoots past the rest position', () => {
    const frames = presetFrames({ preset: MotionPreset.FlyIn, durationMs: 700 }, ctx);

    expect(frames.keyframes).toMatch(/^0%\{opacity:0;transform:translate\(\d+\.\d+px,-\d+\.\d+px\)\}60%\{opacity:1;transform:translate\(-\d/);
  });

  it('with spin-assemble, turns from -540deg at 20% size to rest', () => {
    const frames = presetFrames({ preset: MotionPreset.SpinAssemble, durationMs: 800 }, ctx);

    expect([frames.keyframes.startsWith('0%{opacity:0;transform:rotate(-540deg) scale(0.2)}'), frames.keyframes.endsWith('100%{opacity:1;transform:rotate(0deg) scale(1)}'), frames.extra]).toEqual([true, true, 'transform-box:fill-box;transform-origin:center']);
  });

  it('with drop-bounce on a 64 unit mark, drops from 38.40 px above and bounces twice', () => {
    const frames = presetFrames({ preset: MotionPreset.DropBounce, durationMs: 800 }, ctx);

    expect(frames.keyframes).toBe('0%{opacity:0;transform:translateY(-38.40px)}45%{opacity:1;transform:translateY(0.00px)}60%{opacity:1;transform:translateY(-6.91px)}75%{opacity:1;transform:translateY(0.00px)}87%{opacity:1;transform:translateY(-1.92px)}100%{opacity:1;transform:translateY(0.00px)}');
  });

  it('with flip, turns over through its back face and lands face up', () => {
    const frames = presetFrames({ preset: MotionPreset.Flip, durationMs: 700 }, ctx);

    expect(frames.keyframes).toBe('0%{opacity:0;transform:scale(0,1)}35%{opacity:1;transform:scale(-1,1)}65%{opacity:1;transform:scale(0,1)}100%{opacity:1;transform:scale(1,1)}');
  });

  it('with slam-shake on a 64 unit mark, lands from 2.4x and shakes 2.56 px', () => {
    const frames = presetFrames({ preset: MotionPreset.SlamShake, durationMs: 800 }, ctx);

    expect(frames.keyframes).toBe('0%{opacity:0;transform:translate(0.00px,0px) scale(2.4)}40%{opacity:1;transform:translate(0.00px,0px) scale(0.94)}50%{opacity:1;transform:translate(-2.56px,0px) scale(1)}62%{opacity:1;transform:translate(2.56px,0px) scale(1)}74%{opacity:1;transform:translate(-1.54px,0px) scale(1)}86%{opacity:1;transform:translate(0.77px,0px) scale(1)}100%{opacity:1;transform:translate(0.00px,0px) scale(1)}');
  });
});

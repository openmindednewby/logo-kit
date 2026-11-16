import { describe, expect, it } from 'vitest';

import { Mode } from '../core/Mode';
import type { MotionBeat } from '../core/types';
import { primitiveMark } from '../generate/generate';
import { generatorPalette } from '../palette/variants';
import { MARK_TARGET, PRESET_DEFAULTS } from './defaults';
import { MotionPreset } from './MotionPreset';
import { animatedSvg } from './motionSvg';

const palette = generatorPalette('mooncube');
const RULE = /(svg(?::hover)?) ([#.][\w-]+)\{[^{}]*animation:/g;

function animatedTargets(svg: string): { intro: Set<string>; micro: Set<string> } {
  const intro = new Set<string>();
  const micro = new Set<string>();
  for (const [, root, target] of svg.matchAll(RULE)) {
    if (target !== undefined) {
      (root === 'svg:hover' ? micro : intro).add(target);
    }
  }
  return { intro, micro };
}

const presetBeat = (preset: MotionPreset): MotionBeat => PRESET_DEFAULTS[preset] ?? { preset, durationMs: 200 };
const introBeats: MotionBeat[] = [presetBeat(MotionPreset.ScalePop), presetBeat(MotionPreset.Pulse), presetBeat(MotionPreset.Sweep)];
const microBeats: MotionBeat[] = [presetBeat(MotionPreset.Spread), { ...presetBeat(MotionPreset.Spread), layers: [MARK_TARGET] }, { ...presetBeat(MotionPreset.Sweep), durationMs: 200 }];

describe('animatedSvg', () => {
  it('with an intro and a hover micro on the same layers, never sets animation on an intro-animated element under :hover', () => {
    const svg = animatedSvg(primitiveMark('cube'), palette, Mode.Light, { intro: introBeats, micro: microBeats }, { label: 'cube' });

    const { intro, micro } = animatedTargets(svg);

    expect(intro.size).toBeGreaterThan(0);
    expect(micro.size).toBeGreaterThan(0);
    expect([...micro].filter((t) => intro.has(t))).toEqual([]);
  });

  it('with a hover micro, renders an element for every hover selector', () => {
    const svg = animatedSvg(primitiveMark('cube'), palette, Mode.Light, { intro: introBeats, micro: microBeats }, { label: 'cube' });

    const { micro } = animatedTargets(svg);

    const missing = [...micro].filter((t) => !new RegExp(t.startsWith('#') ? `id="${t.slice(1)}"` : `class="${t.slice(1)}"`).test(svg));
    expect(missing).toEqual([]);
  });
});

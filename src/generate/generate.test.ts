import { describe, expect, it } from 'vitest';

import { Mode } from '../core/Mode';
import { markSvg } from '../core/svg';
import { generatorPalette } from '../palette/variants';
import { generateVariants } from './generate';

const svgs = (seed: number, count: number): string[] => {
  const palette = generatorPalette('mooncube');
  return generateVariants(seed, count).map((v) => markSvg(v.mark, palette, Mode.Light, { label: v.id }));
};

describe('generateVariants', () => {
  it('with seed 7 and count 200 run twice, gives byte-identical SVGs', () => {
    const first = svgs(7, 200);

    const second = svgs(7, 200);

    expect(second).toEqual(first);
    expect(first).toHaveLength(200);
  });

  it('with two different seeds, gives different marks', () => {
    const a = svgs(7, 20);

    const b = svgs(8, 20);

    expect(b).not.toEqual(a);
  });
});

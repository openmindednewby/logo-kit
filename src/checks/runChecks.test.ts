import { describe, expect, it } from 'vitest';

import { contrast, deltaE, simulateCvd } from '../core/colour';
import { CvdKind } from '../core/CvdKind';
import type { Mark, Palette } from '../core/types';
import { generateVariants, primitiveMark } from '../generate/generate';
import { generatorPalette } from '../palette/variants';
import { checkVariants, runChecks } from './runChecks';

const palette = generatorPalette('mooncube');
const twoTone = (a: string, b: string): Palette => ({ ...palette, light: { ...palette.light, a, b } });
const RED = '#c0392b';
const HEX_STEP = 17;
const confusedGreen = (): string => {
  const hexes = Array.from({ length: 16 }, (_, i) => (i * HEX_STEP).toString(16).padStart(2, '0'));
  const all = hexes.flatMap((r) => hexes.flatMap((g) => hexes.map((b) => `#${r}${g}${b}`)));
  const found = all.find((h) => deltaE(h, RED) > 40 && deltaE(simulateCvd(h, CvdKind.Deutan), simulateCvd(RED, CvdKind.Deutan)) < 4 && contrast(h, '#ffffff') >= 3);
  return found ?? '#000000';
};
const DOT = 'M32 32.2L32.2 32L32 31.8L31.8 32Z';

describe('runChecks', () => {
  it('with a plain cube in the Moon Cube generator palette, passes every check', () => {
    const cube = primitiveMark('cube');

    const result = runChecks(cube, palette);

    expect(result.reasons).toEqual([]);
  });

  it('with a role colour under 3:1 on white, fails contrast naming the role', () => {
    const cube = primitiveMark('cube');

    const result = runChecks(cube, twoTone('#eeeeee', palette.light['b'] ?? ''));

    expect(result.reasons.some((r) => r.startsWith('contrast: light "a"'))).toBe(true);
  });

  it('with a red face and a green face a deuteranope sees as one colour, fails cvd', () => {
    const cube = primitiveMark('cube');

    const result = runChecks(cube, twoTone(RED, confusedGreen()));

    expect(result.reasons.some((r) => r.startsWith('cvd:'))).toBe(true);
  });

  it('with a layer smaller than a pixel, fails legibility at 16 px', () => {
    const cube = primitiveMark('cube');
    const mark: Mark = { ...cube, layers: [...cube.layers, { name: 'speck', d: DOT, paint: { light: [{ fill: 'a' }], dark: [{ fill: 'a' }] } }] };

    const result = runChecks(mark, palette);

    expect(result.reasons.some((r) => r.startsWith('legible16: layer "speck"'))).toBe(true);
  });

  it('with a solid square, fails one colour as a solid block', () => {
    const square = primitiveMark('square');

    const result = runChecks(square, palette);

    expect(result.reasons.some((r) => r.startsWith('oneColour'))).toBe(true);
  });
});

describe('checkVariants', () => {
  it('with 200 seeded variants, keeps at least 10 and gives every dropped one a reason', () => {
    const variants = generateVariants(1, 200);

    const report = checkVariants(1, variants, palette);

    expect(report.passed.length).toBeGreaterThanOrEqual(10);
    expect(report.dropped.every((d) => d.reasons.length > 0)).toBe(true);
    expect(report.passed.length + report.dropped.length).toBe(200);
  });
});

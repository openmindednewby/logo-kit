import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadBrand } from '../config/loadBrand';
import { MOONCUBE, tmpDir } from '../testing/paths';
import { buildPickSpec } from './buildPickSpec';
import { FRAME } from './frames';

describe('buildPickSpec', () => {
  it('with the Moon Cube brand, writes shape, colour and motion steps in that order', () => {
    const out = tmpDir('pick');

    const spec = buildPickSpec(loadBrand(MOONCUBE), out);

    expect(spec.steps.map((s) => s.screen)).toEqual(['logo-shape', 'logo-colour', 'logo-motion']);
  });

  it('with the Moon Cube brand, gives every step 3 to 5 options whose frames exist inside the phone frame', () => {
    const out = tmpDir('pick');

    const spec = buildPickSpec(loadBrand(MOONCUBE), out);

    for (const step of spec.steps) {
      expect(step.options.length).toBeGreaterThanOrEqual(3);
      expect(step.options.length).toBeLessThanOrEqual(5);
      for (const o of step.options) {
        expect(fs.existsSync(path.join(out, o.image))).toBe(true);
        const b = o.targetBox;
        expect(b === undefined || (b.x + b.w <= FRAME.w && b.y + b.h <= FRAME.h)).toBe(true);
      }
    }
  });

  it('with the motion step, marks it kind motion and gives each option an .svg that plays in the frame', () => {
    const out = tmpDir('pick');

    const motion = buildPickSpec(loadBrand(MOONCUBE), out).steps[2];

    expect(motion?.kind).toBe('motion');
    expect(motion?.options.every((o) => o.motion?.endsWith('.svg') === true && fs.readFileSync(path.join(out, o.motion), 'utf8').includes('@keyframes'))).toBe(true);
  });
});

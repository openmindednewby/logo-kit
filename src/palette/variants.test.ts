import { presetOf } from '../config/tokens';
import { describe, expect, it } from 'vitest';

import { loadBrand } from '../config/loadBrand';
import { primitiveMark } from '../generate/generate';
import { QUILLO } from '../testing/paths';
import { contrastFailures, cvdFailures } from './paletteChecks';
import { rolesOf } from './roles';
import { paletteVariants } from './variants';

function tokenColours(node: unknown): string[] {
  if (typeof node === 'string') {
    return [node.toLowerCase()];
  }
  return typeof node === 'object' && node !== null ? Object.values(node).flatMap(tokenColours) : [];
}

describe('paletteVariants', () => {
  it('with a cube and the flier preset, gives at least 5 palettes that pass contrast and cvd', () => {
    const cube = primitiveMark('cube');
    const roles = rolesOf(cube);

    const palettes = paletteVariants(cube, 'flier', 5);

    expect(palettes.length).toBeGreaterThanOrEqual(5);
    expect(palettes.flatMap((p) => [...contrastFailures(p, roles), ...cvdFailures(p, roles)])).toEqual([]);
  });

  it('with the Quillo mark, uses only colours from the design-tokens preset', () => {
    const mark = loadBrand(QUILLO).mark;
    const allowed = new Set(tokenColours(presetOf('flier')));

    const palettes = paletteVariants(mark, 'flier', 5);

    const used = palettes.flatMap((p) => [...Object.values(p.light), ...Object.values(p.dark)].map((h) => h.toLowerCase()));
    expect(used.filter((h) => !allowed.has(h))).toEqual([]);
  });
});

import { MOONCUBE_TOKENS } from '@dloizides/design-tokens';
import { describe, expect, it } from 'vitest';

import { loadBrand } from '../config/loadBrand';
import { primitiveMark } from '../generate/generate';
import { MOONCUBE } from '../testing/paths';
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
  it('with a cube and the mooncube preset, gives at least 5 palettes that pass contrast and cvd', () => {
    const cube = primitiveMark('cube');
    const roles = rolesOf(cube);

    const palettes = paletteVariants(cube, 'mooncube', 5);

    expect(palettes.length).toBeGreaterThanOrEqual(5);
    expect(palettes.flatMap((p) => [...contrastFailures(p, roles), ...cvdFailures(p, roles)])).toEqual([]);
  });

  it('with the Moon Cube mark, uses only colours from the design-tokens preset', () => {
    const mark = loadBrand(MOONCUBE).mark;
    const allowed = new Set(tokenColours(MOONCUBE_TOKENS));

    const palettes = paletteVariants(mark, 'mooncube', 5);

    const used = palettes.flatMap((p) => [...Object.values(p.light), ...Object.values(p.dark)].map((h) => h.toLowerCase()));
    expect(used.filter((h) => !allowed.has(h))).toEqual([]);
  });
});

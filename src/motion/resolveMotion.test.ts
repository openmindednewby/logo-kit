import { describe, expect, it } from 'vitest';

import { MotionPreset } from './MotionPreset';
import { resolveMotion } from './resolveMotion';

const LAYERS = ['disc', 'p1', 'p2'];

describe('resolveMotion', () => {
  it('with an intro recipe name and roles, resolves to the recipe beats on those roles', () => {
    const config = resolveMotion({ intro: 'phase-wipe', roles: { base: ['p2'], parts: ['disc', 'p1'] } }, LAYERS, 64);

    expect(config.intro.map((b) => b.layers)).toEqual([['p2'], ['disc', 'p1']]);
  });

  it('with no roles, takes the first layer as base and the rest as parts', () => {
    const config = resolveMotion({ micro: 'faces-part' }, LAYERS, 64);

    expect(config.micro[0]?.layers).toEqual(['p1', 'p2']);
  });

  it('with explicit beats, keeps them as written', () => {
    const beats = [{ preset: MotionPreset.Draw, durationMs: 500 }];

    const config = resolveMotion({ intro: beats }, LAYERS, 64);

    expect(config.intro).toBe(beats);
  });

  it('with unknown recipe names, records an error for each', () => {
    const config = resolveMotion({ intro: 'nope', micro: 'wobble' }, LAYERS, 64);

    expect([config.intro, config.recipeErrors]).toEqual([[], ['unknown intro recipe "nope"', 'unknown micro recipe "wobble"']]);
  });

  it('with a role naming a missing layer, records an error', () => {
    const config = resolveMotion({ intro: 'fly-in', roles: { base: ['moon'] } }, LAYERS, 64);

    expect(config.recipeErrors).toEqual(['motion.roles names unknown layer "moon"']);
  });
});

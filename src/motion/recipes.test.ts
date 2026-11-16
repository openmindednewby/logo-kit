import { describe, expect, it } from 'vitest';

import { INTRO_CAP_MS, MICRO_CAP_MS } from './defaults';
import { INTRO_RECIPES, IntroRecipe } from './IntroRecipe';
import { MICRO_RECIPES, MicroRecipe } from './MicroRecipe';
import { MotionPreset } from './MotionPreset';
import { introRecipe, microRecipe } from './recipes';
import { targetsOf, totalMs, validateMotion } from './timeline';

const LAYERS = ['disc', 'p1', 'p2', 'p3'];
const ctx = { roles: { base: ['disc'], parts: ['p1', 'p2', 'p3'] }, size: 64 };

describe('INTRO_RECIPES', () => {
  it('with the recipe list, names the 5 pick-page intros and 5 bold intros', () => {
    const names = [...INTRO_RECIPES];

    expect(names).toEqual(['rim-then-ink', 'phase-wipe', 'faces-settle', 'turn-into-place', 'grow-from-circles', 'fly-in', 'spin-assemble', 'drop-bounce', 'flip-faces', 'slam-shake']);
  });
});

describe('introRecipe', () => {
  it('with every intro recipe, passes validateMotion inside 1200 ms', () => {
    const reports = INTRO_RECIPES.map((r) => ({ r, rep: validateMotion({ intro: introRecipe(r, ctx) ?? [], micro: [] }, LAYERS) }));

    const bad = reports.filter(({ rep }) => rep.errors.length > 0 || rep.introMs > INTRO_CAP_MS || rep.introMs === 0).map(({ r }) => r);

    expect(bad).toEqual([]);
  });

  it('with every intro recipe, only targets layers named in the roles or the whole mark', () => {
    const targets = INTRO_RECIPES.flatMap((r) => (introRecipe(r, ctx) ?? []).flatMap((b) => targetsOf(b, LAYERS)));

    const foreign = targets.filter((t) => !['@mark', ...LAYERS].includes(t));

    expect(foreign).toEqual([]);
  });

  it('with grow-from-circles, floods the base then morphs each part from a circle', () => {
    const beats = introRecipe(IntroRecipe.GrowFromCircles, ctx);

    expect(beats?.map((b) => [b.preset, b.layers])).toEqual([[MotionPreset.Flood, ['disc']], [MotionPreset.MorphFromCircle, ['p1', 'p2', 'p3']]]);
  });

  it('with phase-wipe on a 640 unit mark, scales the rise distance by 10', () => {
    const beats = introRecipe(IntroRecipe.PhaseWipe, { ...ctx, size: 640 });

    expect(beats?.[1]?.distance).toBe(40);
  });

  it('with twelve parts, shortens the stagger so the intro still ends within 1200 ms', () => {
    const parts = Array.from({ length: 12 }, (_, k) => `q${k}`);

    const ms = totalMs(introRecipe(IntroRecipe.FacesSettle, { roles: { base: ['disc'], parts }, size: 64 }) ?? [], ['disc', ...parts]);

    expect(ms).toBeLessThanOrEqual(INTRO_CAP_MS);
  });

  it('with an unknown name, returns null', () => {
    const beats = introRecipe('nope', ctx);

    expect(beats).toBeNull();
  });
});

describe('microRecipe', () => {
  it('with the recipe list, names faces-part, breath, rim-glint and part-and-glint', () => {
    const names = [...MICRO_RECIPES];

    expect(names).toEqual(['faces-part', 'breath', 'rim-glint', 'part-and-glint']);
  });

  it('with every micro recipe, passes validateMotion inside 300 ms', () => {
    const reports = MICRO_RECIPES.map((r) => ({ r, rep: validateMotion({ intro: [], micro: microRecipe(r, ctx) ?? [] }, LAYERS) }));

    const bad = reports.filter(({ rep }) => rep.errors.length > 0 || rep.microMs > MICRO_CAP_MS || rep.microMs === 0).map(({ r }) => r);

    expect(bad).toEqual([]);
  });

  it('with part-and-glint, spreads the parts and sweeps the base together', () => {
    const beats = microRecipe(MicroRecipe.PartAndGlint, ctx);

    expect(beats?.map((b) => [b.preset, b.layers])).toEqual([[MotionPreset.Spread, ['p1', 'p2', 'p3']], [MotionPreset.Sweep, ['disc']]]);
  });

  it('with an unknown name, returns null', () => {
    const beats = microRecipe('wobble', ctx);

    expect(beats).toBeNull();
  });
});

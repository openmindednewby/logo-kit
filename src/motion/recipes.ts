import type { MotionBeat } from '../core/types';
import { EASE, EASE_IN_FIRST, INTRO_CAP_MS, MARK_TARGET } from './defaults';
import { IntroRecipe } from './IntroRecipe';
import { MicroRecipe } from './MicroRecipe';
import { MotionPreset } from './MotionPreset';
import { fitBeat } from './timeline';

export interface MotionRoles {
  base: string[];
  parts: string[];
}

export interface RecipeContext {
  roles: MotionRoles;
  size: number;
}

const REFERENCE_SIZE = 64;

type Recipe = (ctx: RecipeContext, k: number) => MotionBeat[];

const fit = (beat: MotionBeat): MotionBeat => fitBeat(beat, beat.layers?.length ?? 1, INTRO_CAP_MS);
const all = (ctx: RecipeContext): string[] => [...ctx.roles.base, ...ctx.roles.parts];

const INTROS: Readonly<Record<string, Recipe>> = {
  [IntroRecipe.RimThenInk]: (ctx, k) => [
    { preset: MotionPreset.Sweep, layers: ctx.roles.base, durationMs: 500, share: 0.2, width: 1.5 * k, colour: 'text', easing: EASE },
    { preset: MotionPreset.Flood, layers: ctx.roles.base, durationMs: 500, delayMs: 200, easing: EASE_IN_FIRST },
    fit({ preset: MotionPreset.Flood, layers: ctx.roles.parts, durationMs: 400, delayMs: 600, stepMs: 100, easing: EASE }),
  ],
  [IntroRecipe.PhaseWipe]: (ctx, k) => [
    { preset: MotionPreset.Wipe, layers: ctx.roles.base, durationMs: 600, easing: EASE_IN_FIRST },
    fit({ preset: MotionPreset.StaggerRise, layers: ctx.roles.parts, durationMs: 400, delayMs: 500, stepMs: 120, distance: 4 * k, easing: EASE }),
  ],
  [IntroRecipe.FacesSettle]: (ctx, k) => [
    { preset: MotionPreset.Flood, layers: ctx.roles.base, durationMs: 400, easing: EASE_IN_FIRST },
    fit({ preset: MotionPreset.StaggerRise, layers: ctx.roles.parts, durationMs: 500, delayMs: 300, stepMs: 150, distance: 6 * k, easing: EASE }),
  ],
  [IntroRecipe.TurnIntoPlace]: (ctx) => [fit({ preset: MotionPreset.Orbit, layers: all(ctx), durationMs: 800, stepMs: 100, easing: EASE })],
  [IntroRecipe.GrowFromCircles]: (ctx) => [
    { preset: MotionPreset.Flood, layers: ctx.roles.base, durationMs: 400, easing: EASE_IN_FIRST },
    { preset: MotionPreset.MorphFromCircle, layers: ctx.roles.parts, durationMs: 800, delayMs: 300, stops: [0, 40, 100], fadeIn: ctx.roles.parts, easing: EASE_IN_FIRST, settleEasing: EASE },
  ],
  [IntroRecipe.FlyIn]: (ctx) => [fit({ preset: MotionPreset.FlyIn, layers: all(ctx), durationMs: 700, stepMs: 100 })],
  [IntroRecipe.SpinAssemble]: (ctx) => [
    { preset: MotionPreset.ScalePop, layers: ctx.roles.base, durationMs: 400 },
    fit({ preset: MotionPreset.SpinAssemble, layers: ctx.roles.parts, durationMs: 700, delayMs: 200, stepMs: 100 }),
  ],
  [IntroRecipe.DropBounce]: (ctx) => [fit({ preset: MotionPreset.DropBounce, layers: all(ctx), durationMs: 800, stepMs: 100 })],
  [IntroRecipe.FlipFaces]: (ctx) => [
    { preset: MotionPreset.Flood, layers: ctx.roles.base, durationMs: 400, easing: EASE_IN_FIRST },
    fit({ preset: MotionPreset.Flip, layers: ctx.roles.parts, durationMs: 700, delayMs: 250, stepMs: 100 }),
  ],
  [IntroRecipe.SlamShake]: () => [{ preset: MotionPreset.SlamShake, layers: [MARK_TARGET], durationMs: 800 }],
};

const spread = (ctx: RecipeContext, k: number): MotionBeat => ({ preset: MotionPreset.Spread, layers: ctx.roles.parts, durationMs: 300, distance: 1.6 * k, easing: EASE });
const glint = (ctx: RecipeContext, k: number): MotionBeat => ({ preset: MotionPreset.Sweep, layers: ctx.roles.base, durationMs: 300, share: 0.2, width: 1.5 * k, colour: 'text', easing: EASE });

const MICROS: Readonly<Record<string, Recipe>> = {
  [MicroRecipe.FacesPart]: (ctx, k) => [spread(ctx, k)],
  [MicroRecipe.Breath]: () => [{ preset: MotionPreset.Pulse, layers: [MARK_TARGET], durationMs: 300, scale: 1.04, easing: EASE }],
  [MicroRecipe.RimGlint]: (ctx, k) => [glint(ctx, k)],
  [MicroRecipe.PartAndGlint]: (ctx, k) => [spread(ctx, k), glint(ctx, k)],
};

const run = (table: Readonly<Record<string, Recipe>>, name: string, ctx: RecipeContext): MotionBeat[] | null => {
  const recipe = table[name];
  return recipe ? recipe(ctx, ctx.size / REFERENCE_SIZE) : null;
};

/** Returns the intro beats of a named recipe on the brand's layer roles, or null for an unknown name. */
export function introRecipe(name: string, ctx: RecipeContext): MotionBeat[] | null {
  return run(INTROS, name, ctx);
}

/** Returns the hover beats of a named recipe on the brand's layer roles, or null for an unknown name. */
export function microRecipe(name: string, ctx: RecipeContext): MotionBeat[] | null {
  return run(MICROS, name, ctx);
}

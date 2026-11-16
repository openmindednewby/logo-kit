import type { MotionBeat, MotionConfig } from '../core/types';
import { DEFAULT_MOTION_CONFIG } from './defaults';
import { introRecipe, microRecipe } from './recipes';
import type { MotionRoles, RecipeContext } from './recipes';

export interface RawMotion {
  intro?: MotionBeat[] | string;
  micro?: MotionBeat[] | string;
  roles?: Partial<MotionRoles>;
  allowLongIntro?: string;
}

type RecipeFn = (name: string, ctx: RecipeContext) => MotionBeat[] | null;

function resolve(kind: string, value: MotionBeat[] | string | undefined, fallback: MotionBeat[], fn: RecipeFn, ctx: RecipeContext, errors: string[]): MotionBeat[] {
  if (typeof value !== 'string') {
    return value ?? fallback;
  }
  const beats = fn(value, ctx);
  if (beats === null) {
    errors.push(`unknown ${kind} recipe "${value}"`);
  }
  return beats ?? [];
}

/** Returns the motion config with recipe names turned into beats on the brand's layer roles. */
export function resolveMotion(raw: RawMotion | undefined, layerNames: readonly string[], size: number): MotionConfig {
  const roles: MotionRoles = { base: raw?.roles?.base ?? layerNames.slice(0, 1), parts: raw?.roles?.parts ?? layerNames.slice(1) };
  const errors = [...roles.base, ...roles.parts].filter((n) => !layerNames.includes(n)).map((n) => `motion.roles names unknown layer "${n}"`);
  const ctx: RecipeContext = { roles, size };
  const intro = resolve('intro', raw?.intro, DEFAULT_MOTION_CONFIG.intro, introRecipe, ctx, errors);
  const micro = resolve('micro', raw?.micro, DEFAULT_MOTION_CONFIG.micro, microRecipe, ctx, errors);
  return {
    intro,
    micro,
    ...(raw?.allowLongIntro !== undefined ? { allowLongIntro: raw.allowLongIntro } : {}),
    ...(errors.length > 0 ? { recipeErrors: errors } : {}),
  };
}

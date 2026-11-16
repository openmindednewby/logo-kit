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

interface Resolved {
  beats: MotionBeat[];
  error?: string;
}

const KINDS = {
  intro: { recipe: introRecipe, fallback: DEFAULT_MOTION_CONFIG.intro },
  micro: { recipe: microRecipe, fallback: DEFAULT_MOTION_CONFIG.micro },
};

function resolve(kind: keyof typeof KINDS, value: MotionBeat[] | string | undefined, ctx: RecipeContext): Resolved {
  const { recipe, fallback } = KINDS[kind];
  if (typeof value !== 'string') {
    return { beats: value ?? fallback };
  }
  const beats = recipe(value, ctx);
  return beats !== null ? { beats } : { beats: [], error: `unknown ${kind} recipe "${value}"` };
}

/** Returns the motion config with recipe names turned into beats on the brand's layer roles. */
export function resolveMotion(raw: RawMotion | undefined, layerNames: readonly string[], size: number): MotionConfig {
  const roles: MotionRoles = { base: raw?.roles?.base ?? layerNames.slice(0, 1), parts: raw?.roles?.parts ?? layerNames.slice(1) };
  const ctx: RecipeContext = { roles, size };
  const intro = resolve('intro', raw?.intro, ctx);
  const micro = resolve('micro', raw?.micro, ctx);
  const errors = [
    ...[...roles.base, ...roles.parts].filter((n) => !layerNames.includes(n)).map((n) => `motion.roles names unknown layer "${n}"`),
    ...[intro.error, micro.error].filter((e): e is string => e !== undefined),
  ];
  return {
    intro: intro.beats,
    micro: micro.beats,
    ...(raw?.allowLongIntro !== undefined ? { allowLongIntro: raw.allowLongIntro } : {}),
    ...(errors.length > 0 ? { recipeErrors: errors } : {}),
  };
}

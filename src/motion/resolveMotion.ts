import type { MotionBeat, MotionConfig, WordmarkMotionConfig } from '../core/types';
import { DEFAULT_MOTION_CONFIG } from './defaults';
import { IDLE_RECIPES } from './IdleRecipe';
import { introRecipe, microRecipe } from './recipes';
import type { MotionRoles, RecipeContext } from './recipes';
import { WORDMARK_RECIPES } from './WordmarkRecipe';

export interface RawMotion {
  intro?: MotionBeat[] | string;
  micro?: MotionBeat[] | string;
  wordmark?: string | { recipe: string; startMs?: number };
  idle?: string;
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

function toWordmark(raw: RawMotion['wordmark']): WordmarkMotionConfig | undefined {
  if (raw === undefined) {
    return undefined;
  }
  return typeof raw === 'string' ? { recipe: raw, startMs: 0 } : { recipe: raw.recipe, startMs: raw.startMs ?? 0 };
}

const known = (list: readonly string[], kind: string, name: string | undefined): string[] =>
  name === undefined || list.includes(name) ? [] : [`unknown ${kind} recipe "${name}"`];

/** Returns the motion config with recipe names turned into beats on the brand's layer roles. */
export function resolveMotion(raw: RawMotion | undefined, layerNames: readonly string[], size: number): MotionConfig {
  const roles: MotionRoles = { base: raw?.roles?.base ?? layerNames.slice(0, 1), parts: raw?.roles?.parts ?? layerNames.slice(1) };
  const ctx: RecipeContext = { roles, size };
  const intro = resolve('intro', raw?.intro, ctx);
  const micro = resolve('micro', raw?.micro, ctx);
  const wordmark = toWordmark(raw?.wordmark);
  const errors = [
    ...[...roles.base, ...roles.parts].filter((n) => !layerNames.includes(n)).map((n) => `motion.roles names unknown layer "${n}"`),
    ...[intro.error, micro.error].filter((e): e is string => e !== undefined),
    ...known(WORDMARK_RECIPES, 'wordmark', wordmark?.recipe),
    ...known(IDLE_RECIPES, 'idle', raw?.idle),
  ];
  return {
    intro: intro.beats,
    micro: micro.beats,
    ...(wordmark !== undefined ? { wordmark } : {}),
    ...(raw?.idle !== undefined ? { idle: { recipe: raw.idle } } : {}),
    ...(raw?.allowLongIntro !== undefined ? { allowLongIntro: raw.allowLongIntro } : {}),
    ...(errors.length > 0 ? { recipeErrors: errors } : {}),
  };
}

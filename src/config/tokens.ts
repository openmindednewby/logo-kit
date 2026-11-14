import { PRESETS } from '@dloizides/design-tokens';
import type { DesignTokens } from '@dloizides/design-tokens';

/** Returns a design-tokens preset by id, or throws naming the known ids. */
export function presetOf(id: string): DesignTokens {
  const preset = PRESETS[id];
  if (!preset) {
    throw new Error(`unknown design-tokens preset "${id}", known: ${Object.keys(PRESETS).join(', ')}`);
  }
  return preset;
}

/** Returns a colour for a token reference such as "mooncube.primary" or "mooncube.dark.text"; a "#hex" passes through. */
export function resolveToken(ref: string): string {
  if (ref.startsWith('#')) {
    return ref;
  }
  const [id = '', ...path] = ref.split('.');
  let node: unknown = presetOf(id);
  for (const key of path) {
    node = typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[key] : undefined;
  }
  if (typeof node !== 'string') {
    throw new Error(`token "${ref}" is not a colour`);
  }
  return node;
}

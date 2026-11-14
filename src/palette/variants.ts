import type { DesignTokens } from '@dloizides/design-tokens';

import { contrast } from '../core/colour';
import type { Mark, Palette } from '../core/types';
import { presetOf } from '../config/tokens';
import { contrastFailures, cvdFailures, MIN_CONTRAST } from './paletteChecks';
import { rolesOf } from './roles';

const unique = (list: readonly (string | undefined)[]): string[] =>
  [...new Set(list.filter((h): h is string => h !== undefined).map((h) => h.toLowerCase()))];

/** Returns the preset's colours that keep 3:1 on its light and dark backgrounds. */
export function tokenPools(t: DesignTokens): { light: string[]; dark: string[] } {
  const light = unique([t.primary, t.secondary, t.light.text, t.light.brandFill, t.semantic.info, t.light.textSecondary]);
  const dark = unique([t.accent, t.dark.text, t.dark.brandFill, t.dark.focusRing, t.dark.textSecondary, t.dark.textTertiary, t.semantic.warning]);
  return {
    light: light.filter((h) => contrast(h, t.light.background) >= MIN_CONTRAST),
    dark: dark.filter((h) => contrast(h, t.dark.background) >= MIN_CONTRAST),
  };
}

function candidate(t: DesignTokens, roles: readonly string[], pick: (j: number) => [string, string], name: string): Palette {
  const light: Record<string, string> = { background: t.light.background, text: t.light.text };
  const dark: Record<string, string> = { background: t.dark.background, text: t.dark.text };
  roles.forEach((role, j) => {
    const [l, d] = pick(j);
    light[role] = l;
    dark[role] = d;
  });
  return { name, light, dark, mono: t.light.text };
}

function candidates(t: DesignTokens, roles: readonly string[], tokensId: string): Palette[] {
  const { light, dark } = tokenPools(t);
  const out: Palette[] = [];
  const nl = light.length;
  const nd = dark.length;
  for (let k = 0; k < nl * nd; k++) {
    const li = k % nl;
    const di = Math.floor(k / nl);
    out.push(candidate(t, roles, (j) => [light[(li + j) % nl] ?? '', dark[(di + j) % nd] ?? ''], `${tokensId}-${li}${di}`));
  }
  light.forEach((l, i) => out.push(candidate(t, roles, () => [l, dark[i % nd] ?? ''], `${tokensId}-mono-${i}`)));
  return out;
}

/** Returns up to count palettes from a design-tokens preset, each passing contrast and colour-blind checks for the mark. */
export function paletteVariants(mark: Mark, tokensId: string, count = 5): Palette[] {
  const t = presetOf(tokensId);
  const roles = rolesOf(mark);
  const seen = new Set<string>();
  const out: Palette[] = [];
  for (const p of candidates(t, roles, tokensId)) {
    const key = JSON.stringify([p.light, p.dark]);
    const passes = contrastFailures(p, roles).length === 0 && cvdFailures(p, roles).length === 0;
    if (passes && !seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
    if (out.length >= count) {
      break;
    }
  }
  return out;
}

/** Returns the default two-role palette of a preset for generated marks (roles "a" and "b"). */
export function generatorPalette(tokensId: string): Palette {
  const t = presetOf(tokensId);
  return {
    name: `${tokensId}-generator`,
    light: { background: t.light.background, text: t.light.text, a: t.primary, b: t.light.text },
    dark: { background: t.dark.background, text: t.dark.text, a: t.accent, b: t.dark.text },
    mono: t.light.text,
  };
}

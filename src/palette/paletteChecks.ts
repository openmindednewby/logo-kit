import { contrast, deltaE, simulateCvd } from '../core/colour';
import { CVD_KINDS } from '../core/CvdKind';
import type { ModeColours, Palette } from '../core/types';

export const MIN_CONTRAST = 3;
export const MIN_CVD_DELTA_E = 10;

const bgOf = (colours: ModeColours): string => colours['background'] ?? '#ffffff';

/** Returns the reasons the mark's roles fail 3:1 against the background in light or dark mode. */
export function contrastFailures(palette: Palette, roles: readonly string[]): string[] {
  const out: string[] = [];
  for (const [mode, colours] of [['light', palette.light], ['dark', palette.dark]] as const) {
    for (const role of roles) {
      const hex = colours[role];
      if (hex === undefined) {
        out.push(`contrast: ${mode} has no colour for "${role}"`);
      } else if (contrast(hex, bgOf(colours)) < MIN_CONTRAST) {
        out.push(`contrast: ${mode} "${role}" ${hex} is ${contrast(hex, bgOf(colours)).toFixed(2)}:1 on ${bgOf(colours)}`);
      }
    }
  }
  return out;
}

function cvdModeFailures(colours: ModeColours, roles: readonly string[], mode: string): string[] {
  const out: string[] = [];
  const hexes = [...new Set(roles.map((r) => colours[r]).filter((h): h is string => h !== undefined))];
  for (const kind of CVD_KINDS) {
    const sim = hexes.map((h) => simulateCvd(h, kind));
    const bg = simulateCvd(bgOf(colours), kind);
    sim.forEach((s, i) => {
      if (contrast(s, bg) < MIN_CONTRAST) {
        out.push(`cvd: ${mode} ${hexes[i] ?? ''} drops under 3:1 for ${kind}`);
      }
      sim.slice(i + 1).forEach((t, j) => {
        if (deltaE(s, t) < MIN_CVD_DELTA_E) {
          out.push(`cvd: ${mode} ${hexes[i] ?? ''} and ${hexes[i + j + 1] ?? ''} look the same for ${kind}`);
        }
      });
    });
  }
  return out;
}

/** Returns the reasons the mark's distinct role colours collapse or lose contrast for protan, deutan or tritan viewers. */
export function cvdFailures(palette: Palette, roles: readonly string[]): string[] {
  return [...cvdModeFailures(palette.light, roles, 'light'), ...cvdModeFailures(palette.dark, roles, 'dark')];
}

export type Frame = readonly [number, string];

export interface AnimTiming {
  durationMs: number;
  delayMs?: number;
  easing: string;
}

export const SETTLE_OUT = 'cubic-bezier(0.23,1,0.32,1)';
export const IN_OUT = 'cubic-bezier(0.77,0,0.175,1)';

const pct = (p: number): string => `${Number.isInteger(p) ? p : p.toFixed(2)}%`;

/** Returns one keyframes rule and the rule that plays it once on the selector, holding both ends. */
export function cssAnim(name: string, selector: string, frames: readonly Frame[], timing: AnimTiming): string {
  const body = frames.map(([p, v]) => `${pct(p)}{${v}}`).join('');
  const run = `${name} ${Math.round(timing.durationMs)}ms ${timing.easing} ${Math.round(timing.delayMs ?? 0)}ms 1 both`;
  return `@keyframes ${name}{${body}}${selector}{animation:${run}}`;
}

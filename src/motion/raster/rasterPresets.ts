import { RasterPhase } from './RasterPhase';
import { RASTER_PREFIX, rasterBaseCss } from './rasterBaseCss';
import type { RasterOptions } from './rasterBaseCss';
import { RASTER_INTRO_SPECS } from './rasterIntros';
import { RASTER_IDLE_SPECS, RASTER_MICRO_SPECS } from './rasterLoops';
import { animEndMs } from './rasterSpec';
import type { RasterAnim, RasterSpec } from './rasterSpec';

export interface RasterPreset {
  name: string;
  phase: RasterPhase;
  durationMs: number;
  periodMs?: number;
  css: string;
}

export interface RasterSelection {
  intro?: string;
  micro?: string;
  idle?: string;
}

export interface RasterMotion {
  css: string;
  introMs: number;
  microMs: number;
  periodMs: number;
  unknown: string[];
}

interface Scope {
  p: string;
  id: string;
  phase: RasterPhase;
  idleStartMs: number;
}

function animCss(a: RasterAnim, i: number, s: Scope): string {
  const name = `${s.p}-${s.id}-${i}`;
  const delay = a.loop ? s.idleStartMs : a.delayMs ?? 0;
  const stagger = a.stepMs ? `;animation-delay:calc(${delay}ms + var(--k) * ${a.stepMs}ms)` : '';
  const play = `.${s.p}.${s.p}-play-${s.phase} .${s.p}-${a.layer}{animation:${name} ${a.ms}ms ${a.ease} ${delay}ms ${a.loop ? 'infinite' : '1'} both${stagger}}`;
  const rest = a.rest ? `.${s.p} .${s.p}-${a.layer}{${a.rest}}` : '';
  return `@keyframes ${name}{${a.frames}}${play}${rest}`;
}

function build(spec: RasterSpec, name: string, phase: RasterPhase, options: RasterOptions): RasterPreset {
  const scope: Scope = { p: options.prefix ?? RASTER_PREFIX, id: `${phase}-${name}`, phase, idleStartMs: options.idleStartMs ?? 0 };
  const css = spec.anims.map((a, i) => animCss(a, i, scope)).join('');
  const durationMs = spec.periodMs ?? Math.max(...spec.anims.map(animEndMs));
  return { name, phase, durationMs, periodMs: spec.periodMs, css };
}

const pick = (table: Readonly<Record<string, RasterSpec>>, name: string, phase: RasterPhase, options: RasterOptions): RasterPreset | null => {
  const spec = table[name];
  return spec ? build(spec, name, phase, options) : null;
};

/** Returns the CSS of a raster intro, played while the host has `<prefix>-play-intro`, or null for an unknown name. */
export function rasterIntro(name: string, options: RasterOptions = {}): RasterPreset | null {
  return pick(RASTER_INTRO_SPECS, name, RasterPhase.Intro, options);
}

/** Returns the CSS of a raster micro, played while the host has `<prefix>-play-micro`, or null for an unknown name. */
export function rasterMicro(name: string, options: RasterOptions = {}): RasterPreset | null {
  return pick(RASTER_MICRO_SPECS, name, RasterPhase.Micro, options);
}

/** Returns the CSS of a raster idle loop, run while the host has `<prefix>-play-idle`, or null for an unknown name. */
export function rasterIdle(name: string, options: RasterOptions = {}): RasterPreset | null {
  return pick(RASTER_IDLE_SPECS, name, RasterPhase.Idle, options);
}

const unknownNames = (pairs: readonly [string | undefined, RasterPreset | null][]): string[] =>
  pairs.flatMap(([asked, found]) => (asked !== undefined && found === null ? [asked] : []));

/** Returns one stylesheet for the chosen presets; the idle loop starts when the intro ends unless idleStartMs is set. */
export function rasterMotion(selection: RasterSelection, options: RasterOptions = {}): RasterMotion {
  const intro = selection.intro !== undefined ? rasterIntro(selection.intro, options) : null;
  const micro = selection.micro !== undefined ? rasterMicro(selection.micro, options) : null;
  const idleStartMs = options.idleStartMs ?? intro?.durationMs ?? 0;
  const idle = selection.idle !== undefined ? rasterIdle(selection.idle, { ...options, idleStartMs }) : null;
  const unknown = unknownNames([[selection.intro, intro], [selection.micro, micro], [selection.idle, idle]]);
  const css = rasterBaseCss(options) + [intro, micro, idle].map((x) => x?.css ?? '').join('');
  return { css, introMs: intro?.durationMs ?? 0, microMs: micro?.durationMs ?? 0, periodMs: idle?.periodMs ?? 0, unknown };
}

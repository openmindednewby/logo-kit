import type { MotionBeat, MotionConfig } from '../core/types';
import { INTRO_CAP_MS, MARK_TARGET, MICRO_CAP_MS } from './defaults';
import { INTRO_PRESETS, MICRO_PRESETS, MotionPreset } from './MotionPreset';

export interface Slot {
  target: string;
  delayMs: number;
  durationMs: number;
}

/** Returns the targets a beat animates: its named layers in mark order, the whole mark, or every layer. */
export function targetsOf(beat: MotionBeat, layerNames: readonly string[]): string[] {
  if (!beat.layers) {
    return [...layerNames];
  }
  return beat.layers.includes(MARK_TARGET) ? [MARK_TARGET] : layerNames.filter((n) => beat.layers?.includes(n));
}

/** Returns when each target of a beat starts and how long it runs: delay plus one step per target. */
export function schedule(beat: MotionBeat, layerNames: readonly string[]): Slot[] {
  return targetsOf(beat, layerNames).map((target, k) => ({ target, delayMs: (beat.delayMs ?? 0) + k * (beat.stepMs ?? 0), durationMs: beat.durationMs }));
}

/** Returns when the last target of all beats ends. */
export function totalMs(beats: readonly MotionBeat[], layerNames: readonly string[]): number {
  return Math.max(0, ...beats.flatMap((b) => schedule(b, layerNames).map((s) => s.delayMs + s.durationMs)));
}

/** Returns the beat with its step shortened so n targets end inside the cap. */
export function fitBeat(beat: MotionBeat, n: number, capMs: number): MotionBeat {
  const room = capMs - (beat.delayMs ?? 0) - beat.durationMs;
  const step = n > 1 ? Math.min(beat.stepMs ?? 0, Math.max(0, Math.floor(room / (n - 1)))) : beat.stepMs ?? 0;
  return { ...beat, stepMs: step };
}

export interface MotionReport {
  introMs: number;
  microMs: number;
  errors: string[];
  warnings: string[];
}

function morphClashes(beats: readonly MotionBeat[], layerNames: readonly string[]): string[] {
  const morph = new Set(beats.filter((b) => b.preset === MotionPreset.MorphFromCircle).flatMap((b) => targetsOf(b, layerNames)));
  const other = beats.filter((b) => b.preset !== MotionPreset.MorphFromCircle && b.preset !== MotionPreset.Sweep).flatMap((b) => targetsOf(b, layerNames));
  return other.filter((t) => morph.has(t)).map((t) => `layer "${t}" has morph-from-circle and another preset`);
}

/** Checks a motion config: known presets, intro <= 1200 ms (or a named reason), micro <= 300 ms, no morph clash. */
export function validateMotion(config: MotionConfig, layerNames: readonly string[]): MotionReport {
  const introMs = totalMs(config.intro, layerNames);
  const microMs = totalMs(config.micro, layerNames);
  const errors = [
    ...config.intro.filter((b) => !INTRO_PRESETS.includes(b.preset)).map((b) => `unknown intro preset "${b.preset}"`),
    ...config.micro.filter((b) => !MICRO_PRESETS.includes(b.preset)).map((b) => `unknown micro preset "${b.preset}"`),
    ...(config.recipeErrors ?? []),
    ...morphClashes(config.intro, layerNames),
  ];
  const warnings: string[] = [];
  if (introMs > INTRO_CAP_MS) {
    const message = `intro runs ${introMs} ms, cap ${INTRO_CAP_MS} ms`;
    if (config.allowLongIntro !== undefined) {
      warnings.push(`${message} (allowed: ${config.allowLongIntro})`);
    } else {
      errors.push(message);
    }
  }
  if (microMs > MICRO_CAP_MS) {
    errors.push(`micro runs ${microMs} ms, cap ${MICRO_CAP_MS} ms`);
  }
  return { introMs, microMs, errors, warnings };
}

import type { MotionBeat, MotionConfig } from '../core/types';
import { MotionPreset } from './MotionPreset';

export const INTRO_CAP_MS = 1200;
export const MICRO_CAP_MS = 300;
export const EASE = 'cubic-bezier(0.2,0,0,1)';
export const EASE_IN_FIRST = 'cubic-bezier(0,0,0,1)';
export const MARK_TARGET = '@mark';

const SPREAD_BEAT: MotionBeat = { preset: MotionPreset.Spread, durationMs: 300, distance: 1.6 };

/** Default beat for each preset, timed so a four-layer mark stays inside the intro and micro caps. */
export const PRESET_DEFAULTS: Readonly<Partial<Record<MotionPreset, MotionBeat>>> = {
  [MotionPreset.Draw]: { preset: MotionPreset.Draw, durationMs: 700, stepMs: 120 },
  [MotionPreset.Flood]: { preset: MotionPreset.Flood, durationMs: 500, delayMs: 300, stepMs: 80 },
  [MotionPreset.StaggerRise]: { preset: MotionPreset.StaggerRise, durationMs: 600, stepMs: 150, distance: 4 },
  [MotionPreset.ScalePop]: { preset: MotionPreset.ScalePop, durationMs: 500, stepMs: 120 },
  [MotionPreset.Orbit]: { preset: MotionPreset.Orbit, durationMs: 800, stepMs: 100 },
  [MotionPreset.Wipe]: { preset: MotionPreset.Wipe, durationMs: 700, stepMs: 120 },
  [MotionPreset.MorphFromCircle]: { preset: MotionPreset.MorphFromCircle, durationMs: 1200, stops: [0, 40, 100] },
  [MotionPreset.Sweep]: { preset: MotionPreset.Sweep, durationMs: 600, delayMs: 400, stepMs: 60, share: 0.12, width: 2 },
  [MotionPreset.Pulse]: { preset: MotionPreset.Pulse, durationMs: 400, delayMs: 700, layers: [MARK_TARGET], scale: 1.07 },
  [MotionPreset.Spread]: SPREAD_BEAT,
  [MotionPreset.FlyIn]: { preset: MotionPreset.FlyIn, durationMs: 700, stepMs: 120 },
  [MotionPreset.SpinAssemble]: { preset: MotionPreset.SpinAssemble, durationMs: 800, stepMs: 100 },
  [MotionPreset.DropBounce]: { preset: MotionPreset.DropBounce, durationMs: 800, stepMs: 100 },
  [MotionPreset.Flip]: { preset: MotionPreset.Flip, durationMs: 700, stepMs: 120 },
  [MotionPreset.SlamShake]: { preset: MotionPreset.SlamShake, durationMs: 800, layers: [MARK_TARGET] },
};

/** Default hover beat for each micro preset, timed inside the 300 ms micro cap. */
export const MICRO_DEFAULTS: Readonly<Partial<Record<MotionPreset, MotionBeat>>> = {
  [MotionPreset.Spread]: SPREAD_BEAT,
  [MotionPreset.Pulse]: { preset: MotionPreset.Pulse, durationMs: 300, layers: [MARK_TARGET], scale: 1.04 },
  [MotionPreset.Sweep]: { preset: MotionPreset.Sweep, durationMs: 300, share: 0.2, width: 1.5, colour: 'text' },
};

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  intro: [{ preset: MotionPreset.StaggerRise, durationMs: 600, stepMs: 150, distance: 4 }],
  micro: [{ preset: MotionPreset.Spread, durationMs: 300, distance: 1.6, easing: EASE }],
};

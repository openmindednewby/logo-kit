export const enum MotionPreset {
  Draw = 'draw',
  Flood = 'flood',
  StaggerRise = 'stagger-rise',
  ScalePop = 'scale-pop',
  Orbit = 'orbit',
  Wipe = 'wipe',
  MorphFromCircle = 'morph-from-circle',
  Sweep = 'sweep',
  Pulse = 'pulse',
  Spread = 'spread',
}

export const INTRO_PRESETS: readonly MotionPreset[] = [
  MotionPreset.Draw,
  MotionPreset.Flood,
  MotionPreset.StaggerRise,
  MotionPreset.ScalePop,
  MotionPreset.Orbit,
  MotionPreset.Wipe,
  MotionPreset.MorphFromCircle,
  MotionPreset.Sweep,
  MotionPreset.Pulse,
];

export const MICRO_PRESETS: readonly MotionPreset[] = [MotionPreset.Spread, MotionPreset.Pulse];

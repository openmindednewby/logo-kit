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
  FlyIn = 'fly-in',
  SpinAssemble = 'spin-assemble',
  DropBounce = 'drop-bounce',
  Flip = 'flip',
  SlamShake = 'slam-shake',
}

export const BOLD_PRESETS: readonly MotionPreset[] = [
  MotionPreset.FlyIn,
  MotionPreset.SpinAssemble,
  MotionPreset.DropBounce,
  MotionPreset.Flip,
  MotionPreset.SlamShake,
];

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
  ...BOLD_PRESETS,
];

export const MICRO_PRESETS: readonly MotionPreset[] = [MotionPreset.Spread, MotionPreset.Pulse, MotionPreset.Sweep];

import { RasterIdle } from './RasterIdle';
import { RasterLayer } from './RasterLayer';
import { RasterMicro } from './RasterMicro';
import { drift, RASTER_EASE, sweep, swell } from './rasterSpec';
import type { RasterSpec } from './rasterSpec';

const { out } = RASTER_EASE;

export const RASTER_MICRO_SPECS: Readonly<Record<string, RasterSpec>> = {
  [RasterMicro.Pulse]: { anims: [{ layer: RasterLayer.Nod, frames: '0%,100%{transform:none}45%{transform:scale(1.04)}', ms: 240, ease: out }] },
  [RasterMicro.Glint]: { anims: [sweep(RasterLayer.M0, { width: 0.35, opacity: 0.9 }, 280, 0)] },
  [RasterMicro.Nudge]: { anims: [{ layer: RasterLayer.Nod, frames: '0%,100%{transform:none}45%{transform:translateY(-4px)}', ms: 200, ease: out }] },
  [RasterMicro.UnderlineDraw]: { anims: [{ layer: RasterLayer.Line, frames: 'from{transform:scaleX(0)}to{transform:scaleX(1)}', ms: 260, ease: out }] },
};

export const RASTER_IDLE_SPECS: Readonly<Record<string, RasterSpec>> = {
  [RasterIdle.SlowGlint]: { periodMs: 7000, anims: [drift(RasterLayer.I0, { width: 0.17, opacity: 0.85 }, 7000, [0, 11])] },
  [RasterIdle.GlowBreathe]: { periodMs: 6000, anims: [swell(RasterLayer.Haze, 'opacity:0', 'opacity:.3', 6000)] },
  [RasterIdle.SheenDrift]: { periodMs: 8000, anims: [drift(RasterLayer.I0, { width: 0.8, opacity: 0.35 }, 8000, [0, 45])] },
  [RasterIdle.SoftLift]: {
    periodMs: 6500,
    anims: [swell(RasterLayer.Lift, 'transform:none', 'transform:scale(1.018)', 6500), swell(RasterLayer.Haze, 'opacity:0', 'opacity:.14', 6500)],
  },
  [RasterIdle.TwinShimmer]: {
    periodMs: 8000,
    anims: [drift(RasterLayer.I0, { width: 0.11, opacity: 0.7 }, 8000, [0, 8]), drift(RasterLayer.I1, { width: 0.11, opacity: 0.7 }, 8000, [4, 12])],
  },
};

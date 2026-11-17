export const enum RasterIdle {
  SlowGlint = 'slow-glint',
  GlowBreathe = 'glow-breathe',
  SheenDrift = 'sheen-drift',
  SoftLift = 'soft-lift',
  TwinShimmer = 'twin-shimmer',
}

export const RASTER_IDLES: readonly RasterIdle[] = [RasterIdle.SlowGlint, RasterIdle.GlowBreathe, RasterIdle.SheenDrift, RasterIdle.SoftLift, RasterIdle.TwinShimmer];

export const RASTER_LOOP_MIN_MS = 6000;
export const RASTER_LOOP_MAX_MS = 8000;

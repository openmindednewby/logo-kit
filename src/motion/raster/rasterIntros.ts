import { RasterIntro } from './RasterIntro';
import { RasterLayer } from './RasterLayer';
import { FADE_IN, RASTER_EASE, sweep } from './rasterSpec';
import type { RasterSpec } from './rasterSpec';

const { out, spring, inOut } = RASTER_EASE;
const CENTRED = 'translate(-50%,-50%)';
const SPARK = '0%{opacity:0;transform:translate(0,0) scale(.4)}20%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1)}';

export const RASTER_INTRO_SPECS: Readonly<Record<string, RasterSpec>> = {
  [RasterIntro.FadeUp]: { anims: [{ layer: RasterLayer.Img, frames: 'from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}', ms: 600, ease: out }] },
  [RasterIntro.ScaleSettle]: { anims: [{ layer: RasterLayer.Img, frames: 'from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}', ms: 700, ease: spring }] },
  [RasterIntro.MaskWipe]: { anims: [{ layer: RasterLayer.Img, frames: 'from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}', ms: 800, ease: inOut }] },
  [RasterIntro.LightSweep]: {
    anims: [{ layer: RasterLayer.Img, frames: FADE_IN, ms: 350, ease: out }, sweep(RasterLayer.S0, { width: 0.35, opacity: 0.9 }, 750, 350)],
  },
  [RasterIntro.FocusIn]: { anims: [{ layer: RasterLayer.Img, frames: 'from{opacity:0;filter:blur(10px)}to{opacity:1;filter:blur(0)}', ms: 700, ease: out }] },
  [RasterIntro.GlowSweep]: {
    anims: [
      { layer: RasterLayer.Img, frames: FADE_IN, ms: 300, ease: out },
      { layer: RasterLayer.Glow, frames: '0%,100%{opacity:0}55%{opacity:.85}', ms: 800, delayMs: 300, ease: inOut },
      { layer: RasterLayer.In, frames: '0%,100%{transform:none}55%{transform:scale(1.025)}', ms: 800, delayMs: 300, ease: inOut },
      sweep(RasterLayer.S0, { width: 0.55, opacity: 1 }, 700, 300),
    ],
  },
  [RasterIntro.PunchSweep]: {
    anims: [
      { layer: RasterLayer.In, frames: '0%{opacity:0;transform:scale(.6)}55%{opacity:1;transform:scale(1.08)}78%{transform:scale(.98)}100%{opacity:1;transform:none}', ms: 600, ease: out },
      sweep(RasterLayer.S0, { width: 0.4, opacity: 0.95 }, 520, 600),
    ],
  },
  [RasterIntro.DoubleSweep]: {
    anims: [
      { layer: RasterLayer.Img, frames: FADE_IN, ms: 260, ease: out },
      sweep(RasterLayer.S0, { width: 0.13, opacity: 1 }, 330, 220),
      sweep(RasterLayer.S1, { width: 0.6, opacity: 0.95 }, 580, 560),
    ],
  },
  [RasterIntro.BurstSettle]: {
    anims: [
      { layer: RasterLayer.In, frames: '0%{opacity:0;transform:scale(1.25)}100%{opacity:1;transform:none}', ms: 650, ease: spring },
      { layer: RasterLayer.Ring, frames: `0%{opacity:.9;transform:${CENTRED} scale(.3)}100%{opacity:0;transform:${CENTRED} scale(2.1)}`, ms: 650, delayMs: 60, ease: out },
      { layer: RasterLayer.Rays, frames: `0%{opacity:0;transform:${CENTRED} scale(.4)}25%{opacity:.75}100%{opacity:0;transform:${CENTRED} scale(1.25)}`, ms: 600, delayMs: 40, ease: out },
      { layer: RasterLayer.Spark, frames: SPARK, ms: 720, delayMs: 120, stepMs: 40, ease: out },
      sweep(RasterLayer.S0, { width: 0.4, opacity: 0.95 }, 480, 660),
    ],
  },
  [RasterIntro.TiltSweep]: {
    anims: [
      { layer: RasterLayer.In, frames: '0%{opacity:0;transform:translateY(10px) scaleX(.2) skewY(-16deg)}45%{opacity:1}65%{transform:scaleX(1.05) skewY(2deg)}100%{opacity:1;transform:none}', ms: 620, ease: out },
      { layer: RasterLayer.Shadow, frames: '0%{opacity:0;transform:scaleX(.3)}60%{opacity:.22;transform:scaleX(1.1)}100%{opacity:0;transform:none}', ms: 900, ease: out },
      sweep(RasterLayer.S0, { width: 0.45, opacity: 0.95 }, 520, 620),
    ],
  },
};

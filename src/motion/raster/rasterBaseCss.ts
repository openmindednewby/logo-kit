export interface RasterOptions {
  prefix?: string;
  glowColour?: string;
  bandColour?: string;
  shadowColour?: string;
  idleStartMs?: number;
}

export const RASTER_PREFIX = 'lkr';

const MASK = (p: string): string => `-webkit-mask:var(--${p}-src) center/100% 100% no-repeat;mask:var(--${p}-src) center/100% 100% no-repeat`;

function layoutCss(p: string): string {
  return `.${p}{position:relative;display:inline-block;line-height:0;vertical-align:middle}`
    + `.${p}-img{display:block;max-width:100%;height:auto}`
    + `.${p}-lift,.${p}-nod,.${p}-in{position:relative;display:block;transform-origin:center}`
    + `.${p}-fx{position:absolute;inset:0;pointer-events:none}`
    + `.${p}-glow,.${p}-haze{opacity:0;filter:blur(7px)}`
    + `.${p}-tint{position:absolute;inset:0;background:var(--${p}-glow);${MASK(p)}}`
    + `.${p}-sheen{overflow:hidden;${MASK(p)}}`
    + `.${p}-band{position:absolute;top:0;bottom:0;left:-100%;width:0;background:linear-gradient(90deg,transparent,var(--${p}-band) 50%,transparent)}`;
}

function burstCss(p: string): string {
  const centred = 'position:absolute;left:50%;top:50%;aspect-ratio:1;border-radius:50%;opacity:0;transform:translate(-50%,-50%)';
  const ring = 'radial-gradient(closest-side,transparent 52%,black 54%,black 96%,transparent 100%)';
  return `.${p}-ring{${centred};height:140%;box-sizing:border-box;border:3px solid var(--${p}-glow)}`
    + `.${p}-rays{${centred};height:230%;background:repeating-conic-gradient(var(--${p}-glow) 0 3deg,transparent 3deg 22.5deg);-webkit-mask:${ring};mask:${ring}}`
    + `.${p}-spark{position:absolute;inset:0;opacity:0}`
    + `.${p}-spark::after{content:"";position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--${p}-glow)}`
    + `.${p}-shadow{position:absolute;left:8%;width:84%;top:calc(100% + 5px);height:10px;border-radius:50%;background:var(--${p}-shadow);opacity:0}`
    + `.${p}-line{position:absolute;left:0;width:100%;top:calc(100% + 6px);height:3px;border-radius:1.5px;background:var(--${p}-glow);transform:scaleX(0);transform-origin:left center}`;
}

/** Returns the still layout of the raster logo layers, the hidden-tab pause and the reduced-motion rule. */
export function rasterBaseCss(options: RasterOptions = {}): string {
  const p = options.prefix ?? RASTER_PREFIX;
  const vars = `.${p}{--${p}-glow:${options.glowColour ?? 'currentColor'};--${p}-band:${options.bandColour ?? 'white'};--${p}-shadow:${options.shadowColour ?? 'currentColor'}}`;
  const paused = `.${p}-paused,.${p}-paused *,.${p}-paused *::after{animation-play-state:paused!important}`;
  const reduced = `@media (prefers-reduced-motion:reduce){.${p},.${p} *,.${p} *::after{animation:none!important}}`;
  return vars + layoutCss(p) + burstCss(p) + paused + reduced;
}

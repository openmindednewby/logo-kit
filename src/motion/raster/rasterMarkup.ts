import { RASTER_PREFIX } from './rasterBaseCss';
import { SPARK_COUNT, SPARK_GROUPS } from './rasterSpec';

export interface RasterMarkupOptions {
  prefix?: string;
  width?: string;
}

const PERCENT = 100;
const HEX = 16;
const SPARK_TURN = 0.3;
const SPARK_NEAR = 0.48;
const SPARK_FAR = 0.62;
const SPARK_HEIGHT = 1.25;
const BANDS = ['s0', 's1', 'i0', 'i1', 'm0'];

const attr = (v: string): string => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cssUrl = (v: string): string => v.replace(/["'()\\\s]/g, (c) => `%${c.charCodeAt(0).toString(HEX).toUpperCase().padStart(2, '0')}`);
const n = (v: number): string => String(Number(v.toFixed(1)));

function sparks(p: string): string {
  return Array.from({ length: SPARK_COUNT }, (_, i) => {
    const a = (i / SPARK_COUNT) * Math.PI * 2 + SPARK_TURN;
    const r = i % 2 ? SPARK_FAR : SPARK_NEAR;
    const style = `--dx:${n(Math.cos(a) * r * PERCENT)}%;--dy:${n(Math.sin(a) * SPARK_HEIGHT * PERCENT)}%;--k:${i % SPARK_GROUPS}`;
    return `<span class="${p}-spark" style="${style}"></span>`;
  }).join('');
}

/** Returns the HTML of a raster logo with every motion layer; all overlays stay hidden until a play class is set. */
export function rasterMarkup(src: string, alt: string, options: RasterMarkupOptions = {}): string {
  const p = options.prefix ?? RASTER_PREFIX;
  const size = options.width !== undefined ? `;width:${options.width}` : '';
  const band = (k: string): string => `<span class="${p}-band ${p}-${k}"></span>`;
  const glow = (k: string): string => `<span class="${p}-fx ${p}-${k}"><span class="${p}-tint"></span></span>`;
  const img = `<span class="${p}-lift"><span class="${p}-nod"><span class="${p}-in"><img class="${p}-img" src="${attr(src)}" alt="${attr(alt)}"></span></span></span>`;
  const burst = `<span class="${p}-fx"><span class="${p}-ring"></span><span class="${p}-rays"></span>${sparks(p)}</span>`;
  const sheen = `<span class="${p}-fx ${p}-sheen">${BANDS.map(band).join('')}</span>`;
  const host = attr(`--${p}-src:url("${cssUrl(src)}")${size}`);
  return `<span class="${p}" style="${host}">${glow('glow')}${glow('haze')}${burst}<span class="${p}-shadow"></span>${img}${sheen}<span class="${p}-line"></span></span>`;
}

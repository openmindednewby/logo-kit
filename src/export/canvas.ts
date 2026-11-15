import { Mode } from '../core/Mode';
import { escapeXml } from '../core/num';
import { placeMark } from '../core/svg';
import type { Brand } from '../core/types';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Returns a w x h canvas with a background and the mark centred at a share of the shorter side. */
export function iconCanvas(brand: Brand, mode: Mode, size: { w: number; h: number }, share: number, background: string | null, radius = 0): string {
  const side = Math.min(size.w, size.h) * share;
  const r = Math.min(size.w, size.h) * radius;
  const bg = background !== null ? `<rect width="${size.w}" height="${size.h}" rx="${r}" fill="${background}"/>` : '';
  const mark = placeMark(brand.mark, brand.palette, mode, { x: (size.w - side) / 2, y: (size.h - side) / 2, size: side });
  return `<svg xmlns="${SVG_NS}" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">${bg}${mark}</svg>`;
}

const TEXT_SHARE = 0.3;

/** Returns the favicon: the brand's small mark when it has one (light and dark by colour scheme), else the full mark. */
export function faviconSvg(brand: Brand, size: number): string | null {
  const sm = brand.smallMark;
  if (!sm) {
    return null;
  }
  const name = escapeXml(brand.name);
  const style = `<style>path{fill:${sm.light}}@media (prefers-color-scheme:dark){path{fill:${sm.dark}}}</style>`;
  return `<svg xmlns="${SVG_NS}" viewBox="${sm.viewBox}" width="${size}" height="${size}" role="img" aria-label="${name}"><title>${name}</title>${style}<path d="${sm.d}"/></svg>`;
}

/** Returns a horizontal lockup (mark plus name) of a given height; the width follows the name length. */
export function lockupSvg(brand: Brand, mode: Mode, height: number): { svg: string; width: number } {
  const colours = mode === Mode.Dark ? brand.palette.dark : brand.palette.light;
  const gap = Math.round(height * 1.15);
  const width = Math.round(gap + brand.name.length * height * TEXT_SHARE);
  const name = escapeXml(brand.name);
  const text = `<text x="${gap}" y="${Math.round(height * 0.66)}" font-family="${escapeXml(brand.wordmark.fontFamily)}" font-size="${Math.round(height * 0.5)}" font-weight="700" fill="${colours['text'] ?? '#000000'}">${name}</text>`;
  const svg = `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${name}"><title>${name}</title>${placeMark(brand.mark, brand.palette, mode, { x: 0, y: 0, size: height })}${text}</svg>`;
  return { svg, width };
}

/** Returns a social card: background, mark on the left, name on the right. */
export function cardSvg(brand: Brand, mode: Mode, size: { w: number; h: number }): string {
  const colours = mode === Mode.Dark ? brand.palette.dark : brand.palette.light;
  const side = Math.round(size.h * 0.56);
  const x = Math.round(size.w * 0.1);
  const y = Math.round((size.h - side) / 2);
  const name = escapeXml(brand.name);
  const text = `<text x="${x + side + Math.round(side * 0.2)}" y="${Math.round(size.h / 2 + side * 0.1)}" font-family="${escapeXml(brand.wordmark.fontFamily)}" font-size="${Math.round(side * 0.22)}" font-weight="700" fill="${colours['text'] ?? '#000000'}">${name}</text>`;
  return `<svg xmlns="${SVG_NS}" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}"><rect width="${size.w}" height="${size.h}" fill="${colours['background'] ?? '#ffffff'}"/>${placeMark(brand.mark, brand.palette, mode, { x, y, size: side })}${text}</svg>`;
}

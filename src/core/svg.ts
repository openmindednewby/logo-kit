import { Mode } from './Mode';
import { escapeXml } from './num';
import type { Mark, MarkLayer, ModeColours, PaintItem, Palette } from './types';

export interface MarkSvgOptions {
  label: string;
  size?: number;
  style?: string;
  overlay?: string;
  drawLayers?: ReadonlySet<string>;
  colourOverride?: string;
  microWrap?: boolean;
}

const DEFAULT_SIZE = 256;

const colourOf = (colours: ModeColours, role: string, override?: string): string => {
  if (override !== undefined) {
    return override;
  }
  const hex = colours[role];
  if (hex === undefined) {
    throw new Error(`palette has no colour for role "${role}"`);
  }
  return hex;
};

function paintAttrs(item: PaintItem, colours: ModeColours, override?: string): string {
  const fill = item.fill !== undefined ? colourOf(colours, item.fill, override) : 'none';
  const stroke = item.stroke !== undefined ? ` stroke="${colourOf(colours, item.stroke, override)}" stroke-width="${item.width ?? 1}"` : '';
  return `fill="${fill}"${stroke}`;
}

/** Returns the SVG for one layer: a path, or a group of paths when the layer has several paint items. */
export function layerSvg(layer: MarkLayer, index: number, colours: ModeColours, mode: Mode, opts: Pick<MarkSvgOptions, 'drawLayers' | 'colourOverride' | 'microWrap'> = {}): string {
  const items = mode === Mode.Dark ? layer.paint.dark : layer.paint.light;
  const rule = layer.evenOdd === true ? ' fill-rule="evenodd"' : '';
  const len = opts.drawLayers?.has(layer.name) === true ? ' pathLength="1"' : '';
  const path = (item: PaintItem, head: string): string => `<path${head} ${paintAttrs(item, colours, opts.colourOverride)}${rule}${len} d="${layer.d}"/>`;
  const head = ` id="mark-${layer.name}" class="l${index}"`;
  const body = items.length === 1 && items[0] ? path(items[0], head) : `<g${head}>${items.map((item) => path(item, '')).join('')}</g>`;
  const wrapped = opts.microWrap === true ? `<g class="lkm${index}">${body}</g>` : body;
  return layer.transform !== undefined ? `<g transform="${layer.transform}">${wrapped}</g>` : wrapped;
}

/** Returns the layers of a mark as SVG markup inside a group with id "mark". */
export function markBody(mark: Mark, palette: Palette, mode: Mode, opts: Pick<MarkSvgOptions, 'drawLayers' | 'colourOverride' | 'microWrap'> = {}): string {
  const colours = mode === Mode.Dark ? palette.dark : palette.light;
  const layers = mark.layers.map((layer, i) => layerSvg(layer, i, colours, mode, opts)).join('');
  const body = opts.microWrap === true ? '<g class="lkmm">'.concat(layers, '</g>') : layers;
  return `<g id="mark">${body}</g>`;
}

/** Returns a standalone SVG of the mark in one mode, with optional motion style and overlay. */
export function markSvg(mark: Mark, palette: Palette, mode: Mode, opts: MarkSvgOptions): string {
  const size = opts.size ?? DEFAULT_SIZE;
  const label = escapeXml(opts.label);
  const style = opts.style !== undefined ? `<style>${opts.style}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}" width="${size}" height="${size}" role="img" aria-label="${label}"><title>${label}</title>${style}${markBody(mark, palette, mode, opts)}${opts.overlay ?? ''}</svg>`;
}

/** Returns the larger side of the mark's viewBox. */
export function markSizeOf(mark: Mark): number {
  const vb = viewBoxOf(mark);
  return Math.max(vb.w, vb.h);
}

/** Returns the mark's viewBox as numbers. */
export function viewBoxOf(mark: Mark): { x: number; y: number; w: number; h: number } {
  const [x = 0, y = 0, w = 1, h = 1] = mark.viewBox.trim().split(/[\s,]+/).map(Number);
  return { x, y, w, h };
}

/** Returns the mark nested at a box inside a larger SVG canvas. */
export function placeMark(mark: Mark, palette: Palette, mode: Mode, box: { x: number; y: number; size: number }): string {
  return `<svg x="${box.x}" y="${box.y}" width="${box.size}" height="${box.size}" viewBox="${mark.viewBox}">${markBody(mark, palette, mode)}</svg>`;
}

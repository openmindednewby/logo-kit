import { contrastRatio } from '@dloizides/design-tokens';

import { CvdKind } from './CvdKind';

type Rgb = [number, number, number];
type Matrix = readonly [Rgb, Rgb, Rgb];

const MACHADO: Readonly<Record<CvdKind, Matrix>> = {
  [CvdKind.Protan]: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  [CvdKind.Deutan]: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  [CvdKind.Tritan]: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MAX = 255;
const GAMMA_KNEE = 0.04045;
const LINEAR_KNEE = 0.0031308;
const LAB_KNEE = 0.008856;

/** Returns the 0-255 channels of a #rgb or #rrggbb colour. */
export function hexToRgb(hex: string): Rgb {
  const match = HEX.exec(hex.trim());
  if (!match?.[1]) {
    throw new Error(`not a hex colour: ${hex}`);
  }
  const raw = match[1].length === 3 ? match[1].split('').map((c) => c + c).join('') : match[1];
  return [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16)) as Rgb;
}

/** Returns #rrggbb for 0-255 channels. */
export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(Math.min(MAX, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`;
}

const toLinear = (c: number): number => {
  const s = c / MAX;
  return s <= GAMMA_KNEE ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (l: number): number => {
  const v = Math.min(1, Math.max(0, l));
  return MAX * (v <= LINEAR_KNEE ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
};

/** Returns the colour as a viewer with full protan, deutan or tritan colour blindness sees it (Machado 2009). */
export function simulateCvd(hex: string, kind: CvdKind): string {
  const lin = hexToRgb(hex).map(toLinear);
  const out = MACHADO[kind].map((row) => row[0] * (lin[0] ?? 0) + row[1] * (lin[1] ?? 0) + row[2] * (lin[2] ?? 0));
  return rgbToHex(out.map(fromLinear) as Rgb);
}

function toLab(hex: string): Rgb {
  const [r, g, b] = hexToRgb(hex).map(toLinear) as Rgb;
  const xyz = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883];
  const f = (t: number): number => (t > LAB_KNEE ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = xyz.map(f) as Rgb;
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Returns the CIE76 colour difference of two colours. */
export function deltaE(a: string, b: string): number {
  const la = toLab(a);
  const lb = toLab(b);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** Returns the WCAG contrast ratio of two colours. */
export function contrast(a: string, b: string): number {
  return contrastRatio(a, b);
}

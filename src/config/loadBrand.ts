import fs from 'node:fs';
import path from 'node:path';

import type { Brand, IconStyle, LayerPaint, MarkLayer, Palette, SmallMark } from '../core/types';
import { markSizeOf } from '../core/svg';
import { resolveMotion } from '../motion/resolveMotion';
import type { RawMotion } from '../motion/resolveMotion';
import { resolveToken } from './tokens';

interface RawLayer {
  name: string;
  d: string;
  role?: string;
  paint?: LayerPaint;
  transform?: string;
  evenOdd?: boolean;
}

interface RawBrand {
  name: string;
  slug: string;
  tokens?: string;
  wordmark?: { fontFamily: string; fontFile?: string };
  mark: { viewBox: string; layers: RawLayer[] };
  palette: { light: Record<string, string>; dark: Record<string, string>; mono?: string };
  motion?: RawMotion;
  generate?: { seed: number; count: number };
  icons?: Partial<IconStyle>;
  smallMark?: SmallMark;
}

const DEFAULT_ICONS: IconStyle = { dark: true, share: 0.66, radius: 0.2 };

const DEFAULT_FONT = 'Hanken Grotesk, Arial, sans-serif';
const DEFAULT_GENERATE = { seed: 1, count: 200 };

function toLayer(raw: RawLayer): MarkLayer {
  const paint = raw.paint ?? (raw.role !== undefined ? { light: [{ fill: raw.role }], dark: [{ fill: raw.role }] } : undefined);
  if (!paint) {
    throw new Error(`layer "${raw.name}" needs "role" or "paint"`);
  }
  return { name: raw.name, d: raw.d, paint, ...(raw.transform !== undefined ? { transform: raw.transform } : {}), ...(raw.evenOdd === true ? { evenOdd: true } : {}) };
}

const resolveAll = (refs: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(refs).map(([role, ref]) => [role, resolveToken(ref)]));

function toPalette(raw: RawBrand['palette'], name: string): Palette {
  const light = resolveAll(raw.light);
  const dark = resolveAll(raw.dark);
  const mono = raw.mono !== undefined ? resolveToken(raw.mono) : (light['text'] ?? '#000000');
  return { name, light, dark, mono };
}

/** Returns the brand from a parsed brand.json object, token references resolved to colours. */
export function parseBrand(raw: RawBrand, baseDir: string): Brand {
  const firstRef = Object.values(raw.palette.light).find((ref) => !ref.startsWith('#'));
  const small = raw.smallMark;
  const mark = { id: raw.slug, viewBox: raw.mark.viewBox, layers: raw.mark.layers.map(toLayer) };
  return {
    icons: { ...DEFAULT_ICONS, ...raw.icons },
    ...(small ? { smallMark: { ...small, light: resolveToken(small.light), dark: resolveToken(small.dark) } } : {}),
    name: raw.name,
    slug: raw.slug,
    wordmark: raw.wordmark ?? { fontFamily: DEFAULT_FONT },
    mark,
    palette: toPalette(raw.palette, raw.slug),
    motion: resolveMotion(raw.motion, raw.mark.layers.map((l) => l.name), markSizeOf(mark)),
    generate: raw.generate ?? DEFAULT_GENERATE,
    tokens: raw.tokens ?? firstRef?.split('.')[0] ?? 'flier',
    baseDir,
  };
}

/** Reads and parses a brand.json file. */
export function loadBrand(file: string): Brand {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as RawBrand;
  return parseBrand(raw, path.dirname(path.resolve(file)));
}

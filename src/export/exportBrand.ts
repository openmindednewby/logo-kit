import fs from 'node:fs';
import path from 'node:path';

import { Mode } from '../core/Mode';
import { buildIco, pngSize, renderPng } from '../core/raster';
import { markSvg } from '../core/svg';
import type { Brand } from '../core/types';
import { animatedSvg, introSvg, microSvg } from '../motion/motionSvg';
import { validateMotion } from '../motion/timeline';
import { cardSvg, iconCanvas, lockupSvg } from './canvas';
import { geometryModule } from './geometryModule';

export interface ExportedFile {
  file: string;
  width: number;
  height: number;
}

const MARK_SIZE = 256;
const FAVICON = 32;
const ICO_SIZES = [16, 32, 48];
const HEADERS: readonly [number, number][] = [[360, 40], [1280, 56]];
const ICONS: readonly [string, number, number][] = [['apple-touch-icon.png', 180, 0.8], ['icon-192.png', 192, 0.8], ['icon-512.png', 512, 0.8], ['icon-512-maskable.png', 512, 0.6]];

function writer(brand: Brand, outDir: string): { svg: (f: string, s: string, w: number, h: number) => void; png: (f: string, s: string, w: number) => void; files: ExportedFile[] } {
  const files: ExportedFile[] = [];
  const fonts = brand.wordmark.fontFile !== undefined ? [path.resolve(brand.baseDir, brand.wordmark.fontFile)] : [];
  fs.mkdirSync(outDir, { recursive: true });
  return {
    files,
    svg: (file, body, width, height): void => {
      fs.writeFileSync(path.join(outDir, file), body);
      files.push({ file, width, height });
    },
    png: (file, body, width): void => {
      const png = renderPng(body, width, fonts);
      fs.writeFileSync(path.join(outDir, file), png);
      files.push({ file, ...pngSize(png) });
    },
  };
}

function writeMarks(brand: Brand, w: ReturnType<typeof writer>): void {
  const opts = { label: brand.name, size: MARK_SIZE };
  w.svg('mark.svg', markSvg(brand.mark, brand.palette, Mode.Light, opts), MARK_SIZE, MARK_SIZE);
  w.svg('mark-dark.svg', markSvg(brand.mark, brand.palette, Mode.Dark, opts), MARK_SIZE, MARK_SIZE);
  w.svg('mark-mono.svg', markSvg(brand.mark, brand.palette, Mode.Light, { ...opts, colourOverride: brand.palette.mono }), MARK_SIZE, MARK_SIZE);
  w.svg('mark-reversed.svg', markSvg(brand.mark, brand.palette, Mode.Dark, { ...opts, colourOverride: brand.palette.light['background'] ?? '#ffffff' }), MARK_SIZE, MARK_SIZE);
  w.svg('favicon.svg', markSvg(brand.mark, brand.palette, Mode.Light, { label: brand.name, size: FAVICON }), FAVICON, FAVICON);
}

function writeMotion(brand: Brand, w: ReturnType<typeof writer>): void {
  for (const mode of [Mode.Light, Mode.Dark]) {
    w.svg(`intro-${mode}.svg`, introSvg(brand.mark, brand.palette, mode, brand.motion.intro, { label: `${brand.name}, intro`, size: MARK_SIZE }), MARK_SIZE, MARK_SIZE);
    w.svg(`micro-${mode}.svg`, microSvg(brand.mark, brand.palette, mode, brand.motion.micro, { label: `${brand.name}, hover`, size: MARK_SIZE }), MARK_SIZE, MARK_SIZE);
  }
  w.svg('mark-animated.svg', animatedSvg(brand.mark, brand.palette, Mode.Light, brand.motion, { label: brand.name, size: MARK_SIZE }), MARK_SIZE, MARK_SIZE);
}

function writeRasters(brand: Brand, w: ReturnType<typeof writer>, outDir: string): void {
  const bgLight = brand.palette.light['background'] ?? '#ffffff';
  for (const [file, size, share] of ICONS) {
    w.png(file, iconCanvas(brand, Mode.Light, { w: size, h: size }, share, bgLight), size);
  }
  const icoPngs = ICO_SIZES.map((s) => renderPng(iconCanvas(brand, Mode.Light, { w: s, h: s }, 1, null), s));
  fs.writeFileSync(path.join(outDir, 'favicon.ico'), buildIco(icoPngs));
  w.files.push({ file: 'favicon.ico', width: Math.max(...ICO_SIZES), height: Math.max(...ICO_SIZES) });
  w.png('og.png', cardSvg(brand, Mode.Dark, { w: 1200, h: 630 }), 1200);
  w.png('landing-card.png', cardSvg(brand, Mode.Light, { w: 640, h: 400 }), 640);
}

/** Writes every asset of a brand into outDir and returns each file with its real pixel size; throws on a motion error. */
export function exportBrand(brand: Brand, outDir: string): ExportedFile[] {
  const report = validateMotion(brand.motion, brand.mark.layers.map((l) => l.name));
  if (report.errors.length > 0) {
    throw new Error(`motion: ${report.errors.join('; ')}`);
  }
  const w = writer(brand, outDir);
  writeMarks(brand, w);
  writeMotion(brand, w);
  writeRasters(brand, w, outDir);
  for (const [vw, h] of HEADERS) {
    for (const mode of [Mode.Light, Mode.Dark]) {
      const lockup = lockupSvg(brand, mode, h);
      w.svg(`header-${mode}-${vw}.svg`, lockup.svg, lockup.width, h);
    }
  }
  const moduleDir = path.join(outDir, `brand-${brand.slug}`);
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, 'markGeometry.ts'), geometryModule(brand.mark));
  w.files.push({ file: `brand-${brand.slug}/markGeometry.ts`, width: 0, height: 0 });
  return w.files;
}

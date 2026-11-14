import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { runCli } from '../cliMain';
import { loadBrand } from '../config/loadBrand';
import { pngSize } from '../core/raster';
import { FINREG, MOONCUBE, readRoot, tmpDir } from '../testing/paths';
import { exportBrand } from './exportBrand';
import { geometryModule } from './geometryModule';

const EXPECTED: readonly [string, number, number][] = [
  ['favicon.svg', 32, 32],
  ['favicon.ico', 48, 48],
  ['apple-touch-icon.png', 180, 180],
  ['icon-192.png', 192, 192],
  ['icon-512.png', 512, 512],
  ['icon-512-maskable.png', 512, 512],
  ['og.png', 1200, 630],
  ['landing-card.png', 640, 400],
  ['intro-light.svg', 256, 256],
  ['intro-dark.svg', 256, 256],
  ['micro-light.svg', 256, 256],
  ['micro-dark.svg', 256, 256],
];
const HEADERS = ['header-light-360.svg', 'header-dark-360.svg', 'header-light-1280.svg', 'header-dark-1280.svg'];

const svgSize = (file: string): [number, number] => {
  const head = /<svg[^>]*>/.exec(fs.readFileSync(file, 'utf8'))?.[0] ?? '';
  return [Number(/ width="(\d+)"/.exec(head)?.[1]), Number(/ height="(\d+)"/.exec(head)?.[1])];
};
const sizeOf = (file: string): [number, number] => {
  if (file.endsWith('.png')) {
    const s = pngSize(fs.readFileSync(file));
    return [s.width, s.height];
  }
  if (file.endsWith('.ico')) {
    const buf = fs.readFileSync(file);
    return [buf.readUInt8(6 + 16 * (buf.readUInt16LE(4) - 1)), buf.readUInt8(7 + 16 * (buf.readUInt16LE(4) - 1))];
  }
  return svgSize(file);
};

describe('exportBrand', () => {
  it('with the Moon Cube brand, writes every asset at its real pixel size', () => {
    const out = tmpDir('export');

    exportBrand(loadBrand(MOONCUBE), out);

    expect(EXPECTED.map(([f]) => [f, ...sizeOf(path.join(out, f))])).toEqual(EXPECTED.map((e) => [...e]));
    expect(HEADERS.map((f) => sizeOf(path.join(out, f))[1])).toEqual([40, 40, 56, 56]);
  });

  it('with the FinReg brand, writes the same set', () => {
    const out = tmpDir('export');

    const files = exportBrand(loadBrand(FINREG), out).map((f) => f.file);

    expect(files).toEqual(expect.arrayContaining([...EXPECTED.map(([f]) => f), ...HEADERS, 'brand-finreg/markGeometry.ts']));
  });
});

describe('runCli', () => {
  it('with export and a brand.json, exits 0 and lists the files', () => {
    const out = tmpDir('cli');
    const lines: string[] = [];

    const code = runCli(['export', MOONCUBE, '--out', out], (l) => lines.push(l));

    expect(code).toBe(0);
    expect(lines).toContain('og.png 1200x630');
  });

  it('with no brand file, prints usage and exits 2', () => {
    const lines: string[] = [];

    const code = runCli(['export'], (l) => lines.push(l));

    expect([code, lines[0]?.startsWith('usage:')]).toEqual([2, true]);
  });
});

describe('geometryModule', () => {
  it('with the Moon Cube brand, emits the brand-mooncube markGeometry.ts byte for byte', () => {
    const expected = readRoot('fixtures', 'mooncube', 'markGeometry.ts.txt').replace(/\r\n/g, '\n');

    const source = geometryModule(loadBrand(MOONCUBE).mark);

    expect(source).toBe(expected);
  });
});

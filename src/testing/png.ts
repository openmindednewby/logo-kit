import fs from 'node:fs';
import zlib from 'node:zlib';

import type { Bitmap } from '../core/raster';

const CHANNELS: Readonly<Record<number, number>> = { 2: 3, 6: 4 };
const SIGNATURE = 8;

function paeth(a: number, b: number, c: number): number {
  const pa = Math.abs(b - c);
  const pb = Math.abs(a - c);
  const pc = Math.abs(a + b - 2 * c);
  if (pa <= pb && pa <= pc) {
    return a;
  }
  return pb <= pc ? b : c;
}

function unfilter(filter: number, line: Uint8Array, prev: Uint8Array, ch: number): void {
  for (let x = 0; x < line.length; x++) {
    const a = x >= ch ? (line[x - ch] ?? 0) : 0;
    const b = prev[x] ?? 0;
    const c = x >= ch ? (prev[x - ch] ?? 0) : 0;
    const add = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter] ?? 0;
    line[x] = ((line[x] ?? 0) + add) & 0xff;
  }
}

/** Reads an 8-bit RGB or RGBA PNG into an RGBA bitmap. */
export function readPng(file: string): Bitmap {
  const buf = fs.readFileSync(file);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const ch = CHANNELS[buf.readUInt8(25)] ?? 4;
  const parts: Buffer[] = [];
  for (let i = SIGNATURE; i < buf.length; i += 12 + buf.readUInt32BE(i)) {
    if (buf.toString('ascii', i + 4, i + 8) === 'IDAT') {
      parts.push(buf.subarray(i + 8, i + 8 + buf.readUInt32BE(i)));
    }
  }
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const stride = width * ch;
  const data = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const line = new Uint8Array(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    unfilter(raw[y * (stride + 1)] ?? 0, line, prev, ch);
    for (let x = 0; x < width; x++) {
      for (let k = 0; k < 4; k++) {
        data[(y * width + x) * 4 + k] = k < ch ? (line[x * ch + k] ?? 0) : 0xff;
      }
    }
    prev = line;
  }
  return { width, height, data };
}

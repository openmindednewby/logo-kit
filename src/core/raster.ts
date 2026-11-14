import { Resvg } from '@resvg/resvg-js';

export interface Bitmap {
  width: number;
  height: number;
  data: Uint8Array;
}

const CHANNEL_TOLERANCE = 24;
const WHITE = 255;
const HALF = 128;
const ICO_HEADER = 6;
const ICO_ENTRY = 16;
const ICO_MAX_SIDE = 256;
const BITS = 32;

const options = (width: number, fontFiles: string[]): ConstructorParameters<typeof Resvg>[1] => ({
  fitTo: { mode: 'width', value: width },
  font: { loadSystemFonts: false, fontFiles },
});

/** Renders an SVG string at a pixel width, fonts only from the given files (no system lookup, no network). */
export function renderSvg(svg: string, width: number, fontFiles: string[] = []): Bitmap {
  const img = new Resvg(svg, options(width, fontFiles)).render();
  return { width: img.width, height: img.height, data: new Uint8Array(img.pixels) };
}

/** Renders an SVG string to PNG bytes at a pixel width. */
export function renderPng(svg: string, width: number, fontFiles: string[] = []): Buffer {
  return new Resvg(svg, options(width, fontFiles)).render().asPng();
}

/** Returns 1 where the pixel is mostly opaque, else 0. */
export function alphaMask(bmp: Bitmap): Uint8Array {
  const out = new Uint8Array(bmp.width * bmp.height);
  for (let i = 0; i < out.length; i++) {
    out[i] = (bmp.data[i * 4 + 3] ?? 0) >= HALF ? 1 : 0;
  }
  return out;
}

const onWhite = (data: Uint8Array, i: number): number[] => {
  const a = (data[i + 3] ?? 0) / WHITE;
  return [0, 1, 2].map((k) => (data[i + k] ?? 0) * a + WHITE * (1 - a));
};

/** Returns the share of pixels that differ by more than 24 in any channel, both composited on white. */
export function pixelDiff(a: Bitmap, b: Bitmap): number {
  if (a.width !== b.width || a.height !== b.height) {
    return 1;
  }
  let differ = 0;
  const n = a.width * a.height;
  for (let p = 0; p < n; p++) {
    const ca = onWhite(a.data, p * 4);
    const cb = onWhite(b.data, p * 4);
    if (ca.some((v, k) => Math.abs(v - (cb[k] ?? 0)) > CHANNEL_TOLERANCE)) {
      differ++;
    }
  }
  return differ / n;
}

/** Returns the width and height stored in a PNG header. */
export function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** Returns an .ico holding the given PNG images. */
export function buildIco(pngs: readonly Uint8Array[]): Buffer {
  const header = Buffer.alloc(ICO_HEADER + ICO_ENTRY * pngs.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((png, k) => {
    const { width, height } = pngSize(png);
    const pos = ICO_HEADER + ICO_ENTRY * k;
    header.writeUInt8(width >= ICO_MAX_SIDE ? 0 : width, pos);
    header.writeUInt8(height >= ICO_MAX_SIDE ? 0 : height, pos + 1);
    header.writeUInt16LE(1, pos + 4);
    header.writeUInt16LE(BITS, pos + 6);
    header.writeUInt32LE(png.length, pos + 8);
    header.writeUInt32LE(offset, pos + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => Buffer.from(p))]);
}

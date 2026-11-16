import fs from 'node:fs';
import path from 'node:path';

import { loadBrand } from '../config/loadBrand';

export interface BrandDrift {
  copy: string;
  source: string;
  reason: string;
}

const normalise = (text: string): string => text.replace(/\r\n/g, '\n');

/** Copies a brand.json from its owner's repo to dest after checking it parses as a brand; returns dest. */
export function pullBrand(source: string, dest: string): string {
  loadBrand(source);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, fs.readFileSync(source, 'utf8'));
  return dest;
}

/** Returns why a pulled brand copy no longer matches its source (line endings ignored), or null when it matches. */
export function brandCopyDrift(copy: string, source: string): BrandDrift | null {
  const drift = (reason: string): BrandDrift => ({ copy, source, reason });
  if (!fs.existsSync(source)) {
    return drift('source missing');
  }
  if (!fs.existsSync(copy)) {
    return drift('copy missing');
  }
  return normalise(fs.readFileSync(copy, 'utf8')) === normalise(fs.readFileSync(source, 'utf8')) ? null : drift('content differs');
}

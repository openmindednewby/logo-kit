import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const fromRoot = (...parts: string[]): string => path.join(ROOT, ...parts);
export const readRoot = (...parts: string[]): string => fs.readFileSync(fromRoot(...parts), 'utf8');
export const tmpDir = (name: string): string => fs.mkdtempSync(path.join(os.tmpdir(), `logo-kit-${name}-`));
export const QUILLO = fromRoot('examples', 'quillo', 'brand.json');
export const CRESCENT = fromRoot('src', 'testing', 'fixtures', 'lunette-crescent', 'brand.json');
export const TARN = fromRoot('examples', 'tarn', 'brand.json');

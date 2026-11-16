import path from 'node:path';

import { brandCopyDrift, pullBrand } from './pullBrand';

type Out = (line: string) => void;

export const BRAND_USAGE = 'usage: logo-kit pull-brand <source brand.json> [--out dest] | logo-kit check-brand-copy <copy> --source <source brand.json>';

/** Runs pull-brand or check-brand-copy and returns the exit code, or null for any other command. */
export function brandCommand(cmd: string | undefined, file: string, flags: ReadonlyMap<string, string>, out: Out): number | null {
  if (cmd === 'pull-brand') {
    out(`pulled ${pullBrand(file, flags.get('out') ?? path.join('brand', path.basename(file)))}`);
    return 0;
  }
  if (cmd !== 'check-brand-copy') {
    return null;
  }
  const source = flags.get('source');
  if (source === undefined) {
    out(BRAND_USAGE);
    return 2;
  }
  const drift = brandCopyDrift(file, source);
  out(drift === null ? `brand copy matches ${source}` : `brand copy drift: ${drift.reason} (${file} vs ${source}), run logo-kit pull-brand ${source} --out ${file}`);
  return drift === null ? 0 : 1;
}

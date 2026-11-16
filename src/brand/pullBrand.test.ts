import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { runCli } from '../cliMain';
import { QUILLO, tmpDir } from '../testing/paths';
import { brandCopyDrift, pullBrand } from './pullBrand';

const quiet = (): void => undefined;

describe('pullBrand', () => {
  it('with the owner brand file, writes a copy with the same content', () => {
    const dest = path.join(tmpDir('pull'), 'brand', 'quillo.brand.json');

    pullBrand(QUILLO, dest);

    expect(fs.readFileSync(dest, 'utf8')).toBe(fs.readFileSync(QUILLO, 'utf8'));
  });

  it('with a source that is not a brand, throws and writes nothing', () => {
    const dir = tmpDir('pull-bad');
    const source = path.join(dir, 'bad.json');
    fs.writeFileSync(source, '{"name":"x"}');
    const dest = path.join(dir, 'copy.json');

    const act = (): string => pullBrand(source, dest);

    expect(act).toThrow();
    expect(fs.existsSync(dest)).toBe(false);
  });
});

describe('brandCopyDrift', () => {
  it('with a copy pulled from the source, returns null', () => {
    const dest = path.join(tmpDir('drift-same'), 'quillo.brand.json');
    pullBrand(QUILLO, dest);

    const drift = brandCopyDrift(dest, QUILLO);

    expect(drift).toBeNull();
  });

  it('with only line endings changed, returns null', () => {
    const dest = path.join(tmpDir('drift-eol'), 'quillo.brand.json');
    fs.writeFileSync(dest, fs.readFileSync(QUILLO, 'utf8').replace(/\n/g, '\r\n'));

    const drift = brandCopyDrift(dest, QUILLO);

    expect(drift).toBeNull();
  });

  it('with an edited copy, returns content differs', () => {
    const dest = path.join(tmpDir('drift-edit'), 'quillo.brand.json');
    fs.writeFileSync(dest, fs.readFileSync(QUILLO, 'utf8').replace('Quillo Labs', 'Quillo Lab'));

    const drift = brandCopyDrift(dest, QUILLO);

    expect(drift?.reason).toBe('content differs');
  });

  it('with no copy on disk, returns copy missing', () => {
    const dest = path.join(tmpDir('drift-none'), 'none.json');

    const drift = brandCopyDrift(dest, QUILLO);

    expect(drift?.reason).toBe('copy missing');
  });
});

describe('runCli brand commands', () => {
  it('with pull-brand then check-brand-copy, exits 0 twice', () => {
    const dest = path.join(tmpDir('cli-pull'), 'quillo.brand.json');

    const codes = [runCli(['pull-brand', QUILLO, '--out', dest], quiet), runCli(['check-brand-copy', dest, '--source', QUILLO], quiet)];

    expect(codes).toEqual([0, 0]);
  });

  it('with check-brand-copy on an edited copy, exits 1 and names the drift', () => {
    const dest = path.join(tmpDir('cli-drift'), 'quillo.brand.json');
    fs.writeFileSync(dest, '{}');
    const lines: string[] = [];

    const code = runCli(['check-brand-copy', dest, '--source', QUILLO], (l) => lines.push(l));

    expect([code, lines.join(' ').includes('content differs')]).toEqual([1, true]);
  });

  it('with check-brand-copy and no --source, exits 2 with usage', () => {
    const lines: string[] = [];

    const code = runCli(['check-brand-copy', QUILLO], (l) => lines.push(l));

    expect([code, lines[0]?.startsWith('usage:')]).toEqual([2, true]);
  });
});

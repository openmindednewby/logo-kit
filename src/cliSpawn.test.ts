import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { fromRoot, MOONCUBE, tmpDir } from './testing/paths';

const BUILD_MS = 120000;

describe('logo-kit built CLI', () => {
  beforeAll(() => {
    execFileSync(process.execPath, [fromRoot('node_modules', 'tsup', 'dist', 'cli-default.js')], { cwd: fromRoot(), stdio: 'ignore' });
  }, BUILD_MS);

  it('with export and the Moon Cube brand, exits 0 and writes og.png', () => {
    const out = tmpDir('spawn');

    const run = spawnSync(process.execPath, [fromRoot('dist', 'cli.js'), 'export', MOONCUBE, '--out', out], { encoding: 'utf8' });

    expect([run.status, fs.existsSync(path.join(out, 'og.png'))]).toEqual([0, true]);
  });

  it('with an unknown command, exits 2', () => {
    const run = spawnSync(process.execPath, [fromRoot('dist', 'cli.js'), 'paint', MOONCUBE], { encoding: 'utf8' });

    const code = run.status;

    expect(code).toBe(2);
  });
});

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ChecksReport } from './checks/runChecks';
import { runCli } from './cliMain';
import { QUILLO, tmpDir } from './testing/paths';

describe('runCli generate', () => {
  it('with seed 7 and 200 variants, writes checks-7.json where every dropped variant names its failed checks', () => {
    const out = tmpDir('generate');

    runCli(['generate', QUILLO, '--seed', '7', '--count', '200', '--out', out], () => undefined);

    const report = JSON.parse(fs.readFileSync(path.join(out, 'checks-7.json'), 'utf8')) as ChecksReport;
    const known = /^(legible16|legible32|oneColour|reversed|contrast|cvd|symbol): /;
    const passed = new Set(report.passed);
    expect(report.dropped.length).toBeGreaterThan(0);
    expect(report.dropped.every((d) => d.reasons.length > 0 && d.reasons.every((r) => known.test(r)))).toBe(true);
    expect(report.dropped.filter((d) => passed.has(d.id))).toEqual([]);
    expect(report.passed.length + report.dropped.length).toBe(200);
  });
});

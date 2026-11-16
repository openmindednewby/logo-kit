import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { runCli } from '../cliMain';
import { parseBrand } from '../config/loadBrand';
import { INTRO_RECIPES } from './IntroRecipe';
import { MICRO_RECIPES } from './MicroRecipe';
import { validateMotion } from './timeline';

type Raw = Record<string, unknown>;

const example = (slug: string): Raw => JSON.parse(fs.readFileSync(fileURLToPath(new URL(`../../examples/${slug}/brand.json`, import.meta.url)), 'utf8')) as Raw;
const withMotion = (raw: Raw, motion: Raw): Raw => ({ ...raw, motion: { roles: (raw['motion'] as Raw)['roles'], ...motion } });
const dirs: string[] = [];

function brandFile(motion: Raw): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk2-'));
  dirs.push(dir);
  const file = path.join(dir, 'brand.json');
  fs.writeFileSync(file, JSON.stringify(withMotion(example('quillo'), motion)));
  return file;
}

function runAll(cmds: readonly string[], file: string): { codes: number[]; lines: string[] } {
  const lines: string[] = [];
  const codes = cmds.map((cmd) => runCli([cmd, file, '--out', path.join(path.dirname(file), cmd)], (line) => lines.push(line)));
  return { codes, lines };
}

afterEach(() => {
  dirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
});

describe('recipes on the example brands', () => {
  it('with every intro and micro recipe on quillo and tarn, reports no motion error', () => {
    const errors = ['quillo', 'tarn'].flatMap((slug) =>
      INTRO_RECIPES.flatMap((intro, k) => {
        const brand = parseBrand(withMotion(example(slug), { intro, micro: MICRO_RECIPES[k % MICRO_RECIPES.length] }) as never, '.');
        return validateMotion(brand.motion, brand.mark.layers.map((l) => l.name)).errors.map((e) => `${slug} ${intro}: ${e}`);
      }),
    );

    expect(errors).toEqual([]);
  });
});

describe('runCli', () => {
  it('with an unknown intro recipe, check exits 1 and names it', () => {
    const file = brandFile({ intro: 'nope' });

    const { codes, lines } = runAll(['check'], file);

    expect([codes, lines.join('\n').includes('unknown intro recipe \\"nope\\"')]).toEqual([[1], true]);
  });

  it('with an unknown micro recipe, export and generate exit 1 and name it', () => {
    const file = brandFile({ micro: 'wobble' });

    const result = runAll(['export', 'generate'], file);

    expect(result).toEqual({ codes: [1, 1], lines: ['motion: unknown micro recipe "wobble"', 'motion: unknown micro recipe "wobble"'] });
  });

  it('with a role naming a missing layer, export and generate exit 1 and name it', () => {
    const file = brandFile({ intro: 'fly-in', roles: { base: ['ghost'] } });

    const result = runAll(['export', 'generate'], file);

    expect(result).toEqual({ codes: [1, 1], lines: ['motion: motion.roles names unknown layer "ghost"', 'motion: motion.roles names unknown layer "ghost"'] });
  });
});

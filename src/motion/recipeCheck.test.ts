import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { runCli } from '../cliMain';
import { parseBrand } from '../config/loadBrand';
import { INTRO_RECIPES } from './IntroRecipe';
import { MICRO_RECIPES } from './MicroRecipe';
import { validateMotion } from './timeline';

type Raw = Record<string, unknown>;

const example = (slug: string): Raw => JSON.parse(fs.readFileSync(fileURLToPath(new URL(`../../examples/${slug}/brand.json`, import.meta.url)), 'utf8')) as Raw;
const withMotion = (raw: Raw, motion: Raw): Raw => ({ ...raw, motion: { roles: (raw['motion'] as Raw)['roles'], ...motion } });

describe('recipes on the example brands', () => {
  it('with every intro and micro recipe on mooncube and finreg, reports no motion error', () => {
    const errors = ['mooncube', 'finreg'].flatMap((slug) =>
      INTRO_RECIPES.flatMap((intro, k) => {
        const brand = parseBrand(withMotion(example(slug), { intro, micro: MICRO_RECIPES[k % MICRO_RECIPES.length] }) as never, '.');
        return validateMotion(brand.motion, brand.mark.layers.map((l) => l.name)).errors.map((e) => `${slug} ${intro}: ${e}`);
      }),
    );

    expect(errors).toEqual([]);
  });

  it('with an unknown intro recipe, logo-kit check exits 1 and names it', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lk2-')), 'brand.json');
    fs.writeFileSync(file, JSON.stringify(withMotion(example('mooncube'), { intro: 'nope' })));
    const lines: string[] = [];

    const code = runCli(['check', file], (line) => lines.push(line));

    expect([code, lines.join('\n').includes('unknown intro recipe \\"nope\\"')]).toEqual([1, true]);
  });
});

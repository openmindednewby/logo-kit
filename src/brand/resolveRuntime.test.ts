import { describe, expect, it } from 'vitest';

import { loadBrand, parseBrand } from '../config/loadBrand';
import { QUILLO, readRoot } from '../testing/paths';
import { resolveRuntime } from './resolveRuntime';

const raw = (): Record<string, Record<string, unknown>> => JSON.parse(readRoot('examples', 'quillo', 'brand.json')) as Record<string, Record<string, unknown>>;
const withWordmark = (recipe: string): ReturnType<typeof parseBrand> => {
  const r = raw();
  return parseBrand({ ...r, motion: { ...r['motion'], wordmark: recipe } } as never, '.');
};

describe('resolveRuntime', () => {
  it('with the made-up Quillo brand, gives an animated intro and a still without keyframes in both modes', () => {
    const runtime = resolveRuntime(loadBrand(QUILLO));

    const shape = [runtime.light.intro.includes('@keyframes'), runtime.dark.intro.includes('@keyframes'), runtime.light.still.includes('@keyframes'), runtime.dark.still.includes('@keyframes')];

    expect(shape).toEqual([true, true, false, false]);
  });

  it('with letter-stagger, gives one letter span per character of the name', () => {
    const name = 'Quillo Labs';
    const runtime = resolveRuntime(parseBrand({ ...raw(), name } as never, '.'));

    const spans = runtime.wordmark?.html.match(/class="lkw-l\d+"/g) ?? [];

    expect([spans.length, runtime.wordmark?.recipe, runtime.limits]).toEqual([name.length, 'letter-stagger', []]);
  });

  it('with the faces-part idle, gives idle css on the lk-idle trigger', () => {
    const runtime = resolveRuntime(loadBrand(QUILLO));

    expect([runtime.idle?.className, runtime.idle?.css.includes('.lk-idle')]).toEqual(['lk-idle', true]);
  });

  it.each(['typewriter', 'mask-wipe'])('with the %s wordmark, falls back to letter-stagger and logs a limit', (recipe) => {
    const runtime = resolveRuntime(withWordmark(recipe));

    expect([runtime.wordmark?.recipe, runtime.limits.length, runtime.limits[0]?.includes(recipe)]).toEqual(['letter-stagger', 1, true]);
  });

  it('with a brand name holding markup characters, escapes them in the wordmark', () => {
    const r = raw();
    const brand = parseBrand({ ...r, name: 'A<b>&' } as never, '.');

    const html = resolveRuntime(brand).wordmark?.html ?? '';

    expect([html.includes('<b>'), html.includes('&lt;'), html.includes('&amp;')]).toEqual([false, true, true]);
  });
});

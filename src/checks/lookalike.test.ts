import { describe, expect, it } from 'vitest';

import { loadBrand } from '../config/loadBrand';
import { primitiveMark } from '../generate/generate';
import { MOONCUBE } from '../testing/paths';
import { symbolMatches } from './lookalike';
import { SYMBOLS } from './symbols';

describe('SYMBOLS', () => {
  it('with the sensitive-symbol library, covers at least 12 symbols including the five named ones', () => {
    const named = ['crescent-star', 'latin-cross', 'star-of-david', 'swastika', 'hammer-and-sickle'];

    const ids = SYMBOLS.map((s) => s.id);

    expect(new Set(ids).size).toBeGreaterThanOrEqual(12);
    expect(ids).toEqual(expect.arrayContaining(named));
  });
});

describe('symbolMatches', () => {
  it('with the current Moon Cube mark (brand-mooncube markGeometry), flags crescent-and-star', () => {
    const mark = loadBrand(MOONCUBE).mark;

    const matches = symbolMatches(mark);

    expect(matches.map((m) => m.symbol)).toContain('crescent-star');
  });

  it('with a plain cube, flags no symbol', () => {
    const cube = primitiveMark('cube');

    const matches = symbolMatches(cube);

    expect(matches).toEqual([]);
  });
});

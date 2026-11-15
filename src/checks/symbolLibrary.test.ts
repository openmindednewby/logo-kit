import { describe, expect, it } from 'vitest';

import type { Mark } from '../core/types';
import { svgSymbolScores, LOOKALIKE_THRESHOLD, symbolMatches } from './lookalike';
import { SYMBOLS } from './symbols';

const fill = { light: [{ fill: 'a' }], dark: [{ fill: 'a' }] };
const RING: Mark = { id: 'ring', viewBox: '0 0 64 64', layers: [{ name: 'ring', d: 'M8 32A24 24 0 1 0 56 32A24 24 0 1 0 8 32ZM18 32A14 14 0 1 0 46 32A14 14 0 1 0 18 32Z', evenOdd: true, paint: fill }] };
const DOT = { name: 'dot', d: 'M28 32A4 4 0 1 0 36 32A4 4 0 1 0 28 32Z', paint: fill };
const CIRCLE_DOT: Mark = { ...RING, id: 'circle-dot', layers: [...RING.layers, DOT] };

describe('svgSymbolScores', () => {
  it.each(SYMBOLS.flatMap((s) => s.silhouettes.map((svg, k) => [`${s.id} #${k}`, s.id, svg] as const)))('with the %s silhouette as a mark, flags its own symbol', (_label, id, svg) => {
    const scores = svgSymbolScores(svg);

    const own = scores.find((s) => s.symbol === id)?.score ?? 0;

    expect(own).toBeGreaterThanOrEqual(LOOKALIKE_THRESHOLD);
  });
});

describe('symbolMatches', () => {
  it.each([['a ring', RING], ['a circle with a dot', CIRCLE_DOT]] as const)('with %s, flags no symbol', (_label, mark) => {
    const matches = symbolMatches(mark);

    expect(matches).toEqual([]);
  });
});

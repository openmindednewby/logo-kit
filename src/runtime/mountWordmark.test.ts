import { describe, expect, it } from 'vitest';

import { MARK_STYLE, mountWordmark, wordmarkMarkup } from './mountWordmark';

import type { BrandRuntime } from './BrandRuntime';

const STILL = { intro: '<svg></svg>', still: '<svg></svg>' };
const WORDMARK = { recipe: 'letter-stagger', html: '<b>Lunette</b>', css: '.w{opacity:0}' };

const runtime = (wordmark: BrandRuntime['wordmark']): BrandRuntime => ({
  name: 'Lunette',
  slug: 'lunette',
  light: STILL,
  dark: STILL,
  wordmark,
  idle: null,
  limits: [],
});

const host = (): { innerHTML: string; style: { color: string; fontSize: string } } => ({
  innerHTML: '',
  style: { color: '', fontSize: '' },
});

describe('wordmarkMarkup', () => {
  it('with motion allowed, returns the reveal style and the wordmark', () => {
    const brand = runtime(WORDMARK);

    const markup = wordmarkMarkup(brand, false);

    expect(markup).toBe('<style>.w{opacity:0}</style><b>Lunette</b>');
  });

  it('when still, returns the wordmark without its reveal style', () => {
    const brand = runtime(WORDMARK);

    const markup = wordmarkMarkup(brand, true);

    expect(markup).toBe('<b>Lunette</b>');
  });

  it('with no wordmark in the brand, returns an empty string', () => {
    const brand = runtime(null);

    const markup = wordmarkMarkup(brand, false);

    expect(markup).toBe('');
  });
});

describe('mountWordmark', () => {
  it('with a colour and size, paints the host and writes the sized wordmark', () => {
    const target = host();

    mountWordmark(target, runtime(WORDMARK), { color: 'ink', fontPx: 17, still: true });

    expect(target).toEqual({ innerHTML: `${MARK_STYLE}<b>Lunette</b>`, style: { color: 'ink', fontSize: '17px' } });
  });

  it('when cleaned up, empties the host', () => {
    const target = host();
    const clear = mountWordmark(target, runtime(WORDMARK), { color: 'ink', fontPx: 17, still: false });

    clear();

    expect(target.innerHTML).toBe('');
  });
});

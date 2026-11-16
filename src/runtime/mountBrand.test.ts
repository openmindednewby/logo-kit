import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Mode } from '../core/Mode';
import type { BrandRuntime } from './BrandRuntime';
import { mountBrand } from './mountBrand';

const RUNTIME: BrandRuntime = {
  name: 'Made Up Co',
  slug: 'madeup',
  light: { intro: '<svg data-k="intro-light"></svg>', still: '<svg data-k="still-light"></svg>' },
  dark: { intro: '<svg data-k="intro-dark"></svg>', still: '<svg data-k="still-dark"></svg>' },
  wordmark: { recipe: 'letter-stagger', html: '<span class="lk-wordmark">M</span>', css: '.lkw-l0{animation:x 1s}' },
  idle: { className: 'lk-idle', durationMs: 600, css: '.lk-idle path{animation:y 1s}' },
  limits: [],
};

interface FakeHost {
  innerHTML: string;
  classes: Set<string>;
  classList: { add(n: string): void; remove(n: string): void };
}

function fakeHost(): FakeHost {
  const classes = new Set<string>();
  return { innerHTML: '', classes, classList: { add: (n): void => { classes.add(n); }, remove: (n): void => { classes.delete(n); } } };
}

const reduce = (on: boolean): void => {
  vi.stubGlobal('matchMedia', () => ({ matches: on }));
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('mountBrand', () => {
  it('with motion allowed, mounts the light intro, the wordmark and its css', () => {
    reduce(false);
    const host = fakeHost();

    mountBrand(host, RUNTIME);

    expect(['intro-light', 'lk-wordmark', 'animation:x', 'animation:y'].map((s) => host.innerHTML.includes(s))).toEqual([true, true, true, true]);
  });

  it('with the dark mode and no name, mounts the dark intro and no wordmark', () => {
    reduce(false);
    const host = fakeHost();

    mountBrand(host, RUNTIME, { mode: Mode.Dark, showName: false });

    expect([host.innerHTML.includes('intro-dark'), host.innerHTML.includes('lk-wordmark')]).toEqual([true, false]);
  });

  it('with reduced motion, mounts the still with no motion css and never plays the idle', () => {
    reduce(true);
    const host = fakeHost();

    mountBrand(host, RUNTIME, { idle: { minMs: 10, maxMs: 10 } });
    vi.advanceTimersByTime(50);

    expect([host.innerHTML.includes('still-light'), host.innerHTML.includes('animation:'), host.innerHTML.includes('lk-wordmark'), host.classes.size]).toEqual([true, false, true, 0]);
  });

  it('with motion allowed, adds the idle class after the idle wait', () => {
    reduce(false);
    const host = fakeHost();
    mountBrand(host, RUNTIME, { idle: { minMs: 10, maxMs: 10 } });

    vi.advanceTimersByTime(11);

    expect(host.classes.has('lk-idle')).toBe(true);
  });

  it('with unmount called, clears the host and stops the idle', () => {
    reduce(false);
    const host = fakeHost();
    const unmount = mountBrand(host, RUNTIME, { idle: { minMs: 10, maxMs: 10 } });

    unmount();
    vi.advanceTimersByTime(50);

    expect([host.innerHTML, host.classes.size]).toEqual(['', 0]);
  });
});

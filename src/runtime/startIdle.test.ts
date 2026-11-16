import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startIdle } from './startIdle';

interface FakeEl {
  classes: Set<string>;
  classList: { add: (c: string) => void; remove: (c: string) => void };
}

const fakeEl = (): FakeEl => {
  const classes = new Set<string>();
  return {
    classes,
    classList: {
      add: (c): void => {
        classes.add(c);
      },
      remove: (c): void => {
        classes.delete(c);
      },
    },
  };
};

const env = (reduced: boolean, hidden: boolean): void => {
  vi.stubGlobal('document', { hidden });
  vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
};

describe('startIdle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('with defaults and random 0, plays after 8 s', () => {
    env(false, false);
    const el = fakeEl();

    startIdle(el, { random: () => 0 });
    vi.advanceTimersByTime(8000);

    expect(el.classes.has('lk-idle')).toBe(true);
  });

  it('with defaults and random near 1, waits up to 15 s', () => {
    env(false, false);
    const el = fakeEl();

    startIdle(el, { random: () => 0.9999 });
    vi.advanceTimersByTime(14000);

    expect(el.classes.has('lk-idle')).toBe(false);
  });

  it('with a min and max, waits inside that range', () => {
    env(false, false);
    const el = fakeEl();

    startIdle(el, { minMs: 1000, maxMs: 2000, random: () => 0.5 });
    vi.advanceTimersByTime(1500);

    expect(el.classes.has('lk-idle')).toBe(true);
  });

  it('after the run length, removes the class again', () => {
    env(false, false);
    const el = fakeEl();

    startIdle(el, { minMs: 100, maxMs: 100, durationMs: 600, className: 'go' });
    vi.advanceTimersByTime(750);

    expect(el.classes.has('go')).toBe(false);
  });

  it('with prefers-reduced-motion, never plays', () => {
    env(true, false);
    const el = fakeEl();

    startIdle(el, { minMs: 100, maxMs: 100 });
    vi.advanceTimersByTime(1000);

    expect(el.classes.size).toBe(0);
  });

  it('with a hidden tab, skips the run', () => {
    env(false, true);
    const el = fakeEl();

    startIdle(el, { minMs: 100, maxMs: 100 });
    vi.advanceTimersByTime(150);

    expect(el.classes.size).toBe(0);
  });

  it('after stop, never plays again', () => {
    env(false, false);
    const el = fakeEl();
    const stop = startIdle(el, { minMs: 100, maxMs: 100 });

    stop();
    vi.advanceTimersByTime(1000);

    expect(el.classes.size).toBe(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rasterMarkup } from '../motion/raster/rasterMarkup';
import { startRasterMotion } from './startRasterMotion';

interface FakeHost {
  classes: Set<string>;
  classList: { add: (c: string) => void; remove: (c: string) => void };
}

const fakeHost = (): FakeHost => {
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

interface FakeDoc {
  hidden: boolean;
  listeners: Map<string, () => void>;
  addEventListener: (t: string, fn: () => void) => void;
  removeEventListener: (t: string) => void;
}

const env = (reduced: boolean, hidden: boolean): FakeDoc => {
  const listeners = new Map<string, () => void>();
  const doc: FakeDoc = {
    hidden,
    listeners,
    addEventListener: (t, fn): void => {
      listeners.set(t, fn);
    },
    removeEventListener: (t): void => {
      listeners.delete(t);
    },
  };
  vi.stubGlobal('document', doc);
  vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
  return doc;
};

describe('startRasterMotion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('with intro and idle on a visible tab, sets both play classes', () => {
    env(false, false);
    const host = fakeHost();

    startRasterMotion(host, { idle: true });

    expect([...host.classes]).toEqual(['lkr-play-intro', 'lkr-play-idle']);
  });

  it('with reduced motion, sets no class and adds no listener', () => {
    const doc = env(true, false);
    const host = fakeHost();

    startRasterMotion(host, { idle: true }).micro();

    expect([host.classes.size, doc.listeners.size]).toEqual([0, 0]);
  });

  it('when the tab becomes hidden, pauses, and when visible again, resumes', () => {
    const doc = env(false, false);
    const host = fakeHost();
    startRasterMotion(host, { idle: true });

    doc.hidden = true;
    doc.listeners.get('visibilitychange')?.();
    const pausedWhileHidden = host.classes.has('lkr-paused');
    doc.hidden = false;
    doc.listeners.get('visibilitychange')?.();

    expect([pausedWhileHidden, host.classes.has('lkr-paused')]).toEqual([true, false]);
  });

  it('with microMs 900, holds the micro class no longer than 300 ms', () => {
    env(false, false);
    const host = fakeHost();
    const controls = startRasterMotion(host, { intro: false, microMs: 900 });

    controls.micro();
    const during = host.classes.has('lkr-play-micro');
    vi.advanceTimersByTime(300);

    expect([during, host.classes.has('lkr-play-micro')]).toEqual([true, false]);
  });

  it('with stop, removes every class and the visibility listener', () => {
    const doc = env(false, true);
    const host = fakeHost();
    const controls = startRasterMotion(host, { idle: true });

    controls.stop();

    expect([host.classes.size, doc.listeners.size]).toEqual([0, 0]);
  });
});

describe('rasterMarkup', () => {
  it('with a src holding quotes, escapes it in the img and the mask url', () => {
    const src = 'logo "a".webp';

    const html = rasterMarkup(src, 'Acme', { prefix: 'acme', width: '200px' });

    expect([html.includes('src="logo &quot;a&quot;.webp"'), html.includes('--acme-src:url(&quot;logo%20%22a%22.webp&quot;);width:200px'), html.match(/class="acme-spark"/g)?.length]).toEqual([true, true, 12]);
  });
});

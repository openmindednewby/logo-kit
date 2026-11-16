export interface IdleHost {
  classList: { add(name: string): void; remove(name: string): void };
}

export interface IdleOptions {
  minMs?: number;
  maxMs?: number;
  durationMs?: number;
  className?: string;
  random?: () => number;
}

interface BrowserGlobals {
  document?: { hidden?: boolean };
  matchMedia?: (query: string) => { matches: boolean };
}

const DEFAULT_MIN_MS = 8000;
const DEFAULT_MAX_MS = 15000;
const DEFAULT_RUN_MS = 600;
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

const browser = (): BrowserGlobals => globalThis as BrowserGlobals;
const reducedMotion = (): boolean => browser().matchMedia?.(REDUCED_QUERY).matches === true;
const tabHidden = (): boolean => browser().document?.hidden === true;

/** Plays the idle class on the element every 8-15 s (configurable) and returns stop(). */
export function startIdle(el: IdleHost, options: IdleOptions = {}): () => void {
  const minMs = options.minMs ?? DEFAULT_MIN_MS;
  const maxMs = Math.max(minMs, options.maxMs ?? DEFAULT_MAX_MS);
  const runMs = options.durationMs ?? DEFAULT_RUN_MS;
  const className = options.className ?? 'lk-idle';
  const random = options.random ?? Math.random;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const schedule = (): void => {
    timer = setTimeout(tick, minMs + random() * (maxMs - minMs));
  };
  const finish = (): void => {
    el.classList.remove(className);
    schedule();
  };
  function tick(): void {
    if (stopped) {
      return;
    }
    if (tabHidden() || reducedMotion()) {
      schedule();
      return;
    }
    el.classList.add(className);
    timer = setTimeout(finish, runMs);
  }
  if (reducedMotion()) {
    return (): void => undefined;
  }
  schedule();
  return (): void => {
    stopped = true;
    clearTimeout(timer);
    el.classList.remove(className);
  };
}

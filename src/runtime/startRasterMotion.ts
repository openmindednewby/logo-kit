import { MICRO_CAP_MS } from '../motion/defaults';
import { RASTER_PREFIX } from '../motion/raster/rasterBaseCss';

export interface RasterHost {
  classList: { add(name: string): void; remove(name: string): void };
  offsetWidth?: number;
}

export interface RasterRunOptions {
  prefix?: string;
  intro?: boolean;
  idle?: boolean;
  microMs?: number;
}

export interface RasterControls {
  micro(): void;
  stop(): void;
}

interface BrowserGlobals {
  document?: {
    hidden?: boolean;
    addEventListener?(type: string, fn: () => void): void;
    removeEventListener?(type: string, fn: () => void): void;
  };
  matchMedia?: (query: string) => { matches: boolean };
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const VISIBILITY = 'visibilitychange';
const NOOP: RasterControls = { micro: (): void => undefined, stop: (): void => undefined };

const browser = (): BrowserGlobals => globalThis as BrowserGlobals;
const restart = (host: RasterHost): number => host.offsetWidth ?? 0;

/** Plays the raster intro and idle on the host, pauses them while the tab is hidden, and returns micro() and stop(). */
export function startRasterMotion(host: RasterHost, options: RasterRunOptions = {}): RasterControls {
  if (browser().matchMedia?.(REDUCED_QUERY).matches === true) {
    return NOOP;
  }
  const p = options.prefix ?? RASTER_PREFIX;
  const microClass = `${p}-play-micro`;
  const microMs = Math.min(options.microMs ?? MICRO_CAP_MS, MICRO_CAP_MS);
  const played = [options.intro !== false ? `${p}-play-intro` : '', options.idle === true ? `${p}-play-idle` : ''].filter((c) => c !== '');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sync = (): void => {
    if (browser().document?.hidden === true) {
      host.classList.add(`${p}-paused`);
    } else {
      host.classList.remove(`${p}-paused`);
    }
  };
  played.forEach((c) => host.classList.add(c));
  sync();
  browser().document?.addEventListener?.(VISIBILITY, sync);
  const micro = (): void => {
    clearTimeout(timer);
    host.classList.remove(microClass);
    restart(host);
    host.classList.add(microClass);
    timer = setTimeout(() => host.classList.remove(microClass), microMs);
  };
  const stop = (): void => {
    clearTimeout(timer);
    browser().document?.removeEventListener?.(VISIBILITY, sync);
    [...played, microClass, `${p}-paused`].forEach((c) => host.classList.remove(c));
  };
  return { micro, stop };
}

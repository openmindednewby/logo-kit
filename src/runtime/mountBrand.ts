import { Mode } from '../core/Mode';
import type { BrandRuntime } from './BrandRuntime';
import { startIdle } from './startIdle';
import type { IdleHost, IdleOptions } from './startIdle';

export interface BrandHost extends IdleHost {
  innerHTML: string;
}

export interface MountOptions {
  mode?: Mode;
  showName?: boolean;
  idle?: IdleOptions;
}

interface MediaGlobals {
  matchMedia?: (query: string) => { matches: boolean };
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

const reducedMotion = (): boolean => (globalThis as MediaGlobals).matchMedia?.(REDUCED_QUERY).matches === true;

/** Mounts the brand mark, wordmark and idle into host (the still under reduced motion) and returns unmount(). */
export function mountBrand(host: BrandHost, runtime: BrandRuntime, options: MountOptions = {}): () => void {
  const still = reducedMotion();
  const mode = runtime[options.mode ?? Mode.Light];
  const showName = options.showName !== false && runtime.wordmark !== null;
  const wordmarkCss = showName ? (runtime.wordmark?.css ?? '') : '';
  const css = still ? '' : `${wordmarkCss}${runtime.idle?.css ?? ''}`;
  const style = css !== '' ? `<style>${css}</style>` : '';
  const name = showName ? (runtime.wordmark?.html ?? '') : '';
  host.innerHTML = `${style}<span class="lk-brand">${still ? mode.still : mode.intro}${name}</span>`;
  const idle = runtime.idle;
  const stopIdle = still || idle === null ? (): void => undefined : startIdle(host, { durationMs: idle.durationMs, className: idle.className, ...options.idle });
  return (): void => {
    stopIdle();
    host.innerHTML = '';
  };
}

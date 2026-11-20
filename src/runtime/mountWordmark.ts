import type { BrandRuntime } from './BrandRuntime';

export interface WordmarkHost {
  innerHTML: string;
  style: { color: string; fontSize: string };
}

export interface WordmarkOptions {
  color: string;
  fontPx: number;
  still: boolean;
}

export const MARK_STYLE = '<style>.lk-brand,.lk-brand svg{display:block;width:100%;height:100%}</style>';

/** Returns the wordmark markup with its reveal style, or without it when still. */
export function wordmarkMarkup(runtime: BrandRuntime, still: boolean): string {
  const wordmark = runtime.wordmark;
  if (wordmark === null) {
    return '';
  }
  return still ? wordmark.html : `<style>${wordmark.css}</style>${wordmark.html}`;
}

/** Fills host with the sized wordmark; returns a cleanup that empties it. */
export function mountWordmark(host: WordmarkHost, runtime: BrandRuntime, options: WordmarkOptions): () => void {
  Object.assign(host.style, { color: options.color, fontSize: `${options.fontPx}px` });
  Object.assign(host, { innerHTML: MARK_STYLE + wordmarkMarkup(runtime, options.still) });
  return () => {
    Object.assign(host, { innerHTML: '' });
  };
}

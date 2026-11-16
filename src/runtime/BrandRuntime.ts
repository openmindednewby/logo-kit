export interface BrandModeRuntime {
  intro: string;
  still: string;
}

export interface BrandWordmarkRuntime {
  recipe: string;
  html: string;
  css: string;
}

export interface BrandIdleRuntime {
  className: string;
  durationMs: number;
  css: string;
}

/** A brand's resolved logo markup, passed to mountBrand. */
export interface BrandRuntime {
  name: string;
  slug: string;
  light: BrandModeRuntime;
  dark: BrandModeRuntime;
  wordmark: BrandWordmarkRuntime | null;
  idle: BrandIdleRuntime | null;
  limits: string[];
}

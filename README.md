# @dloizides/logo-kit

One `brand.json`, every logo asset. No network and no LLM calls.

- `logo-kit export brand.json --out export/` writes icons, favicon, og card, landing card, header lockups, intro and micro motion SVGs and a `brand-<slug>/markGeometry.ts` module.
- `logo-kit generate brand.json --seed 7 --count 200 --out variants/` writes seeded mark variants and `checks-7.json` (dropped variants carry their reasons).
- `logo-kit pick brand.json --out pick/ [--builder build-pick-page.mjs]` writes a shape, colour and motion pick spec with frames, and builds the page when given the builder.
- `logo-kit check brand.json` runs the checks on the brand's own mark.

Checks: 16/32 px legibility, one colour, reversed, contrast >= 3:1 on light and dark, colour-blind (protan, deutan, tritan) and a sensitive-symbol lookalike check over 13 symbols.

Motion presets: draw, flood, stagger-rise, scale-pop, orbit, wipe, morph-from-circle, sweep, pulse (intro) and spread, pulse (micro). Intro <= 1200 ms and micro <= 300 ms unless `motion.allowLongIntro` names a reason. Reduced motion shows the final still.

Examples (made-up brands): `examples/quillo/brand.json`, `examples/tarn/brand.json`.

## Raster logos

For a logo that exists only as an image (PNG, WebP), motion acts on the whole image. Colours come in as options (pass design-token values); nothing brand-specific is in the package.

- `rasterMarkup(src, alt, { width })` returns the layered HTML; `rasterMotion({ intro, micro, idle }, { glowColour, bandColour })` returns `{ css, introMs, microMs, periodMs, unknown }`.
- Intros: fade-up, scale-settle, mask-wipe, light-sweep, focus-in, glow-sweep, punch-sweep, double-sweep, burst-settle, tilt-sweep (<= 1200 ms). Micros: pulse, glint, nudge, underline-draw (<= 300 ms). Idle loops: slow-glint, glow-breathe, sheen-drift, soft-lift, twin-shimmer (6-8 s, starting when the intro ends).
- Browser: `startRasterMotion(host, { idle: true })` from `@dloizides/logo-kit/runtime` returns `{ micro, stop }`, pauses while the tab is hidden and does nothing under reduced motion, where the CSS shows the still.
- React / React Native: `import { MotionLogo } from '@dloizides/logo-kit/react'` (`react` and `react-native` are optional peers). Props `src`, `label` (re-read on change), `hint`, `intro` / `micro` / `idle` preset names, `glowColour`, `bandColour`, `width`, `aspectRatio`, `testID`; the ref exposes `micro()`. On native it renders a still `Image`; under reduced motion the still stays.

## Brand runtime

A brand's `brand.json` lives in its owner's private repo; this package holds only generic code.

- `logo-kit pull-brand <source brand.json> [--out brand/x.brand.json]` copies it into a sibling app.
- `logo-kit check-brand-copy <copy> --source <source brand.json>` exits 1 when the copy drifted.
- Build time: `resolveRuntime(loadBrand(file))` returns plain markup (intro + still per mode, wordmark, idle).
- Browser: `import { mountBrand } from '@dloizides/logo-kit/runtime'`; `mountBrand(host, runtime, { mode, showName })` returns `unmount()`. Under `prefers-reduced-motion: reduce` it mounts the still, no motion CSS, no idle.
- Limit: the HTML wordmark has no glyph positions, so `typewriter` and `mask-wipe` play `letter-stagger`; `runtime.limits` names it.

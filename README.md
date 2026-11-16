# @dloizides/logo-kit

One `brand.json`, every logo asset. No network and no LLM calls.

- `logo-kit export brand.json --out export/` writes icons, favicon, og card, landing card, header lockups, intro and micro motion SVGs and a `brand-<slug>/markGeometry.ts` module.
- `logo-kit generate brand.json --seed 7 --count 200 --out variants/` writes seeded mark variants and `checks-7.json` (dropped variants carry their reasons).
- `logo-kit pick brand.json --out pick/ [--builder build-pick-page.mjs]` writes a shape, colour and motion pick spec with frames, and builds the page when given the builder.
- `logo-kit check brand.json` runs the checks on the brand's own mark.

Checks: 16/32 px legibility, one colour, reversed, contrast >= 3:1 on light and dark, colour-blind (protan, deutan, tritan) and a sensitive-symbol lookalike check over 13 symbols.

Motion presets: draw, flood, stagger-rise, scale-pop, orbit, wipe, morph-from-circle, sweep, pulse (intro) and spread, pulse (micro). Intro <= 1200 ms and micro <= 300 ms unless `motion.allowLongIntro` names a reason. Reduced motion shows the final still.

Examples (made-up brands): `examples/quillo/brand.json`, `examples/tarn/brand.json`.

## Brand runtime

A brand's `brand.json` lives in its owner's private repo; this package holds only generic code.

- `logo-kit pull-brand <source brand.json> [--out brand/x.brand.json]` copies it into a sibling app.
- `logo-kit check-brand-copy <copy> --source <source brand.json>` exits 1 when the copy drifted.
- Build time: `resolveRuntime(loadBrand(file))` returns plain markup (intro + still per mode, wordmark, idle).
- Browser: `import { mountBrand } from '@dloizides/logo-kit/runtime'`; `mountBrand(host, runtime, { mode, showName })` returns `unmount()`. Under `prefers-reduced-motion: reduce` it mounts the still, no motion CSS, no idle.
- Limit: the HTML wordmark has no glyph positions, so `typewriter` and `mask-wipe` play `letter-stagger`; `runtime.limits` names it.

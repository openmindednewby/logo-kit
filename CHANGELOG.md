# Changelog

## 0.6.0

- React entry `@dloizides/logo-kit/react`: `MotionLogo` hosts a raster logo, injects the markup and preset CSS, plays intro and idle, exposes `micro()` through its ref and stops on unmount. `react` and `react-native` are optional peers.
- Native renders a still `Image`; reduced motion keeps the still; a changed `label` or preset re-renders the markup.

## 0.5.0

- Raster motion presets: whole-image motion for a logo that has no SVG layers (a PNG or WebP). Intros `fade-up`, `scale-settle`, `mask-wipe`, `light-sweep`, `focus-in`, `glow-sweep`, `punch-sweep`, `double-sweep`, `burst-settle`, `tilt-sweep` (600-1140 ms, cap 1200 ms); micros `pulse`, `glint`, `nudge`, `underline-draw` (200-280 ms, cap 300 ms); idle loops `slow-glint` (7 s), `glow-breathe` (6 s), `sheen-drift` (8 s), `soft-lift` (6.5 s), `twin-shimmer` (8 s).
- `rasterMarkup(src, alt)` writes the layered HTML; `rasterMotion({ intro, micro, idle }, { glowColour, bandColour })` writes one stylesheet (the idle loop starts when the intro ends) and lists unknown names; `rasterIntro` / `rasterMicro` / `rasterIdle` give one preset with its timing.
- Runtime `startRasterMotion(host, { idle: true })` plays the intro and idle, pauses them while the tab is hidden, returns `micro()` (capped at 300 ms) and `stop()`. Under `prefers-reduced-motion: reduce` it sets nothing and the CSS holds the finished still.

## 0.4.1

- `MountOptions.mode` is typed as the `Mode` const enum.
- Fix: the 0.4.0 note placed `resolveRuntime` in `/runtime`; it is exported from the root entry.

## 0.4.0

- `resolveRuntime(brand)` (build time, root entry `@dloizides/logo-kit`) and `mountBrand(host, runtime, opts)` (`@dloizides/logo-kit/runtime`): intro, wordmark reveal and idle; reduced motion mounts the still with no motion and no idle.
- `pullBrand` / `brandCopyDrift` and CLI `pull-brand` + `check-brand-copy` (drift = exit 1, line endings ignored).
- Limit: the HTML wordmark plays `letter-stagger` for `typewriter` and `mask-wipe` (no glyph positions) and lists it in `runtime.limits`.
- Brand data removed from the repo: examples, parity fixtures and pick demo are made-up brands or gone; brands with no token reference now default to the `flier` generator palette.

## 0.3.1

- Fix: `startIdle` caps `durationMs` at `IDLE_CAP_MS` (600 ms), so a longer value no longer holds the idle class past the idle budget.
- The `brand.json` `motion.idle` type is now the exported `IdleMotionConfig` (same `{ recipe }` shape).

## 0.3.0

- Intro recipe `grow-settle` ("Settle overshoot"): the base floods, the parts grow from circles, then the whole mark swells 4% and settles back; ends at 1180 ms.
- Wordmark reveal recipes `letter-stagger`, `slide-from-mark`, `typewriter`, `mask-wipe`, `tracking-settle` (`wordmarkReveal`): CSS for letters classed `<prefix>-l<i>`, word width from the letter advances, a configurable start offset; reduced motion shows the name at once. `brand.json` `motion.wordmark` takes a recipe name or `{ recipe, startMs }`.
- Idle recipes `rim-glint`, `faces-part`, `breath`, `orbit-spark` (`idleRecipe`), each at most 600 ms (`IDLE_CAP_MS`), played while a trigger class is on; `brand.json` `motion.idle` names one. Unknown wordmark or idle recipes are reported like intro and micro ones.
- Browser-safe subpath `@dloizides/logo-kit/runtime` (no fs, no resvg): `startIdle(el, { minMs, maxMs })` adds the idle class every 8-15 s by default, skips a run while the tab is hidden, never runs under prefers-reduced-motion, and returns `stop()`.

## 0.2.0

- Motion recipes: `brand.json` `motion.intro` / `motion.micro` may name a recipe instead of a beat list. Intro recipes `rim-then-ink`, `phase-wipe`, `faces-settle`, `turn-into-place`, `grow-from-circles`, `fly-in`, `spin-assemble`, `drop-bounce`, `flip-faces`, `slam-shake`; micro recipes `faces-part`, `breath`, `rim-glint`, `part-and-glint`.
- `motion.roles` (`base`, `parts`) names the layers a recipe acts on; without it, base is the first layer and parts are the rest. Distances scale with the viewBox size.
- New intro presets `fly-in`, `spin-assemble`, `drop-bounce`, `flip`, `slam-shake` (`BOLD_PRESETS`), each default within 1200 ms.
- `pulse` and `sweep` are micro presets again, reversing the 0.1.1 note: `MICRO_DEFAULTS` gives each a 300 ms hover beat, and the 300 ms micro cap is still enforced.
- `check`, `export` and `generate` exit 1 and name an unknown recipe or a `motion.roles` layer the mark does not have.

## 0.1.2

- Fix: the hover micro no longer restarts or cuts short the intro. Micro CSS now animates dedicated wrappers (`<g class="lkmN">` per layer, `<g class="lkmm">` for the whole mark, `lkmsN` sweep overlays) instead of the intro's `.lN` / `#mark` / `.lksN` elements, so hover never changes the intro element's `animation-name`.

## 0.1.1

- First published version. Reversed check covers visibility as well as contrast; Pulse is no longer a micro preset (every micro preset stays under 300 ms); export output is byte-for-byte parity-tested against the live brand files; the built CLI is spawn-tested.

## 0.1.0

- First release: generate, check, export, pick; parity configs for two brands.

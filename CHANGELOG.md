# Changelog

## 0.3.1

- Fix: `startIdle` caps `durationMs` at `IDLE_CAP_MS` (600 ms), so a longer value no longer holds the idle class past the idle budget.
- The `brand.json` `motion.idle` type is now the exported `IdleMotionConfig` (same `{ recipe }` shape).

## 0.3.0

- Intro recipe `grow-settle` (Moon Cube option "Settle overshoot"): the base floods, the parts grow from circles, then the whole mark swells 4% and settles back; ends at 1180 ms.
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

- First published version. Reversed check covers visibility as well as contrast; Pulse is no longer a micro preset (every micro preset stays under 300 ms); export output is byte-for-byte parity-tested against the live Moon Cube files; the built CLI is spawn-tested.

## 0.1.0

- First release: generate, check, export, pick; parity configs for Moon Cube and FinReg.

# Changelog

## 0.1.2

- Fix: the hover micro no longer restarts or cuts short the intro. Micro CSS now animates dedicated wrappers (`<g class="lkmN">` per layer, `<g class="lkmm">` for the whole mark, `lkmsN` sweep overlays) instead of the intro's `.lN` / `#mark` / `.lksN` elements, so hover never changes the intro element's `animation-name`.

## 0.1.1

- First published version. Reversed check covers visibility as well as contrast; Pulse is no longer a micro preset (every micro preset stays under 300 ms); export output is byte-for-byte parity-tested against the live Moon Cube files; the built CLI is spawn-tested.

## 0.1.0

- First release: generate, check, export, pick; parity configs for Moon Cube and FinReg.

import { Mode } from '../core/Mode';
import { markSvg } from '../core/svg';
import type { Brand } from '../core/types';
import { idleRecipe } from '../motion/idle';
import { introSvg } from '../motion/motionSvg';
import { wordmarkReveal } from '../motion/wordmark';
import { WordmarkRecipe } from '../motion/WordmarkRecipe';
import type { BrandModeRuntime, BrandRuntime, BrandWordmarkRuntime } from '../runtime/BrandRuntime';

const IDLE_CLASS = 'lk-idle';
const LETTER_PREFIX = 'lkw';
const ADVANCE_SHARE = 0.6;
const FONT_SIZE = 17;
const NEEDS_SVG_GLYPHS: readonly string[] = [WordmarkRecipe.Typewriter, WordmarkRecipe.MaskWipe];

const ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = (text: string): string => text.replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c);

const withOverlay = (svg: string, overlay: string): string => svg.replace(/<\/svg>$/, `${overlay}</svg>`);

function modeRuntime(brand: Brand, mode: Mode, overlay: string): BrandModeRuntime {
  const label = brand.name;
  return {
    intro: withOverlay(introSvg(brand.mark, brand.palette, mode, brand.motion.intro, { label }), overlay),
    still: markSvg(brand.mark, brand.palette, mode, { label, overlay }),
  };
}

function wordmarkRuntime(brand: Brand, limits: string[]): BrandWordmarkRuntime | null {
  const config = brand.motion.wordmark;
  if (config === undefined) {
    return null;
  }
  const svgOnly = NEEDS_SVG_GLYPHS.includes(config.recipe);
  if (svgOnly) {
    limits.push(`wordmark ${config.recipe}: needs SVG glyph positions, the HTML wordmark plays letter-stagger`);
  }
  const recipe = svgOnly ? WordmarkRecipe.LetterStagger : config.recipe;
  const letters = [...brand.name];
  const advances = letters.map(() => FONT_SIZE * ADVANCE_SHARE);
  const reveal = wordmarkReveal(recipe, { advances, startMs: config.startMs, prefix: LETTER_PREFIX, fontSize: FONT_SIZE });
  const spans = letters.map((c, i) => `<span class="${LETTER_PREFIX}-l${i}">${escapeHtml(c)}</span>`).join('');
  const font = escapeHtml(brand.wordmark.fontFamily);
  const html = `<span class="lk-wordmark ${LETTER_PREFIX}-g" style="white-space:pre;display:inline-block;font-family:${font}">${spans}</span>`;
  return { recipe, html, css: reveal?.css ?? '' };
}

/** Returns the brand's logo markup for mountBrand, with any logged limits. */
export function resolveRuntime(brand: Brand): BrandRuntime {
  const limits: string[] = [];
  const idleName = brand.motion.idle?.recipe;
  const idle = idleName !== undefined ? idleRecipe(idleName, { mark: brand.mark, trigger: IDLE_CLASS }) : null;
  const overlay = idle?.overlay ?? '';
  return {
    name: brand.name,
    slug: brand.slug,
    light: modeRuntime(brand, Mode.Light, overlay),
    dark: modeRuntime(brand, Mode.Dark, overlay),
    wordmark: wordmarkRuntime(brand, limits),
    idle: idle !== null ? { className: IDLE_CLASS, durationMs: idle.durationMs, css: idle.css } : null,
    limits,
  };
}

import { describe, expect, it } from 'vitest';

import { wordmarkReveal } from './wordmark';
import { WORDMARK_RECIPES, WordmarkRecipe } from './WordmarkRecipe';

const ADVANCES = Array.from({ length: 22 }, () => 10);

describe('wordmarkReveal', () => {
  it('with letter-stagger on 22 letters, lasts 21 steps of 12 ms plus one 240 ms letter', () => {
    const motion = wordmarkReveal(WordmarkRecipe.LetterStagger, { advances: ADVANCES });

    expect(motion?.durationMs).toBe(492);
  });

  it('with typewriter on 22 letters, lasts 16 ms a letter over 70% of the run', () => {
    const motion = wordmarkReveal(WordmarkRecipe.Typewriter, { advances: ADVANCES });

    expect(motion?.durationMs).toBe(503);
  });

  it('with a start offset, delays the first letter by it', () => {
    const motion = wordmarkReveal(WordmarkRecipe.LetterStagger, { advances: ADVANCES, startMs: 1850, prefix: 'w' });

    expect(motion?.css).toContain('.w-l0{animation:w-l0 240ms cubic-bezier(0.23,1,0.32,1) 1850ms 1 both}');
  });

  it('with no start offset, starts at 0 ms', () => {
    const motion = wordmarkReveal(WordmarkRecipe.TrackingSettle, { advances: [10, 10] });

    expect(motion?.startMs).toBe(0);
  });

  it('with mask-wipe, sends the edge across the full word width', () => {
    const motion = wordmarkReveal(WordmarkRecipe.MaskWipe, { advances: [10, 20, 30], prefix: 'w' });

    expect([motion?.classes, motion?.css.includes('translateX(60px)')]).toEqual([['w-r', 'w-e'], true]);
  });

  it('with slide-from-mark, animates only the group', () => {
    const motion = wordmarkReveal(WordmarkRecipe.SlideFromMark, { advances: [10, 10], prefix: 'w' });

    expect([motion?.classes, motion?.css.includes('.w-l0')]).toEqual([['w-g'], false]);
  });

  it('with reduced motion, shows the name at once and hides the caret', () => {
    const motion = wordmarkReveal(WordmarkRecipe.Typewriter, { advances: [10, 10], prefix: 'w' });

    expect(motion?.css).toContain(
      '@media (prefers-reduced-motion:reduce){.w-l0,.w-l1{animation:none!important;opacity:1!important;transform:none!important}.w-k{animation:none!important;opacity:0!important}}',
    );
  });

  it('with every recipe, ends its css with the reduced-motion rule', () => {
    const ends = WORDMARK_RECIPES.map((r) => wordmarkReveal(r, { advances: [10, 10] })?.css.includes('@media (prefers-reduced-motion:reduce)'));

    expect(ends).toEqual(WORDMARK_RECIPES.map(() => true));
  });

  it('with an unknown name, returns null', () => {
    const motion = wordmarkReveal('zoom', { advances: [10] });

    expect(motion).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import type { Mark } from '../core/types';
import { idleRecipe } from './idle';
import { IDLE_CAP_MS, IDLE_RECIPES, IdleRecipe } from './IdleRecipe';

const MARK: Mark = {
  id: 'm',
  viewBox: '0 0 64 64',
  layers: [
    { name: 'disc', d: 'M0 0H64V64H0Z', paint: { light: [], dark: [] } },
    { name: 'top', d: 'M30 10H34V14H30Z', paint: { light: [], dark: [] } },
  ],
};

describe('idleRecipe', () => {
  it('with every recipe, stays within the 600 ms idle cap', () => {
    const over = IDLE_RECIPES.filter((r) => (idleRecipe(r, { mark: MARK })?.durationMs ?? Infinity) > IDLE_CAP_MS);

    expect(over).toEqual([]);
  });

  it('with faces-part, moves each part away from the mark centre while the trigger class is on', () => {
    const motion = idleRecipe(IdleRecipe.FacesPart, { mark: MARK, prefix: 'i', trigger: 'go' });

    expect([motion?.css.includes('.go #mark-top{animation:i-p0 420ms'), motion?.css.includes('translate(0.00px,-1.20px)')]).toEqual([true, true]);
  });

  it('with breath, scales the whole mark about its viewBox centre', () => {
    const motion = idleRecipe(IdleRecipe.Breath, { mark: MARK, prefix: 'i' });

    expect(motion?.css).toContain('transform-origin:32px 32px');
  });

  it('with rim-glint, adds a rim stroke overlay in the given colour', () => {
    const motion = idleRecipe(IdleRecipe.RimGlint, { mark: MARK, prefix: 'i', colour: '#fff' });

    expect(motion?.overlay).toContain('class="i-s" cx="32" cy="32" r="27.2" fill="none" stroke="#fff"');
  });

  it('with orbit-spark, adds a spark overlay near the top rim', () => {
    const motion = idleRecipe(IdleRecipe.OrbitSpark, { mark: MARK, prefix: 'i' });

    expect(motion?.overlay).toContain('cy="1.6"');
  });

  it('with reduced motion, stops every idle animation', () => {
    const motion = idleRecipe(IdleRecipe.Breath, { mark: MARK, trigger: 'go' });

    expect(motion?.css.endsWith('@media (prefers-reduced-motion:reduce){.go *{animation:none!important}}')).toBe(true);
  });

  it('with an unknown name, returns null', () => {
    const motion = idleRecipe('wobble', { mark: MARK });

    expect(motion).toBeNull();
  });
});

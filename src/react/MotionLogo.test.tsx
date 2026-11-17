import { createRef } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { Platform } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RASTER_PREFIX } from '../motion/raster/rasterBaseCss';
import { MotionLogo } from './MotionLogo';
import type { MotionLogoHandle } from './MotionLogo';

const SRC = 'https://example.test/logo.webp';
const LABEL = 'Example logo';
const TEST_ID = 'motion-logo';
const INTRO = 'glow-sweep';
const MICRO = 'glint';
const IDLE = 'slow-glint';

const stubReducedMotion = (reduced: boolean): void => {
  vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
};
const motionHost = (): Element | null => screen.getByTestId(TEST_ID).lastElementChild;
const playClasses = (): string[] => [...(motionHost()?.classList ?? [])].filter((c) => c.includes('-play-'));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Platform.OS = 'web';
});

describe('MotionLogo', () => {
  it('on web with motion allowed, plays the intro and idle on the injected host', () => {
    stubReducedMotion(false);

    render(<MotionLogo idle={IDLE} intro={INTRO} label={LABEL} micro={MICRO} src={SRC} testID={TEST_ID} />);

    expect(playClasses()).toEqual([`${RASTER_PREFIX}-play-intro`, `${RASTER_PREFIX}-play-idle`]);
  });

  it('under reduced motion, shows the still image with no play class', () => {
    stubReducedMotion(true);

    render(<MotionLogo idle={IDLE} intro={INTRO} label={LABEL} micro={MICRO} src={SRC} testID={TEST_ID} />);

    expect(playClasses()).toEqual([]);
    expect(motionHost()?.querySelector('img')?.getAttribute('src')).toBe(SRC);
  });

  it('on native, renders the still image and injects no motion markup', () => {
    Platform.OS = 'ios';

    render(<MotionLogo idle={IDLE} intro={INTRO} label={LABEL} micro={MICRO} src={SRC} testID={TEST_ID} />);

    expect(screen.getByTestId(`${TEST_ID}-still`)).toBeTruthy();
    expect(screen.getByTestId(TEST_ID).querySelector('style')).toBeNull();
  });

  it('micro() on web, plays the micro class on the host', () => {
    stubReducedMotion(false);
    const ref = createRef<MotionLogoHandle>();
    render(<MotionLogo ref={ref} idle={IDLE} intro={INTRO} label={LABEL} micro={MICRO} src={SRC} testID={TEST_ID} />);

    act(() => ref.current?.micro());

    expect(playClasses()).toContain(`${RASTER_PREFIX}-play-micro`);
  });

  it('with a changed label, re-reads it into the image alt', () => {
    stubReducedMotion(false);
    const nextLabel = 'Renamed logo';
    const view = render(<MotionLogo label={LABEL} src={SRC} testID={TEST_ID} />);

    view.rerender(<MotionLogo label={nextLabel} src={SRC} testID={TEST_ID} />);

    expect(motionHost()?.querySelector('img')?.getAttribute('alt')).toBe(nextLabel);
  });
});

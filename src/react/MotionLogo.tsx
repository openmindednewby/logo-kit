import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { rasterMarkup } from '../motion/raster/rasterMarkup';
import { rasterMotion } from '../motion/raster/rasterPresets';
import { startRasterMotion } from '../runtime/startRasterMotion';
import type { RasterControls } from '../runtime/startRasterMotion';

export interface MotionLogoProps {
  src: string;
  label: string;
  hint?: string;
  intro?: string;
  micro?: string;
  idle?: string;
  glowColour?: string;
  bandColour?: string;
  width?: number;
  aspectRatio?: number;
  testID?: string;
}

export interface MotionLogoHandle {
  micro: () => void;
}

const WEB = 'web';
const STILL_SUFFIX = '-still';
const FULL_WIDTH = '100%';

const styles = StyleSheet.create({
  frame: { alignSelf: 'center' },
  still: { height: FULL_WIDTH, width: FULL_WIDTH },
});

const isElement = (node: unknown): node is HTMLElement => typeof HTMLElement !== 'undefined' && node instanceof HTMLElement;

function useRasterMotion(hostRef: RefObject<unknown>, props: MotionLogoProps, isWeb: boolean): RefObject<RasterControls | null> {
  const controls = useRef<RasterControls | null>(null);
  const { src, label, intro, micro, idle, glowColour, bandColour } = props;
  useEffect(() => {
    const node = hostRef.current;
    if (!isWeb || !isElement(node)) {
      return undefined;
    }
    const motion = rasterMotion({ intro, micro, idle }, { glowColour, bandColour });
    node.innerHTML = `<style>${motion.css}</style>${rasterMarkup(src, label, { width: FULL_WIDTH })}`;
    const host = node.lastElementChild;
    if (host === null) {
      return undefined;
    }
    controls.current = startRasterMotion(host, { intro: intro !== undefined, idle: idle !== undefined, microMs: motion.microMs });
    return (): void => {
      controls.current?.stop();
      controls.current = null;
    };
  }, [hostRef, isWeb, src, label, intro, micro, idle, glowColour, bandColour]);
  return controls;
}

export const MotionLogo = forwardRef<MotionLogoHandle, MotionLogoProps>((props, ref): ReactElement => {
  const hostRef = useRef<unknown>(null);
  const isWeb = Platform.OS === WEB;
  const controls = useRasterMotion(hostRef, props, isWeb);
  useImperativeHandle(ref, () => ({ micro: (): void => controls.current?.micro() }), [controls]);
  const size = { aspectRatio: props.aspectRatio, width: props.width };
  const stillTestID = props.testID !== undefined ? `${props.testID}${STILL_SUFFIX}` : undefined;

  return (
    <View
      ref={hostRef}
      accessibilityHint={props.hint}
      accessibilityLabel={props.label}
      accessibilityRole="image"
      style={[styles.frame, size]}
      testID={props.testID}
    >
      {isWeb ? null : (
        <Image accessibilityIgnoresInvertColors resizeMode="contain" source={{ uri: props.src }} style={styles.still} testID={stillTestID} />
      )}
    </View>
  );
});

MotionLogo.displayName = 'MotionLogo';

import type { MotionPreset } from '../motion/MotionPreset';

export interface Pt {
  x: number;
  y: number;
}

export interface PaintItem {
  fill?: string;
  stroke?: string;
  width?: number;
}

export interface LayerPaint {
  light: PaintItem[];
  dark: PaintItem[];
}

export interface MarkLayer {
  name: string;
  d: string;
  paint: LayerPaint;
  transform?: string;
  evenOdd?: boolean;
}

export interface Mark {
  id: string;
  viewBox: string;
  layers: MarkLayer[];
}

export type ModeColours = Readonly<Record<string, string>>;

export interface Palette {
  name: string;
  light: ModeColours;
  dark: ModeColours;
  mono: string;
}

export interface MotionBeat {
  preset: MotionPreset;
  durationMs: number;
  layers?: string[];
  delayMs?: number;
  stepMs?: number;
  easing?: string;
  settleEasing?: string;
  stops?: number[];
  fadeIn?: string[];
  scale?: number;
  distance?: number;
  share?: number;
  width?: number;
  colour?: string;
}

export interface MotionConfig {
  intro: MotionBeat[];
  micro: MotionBeat[];
  allowLongIntro?: string;
}

export interface GenerateConfig {
  seed: number;
  count: number;
}

export interface Wordmark {
  fontFamily: string;
  fontFile?: string;
}

export interface IconStyle {
  dark: boolean;
  share: number;
  radius: number;
}

export interface SmallMark {
  viewBox: string;
  d: string;
  light: string;
  dark: string;
}

export interface Brand {
  icons: IconStyle;
  smallMark?: SmallMark;
  name: string;
  slug: string;
  wordmark: Wordmark;
  mark: Mark;
  palette: Palette;
  motion: MotionConfig;
  generate: GenerateConfig;
  tokens: string;
  baseDir: string;
}

declare module 'react-native' {
  import type { ComponentType, Ref } from 'react';

  type Style = object | false | null | undefined;
  type StyleProp = Style | readonly Style[];

  interface BaseProps {
    accessibilityHint?: string;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    style?: StyleProp;
    testID?: string;
  }

  export interface ViewProps extends BaseProps {
    ref?: Ref<unknown>;
    children?: unknown;
  }

  export interface ImageProps extends BaseProps {
    accessibilityIgnoresInvertColors?: boolean;
    resizeMode?: string;
    source: { uri: string } | number;
  }

  export const Platform: { OS: string };
  export const StyleSheet: { create<T extends Record<string, object>>(styles: T): T };
  export const View: ComponentType<ViewProps>;
  export const Image: ComponentType<ImageProps>;
}

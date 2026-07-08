import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  surface: '#f9f9ff',
  surfaceDim: '#d3daef',
  surfaceBright: '#f9f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f3ff',
  surfaceContainer: '#e9edff',
  surfaceContainerHigh: '#e1e8fd',
  surfaceContainerHighest: '#dce2f7',
  onSurface: '#141b2b',
  onSurfaceVariant: '#404943',
  inverseSurface: '#293040',
  inverseOnSurface: '#edf0ff',
  outline: '#707973',
  outlineVariant: '#bfc9c1',
  surfaceTint: '#2c694e',
  primary: '#0f5238',
  onPrimary: '#ffffff',
  primaryContainer: '#2d6a4f',
  onPrimaryContainer: '#a8e7c5',
  inversePrimary: '#95d4b3',
  secondary: '#555f70',
  onSecondary: '#ffffff',
  secondaryContainer: '#d6e0f4',
  onSecondaryContainer: '#596374',
  tertiary: '#0f4883',
  onTertiary: '#ffffff',
  tertiaryContainer: '#31609c',
  onTertiaryContainer: '#c6dbff',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  accentSuccess: '#52b788',
  surfaceMint: '#d8f3dc',
  alertWarning: '#f4a261',
  errorRed: '#e63946',
  placeholderGray: '#9ca3af',
  surfaceSecondary: '#f3f4f6',
  borderDefault: '#d1d5db',
} as const;

export const Colors = {
  light: {
    text: Palette.onSurface,
    background: Palette.surface,
    backgroundElement: Palette.surfaceContainerLow,
    backgroundSelected: Palette.surfaceContainerHighest,
    textSecondary: Palette.onSurfaceVariant,
    tint: Palette.primaryContainer,
    primary: Palette.primaryContainer,
    primaryStrong: Palette.primary,
    border: Palette.borderDefault,
    card: Palette.surfaceContainerLowest,
    success: Palette.accentSuccess,
    error: Palette.error,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;


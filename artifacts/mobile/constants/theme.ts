// Pocketflow Theme System — Dark-only per ui.md specification
// The design calls for a single dark premium aesthetic

import { palette } from './tokens';

export type ThemeTokens = {
  // Surfaces
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceRecessed: string;
  surfaceSubtle: string;

  // Text
  fg: string;
  fgMuted: string;
  fgSubtle: string;

  // Brand — lime accent
  primary: string;
  primaryText: string;
  onPrimary: string;

  // Secondary
  secondary: string;
  secondaryText: string;

  // Semantic
  income: string;
  expense: string;
  transfer: string;
  success: string;
  warning: string;
  error: string;

  // UI
  border: string;
  divider: string;
  ripple: string;
  scrim: string;

  // Accent colors
  lavender: string;
  blue: string;

  // Hero card
  heroBg: string;
  heroText: string;
  heroMuted: string;

  // Tab bar
  tabBarBg: string;
  tabActive: string;
  tabInactive: string;

  // Data viz
  data: string[];
};

export const darkTheme: ThemeTokens = {
  // Surfaces
  canvas: palette.appBg,
  surface: palette.cardBg,
  surfaceElevated: palette.cardSecondary,
  surfaceRecessed: palette.inputBg,
  surfaceSubtle: palette.divider,

  // Text
  fg: palette.textPrimary,
  fgMuted: palette.textSecondary,
  fgSubtle: palette.textMuted,

  // Brand — lime
  primary: palette.lime,
  primaryText: palette.limeDark,
  onPrimary: '#000000',

  // Secondary
  secondary: palette.lavender,
  secondaryText: '#6B5BAA',

  // Semantic
  income: palette.income,
  expense: palette.expense,
  transfer: palette.blue,
  success: palette.income,
  warning: palette.warning,
  error: palette.expense,

  // UI
  border: palette.divider,
  divider: palette.divider,
  ripple: 'rgba(183, 255, 99, 0.08)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  // Accent colors
  lavender: palette.lavender,
  blue: palette.blue,

  // Hero card
  heroBg: palette.heroStart,
  heroText: '#ffffff',
  heroMuted: palette.textSecondary,

  // Tab bar
  tabBarBg: palette.cardBg,
  tabActive: palette.lime,
  tabInactive: palette.textMuted,

  // Data viz
  data: [
    palette.lime,
    palette.lavender,
    palette.income,
    palette.warning,
    palette.expense,
    palette.blue,
  ],
};

export const lightTheme: ThemeTokens = darkTheme;

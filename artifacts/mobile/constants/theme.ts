// Pocketflow Theme System
// Light + Dark themes derived from Gesso design references

import { palette } from './tokens';

export type ThemeTokens = {
  // Surfaces
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceRecessed: string;

  // Text
  fg: string;
  fgMuted: string;
  fgSubtle: string;

  // Brand
  primary: string;
  primaryText: string;
  onPrimary: string;
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

export const lightTheme: ThemeTokens = {
  canvas: palette.neutral50,
  surface: palette.neutral100,
  surfaceElevated: '#f5f5f5',
  surfaceRecessed: '#e8e8ea',

  fg: palette.neutral900,
  fgMuted: palette.neutral600,
  fgSubtle: palette.neutral400,

  primary: palette.primaryBlue,
  primaryText: palette.primaryBlueText,
  onPrimary: palette.onPrimaryBlue,
  secondary: palette.secondaryPink,
  secondaryText: palette.secondaryPinkText,

  income: palette.income,
  expense: palette.expense,
  transfer: palette.transfer,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,

  border: palette.neutral200,
  divider: 'rgba(0, 0, 0, 0.04)',
  ripple: 'rgba(0, 0, 0, 0.04)',
  scrim: palette.scrim,

  heroBg: palette.heroDark,
  heroText: '#ffffff',
  heroMuted: 'rgba(255,255,255,0.55)',

  tabBarBg: 'rgba(242, 242, 244, 0.9)',
  tabActive: palette.primaryBlue,
  tabInactive: palette.neutral600,

  data: [palette.data1, palette.data2, palette.data3, palette.data4, palette.data5, palette.data6],
};

export const darkTheme: ThemeTokens = {
  canvas: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#222222',
  surfaceRecessed: '#141414',

  fg: '#f5f5f5',
  fgMuted: '#a0a0a0',
  fgSubtle: '#666666',

  primary: palette.primaryBlue,
  primaryText: '#7ba4f7',
  onPrimary: '#000000',
  secondary: palette.secondaryPink,
  secondaryText: '#f2899e',

  income: '#34d058',
  expense: '#f85149',
  transfer: '#79c0ff',
  success: '#34d058',
  warning: '#d29922',
  error: '#f85149',

  border: '#333333',
  divider: 'rgba(255, 255, 255, 0.06)',
  ripple: 'rgba(255, 255, 255, 0.06)',
  scrim: 'rgba(0, 0, 0, 0.7)',

  heroBg: '#111111',
  heroText: '#ffffff',
  heroMuted: 'rgba(255,255,255,0.55)',

  tabBarBg: 'rgba(10, 10, 10, 0.9)',
  tabActive: palette.primaryBlue,
  tabInactive: '#666666',

  data: [palette.data1, palette.data2, palette.data3, palette.data4, palette.data5, palette.data6],
};

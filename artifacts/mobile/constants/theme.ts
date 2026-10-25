// Zeno Theme System — Dark and Light themes

import { palette } from './tokens';

export type ThemeTokens = {
  isDark: boolean;
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

  // Brand — lime accent (dark) / navy accent (light)
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
  isDark: true,
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

export const lightTheme: ThemeTokens = {
  isDark: false,
  // Surfaces
  canvas: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F7FA',
  surfaceRecessed: '#F0F2F5',
  surfaceSubtle: '#E8EBF0',

  // Text
  fg: '#101C3D',
  fgMuted: '#667085',
  fgSubtle: '#98A2B3',

  // Brand — navy blue
  primary: '#101C3D',
  primaryText: '#101C3D',
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: '#101C3D',
  secondaryText: '#667085',

  // Semantic
  income: '#12B76A',
  expense: '#F04438',
  transfer: '#2E90FA',
  success: '#12B76A',
  warning: '#F79009',
  error: '#F04438',

  // UI
  border: '#E5E7EB',
  divider: '#E5E7EB',
  ripple: 'rgba(16, 28, 61, 0.06)',
  scrim: 'rgba(0, 0, 0, 0.4)',

  // Accent colors
  lavender: '#7A5AF8',
  blue: '#2E90FA',

  // Hero card
  heroBg: '#F0F4FF',
  heroText: '#101C3D',
  heroMuted: '#667085',

  // Tab bar
  tabBarBg: '#FFFFFF',
  tabActive: '#101C3D',
  tabInactive: '#98A2B3',

  // Data viz
  data: [
    '#101C3D',
    '#7A5AF8',
    '#12B76A',
    '#F79009',
    '#F04438',
    '#2E90FA',
  ],
};

// Pocketflow Design System — Derived from Gesso Vault Calm references
// Base unit: 4px | Density: comfortable | Grid: 8px rhythm

// ─── Colors ────────────────────────────────────────────────
export const palette = {
  // Neutrals
  neutral50: '#f2f2f4',
  neutral100: '#ffffff',
  neutral200: '#D8DBDF',
  neutral300: '#B8BDC4',
  neutral400: '#8E959F',
  neutral500: '#646C77',
  neutral600: '#646469',
  neutral700: '#343B44',
  neutral800: '#22282F',
  neutral900: '#1a1a1a',
  neutral950: '#0A0C0F',

  // Brand — Home accent (lime)
  primaryHome: '#aaee44',
  primaryHomeText: '#557722',
  onPrimaryHome: '#000000',

  // Brand — Insights/Profile accent (blue)
  primaryBlue: '#5b8def',
  primaryBlueText: '#446ab3',
  onPrimaryBlue: '#000000',

  // Secondary — pink
  secondaryPink: '#f26e8e',
  secondaryPinkText: '#a94d63',

  // Secondary — purple
  secondaryPurple: '#9b8fe8',
  secondaryPurpleText: '#6d64a2',

  // Semantic
  success: '#149343',
  warning: '#c36b05',
  error: '#DC2626',
  income: '#149343',
  expense: '#DC2626',
  transfer: '#5b8def',

  // Dark hero
  heroDark: '#0F0F12',
  heroGlow: 'rgba(255,255,255,0.12)',

  // Data viz (pink series for insights)
  data1: '#991845',
  data2: '#b5365b',
  data3: '#d15072',
  data4: '#ed698a',
  data5: '#ff8ba4',
  data6: '#ffb7c4',

  // Data viz (green series for home)
  dataGreen1: '#406100',
  dataGreen2: '#517a00',
  dataGreen3: '#649500',
  dataGreen4: '#77b000',
  dataGreen5: '#8acc00',
  dataGreen6: '#a3e63a',

  // Scrim / overlay
  scrim: 'rgba(0, 0, 0, 0.45)',
} as const;

// ─── Typography ────────────────────────────────────────────
export const typography = {
  displayFamily: 'Space Grotesk',
  bodyFamily: 'Schibsted Grotesk',
  monoFamily: 'Schibsted Grotesk',
  // Fallbacks for React Native
  displayFallback: 'SpaceGrotesk-Regular',
  bodyFallback: 'System',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 44,
  hero: 52,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ─── Spacing (4px base) ───────────────────────────────────
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ─── Border Radius ─────────────────────────────────────────
export const radius = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const shadows = {
  sm: 'none',
  md: 'none',
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  elevated: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
} as const;

// ─── Animation ─────────────────────────────────────────────
export const duration = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

// ─── Layout ────────────────────────────────────────────────
export const layout = {
  screenWidth: 393,
  screenHeight: 852,
  padding: {
    screen: 16,
    card: 16,
    section: 24,
  },
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  tabBarHeight: 88,
  statusBarHeight: 44,
} as const;

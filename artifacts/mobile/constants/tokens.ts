// Zeno Design System — Derived from ui.md specification
// Base unit: 4px | Density: spacious | Grid: 8px rhythm

// ─── Colors (ui.md §3.1) ──────────────────────────────────
export const palette = {
  // Base colors — dark finance aesthetic
  appBg: '#090B0A',
  cardBg: '#171A18',
  cardSecondary: '#202320',
  inputBg: '#1B1E1C',
  divider: '#303431',

  // Text hierarchy
  textPrimary: '#F5F7F3',
  textSecondary: '#A5AAA3',
  textMuted: '#777D76',

  // Accent — lime
  lime: '#B7FF63',
  limeBright: '#C4FF7B',
  limeDark: '#4B682C',

  // Semantic
  income: '#7CFF66',
  warning: '#F7D66A',
  expense: '#FF8B9A',
  lavender: '#B7A8FF',
  blue: '#86BFFF',

  // Presentation background (mockups only)
  presentationBg: '#858E7A',

  // Hero card gradient stops
  heroStart: '#1B2B1A',
  heroEnd: '#0D150C',
} as const;

// ─── Typography (ui.md §3.2) ──────────────────────────────
export const typography = {
  displayFamily: 'Inter',
  bodyFamily: 'Inter',
  monoFamily: 'Inter',
  displayFallback: 'System',
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
  '4xl': 36,
  hero: 40,
} as const;

export const lineHeight = {
  tight: 1.15,
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

// ─── Spacing (ui.md §3.3 — 8pt grid) ─────────────────────
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

// ─── Border Radius (ui.md §3.4) ───────────────────────────
export const radius = {
  none: 0,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 24,
  hero: 28,
  full: 9999,
} as const;

// ─── Shadows and Effects (ui.md §3.5) ─────────────────────
export const shadows = {
  sm: 'none',
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#B7FF63',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

// ─── Animation ─────────────────────────────────────────────
export const duration = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

// ─── Layout (ui.md §4) ────────────────────────────────────
export const layout = {
  screenWidth: 390,
  screenHeight: 844,
  padding: {
    screen: 16,
    card: 20,
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
  statusBarHeight: 47,
  bottomSafeArea: 34,
} as const;

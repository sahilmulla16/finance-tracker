// Pocketflow Colors — Backward-compatible wrapper
// New code should import from './tokens' and './theme' directly

import { lightTheme, darkTheme } from './theme';

const colors = {
  light: {
    text: lightTheme.fg,
    tint: lightTheme.primary,
    background: lightTheme.canvas,
    foreground: lightTheme.fg,
    card: lightTheme.surface,
    cardForeground: lightTheme.fg,
    primary: lightTheme.primary,
    primaryForeground: lightTheme.onPrimary,
    secondary: lightTheme.secondary,
    secondaryForeground: lightTheme.secondaryText,
    muted: lightTheme.surfaceRecessed,
    mutedForeground: lightTheme.fgMuted,
    accent: lightTheme.surfaceElevated,
    accentForeground: lightTheme.fg,
    destructive: lightTheme.error,
    destructiveForeground: '#FFFFFF',
    border: lightTheme.border,
    input: lightTheme.border,
  },
  dark: {
    text: darkTheme.fg,
    tint: darkTheme.primary,
    background: darkTheme.canvas,
    foreground: darkTheme.fg,
    card: darkTheme.surface,
    cardForeground: darkTheme.fg,
    primary: darkTheme.primary,
    primaryForeground: darkTheme.onPrimary,
    secondary: darkTheme.secondary,
    secondaryForeground: darkTheme.secondaryText,
    muted: darkTheme.surfaceRecessed,
    mutedForeground: darkTheme.fgMuted,
    accent: darkTheme.surfaceElevated,
    accentForeground: darkTheme.fg,
    destructive: darkTheme.error,
    destructiveForeground: '#FFFFFF',
    border: darkTheme.border,
    input: darkTheme.border,
  },
  radius: 16,
};

export default colors;

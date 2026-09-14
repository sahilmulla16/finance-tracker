import { darkTheme, type ThemeTokens } from '@/constants/theme';

/**
 * Returns the dark theme tokens.
 * Per ui.md spec, Pocketflow uses a single dark premium aesthetic.
 */
export function useColors(): ThemeTokens {
  return darkTheme;
}

import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, type ThemeTokens } from '@/constants/theme';
import { useFinance } from '@/context/FinanceContext';

/**
 * Returns the full design token set for the active color scheme.
 *
 * Respects the user's appearance setting from FinanceContext:
 * - 'system' → follows device setting
 * - 'light' → always light
 * - 'dark' → always dark
 */
export function useColors(): ThemeTokens {
  const deviceScheme = useColorScheme();
  const { settings } = useFinance();

  let isDark = deviceScheme === 'dark';

  if (settings.appearance === 'light') isDark = false;
  else if (settings.appearance === 'dark') isDark = true;

  return isDark ? darkTheme : lightTheme;
}

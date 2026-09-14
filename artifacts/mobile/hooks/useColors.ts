import { darkTheme, lightTheme, type ThemeTokens } from '@/constants/theme';
import { useFinance } from '@/context/FinanceContext';
import { Appearance as ReactAppearance } from 'react-native';

/**
 * Returns the theme tokens based on user's appearance setting.
 * Supports dark, light, and system (follows device setting).
 */
export function useColors(): ThemeTokens {
  const { settings } = useFinance();
  const appearance = settings.appearance;

  if (appearance === 'light') return lightTheme;
  if (appearance === 'dark') return darkTheme;

  // System — follow device setting
  const deviceColorScheme = ReactAppearance.getColorScheme();
  return deviceColorScheme === 'light' ? lightTheme : darkTheme;
}

// Backward-compatible color object
// All screens should use useColors() hook instead
import { darkTheme } from './theme';

const colors = {
  primary: darkTheme.primary,
  background: darkTheme.canvas,
  card: darkTheme.surface,
  text: darkTheme.fg,
  border: darkTheme.border,
  muted: darkTheme.fgMuted,
};

export default colors;

import { MD3DarkTheme } from 'react-native-paper';
import { ARCADE_THEME } from './colors';

// Default theme (current classic theme)
export const DefaultTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6',      // Blue (P1)
    secondary: '#10B981',    // Green (P2)
    background: '#111827',   // Very dark gray
    surface: '#1F2937',      // Dark gray
  }
};

// Arcade theme (80's neon aesthetic)
export const ArcadeTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: ARCADE_THEME.neon.cyan,
    secondary: ARCADE_THEME.neon.pink,
    tertiary: ARCADE_THEME.neon.purple,
    background: ARCADE_THEME.bg.primary,
    surface: ARCADE_THEME.bg.tertiary,
    surfaceVariant: ARCADE_THEME.bg.card,
    onSurface: ARCADE_THEME.text.primary,
    onSurfaceVariant: ARCADE_THEME.text.secondary,
    outline: ARCADE_THEME.border.default,
    error: ARCADE_THEME.neon.red,
    onError: '#FFFFFF',
  },
  // Custom arcade colors for advanced styling
  arcade: ARCADE_THEME
};

// Helper function to create glow effects
export const createGlow = (color: string, radius: number = 10) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: radius,
  elevation: radius, // Android
});

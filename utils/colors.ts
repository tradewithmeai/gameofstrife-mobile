/**
 * Arcade Color Palette for Game of Strife
 *
 * Design Philosophy:
 * - 80's arcade aesthetic with neon colors on black backgrounds
 * - High contrast for clear visibility
 * - Distinctive colors for each superpower type
 * - Saturated, vibrant colors that "pop" on screen
 *
 * Note: useArcadeTheme setting not yet implemented - uses standard theme for now
 */

/**
 * Main arcade color palette
 */
export const ARCADE_COLORS = {
  // Player identification colors
  player1: '#00F5FF',      // Neon cyan - bright and energetic
  player2: '#FF006E',      // Hot pink - contrasts well with cyan

  // Superpower type colors (Types 1-7)
  tank: '#FFFFFF',         // Bright white - defensive, pure, strong
  spreader: '#00F5FF',     // Neon cyan - flowing, spreading energy
  survivor: '#FFFF00',     // Electric yellow - attention-demanding, persistent
  ghost: '#FF10F0',        // Neon magenta - otherworldly, ethereal
  replicator: '#FF6600',   // Bright orange - explosive, energetic
  destroyer: '#FF0000',    // Pure red - danger, aggression, power
  hybrid: '#B026FF',       // Electric purple - sophisticated, complex

  // UI/Layout colors
  background: '#000000',   // Pure black - maximum contrast
  surface: '#1A0033',      // Deep purple-black - subtle depth
  gridLines: '#330066',    // Dark purple - visible but not distracting
  text: '#00F5FF',         // Neon cyan - primary text
  textSecondary: '#FF10F0', // Neon magenta - secondary/hint text
  accent: '#FFFF00',       // Electric yellow - highlights, warnings
  danger: '#FF0000',       // Pure red - errors, destructive actions
  success: '#00FF00',      // Neon green - success states, confirmations
};

export const ARCADE_THEME = {
  // Backgrounds
  bg: {
    primary: '#000000',      // Pure black
    secondary: '#0D001A',    // Deep purple-black
    tertiary: '#1A0033',     // Purple-black surface
    card: '#220044',         // Purple card background
  },

  // Neon accents
  neon: {
    cyan: '#00F5FF',         // Primary neon (P1, links, active)
    pink: '#FF006E',         // Secondary neon (P2, highlights)
    yellow: '#FFFF00',       // Attention (warnings, selected)
    green: '#00FF00',        // Success states
    orange: '#FF6600',       // Info/neutral
    purple: '#B026FF',       // Special actions
    red: '#FF0000',          // Danger/errors
  },

  // Text
  text: {
    primary: '#FFFFFF',      // Pure white for headers
    secondary: '#00F5FF',    // Neon cyan for body
    tertiary: '#FF10F0',     // Neon magenta for hints
    disabled: '#666666',     // Dim gray
  },

  // Borders & dividers
  border: {
    default: '#00F5FF',      // Neon cyan
    active: '#FF006E',       // Hot pink
    disabled: '#333333',     // Dark gray
  },

  // Shadows (for glow effect)
  glow: {
    cyan: 'rgba(0, 245, 255, 0.8)',
    pink: 'rgba(255, 0, 110, 0.8)',
    yellow: 'rgba(255, 255, 0, 0.8)',
    purple: 'rgba(176, 38, 255, 0.8)',
  }
};

// Superpower-specific colors for easy reference
export const SUPERPOWER_COLORS = {
  0: ARCADE_COLORS.text,        // Normal cells (white/default)
  1: ARCADE_COLORS.tank,        // Tank - white
  2: ARCADE_COLORS.spreader,    // Spreader - cyan
  3: ARCADE_COLORS.survivor,    // Survivor - yellow
  4: ARCADE_COLORS.ghost,       // Ghost - magenta
  5: ARCADE_COLORS.replicator,  // Replicator - orange
  6: ARCADE_COLORS.destroyer,   // Destroyer - red
  7: ARCADE_COLORS.hybrid,      // Hybrid - purple
};

/**
 * Default Lives Configuration for Superpower Types
 *
 * Lives System:
 * - Normal cells (type 0) have 0 lives = die immediately when death conditions met
 * - Superpower cells (types 1-7) have 1-5 lives = survive multiple death events
 * - Each time death conditions met, lives decrement by 1
 * - Cell actually dies when lives reach 0
 *
 * Balance Philosophy:
 * - Defensive types (Tank, Destroyer, Survivor) have more lives (3-5)
 * - Offensive/utility types (Spreader, Replicator, Ghost) have fewer lives (1-2)
 * - Hybrid balances offense and defense (3 lives)
 *
 * Note: These values are always loaded from code (not from stored settings)
 * to ensure users automatically receive balance updates
 */
export const DEFAULT_SUPERPOWER_LIVES: Record<number, number> = {
  0: 0,  // Normal cells - die immediately (standard Conway behavior)
  1: 3,  // Tank - medium durability (defensive role)
  2: 2,  // Spreader - low durability (offensive spread before dying)
  3: 5,  // Survivor - highest durability (ultimate endurance)
  4: 1,  // Ghost - ethereal (minimal lives, unpredictable)
  5: 2,  // Replicator - low durability (create offspring then die)
  6: 4,  // Destroyer - high durability (sustained assault)
  7: 3,  // Hybrid - medium durability (balanced capabilities)
};

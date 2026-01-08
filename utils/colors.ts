// Arcade color palette for Game of Strife
// 80's arcade aesthetic with neon colors on black

export const ARCADE_COLORS = {
  // Player colors
  player1: '#00F5FF',      // Neon cyan
  player2: '#FF006E',      // Hot pink

  // Superpower colors
  tank: '#FFFFFF',         // Bright white (unchanged - works well)
  spreader: '#00F5FF',     // Neon cyan (enhanced from current)
  survivor: '#FFFF00',     // Electric yellow (more vibrant)
  ghost: '#FF10F0',        // Neon magenta (more vibrant purple)
  replicator: '#FF6600',   // Bright orange (more saturated)
  destroyer: '#FF0000',    // Pure red (more intense)
  hybrid: '#B026FF',       // Electric purple (more vibrant)

  // UI colors
  background: '#000000',   // Pure black
  surface: '#1A0033',      // Deep purple-black
  gridLines: '#330066',    // Dark purple
  text: '#00F5FF',         // Neon cyan
  textSecondary: '#FF10F0', // Neon magenta
  accent: '#FFFF00',       // Electric yellow
  danger: '#FF0000',       // Pure red
  success: '#00FF00',      // Neon green
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

// Default superpower lives configuration
export const DEFAULT_SUPERPOWER_LIVES: Record<number, number> = {
  0: 1,  // Normal cells
  1: 3,  // Tank - medium durability
  2: 2,  // Spreader - low durability
  3: 5,  // Survivor - high durability
  4: 1,  // Ghost - ethereal (no extra lives)
  5: 2,  // Replicator - low durability
  6: 4,  // Destroyer - high durability
  7: 3,  // Hybrid - medium durability
};

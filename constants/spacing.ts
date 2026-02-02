// Strict 8pt grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const layout = {
  screenPadding: 24,
  cardPadding: 16,
  tabBarHeight: 80,
  headerHeight: 56,
  buttonHeight: 56,
};

// Animation spring configurations
export const springs = {
  // For buttons, quick responses
  snappy: {
    damping: 20,
    stiffness: 400,
    mass: 1,
  },
  // For page transitions, cards
  smooth: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
  // For large movements, dramatic reveals
  dramatic: {
    damping: 12,
    stiffness: 80,
    mass: 1,
  },
  // For bouncy elements
  bouncy: {
    damping: 8,
    stiffness: 200,
    mass: 0.8,
  },
  // For achievement unlocks
  unlock: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  // For progress fills
  progress: {
    damping: 25,
    stiffness: 100,
    mass: 1,
  },
  // For celebration moments
  celebration: {
    damping: 6,
    stiffness: 180,
    mass: 0.6,
  },
};

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Layout = typeof layout;
export type Springs = typeof springs;

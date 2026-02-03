export const lightColors = {
  // Backgrounds - Light mode with soft navy tint
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F5F7FA',
  bgTertiary: '#E8EDF5',
  bgCard: '#FFFFFF',
  bgCardHover: '#F0F4F8',

  // Gradient backgrounds
  bgGradientCenter: '#FFFFFF',
  bgGradientEdge: '#E8EDF5',

  // Borders
  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.04)',
  borderAccent: 'rgba(26, 31, 46, 0.3)',

  // Primary Accent - Deep Navy
  accent: '#1A1F2E',
  accentMuted: 'rgba(26, 31, 46, 0.12)',
  accentGlow: 'rgba(26, 31, 46, 0.3)',
  accentLight: '#242A3A',

  // Secondary Accent - Slate
  accentSecondary: '#3A4255',
  accentSecondaryMuted: 'rgba(58, 66, 85, 0.12)',
  accentSecondaryGlow: 'rgba(58, 66, 85, 0.3)',

  // Tertiary Accent - Cool Gray
  accentTertiary: '#4ECDC4',
  accentTertiaryMuted: 'rgba(78, 205, 196, 0.12)',

  // Semantic
  success: '#2ECC71',
  successMuted: 'rgba(46, 204, 113, 0.12)',
  error: '#E74C3C',
  errorMuted: 'rgba(231, 76, 60, 0.12)',
  warning: '#F39C12',
  warningMuted: 'rgba(243, 156, 18, 0.12)',

  // Text hierarchy
  textPrimary: '#1A1F2E',
  textSecondary: '#5A6070',
  textTertiary: '#8A90A0',
  textOnAccent: '#FFFFFF',

  // Overlay
  overlay: 'rgba(26, 31, 46, 0.85)',
  overlayLight: 'rgba(26, 31, 46, 0.6)',

  // Glass effects
  glassBg: 'rgba(0, 0, 0, 0.03)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',

  // Progress/Achievement
  progressTrack: 'rgba(0, 0, 0, 0.08)',
  progressFill: '#1A1F2E',
  streakGold: '#FFD700',

  // Gradient colors for accents
  gradientStart: '#1A1F2E',
  gradientEnd: '#0D1017',
};

export const darkColors = {
  // Backgrounds - Premium dark with subtle warmth
  bgPrimary: '#09090B',      // Rich near-black
  bgSecondary: '#131316',    // Elevated surface
  bgTertiary: '#1C1C21',     // Tertiary surface
  bgCard: '#141417',         // Card background
  bgCardHover: '#1A1A1F',    // Card hover state

  // Gradient backgrounds
  bgGradientCenter: '#141417',
  bgGradientEdge: '#09090B',

  // Borders - Subtle and refined
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderAccent: 'rgba(255, 255, 255, 0.15)',

  // Primary Accent - Soft white/silver
  accent: '#E4E4E7',         // Zinc-200
  accentMuted: 'rgba(228, 228, 231, 0.12)',
  accentGlow: 'rgba(255, 255, 255, 0.2)',
  accentLight: '#F4F4F5',    // Zinc-100

  // Secondary Accent - Muted silver
  accentSecondary: '#A1A1AA', // Zinc-400
  accentSecondaryMuted: 'rgba(161, 161, 170, 0.15)',
  accentSecondaryGlow: 'rgba(161, 161, 170, 0.25)',

  // Tertiary Accent - Subtle teal for highlights
  accentTertiary: '#5EEAD4', // Teal-300
  accentTertiaryMuted: 'rgba(94, 234, 212, 0.12)',

  // Semantic - Refined status colors
  success: '#34D399',        // Emerald-400
  successMuted: 'rgba(52, 211, 153, 0.15)',
  error: '#F87171',          // Red-400
  errorMuted: 'rgba(248, 113, 113, 0.15)',
  warning: '#FBBF24',        // Amber-400
  warningMuted: 'rgba(251, 191, 36, 0.15)',

  // Text hierarchy - High contrast for readability
  textPrimary: '#FAFAFA',    // Zinc-50
  textSecondary: '#A1A1AA',  // Zinc-400
  textTertiary: '#71717A',   // Zinc-500
  textOnAccent: '#09090B',   // Dark text on light accent
  textDisabled: '#3F3F46',   // Zinc-700

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.6)',

  // Glass effects - Refined translucency
  glassBg: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.06)',

  // Progress/Achievement
  progressTrack: 'rgba(255, 255, 255, 0.06)',
  progressFill: '#E4E4E7',   // Matches accent
  streakGold: '#FCD34D',     // Amber-300

  // Gradient colors for buttons
  gradientStart: '#27272A',  // Zinc-800
  gradientEnd: '#18181B',    // Zinc-900
};

// Default export for backward compatibility (light mode)
export const colors = lightColors;

export type Colors = typeof darkColors;

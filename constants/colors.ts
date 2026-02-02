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
  // Backgrounds - Dark mode with deep navy
  bgPrimary: '#0D1017',
  bgSecondary: '#141922',
  bgTertiary: '#1A1F2E',
  bgCard: '#1A1F2E',
  bgCardHover: '#242A3A',

  // Gradient backgrounds
  bgGradientCenter: '#1A1F2E',
  bgGradientEdge: '#0D1017',

  // Borders
  border: 'rgba(255, 255, 255, 0.10)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderAccent: 'rgba(36, 42, 58, 0.5)',

  // Primary Accent - Deep Navy
  accent: '#242A3A',
  accentMuted: 'rgba(36, 42, 58, 0.25)',
  accentGlow: 'rgba(36, 42, 58, 0.4)',
  accentLight: '#2E3647',

  // Secondary Accent - Slate
  accentSecondary: '#3A4255',
  accentSecondaryMuted: 'rgba(58, 66, 85, 0.25)',
  accentSecondaryGlow: 'rgba(58, 66, 85, 0.4)',

  // Tertiary Accent - Cool Gray
  accentTertiary: '#4ECDC4',
  accentTertiaryMuted: 'rgba(78, 205, 196, 0.15)',

  // Semantic
  success: '#2ECC71',
  successMuted: 'rgba(46, 204, 113, 0.15)',
  error: '#E74C3C',
  errorMuted: 'rgba(231, 76, 60, 0.15)',
  warning: '#F39C12',
  warningMuted: 'rgba(243, 156, 18, 0.15)',

  // Text hierarchy
  textPrimary: '#FDFCFA',
  textSecondary: '#B8B4AC',
  textTertiary: '#7A756D',
  textOnAccent: '#FFFFFF',

  // Overlay
  overlay: 'rgba(13, 16, 23, 0.85)',
  overlayLight: 'rgba(13, 16, 23, 0.6)',

  // Glass effects
  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Progress/Achievement
  progressTrack: 'rgba(255, 255, 255, 0.08)',
  progressFill: '#242A3A',
  streakGold: '#FFD700',

  // Gradient colors for accents
  gradientStart: '#1A1F2E',
  gradientEnd: '#0D1017',
};

// Default export for backward compatibility (dark mode)
export const colors = darkColors;

export type Colors = typeof darkColors;

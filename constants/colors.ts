export const colors = {
  // Backgrounds - Deep dark foundation
  bgPrimary: '#0A0A0A',
  bgSecondary: '#111111',
  bgTertiary: '#1A1A1A',
  bgCard: 'rgba(255, 255, 255, 0.05)',
  bgCardHover: 'rgba(255, 255, 255, 0.08)',

  // Glass effect - Cool frosted glass
  glassBg: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassLight: 'rgba(255, 255, 255, 0.15)',

  // Text - Clean white hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',

  // Accents - Electric cyan/teal
  accentPrimary: '#00D4FF', // Electric cyan
  accentSecondary: '#00BFA5', // Teal
  accentSuccess: '#00E676', // Bright green
  accentWarning: '#FFAB40', // Amber
  accentError: '#FF5252', // Red

  // Gradients - Electric cyan to teal
  gradientPrimary: ['#00D4FF', '#00BFA5'] as const,
  gradientSubtle: ['rgba(0, 212, 255, 0.15)', 'rgba(0, 191, 165, 0.15)'] as const,
  gradientDark: ['rgba(0, 212, 255, 0.08)', 'rgba(0, 191, 165, 0.08)'] as const,

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

export type Colors = typeof colors;

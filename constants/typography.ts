import { TextStyle } from 'react-native';

export const typography = {
  // Display - Big headlines with tight tracking (increased for impact)
  displayLarge: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 52,
  } as TextStyle,
  displayMedium: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
  } as TextStyle,

  // Headlines - Negative tracking for SF Pro feel
  headlineLarge: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 32,
  } as TextStyle,
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 28,
  } as TextStyle,

  // Body - Slight negative tracking
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 24,
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 22,
  } as TextStyle,
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  } as TextStyle,

  // Labels - NO uppercase (removed textTransform)
  labelLarge: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  } as TextStyle,
  labelMedium: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 20,
  } as TextStyle,
  labelSmall: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 18,
  } as TextStyle,

  // Caption - For tertiary text
  caption: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  } as TextStyle,

  // Motivational - For encouraging micro-copy
  motivational: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 20,
  } as TextStyle,

  // PRO badge - ONLY place uppercase is allowed
  proBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 16,
    textTransform: 'uppercase',
  } as TextStyle,
};

export type Typography = typeof typography;

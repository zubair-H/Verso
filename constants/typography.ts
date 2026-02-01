import { TextStyle } from 'react-native';

export const typography = {
  // Display - Big headlines
  displayLarge: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 48,
  } as TextStyle,
  displayMedium: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 40,
  } as TextStyle,

  // Headlines
  headlineLarge: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 32,
  } as TextStyle,
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 28,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 22,
  } as TextStyle,
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  } as TextStyle,

  // Labels
  labelLarge: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 20,
  } as TextStyle,
  labelMedium: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    lineHeight: 18,
  } as TextStyle,
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 16,
  } as TextStyle,
};

export type Typography = typeof typography;

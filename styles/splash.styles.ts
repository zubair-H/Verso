import { StyleSheet } from 'react-native';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import type { Colors } from '@/constants/colors';

export const createSplashStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    logoContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 100,
    },
    masonryContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    },
    masonry: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 14,
    },
    masonryColumn: {
      flex: 1,
      gap: 10,
    },
    imageCard: {
      borderRadius: 16,
      marginBottom: 10,
      overflow: 'hidden',
      backgroundColor: colors.bgTertiary,
    },
    bottomSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: layout.screenPadding,
      zIndex: 50,
    },
    bottomPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bgSecondary,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: layout.screenPadding,
      paddingTop: 32,
      zIndex: 50,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    textContent: {
      alignItems: 'center',
      marginBottom: 20,
    },
    typingContainer: {
      alignItems: 'center',
      overflow: 'hidden',
    },
    typingClip: {
      overflow: 'hidden',
    },
    headline: {
      ...typography.headlineLarge,
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subline: {
      ...typography.bodyMedium,
      fontSize: 16,
      color: colors.textSecondary,
    },
    button: {
      width: '100%',
      height: 56,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    buttonText: {
      ...typography.labelLarge,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textOnAccent,
    },
  });
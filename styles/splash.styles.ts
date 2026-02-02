import { StyleSheet } from 'react-native';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import type { Colors } from '@/constants/colors';

export const createSplashStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
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
      backgroundColor: '#E5E5E5',
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
      backgroundColor: colors.bgPrimary,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: layout.screenPadding,
      paddingTop: 32,
      zIndex: 50,
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
      textShadowColor: 'rgba(0, 0, 0, 0.15)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    subline: {
      ...typography.bodyMedium,
      fontSize: 16,
      color: colors.textSecondary,
      textShadowColor: 'rgba(0, 0, 0, 0.15)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    button: {
      width: '100%',
      height: 56,
      backgroundColor: colors.textPrimary,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      ...typography.labelLarge,
      color: colors.bgPrimary,
    },
  });
import { StyleSheet } from 'react-native';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import type { Colors } from '@/constants/colors';

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: 80,
    },
    cardsSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 80,
    },
    cardsWrapper: {
      width: 280,
      height: 340,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backCardLeft: {
      position: 'absolute',
      width: 180,
      height: 240,
      backgroundColor: colors.bgTertiary,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backCardRight: {
      position: 'absolute',
      width: 180,
      height: 240,
      backgroundColor: colors.bgTertiary,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mainCard: {
      width: 180,
      height: 240,
      backgroundColor: colors.textPrimary,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    cardIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    cardText: {
      ...typography.headlineMedium,
      color: colors.bgPrimary,
      letterSpacing: -0.3,
    },
    statementContainer: {
      alignItems: 'center',
      marginTop: 60,
      paddingHorizontal: 20,
    },
    statement: {
      ...typography.bodyLarge,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 24,
    },
    starsContainer: {
      position: 'absolute',
      width: 320,
      height: 380,
    },
    star1: {
      position: 'absolute',
      top: 20,
      alignSelf: 'center',
      left: '45%',
    },
    star3: {
      position: 'absolute',
      bottom: 20,
      left: -15,
    },
    star4: {
      position: 'absolute',
      bottom: 40,
      right: -10,
    },
    bottomSection: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 56,
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

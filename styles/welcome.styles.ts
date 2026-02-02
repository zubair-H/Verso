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
    centerSection: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    textBlock: {
      alignItems: 'flex-start',
    },
    cardsWrapper: {
      width: 280,
      height: 340,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ringsContainer: {
      width: 240,
      height: 240,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    backCardLeft: {
      position: 'absolute',
      width: 180,
      height: 240,
      backgroundColor: colors.bgTertiary,
      borderRadius: 24,
      overflow: 'hidden',
    },
    backCardRight: {
      position: 'absolute',
      width: 180,
      height: 240,
      backgroundColor: colors.bgTertiary,
      borderRadius: 24,
      overflow: 'hidden',
    },
    mainCard: {
      width: 180,
      height: 240,
      backgroundColor: colors.bgTertiary,
      borderRadius: 24,
      overflow: 'hidden',
      zIndex: 10,
    },
    cardImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    cardOverlay: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
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
    headline: {
      ...typography.displayLarge,
      color: '#E0EAF5', // Light blue-tinged white for blurred background
      lineHeight: 44,
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 10,
    },
    subheadline: {
      ...typography.bodyLarge,
      color: '#B8CCDF', // Softer blue-tinged gray
      marginTop: 16,
      textShadowColor: 'rgba(0, 0, 0, 0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 8,
    },
    typingContainer: {
      alignItems: 'center',
      overflow: 'hidden',
    },
    typingClip: {
      overflow: 'hidden',
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
      backgroundColor: '#E0EAF5', // Light blue-tinged white to match headline
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      ...typography.labelLarge,
      color: '#1A1F26', // Dark text for contrast on light button
    },
  });

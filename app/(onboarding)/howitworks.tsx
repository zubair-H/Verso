import React, { useEffect, useRef, useCallback } from 'react';
import { Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);
const LOGO_SIZE_SMALL = 220;

const CARD_DATA = [
  { icon: 'camera' as const, title: 'Selfie', desc: 'Snap a quick photo' },
  { icon: 'users' as const, title: 'Inspo', desc: 'Browse celeb looks' },
  { icon: 'scissors' as const, title: 'Attributes', desc: 'Fine-tune details' },
  { icon: 'zap' as const, title: 'Magic', desc: 'See the result' },
];

export default function HowItWorksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Entry animations
  const headlineEntry = useSharedValue(0);
  const subtitleEntry = useSharedValue(0);
  const cardEntries = useRef([
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ]).current;
  const buttonEntry = useSharedValue(0);

  // Exit animation
  const exitProgress = useSharedValue(0);
  const isExiting = useRef(false);

  useEffect(() => {
    const SPRING = { damping: 22, stiffness: 90 };

    headlineEntry.value = withDelay(300, withSpring(1, SPRING));
    subtitleEntry.value = withDelay(450, withSpring(1, { damping: 24, stiffness: 100 }));

    cardEntries.forEach((entry, i) => {
      entry.value = withDelay(600 + i * 150, withSpring(1, SPRING));
    });

    buttonEntry.value = withDelay(1200, withSpring(1, { damping: 20, stiffness: 85 }));
  }, []);

  const handleContinue = useCallback(() => {
    if (isExiting.current) return;
    isExiting.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    exitProgress.value = withTiming(1, { duration: 400, easing: SMOOTH_EASE }, (finished) => {
      if (finished) {
        runOnJS(router.push)('/(onboarding)/demo1' as any);
      }
    });
  }, []);

  // Animated styles
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headlineEntry.value, [0, 1], [0, 1]) * (1 - exitProgress.value),
    transform: [
      { translateY: interpolate(headlineEntry.value, [0, 1], [20, 0]) },
      { translateY: interpolate(exitProgress.value, [0, 1], [0, -10]) },
    ],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(subtitleEntry.value, [0, 1], [0, 1]) * (1 - exitProgress.value),
    transform: [
      { translateY: interpolate(subtitleEntry.value, [0, 1], [14, 0]) },
    ],
  }));

  const cardAnimStyles = cardEntries.map((entry, i) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(entry.value, [0, 1], [0, 1]) * (1 - exitProgress.value),
      transform: [
        { translateY: interpolate(entry.value, [0, 1], [30, 0]) },
        { scale: interpolate(entry.value, [0, 1], [0.85, 1]) },
      ],
    }))
  );

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(buttonEntry.value, [0, 1], [0, 1]) * (1 - exitProgress.value),
    transform: [
      { translateY: interpolate(buttonEntry.value, [0, 1], [30, 0]) },
    ],
  }));

  const buttonScale = useSharedValue(1);
  const buttonPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const styles = createStyles(colors, insets);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgSecondary, colors.bgTertiary, colors.bgPrimary]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.logoSpacer} />

        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Here's how it works
          </Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            4 simple steps to your new look
          </Text>
        </Animated.View>

        <View style={styles.cardsContainer}>
          {CARD_DATA.map((card, i) => (
            <Animated.View
              key={card.title}
              style={[
                styles.card,
                { backgroundColor: colors.bgCard, shadowOpacity: 0.08 },
                cardAnimStyles[i],
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentMuted }]}>
                <Feather name={card.icon} size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {card.title}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.textTertiary }]}>
                  {card.desc}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={() => { buttonScale.value = withSpring(0.97, { damping: 20, stiffness: 400 }); }}
          onPressOut={() => { buttonScale.value = withSpring(1, { damping: 20, stiffness: 400 }); }}
          style={buttonPressStyle}
        >
          <LinearGradient
            colors={[colors.accentLight, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={[styles.buttonText, { color: colors.textOnAccent }]}>
              Continue
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgTertiary,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    logoSpacer: {
      marginTop: insets.top - 40,
      height: LOGO_SIZE_SMALL,
    },
    headlineContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 34,
      fontWeight: '400',
      textAlign: 'center',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...typography.bodyLarge,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 0,
    },
    cardsContainer: {
      width: '100%',
      marginTop: 32,
      gap: 12,
    },
    card: {
      width: '100%',
      height: 72,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 16,
      elevation: 6,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textWrap: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    cardDesc: {
      fontSize: 11,
      fontWeight: '400',
      marginTop: 2,
    },
    bottomSection: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Math.max(insets.bottom, 16) + 24,
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
    },
  });

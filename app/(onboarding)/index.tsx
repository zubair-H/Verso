import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = 280;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);

// Card dimensions
const CARD_WIDTH = 152;
const CARD_HEIGHT = 200;
const CARDS_CONTAINER_WIDTH = 270;
const CARDS_CONTAINER_HEIGHT = 300;

// Particle configuration - 8 particles flowing between cards
const NUM_PARTICLES = 8;

// Bezier curve for particle path (from left card center to right card center)
const FROM_X = 76;
const FROM_Y = 116;
const TO_X = 194;
const TO_Y = 136;
const MID_X = (FROM_X + TO_X) / 2;
const MID_Y = (FROM_Y + TO_Y) / 2 - 20;

function getPointOnCurve(t: number) {
  'worklet';
  return {
    x: (1 - t) * (1 - t) * FROM_X + 2 * (1 - t) * t * MID_X + t * t * TO_X,
    y: (1 - t) * (1 - t) * FROM_Y + 2 * (1 - t) * t * MID_Y + t * t * TO_Y,
  };
}

// Single animated particle
function Particle({
  index,
  exitProgress,
  entryProgress,
}: {
  index: number;
  exitProgress: SharedValue<number>;
  entryProgress: SharedValue<number>;
}) {
  const progress = useSharedValue(index / NUM_PARTICLES);
  const offsetY = ((index % 3) - 1) * 5;
  const size = 2 + (index % 3) * 0.4;

  useEffect(() => {
    // Animate particle along the path continuously (delayed to start after logo animation)
    progress.value = withDelay(
      2200 + index * 80,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const pt = getPointOnCurve(t);
    const edgeFade = Math.sin(t * Math.PI);
    const entryOpacity = interpolate(entryProgress.value, [0, 1], [0, 0.25]);
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);

    return {
      position: 'absolute',
      left: pt.x - size,
      top: pt.y + offsetY - size,
      width: size * 2,
      height: size * 2,
      borderRadius: size,
      backgroundColor: 'rgba(26,29,43,0.18)',
      opacity: edgeFade * entryOpacity * exitOpacity,
    };
  });

  return <Animated.View style={animatedStyle} />;
}

export default function IntroScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Wait for logo animation to complete (~1800ms) before showing content
  const LOGO_ANIMATION_DELAY = 1900;

  // Entry animations
  const cardLeftEntry = useSharedValue(0);
  const cardRightEntry = useSharedValue(0);
  const headlineEntry = useSharedValue(0);
  const headlineTranslateY = useSharedValue(14);
  const buttonEntry = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  const particleEntry = useSharedValue(0);

  // Exit animation
  const exitProgress = useSharedValue(0);
  const contentExitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    // Left card slides in from left (after logo animation)
    cardLeftEntry.value = withDelay(
      LOGO_ANIMATION_DELAY,
      withTiming(1, { duration: 900, easing: EASE })
    );

    // Right card slides in from right (slightly staggered)
    cardRightEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 150,
      withTiming(1, { duration: 900, easing: EASE })
    );

    // Particles fade in
    particleEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 300,
      withTiming(1, { duration: 800, easing: SMOOTH_EASE })
    );

    // Headline fades up
    headlineEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 550,
      withTiming(1, { duration: 800, easing: EASE })
    );
    headlineTranslateY.value = withDelay(
      LOGO_ANIMATION_DELAY + 550,
      withSpring(0, { damping: 22, stiffness: 85 })
    );

    // Button appears
    buttonEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 700,
      withTiming(1, { duration: 500, easing: SMOOTH_EASE })
    );
    buttonTranslateY.value = withDelay(
      LOGO_ANIMATION_DELAY + 700,
      withSpring(0, { damping: 20, stiffness: 90 })
    );
  }, []);

  // Card styles
  const cardLeftStyle = useAnimatedStyle(() => {
    const entryOpacity = interpolate(cardLeftEntry.value, [0, 1], [0, 1]);
    const entryTranslateX = interpolate(cardLeftEntry.value, [0, 1], [-25, 0]);
    const entryScale = interpolate(cardLeftEntry.value, [0, 1], [0.92, 1]);
    const exitOpacity = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(contentExitProgress.value, [0, 1], [0, -40]);

    return {
      opacity: entryOpacity * exitOpacity,
      transform: [
        { translateX: entryTranslateX + exitTranslateX },
        { rotate: '-6deg' },
        { scale: entryScale },
      ],
    };
  });

  const cardRightStyle = useAnimatedStyle(() => {
    const entryOpacity = interpolate(cardRightEntry.value, [0, 1], [0, 1]);
    const entryTranslateX = interpolate(cardRightEntry.value, [0, 1], [25, 0]);
    const entryScale = interpolate(cardRightEntry.value, [0, 1], [0.92, 1]);
    const exitOpacity = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(contentExitProgress.value, [0, 1], [0, 40]);

    return {
      opacity: entryOpacity * exitOpacity,
      transform: [
        { translateX: entryTranslateX + exitTranslateX },
        { rotate: '4deg' },
        { scale: entryScale },
      ],
    };
  });

  const headlineStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTranslateY = interpolate(contentExitProgress.value, [0, 1], [0, -20]);
    return {
      opacity: headlineEntry.value * exitOpacity,
      transform: [{ translateY: headlineTranslateY.value + exitTranslateY }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTranslateY = interpolate(contentExitProgress.value, [0, 1], [0, 40]);
    return {
      opacity: buttonEntry.value * exitOpacity,
      transform: [
        { translateY: buttonTranslateY.value + exitTranslateY },
        { scale: buttonScale.value },
      ],
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(contentExitProgress.value, [0, 0.7], [1, 0]);
    return { opacity: exitOpacity };
  });

  const handleGetStarted = () => {
    if (isExiting.value) return;
    isExiting.value = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const EXIT_DURATION = 450;
    const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1);

    // Animate content out
    contentExitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: EASE_OUT });
    exitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: EASE_OUT });

    // Navigate after exit animation completes
    setTimeout(() => {
      router.push('/(onboarding)/welcome');
    }, EXIT_DURATION - 100);
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={isDark ? [colors.bgSecondary, colors.bgTertiary, colors.bgPrimary] : ['#F3F4F6', '#F5F6F8', '#F8F9FB']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo spacer - actual logo is in layout */}
        <View style={styles.logoSpacer} />

        {/* Hero section with cards */}
        <View style={styles.hero}>
          <View style={styles.cardsContainer}>
            {/* Left card - "Pick a style" */}
            <Animated.View style={[styles.card, styles.cardLeft, cardLeftStyle]}>
              <View style={[styles.cardAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' }]}>
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={isDark ? colors.textSecondary : '#1a1d2b'}
                />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>
                Pick a style
              </Text>
              <Text style={[styles.cardDesc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.3)' }]}>
                Choose any celebrity look
              </Text>
            </Animated.View>

            {/* Right card - "See it on you" */}
            <Animated.View style={[styles.card, styles.cardRight, cardRightStyle]}>
              <View style={[styles.cardAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' }]}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={isDark ? colors.textSecondary : '#1a1d2b'}
                />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>
                See it on you
              </Text>
              <Text style={[styles.cardDesc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.3)' }]}>
                Try before you commit
              </Text>
            </Animated.View>

            {/* Animated particles flowing between cards */}
            <View style={styles.particleLayer}>
              {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
                <Particle
                  key={i}
                  index={i}
                  exitProgress={exitProgress}
                  entryProgress={particleEntry}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Headline */}
        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>Try any look.</Text>
          <Text style={[styles.headline, styles.headlineDim]}>Risk nothing.</Text>
        </Animated.View>
      </View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={isDark ? [colors.accentLight, colors.accent] : ['#1A1F2E', '#0D1017']}
            locations={[0.68, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any, insets: any, isDark: boolean) =>
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
      marginTop: 80,
      height: LOGO_SIZE,
      marginBottom: 10,
    },
    hero: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    cardsContainer: {
      width: CARDS_CONTAINER_WIDTH,
      height: CARDS_CONTAINER_HEIGHT,
      position: 'relative',
    },
    card: {
      position: 'absolute',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.bgSecondary : '#fff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 40,
      elevation: 8,
    },
    cardLeft: {
      left: 0,
      top: 16,
      zIndex: 2,
    },
    cardRight: {
      right: 0,
      top: 36,
      zIndex: 3,
    },
    cardAvatar: {
      width: 52,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    cardDesc: {
      fontSize: 9,
      fontWeight: '400',
      textAlign: 'center',
      paddingHorizontal: 14,
      lineHeight: 13,
    },
    particleLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: CARDS_CONTAINER_WIDTH,
      height: CARDS_CONTAINER_HEIGHT,
      zIndex: 4,
    },
    headlineContainer: {
      alignItems: 'center',
      marginBottom: 38,
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 38,
      fontWeight: '400',
      color: isDark ? colors.textPrimary : '#1a1d2b',
      textAlign: 'center',
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    headlineDim: {
      color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,29,43,0.2)',
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
      color: colors.textOnAccent,
    },
  });

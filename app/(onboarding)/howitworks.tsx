import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { AttributesCarousel } from '@/components/ui';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const logoImage = require('@/assets/ios-tinted.png');

// Logo sizes - shrinks from page 1 size to page 4 size
const LOGO_SIZE_START = 280; // Same as page 1
const LOGO_SIZE_END = 220;   // Same as page 4

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Premium spring configs
const SMOOTH_SPRING = { damping: 20, stiffness: 90, mass: 1 };

// Transformation attributes that explain how the app works
const TRANSFORMATIONS = [
  { from: 'Your hair', to: 'Celebrity style', icon: 'cut-outline' as const },
  { from: 'Your outfit', to: 'Designer look', icon: 'shirt-outline' as const },
  { from: 'Your color', to: 'New palette', icon: 'color-palette-outline' as const },
];

export default function HowItWorksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Logo animation - moves up and shrinks
  const logoProgress = useSharedValue(0);

  // Content animations
  const headlineOpacity = useSharedValue(0);
  const headlineTranslateY = useSharedValue(20);

  // Transformation card animations (staggered)
  const card1Progress = useSharedValue(0);
  const card2Progress = useSharedValue(0);
  const card3Progress = useSharedValue(0);

  // Arrow pulse animation
  const arrowPulse = useSharedValue(1);

  // Button animations
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const PREMIUM_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
    const DECEL_EASE = Easing.out(Easing.exp);

    // Logo starts at page 1 position (top: 80), waits for page transition, then moves up
    const logoStartDelay = 500; // Wait for page transition to settle
    const logoDuration = 800;

    // 1. Logo moves up after brief pause (feels like continuation from page 1)
    logoProgress.value = withDelay(
      logoStartDelay,
      withTiming(1, { duration: logoDuration, easing: Easing.out(Easing.cubic) })
    );

    // 2. Headline appears as logo is moving
    const headlineDelay = logoStartDelay + 200;
    headlineOpacity.value = withDelay(headlineDelay, withTiming(1, { duration: 500, easing: PREMIUM_EASE }));
    headlineTranslateY.value = withDelay(headlineDelay, withSpring(0, SMOOTH_SPRING));

    // 3. Cards animate in with stagger
    const cardsStartDelay = headlineDelay + 200;
    card1Progress.value = withDelay(cardsStartDelay, withSpring(1, SMOOTH_SPRING));
    card2Progress.value = withDelay(cardsStartDelay + 150, withSpring(1, SMOOTH_SPRING));
    card3Progress.value = withDelay(cardsStartDelay + 300, withSpring(1, SMOOTH_SPRING));

    // 4. Arrow pulse starts after cards appear
    arrowPulse.value = withDelay(
      cardsStartDelay + 600,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // 5. Button springs up last
    const buttonDelay = cardsStartDelay + 400;
    buttonOpacity.value = withDelay(buttonDelay, withTiming(1, { duration: 500, easing: DECEL_EASE }));
    buttonTranslateY.value = withDelay(buttonDelay, withSpring(0, SMOOTH_SPRING));
  }, []);

  // Logo animated style - moves up and shrinks to page 4 size
  // Note: scaling from center shifts visual position, so we compensate
  // Scale offset = (280 - 220) / 2 = 30px
  const logoContainerStyle = useAnimatedStyle(() => {
    const scaleOffset = (LOGO_SIZE_START - LOGO_SIZE_END) / 2; // 30px

    const top = interpolate(
      logoProgress.value,
      [0, 1],
      [80, insets.top - 60 - scaleOffset] // Compensate for scale center offset
    );

    const scale = interpolate(
      logoProgress.value,
      [0, 1],
      [1, LOGO_SIZE_END / LOGO_SIZE_START] // Shrink from 280 to 220
    );

    return {
      top,
      transform: [{ scale }],
    };
  });

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineTranslateY.value }],
  }));

  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Progress.value,
    transform: [
      { translateY: interpolate(card1Progress.value, [0, 1], [30, 0]) },
      { scale: interpolate(card1Progress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Progress.value,
    transform: [
      { translateY: interpolate(card2Progress.value, [0, 1], [30, 0]) },
      { scale: interpolate(card2Progress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Progress.value,
    transform: [
      { translateY: interpolate(card3Progress.value, [0, 1], [30, 0]) },
      { scale: interpolate(card3Progress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const cardStyles = [card1Style, card2Style, card3Style];

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: arrowPulse.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { translateY: buttonTranslateY.value },
      { scale: buttonScale.value },
    ],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/splash');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <View style={styles.container}>
      {/* Attributes carousel background with blur */}
      <AttributesCarousel showBlur blurIntensity={100} blurTint="light" />

      {/* Logo - animates from page 1 position/size to page 4 position/size */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        <Image
          source={logoImage}
          style={{ width: LOGO_SIZE_START, height: LOGO_SIZE_START }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Content area */}
      <View style={styles.content}>
        {/* Headline */}
        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>How it works</Text>
          <Text style={styles.subheadline}>
            Pick any attribute. See it transform into celebrity styles.
          </Text>
        </Animated.View>

        {/* Transformation cards */}
        <View style={styles.cardsContainer}>
          {TRANSFORMATIONS.map((transform, index) => (
            <Animated.View
              key={transform.from}
              style={[styles.transformCard, cardStyles[index]]}
            >
              <View style={styles.transformRow}>
                {/* From */}
                <View style={styles.attributeBox}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.bgTertiary }]}>
                    <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.attributeLabel}>{transform.from}</Text>
                </View>

                {/* Arrow */}
                <Animated.View style={[styles.arrowContainer, arrowStyle]}>
                  <Ionicons name="arrow-forward" size={20} color={colors.accent} />
                </Animated.View>

                {/* To */}
                <View style={styles.attributeBox}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name={transform.icon} size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.attributeLabel, { color: colors.accent }]}>
                    {transform.to}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={['#1A1F2E', '#0D1017']}
            locations={[0.68, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
      backgroundColor: '#FFFFFF',
    },
    logoContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 100,
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: insets.top + LOGO_SIZE_END - 40, // Account for logo at top (after shrink)
    },
    headlineContainer: {
      marginBottom: 24,
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 32,
      fontWeight: '700',
      color: '#1A2B42',
      letterSpacing: -0.5,
    },
    subheadline: {
      ...typography.bodyLarge,
      fontSize: 16,
      color: '#5A6B7D',
      marginTop: 8,
      lineHeight: 22,
    },
    cardsContainer: {
      gap: 14,
    },
    transformCard: {
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.xl,
      padding: 18,
    },
    transformRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    attributeBox: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attributeLabel: {
      ...typography.labelSmall,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    arrowContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 8,
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
      color: '#FFFFFF',
    },
  });

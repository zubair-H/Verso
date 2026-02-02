import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Image, StyleSheet, Dimensions } from 'react-native';
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const logoImage = require('@/assets/ios-tinted.png');
const LOGO_SIZE = 280;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Premium easing - smooth deceleration
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);
const SOFT_SPRING = { damping: 20, stiffness: 90, mass: 0.8 };

// Bubble configurations
const BUBBLES = [
  { size: 180, x: -60, y: 80, color: '#4A90D9', opacity: 0.12, duration: 4000, delay: 0 },
  { size: 120, x: SCREEN_WIDTH - 80, y: 150, color: '#7BB3E0', opacity: 0.1, duration: 5000, delay: 200 },
  { size: 200, x: SCREEN_WIDTH / 2 - 100, y: SCREEN_HEIGHT * 0.35, color: '#5A9FE0', opacity: 0.08, duration: 6000, delay: 400 },
  { size: 90, x: 30, y: SCREEN_HEIGHT * 0.5, color: '#8EC5F0', opacity: 0.1, duration: 4500, delay: 100 },
  { size: 140, x: SCREEN_WIDTH - 120, y: SCREEN_HEIGHT * 0.55, color: '#6AADE8', opacity: 0.09, duration: 5500, delay: 300 },
  { size: 100, x: SCREEN_WIDTH / 2 + 40, y: SCREEN_HEIGHT * 0.7, color: '#A0D0F5', opacity: 0.08, duration: 4800, delay: 500 },
];

// Floating bubble component
function FloatingBubble({
  size, x, y, color, opacity, duration, delay
}: {
  size: number; x: number; y: number; color: string; opacity: number; duration: number; delay: number;
}) {
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);

  useEffect(() => {
    // Vertical float
    floatY.value = withDelay(delay, withRepeat(
      withTiming(20, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    ));
    // Horizontal drift (slower, smaller movement)
    floatX.value = withDelay(delay + 500, withRepeat(
      withTiming(12, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { translateX: floatX.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Logo animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const logoTranslateY = useSharedValue(20);

  // Text animation values
  const tagline1Opacity = useSharedValue(0);
  const tagline1TranslateY = useSharedValue(24);
  const tagline2Opacity = useSharedValue(0);
  const tagline2TranslateY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);

  // Button animation values
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Logo entrance - smooth and confident
    logoOpacity.value = withDelay(150, withTiming(1, { duration: 700, easing: SMOOTH_EASE }));
    logoScale.value = withDelay(150, withSpring(1, SOFT_SPRING));
    logoTranslateY.value = withDelay(150, withSpring(0, SOFT_SPRING));

    // Tagline line 1 - elegant fade up
    tagline1Opacity.value = withDelay(550, withTiming(1, { duration: 600, easing: SMOOTH_EASE }));
    tagline1TranslateY.value = withDelay(550, withSpring(0, { damping: 22, stiffness: 85 }));

    // Tagline line 2 - slight stagger
    tagline2Opacity.value = withDelay(700, withTiming(1, { duration: 600, easing: SMOOTH_EASE }));
    tagline2TranslateY.value = withDelay(700, withSpring(0, { damping: 22, stiffness: 85 }));

    // Subtitle - subtle appearance
    subtitleOpacity.value = withDelay(950, withTiming(1, { duration: 650, easing: SMOOTH_EASE }));
    subtitleTranslateY.value = withDelay(950, withSpring(0, { damping: 24, stiffness: 80 }));

    // Button - confident entrance
    buttonOpacity.value = withDelay(1150, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
    buttonTranslateY.value = withDelay(1150, withSpring(0, { damping: 20, stiffness: 90 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
      { scale: logoScale.value },
    ],
  }));

  const tagline1Style = useAnimatedStyle(() => ({
    opacity: tagline1Opacity.value,
    transform: [{ translateY: tagline1TranslateY.value }],
  }));

  const tagline2Style = useAnimatedStyle(() => ({
    opacity: tagline2Opacity.value,
    transform: [{ translateY: tagline2TranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { translateY: buttonTranslateY.value },
      { scale: buttonScale.value },
    ],
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/possibilities');
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
      {/* Subtle gradient background */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FBFF', '#F0F6FC']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating bubbles layer */}
      <View style={styles.bubblesLayer}>
        {BUBBLES.map((bubble, index) => (
          <FloatingBubble key={index} {...bubble} />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <Image
              source={logoImage}
              style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Text content */}
        <View style={styles.textSection}>
          <View style={styles.taglineContainer}>
            <Animated.View style={tagline1Style}>
              <Text style={styles.tagline}>Try any look.</Text>
            </Animated.View>
            <Animated.View style={tagline2Style}>
              <Text style={styles.tagline}>Risk nothing.</Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.subtitleContainer, subtitleStyle]}>
            <Text style={styles.subtitle}>
              See yourself in celebrity styles before you commit.
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={['#1A1F2E', '#0D1017']}
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

const createStyles = (_colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    bubblesLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    logoWrapper: {
      marginTop: 80,
      marginBottom: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoContainer: {
      zIndex: 1,
    },
    textSection: {
      alignItems: 'center',
    },
    taglineContainer: {
      alignItems: 'center',
    },
    tagline: {
      ...typography.displayLarge,
      fontSize: 36,
      fontWeight: '700',
      color: '#1A2B42',
      textAlign: 'center',
      lineHeight: 44,
      letterSpacing: -0.8,
    },
    subtitleContainer: {
      marginTop: 20,
      paddingHorizontal: 24,
    },
    subtitle: {
      ...typography.bodyLarge,
      fontSize: 17,
      color: '#6B7C8E',
      textAlign: 'center',
      lineHeight: 24,
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

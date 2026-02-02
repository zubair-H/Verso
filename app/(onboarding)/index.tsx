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
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const logoImage = require('@/assets/ios-tinted.png');
const LOGO_SIZE = 280;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Premium spring configs
const SMOOTH_SPRING = { damping: 20, stiffness: 90, mass: 1 };
const BOUNCY_SPRING = { damping: 12, stiffness: 120, mass: 0.8 };
const GENTLE_SPRING = { damping: 25, stiffness: 70, mass: 1.2 };

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values - Logo
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const logoTranslateY = useSharedValue(40);
  const logoRotate = useSharedValue(-8);

  // Animation values - Text lines (staggered)
  const tagline1Opacity = useSharedValue(0);
  const tagline1TranslateY = useSharedValue(30);
  const tagline2Opacity = useSharedValue(0);
  const tagline2TranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(25);

  // Animation values - Button
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const PREMIUM_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
    const DECEL_EASE = Easing.out(Easing.exp);

    // Logo: dramatic entrance with rotation settling
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 800, easing: PREMIUM_EASE }));
    logoScale.value = withDelay(100, withSpring(1, BOUNCY_SPRING));
    logoTranslateY.value = withDelay(100, withSpring(0, SMOOTH_SPRING));
    logoRotate.value = withDelay(100, withSequence(
      withSpring(2, { damping: 8, stiffness: 150 }),
      withSpring(0, { damping: 15, stiffness: 100 })
    ));

    // Tagline line 1: slide up with fade
    tagline1Opacity.value = withDelay(500, withTiming(1, { duration: 600, easing: PREMIUM_EASE }));
    tagline1TranslateY.value = withDelay(500, withSpring(0, GENTLE_SPRING));

    // Tagline line 2: staggered after line 1
    tagline2Opacity.value = withDelay(650, withTiming(1, { duration: 600, easing: PREMIUM_EASE }));
    tagline2TranslateY.value = withDelay(650, withSpring(0, GENTLE_SPRING));

    // Subtitle: subtle slide up
    subtitleOpacity.value = withDelay(900, withTiming(1, { duration: 700, easing: DECEL_EASE }));
    subtitleTranslateY.value = withDelay(900, withSpring(0, GENTLE_SPRING));

    // Button: spring up from bottom
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500, easing: PREMIUM_EASE }));
    buttonTranslateY.value = withDelay(1200, withSpring(0, SMOOTH_SPRING));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
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
    router.push('/(onboarding)/howitworks');
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
      {/* White and blue tinge gradient background */}
      <LinearGradient
        colors={['#FFFFFF', '#F0F7FF', '#E8F4FD']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={logoImage}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
        </Animated.View>

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
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    logoContainer: {
      marginTop: 80,
      marginBottom: 48,
    },
    textSection: {
      alignItems: 'center',
    },
    taglineContainer: {
      alignItems: 'center',
    },
    tagline: {
      ...typography.displayLarge,
      fontSize: 38,
      fontWeight: '700',
      color: '#1A2B42',
      textAlign: 'center',
      lineHeight: 46,
      letterSpacing: -1,
    },
    subtitleContainer: {
      marginTop: 20,
      paddingHorizontal: 20,
    },
    subtitle: {
      ...typography.bodyLarge,
      fontSize: 17,
      color: '#5A6B7D',
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

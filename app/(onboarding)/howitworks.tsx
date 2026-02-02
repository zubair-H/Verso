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
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { AttributesCarousel } from '@/components/ui';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const logoImage = require('@/assets/ios-tinted.png');

// Logo sizes - starts same as page 1/2, ends same as page 4
const LOGO_SIZE_START = 280;
const LOGO_SIZE_END = 220;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Smooth spring for elegant motion
const SMOOTH_SPRING = { damping: 22, stiffness: 85, mass: 1 };

// Timing configuration
const BASE_DELAY = 600;
const STEP_STAGGER = 400;
const SLIDE_DURATION = 500;

export default function HowItWorksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Logo animation
  const logoProgress = useSharedValue(0);

  // Content animations
  const titleProgress = useSharedValue(0);
  const step1Progress = useSharedValue(0);
  const step2Progress = useSharedValue(0);
  const step3Progress = useSharedValue(0);

  // Button animation
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);

    // Logo moves up and shrinks
    logoProgress.value = withDelay(
      300,
      withTiming(1, { duration: 700, easing: EASE })
    );

    // Title
    titleProgress.value = withDelay(
      BASE_DELAY,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Step 1
    step1Progress.value = withDelay(
      BASE_DELAY + STEP_STAGGER,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Step 2
    step2Progress.value = withDelay(
      BASE_DELAY + STEP_STAGGER * 2,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Step 3
    step3Progress.value = withDelay(
      BASE_DELAY + STEP_STAGGER * 3,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Button appears after all content
    const buttonDelay = BASE_DELAY + STEP_STAGGER * 3 + 300;
    buttonOpacity.value = withDelay(buttonDelay, withTiming(1, { duration: 400, easing: EASE }));
    buttonTranslateY.value = withDelay(buttonDelay, withSpring(0, SMOOTH_SPRING));
  }, []);

  // Logo style - starts at page 1/2 position (80), ends at page 4 position (insets.top - 60)
  const logoContainerStyle = useAnimatedStyle(() => {
    const scaleOffset = (LOGO_SIZE_START - LOGO_SIZE_END) / 2;
    // scaleOffset accounts for the scale transform shrinking the logo from center
    const top = interpolate(logoProgress.value, [0, 1], [80, insets.top - 60 - scaleOffset]);
    const scale = interpolate(logoProgress.value, [0, 1], [1, LOGO_SIZE_END / LOGO_SIZE_START]);
    return { top, transform: [{ scale }] };
  });

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleProgress.value,
    transform: [{ translateY: interpolate(titleProgress.value, [0, 1], [20, 0]) }],
  }));

  const step1Style = useAnimatedStyle(() => ({
    opacity: step1Progress.value,
    transform: [{ translateX: interpolate(step1Progress.value, [0, 1], [-40, 0]) }],
  }));

  const step2Style = useAnimatedStyle(() => ({
    opacity: step2Progress.value,
    transform: [{ translateX: interpolate(step2Progress.value, [0, 1], [40, 0]) }],
  }));

  const step3Style = useAnimatedStyle(() => ({
    opacity: step3Progress.value,
    transform: [{ translateX: interpolate(step3Progress.value, [0, 1], [-40, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }, { scale: buttonScale.value }],
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

      {/* Logo - animates from page 1/2 position to page 4 position */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        <Image
          source={logoImage}
          style={{ width: LOGO_SIZE_START, height: LOGO_SIZE_START }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.title}>Here's how it works</Text>
        </Animated.View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <Animated.View style={[styles.stepRow, step1Style]}>
            <View style={styles.stepIcon}>
              <Ionicons name="camera-outline" size={28} color="#4A90D9" />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Upload your photo</Text>
              <Text style={styles.stepDescription}>
                Choose a clear photo of yourself to get started
              </Text>
            </View>
          </Animated.View>

          {/* Step 2 */}
          <Animated.View style={[styles.stepRow, step2Style]}>
            <View style={styles.stepIcon}>
              <Ionicons name="sparkles-outline" size={28} color="#4A90D9" />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Generate your attributes</Text>
              <Text style={styles.stepDescription}>
                We'll analyze your features and create a personalized profile
              </Text>
            </View>
          </Animated.View>

          {/* Step 3 */}
          <Animated.View style={[styles.stepRow, step3Style]}>
            <View style={styles.stepIcon}>
              <Ionicons name="color-wand-outline" size={28} color="#4A90D9" />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Discover new looks</Text>
              <Text style={styles.stepDescription}>
                Try on celebrity styles and find what suits you best
              </Text>
            </View>
          </Animated.View>
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
      paddingTop: insets.top + LOGO_SIZE_END - 40,
      justifyContent: 'center',
    },
    titleContainer: {
      marginBottom: 40,
    },
    title: {
      ...typography.displayLarge,
      fontSize: 32,
      fontWeight: '700',
      color: '#1A2B42',
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    stepsContainer: {
      gap: 32,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
    },
    stepIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: '#F0F6FC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepTextContainer: {
      flex: 1,
      paddingTop: 4,
    },
    stepTitle: {
      ...typography.labelLarge,
      fontSize: 18,
      fontWeight: '600',
      color: '#1A2B42',
      marginBottom: 4,
    },
    stepDescription: {
      ...typography.bodyMedium,
      fontSize: 15,
      color: '#6B7C8E',
      lineHeight: 21,
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

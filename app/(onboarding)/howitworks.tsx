import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
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
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

// Logo size for spacing reference (actual logo is in layout)
const LOGO_SIZE_END = 220;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Smooth spring for elegant motion
const SMOOTH_SPRING = { damping: 22, stiffness: 85, mass: 1 };

// Timing configuration
const BASE_DELAY = 600;
const STEP_STAGGER = 400;
const SLIDE_DURATION = 500;

export default function HowItWorksScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Content animations
  const titleProgress = useSharedValue(0);
  const step1Progress = useSharedValue(0);
  const step2Progress = useSharedValue(0);

  // Button animation
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  // Exit animation
  const exitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);

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

    // Button appears after all content
    const buttonDelay = BASE_DELAY + STEP_STAGGER * 2 + 300;
    buttonOpacity.value = withDelay(buttonDelay, withTiming(1, { duration: 400, easing: EASE }));
    buttonTranslateY.value = withDelay(buttonDelay, withSpring(0, SMOOTH_SPRING));
  }, []);

  // Unmask animation - text slides in from left (transform-based for smoothness)
  const unmask1Style = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const translateX = interpolate(titleProgress.value, [0, 1], [-300, 0]);
    return {
      opacity: exitOpacity,
      transform: [{ translateX }],
    };
  });

  // Unmask animation - text slides in from right
  const unmask2Style = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const translateX = interpolate(step1Progress.value, [0, 1], [300, 0]);
    return {
      opacity: exitOpacity,
      transform: [{ translateX }],
    };
  });

  // Unmask animation - text slides in from left
  const unmask3Style = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const translateX = interpolate(step2Progress.value, [0, 1], [-300, 0]);
    return {
      opacity: exitOpacity,
      transform: [{ translateX }],
    };
  });

  // Button with exit animation - fades down
  const buttonStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateY = interpolate(exitProgress.value, [0, 1], [0, 40]);
    return {
      opacity: buttonOpacity.value * exitOpacity,
      transform: [{ translateY: buttonTranslateY.value + exitTranslateY }, { scale: buttonScale.value }],
    };
  });

  const handleContinue = () => {
    // Prevent double taps
    if (isExiting.value) return;
    isExiting.value = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const EXIT_DURATION = 400;
    const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1);

    // Animate content out
    exitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: EASE_OUT });

    // Navigate after exit animation
    setTimeout(() => {
      router.push('/(onboarding)/splash');
    }, EXIT_DURATION - 80);
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
      {/* Content - carousel is handled in layout */}
      <View style={styles.content}>
        {/* Bold statements with unmask reveal */}
        <View style={styles.statementsContainer}>
          {/* Unmask left to right */}
          <View style={[styles.clipContainer, styles.alignLeft]}>
            <Animated.View style={unmask1Style}>
              <Text style={styles.statement}>Snap a photo</Text>
            </Animated.View>
          </View>

          {/* Unmask right to left */}
          <View style={[styles.clipContainer, styles.alignRight]}>
            <Animated.View style={unmask2Style}>
              <Text style={styles.statement}>Get styled</Text>
            </Animated.View>
          </View>

          {/* Unmask left to right */}
          <View style={[styles.clipContainer, styles.alignLeft]}>
            <Animated.View style={unmask3Style}>
              <Text style={styles.statement}>Try endless looks</Text>
            </Animated.View>
          </View>
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
            colors={isDark ? [colors.accentLight, colors.accent] : ['#1A1F2E', '#0D1017']}
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
      backgroundColor: 'transparent',
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: insets.top + LOGO_SIZE_END - 40,
      justifyContent: 'center',
    },
    statementsContainer: {
      gap: 28,
      width: '100%',
    },
    clipContainer: {
      overflow: 'hidden',
      width: '100%',
    },
    alignLeft: {
      alignItems: 'flex-start',
    },
    alignRight: {
      alignItems: 'flex-end',
    },
    statement: {
      ...typography.displayLarge,
      fontSize: 36,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -1,
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

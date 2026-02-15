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

const LOGO_SIZE = 280; // Keep for spacing reference

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Smooth spring for elegant motion
const SMOOTH_SPRING = { damping: 22, stiffness: 85, mass: 1 };

// Flowing content - reveals in zigzag pattern
const FLOW_CONTENT = [
  { text: 'One photo', direction: 'left', emphasis: true },
  { text: 'Endless possibilities', direction: 'right', emphasis: false },
  { text: 'Hair. Color. Style. Accessories.', direction: 'left', emphasis: false },
  { text: 'All yours to try', direction: 'right', emphasis: true },
];

// Timing configuration
const BASE_DELAY = 400;
const ROW_STAGGER = 400;
const SLIDE_DURATION = 500;

export default function PossibilitiesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Flow content animations - one for each row
  const row1Progress = useSharedValue(0);
  const row2Progress = useSharedValue(0);
  const row3Progress = useSharedValue(0);
  const row4Progress = useSharedValue(0);

  // Button animation
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  // Exit animation
  const exitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);

    // Row 1: slides from left
    row1Progress.value = withDelay(
      BASE_DELAY,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Row 2: slides from right
    row2Progress.value = withDelay(
      BASE_DELAY + ROW_STAGGER,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Row 3: slides from left
    row3Progress.value = withDelay(
      BASE_DELAY + ROW_STAGGER * 2,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Row 4: slides from right
    row4Progress.value = withDelay(
      BASE_DELAY + ROW_STAGGER * 3,
      withTiming(1, { duration: SLIDE_DURATION, easing: EASE })
    );

    // Button appears after all content
    const buttonDelay = BASE_DELAY + ROW_STAGGER * 3 + 300;
    buttonOpacity.value = withDelay(buttonDelay, withTiming(1, { duration: 400, easing: EASE }));
    buttonTranslateY.value = withDelay(buttonDelay, withSpring(0, SMOOTH_SPRING));
  }, []);

  // Row styles - alternating slide directions with exit animations
  // Exit: rows slide out in opposite direction (creates satisfying reverse zigzag)
  const row1Style = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(exitProgress.value, [0, 1], [0, 80]); // slides right on exit
    return {
      opacity: row1Progress.value * exitOpacity,
      transform: [{ translateX: interpolate(row1Progress.value, [0, 1], [-60, 0]) + exitTranslateX }],
    };
  });

  const row2Style = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(exitProgress.value, [0, 1], [0, -80]); // slides left on exit
    return {
      opacity: row2Progress.value * exitOpacity,
      transform: [{ translateX: interpolate(row2Progress.value, [0, 1], [60, 0]) + exitTranslateX }],
    };
  });

  const row3Style = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(exitProgress.value, [0, 1], [0, 80]); // slides right on exit
    return {
      opacity: row3Progress.value * exitOpacity,
      transform: [{ translateX: interpolate(row3Progress.value, [0, 1], [-60, 0]) + exitTranslateX }],
    };
  });

  const row4Style = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(exitProgress.value, [0, 1], [0, -80]); // slides left on exit
    return {
      opacity: row4Progress.value * exitOpacity,
      transform: [{ translateX: interpolate(row4Progress.value, [0, 1], [60, 0]) + exitTranslateX }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateY = interpolate(exitProgress.value, [0, 1], [0, 40]);
    return {
      opacity: buttonOpacity.value * exitOpacity,
      transform: [{ translateY: buttonTranslateY.value + exitTranslateY }, { scale: buttonScale.value }],
    };
  });

  // Gradient fades out during exit
  const gradientStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 0.8], [1, 0]);
    return { opacity: exitOpacity };
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
      router.push('/(onboarding)/howitworks');
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
      {/* Subtle gradient background - fades during exit */}
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={['#F8FBFF', '#F4F9FE', '#F0F6FC']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Logo spacer - actual logo is in layout */}
      <View style={styles.logoSpacer} />

      {/* Flowing content */}
      <View style={styles.content}>
        {/* Row 1 - Left aligned, slides from left */}
        <Animated.View style={[styles.flowRow, styles.rowLeft, row1Style]}>
          <Text style={styles.flowTextEmphasis}>{FLOW_CONTENT[0].text}</Text>
        </Animated.View>

        {/* Row 2 - Right aligned, slides from right */}
        <Animated.View style={[styles.flowRow, styles.rowRight, row2Style]}>
          <Text style={styles.flowText}>{FLOW_CONTENT[1].text}</Text>
        </Animated.View>

        {/* Row 3 - Left aligned, slides from left */}
        <Animated.View style={[styles.flowRow, styles.rowLeft, row3Style]}>
          <Text style={styles.flowTextSmall}>{FLOW_CONTENT[2].text}</Text>
        </Animated.View>

        {/* Row 4 - Right aligned, slides from right */}
        <Animated.View style={[styles.flowRow, styles.rowRight, row4Style]}>
          <Text style={styles.flowTextEmphasis}>{FLOW_CONTENT[3].text}</Text>
        </Animated.View>
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
      backgroundColor: '#F0F6FC',
    },
    logoSpacer: {
      height: LOGO_SIZE,
      marginTop: 80,
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      justifyContent: 'center',
      gap: 28,
    },
    flowRow: {
      paddingVertical: 4,
    },
    rowLeft: {
      alignSelf: 'flex-start',
    },
    rowRight: {
      alignSelf: 'flex-end',
    },
    flowTextEmphasis: {
      ...typography.displayLarge,
      fontSize: 34,
      fontWeight: '700',
      color: '#1A2B42',
      letterSpacing: -0.8,
    },
    flowText: {
      ...typography.displayLarge,
      fontSize: 28,
      fontWeight: '600',
      color: '#4A5D70',
      letterSpacing: -0.5,
    },
    flowTextSmall: {
      ...typography.bodyLarge,
      fontSize: 18,
      fontWeight: '600',
      color: '#3A4D5F',
      letterSpacing: 0.5,
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

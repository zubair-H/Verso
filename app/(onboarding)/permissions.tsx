import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LOGO_SIZE_SMALL = 220;
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);

// Lock icon dimensions
const LOCK_SIZE = 140;
const LOCK_STROKE = 2.5;

export default function PermissionsScreen() {
  const { colors, isDark } = useTheme();
  const { logoExitProgress } = useOnboarding();
  const insets = useSafeAreaInsets();
  const [isCompleting, setIsCompleting] = useState(false);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(16);

  const buttonScale = useSharedValue(1);
  const skipOpacity = useSharedValue(0);

  // Lock icon animation
  const lockOpacity = useSharedValue(0);
  const lockScale = useSharedValue(0.9);
  const lockBodyProgress = useSharedValue(0);
  const lockShackleProgress = useSharedValue(0);

  // Completion animation
  const completionProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  // Exit animation
  const exitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    // Content fades in
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: SMOOTH_EASE }));
    contentTranslateY.value = withDelay(100, withSpring(0, { damping: 20, stiffness: 90 }));
    skipOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));

    // Lock icon draws in
    lockOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    lockScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));
    lockBodyProgress.value = withDelay(300, withTiming(1, { duration: 600, easing: SMOOTH_EASE }));
    lockShackleProgress.value = withDelay(500, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
  }, []);

  const contentStyle = useAnimatedStyle(() => {
    const exitY = exitProgress.value * -50;
    const exitOpacity = 1 - exitProgress.value;
    const completionScale = interpolate(completionProgress.value, [0, 0.5, 1], [1, 1.02, 1]);
    return {
      opacity: contentOpacity.value * exitOpacity,
      transform: [
        { translateY: contentTranslateY.value + exitY },
        { scale: completionScale },
      ],
    };
  });

  const lockContainerStyle = useAnimatedStyle(() => {
    const exitScale = interpolate(exitProgress.value, [0, 1], [1, 0.8]);
    const exitOpacity = 1 - exitProgress.value;
    return {
      opacity: lockOpacity.value * exitOpacity,
      transform: [{ scale: lockScale.value * exitScale }],
    };
  });

  // Animated props for lock body (rounded rectangle path)
  const lockBodyProps = useAnimatedProps(() => {
    const progress = lockBodyProgress.value;
    // Total path length for the rounded rectangle
    const pathLength = 200;
    return {
      strokeDashoffset: pathLength * (1 - progress),
    };
  });

  // Animated props for shackle (the U-shaped top)
  const shackleProps = useAnimatedProps(() => {
    const progress = lockShackleProgress.value;
    const pathLength = 100;
    return {
      strokeDashoffset: pathLength * (1 - progress),
    };
  });

  // Checkmark animation props
  const checkProps = useAnimatedProps(() => {
    const pathLength = 50;
    return {
      strokeDashoffset: pathLength * (1 - checkProgress.value),
    };
  });

  // Success ring animation
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => {
    const exitY = exitProgress.value * 80;
    const exitOpacity = 1 - exitProgress.value;
    const fadeForCompletion = interpolate(completionProgress.value, [0, 0.3], [1, 0]);
    return {
      opacity: exitOpacity * fadeForCompletion,
      transform: [{ scale: buttonScale.value }, { translateY: exitY }],
    };
  });

  const skipStyle = useAnimatedStyle(() => {
    const exitOpacity = 1 - exitProgress.value;
    const fadeForCompletion = interpolate(completionProgress.value, [0, 0.3], [1, 0]);
    return {
      opacity: skipOpacity.value * exitOpacity * fadeForCompletion,
    };
  });

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@lookr/onboarding_complete', 'true');
    trackEvent('onboarding_completed');
    router.replace('/(tabs)');
  };

  const triggerCompletion = (withPermission: boolean) => {
    if (isExiting.value) return;
    isExiting.value = true;
    setIsCompleting(true);

    // First haptic - acknowledgment
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // STEP 1: Lock checkmark animation
    completionProgress.value = withTiming(1, { duration: 400, easing: SMOOTH_EASE });

    // Ring pulses out
    ringOpacity.value = withTiming(0.6, { duration: 150 });
    ringScale.value = withSequence(
      withTiming(1.3, { duration: 300, easing: SMOOTH_EASE }),
      withTiming(1.5, { duration: 200 })
    );
    ringOpacity.value = withDelay(300, withTiming(0, { duration: 200 }));

    // Checkmark draws in
    checkProgress.value = withDelay(150, withSpring(1, { damping: 12, stiffness: 100 }));

    // Success haptic when checkmark completes
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 400);

    // STEP 2: After lock animation completes, start logo collapse
    setTimeout(() => {
      // Logo layers collapse sequentially (name → swoosh → line)
      logoExitProgress.value = withTiming(1, { duration: 1000, easing: SMOOTH_EASE });
    }, 800);

    // STEP 3: After logo collapses, fade content and navigate
    setTimeout(() => {
      exitProgress.value = withTiming(1, { duration: 350, easing: SMOOTH_EASE });

      // Navigate after content fades
      setTimeout(() => {
        completeOnboarding();
      }, 300);
    }, 1850);
  };

  const handleAllowAccess = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    triggerCompletion(status === 'granted');
  };

  const handleSkip = () => {
    if (isExiting.value) return;
    isExiting.value = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simple fade out without lock animation
    exitProgress.value = withTiming(1, { duration: 350, easing: SMOOTH_EASE });

    // Logo collapses sequentially (name → swoosh → line)
    logoExitProgress.value = withDelay(100, withTiming(1, { duration: 1000, easing: SMOOTH_EASE }));

    // Navigate after logo animation completes
    setTimeout(() => {
      completeOnboarding();
    }, 1150);
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 80 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 80 });
  };

  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <View style={styles.container}>
      <View style={styles.logoSpacer} />

      <Animated.View style={[styles.content, contentStyle]}>
        {/* Lock icon that draws in */}
        <Animated.View style={[styles.lockContainer, lockContainerStyle]}>
          <Svg width={LOCK_SIZE} height={LOCK_SIZE} viewBox="0 0 100 100">
            {/* Lock body - rounded rectangle */}
            <AnimatedPath
              d="M25 45 L25 85 Q25 90 30 90 L70 90 Q75 90 75 85 L75 45 Q75 40 70 40 L30 40 Q25 40 25 45 Z"
              stroke={colors.textPrimary}
              strokeWidth={LOCK_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={200}
              animatedProps={lockBodyProps}
            />
            {/* Shackle - the U-shaped top */}
            <AnimatedPath
              d="M35 40 L35 30 Q35 15 50 15 Q65 15 65 30 L65 40"
              stroke={colors.textPrimary}
              strokeWidth={LOCK_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={100}
              animatedProps={shackleProps}
            />
            {/* Keyhole dot */}
            <AnimatedCircle
              cx="50"
              cy="62"
              r="4"
              fill={colors.textPrimary}
              opacity={lockBodyProgress}
            />
          </Svg>

          {/* Success ring that pulses out */}
          <Animated.View style={[styles.successRing, ringStyle]} />

          {/* Checkmark overlay */}
          {isCompleting && (
            <View style={styles.checkOverlay}>
              <Svg width={60} height={60} viewBox="0 0 50 50">
                <AnimatedPath
                  d="M12 26 L22 36 L38 16"
                  stroke={colors.textPrimary}
                  strokeWidth={3.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={50}
                  animatedProps={checkProps}
                />
              </Svg>
            </View>
          )}
        </Animated.View>

        <Text style={styles.title}>One last thing</Text>
        <Text style={styles.description}>
          To try looks on your photos, we need access to your camera roll.
        </Text>
        <Text style={styles.note}>
          Your photos stay on your device — always.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleAllowAccess}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Allow photo access</Text>
        </AnimatedPressable>
      </Animated.View>

      <Animated.View style={[styles.skipContainer, skipStyle]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
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
    logoSpacer: {
      height: LOGO_SIZE_SMALL,
      marginTop: insets.top - 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
    },
    lockContainer: {
      width: LOCK_SIZE,
      height: LOCK_SIZE,
      marginBottom: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successRing: {
      position: 'absolute',
      width: LOCK_SIZE - 20,
      height: LOCK_SIZE - 20,
      borderRadius: (LOCK_SIZE - 20) / 2,
      borderWidth: 2,
      borderColor: colors.textPrimary,
    },
    checkOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.displayLarge,
      fontSize: 32,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 16,
    },
    description: {
      ...typography.bodyLarge,
      fontSize: 18,
      color: colors.textPrimary,
      lineHeight: 28,
      marginBottom: 8,
    },
    note: {
      ...typography.bodyMedium,
      fontSize: 16,
      color: colors.textSecondary,
    },
    bottomSection: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 16,
    },
    button: {
      width: '100%',
      height: 56,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.textPrimary,
    },
    buttonText: {
      ...typography.labelLarge,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textOnAccent,
    },
    skipContainer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Math.max(insets.bottom, 16) + 24,
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    skipText: {
      ...typography.bodyMedium,
      fontSize: 15,
      color: colors.textTertiary,
    },
  });

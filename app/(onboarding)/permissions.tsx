import React, { useEffect, useMemo } from 'react';
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
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
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

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(16);

  const buttonScale = useSharedValue(1);
  const skipOpacity = useSharedValue(0);

  // Lock icon animation
  const lockOpacity = useSharedValue(0);
  const lockScale = useSharedValue(0.9);
  const lockBodyProgress = useSharedValue(0);
  const lockShackleProgress = useSharedValue(0);
  const lockCloseProgress = useSharedValue(0); // Animates shackle from open to closed

  // Completion animation
  const completionProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);

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
    // Shackle draws in open position first
    lockShackleProgress.value = withDelay(500, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
    // Then the lock closes smoothly
    lockCloseProgress.value = withDelay(1100, withTiming(1, { duration: 300, easing: SMOOTH_EASE }));
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
    // Fade out lock when completion starts
    const completionFade = interpolate(completionProgress.value, [0, 0.5], [1, 0], 'clamp');
    return {
      opacity: lockOpacity.value * exitOpacity * completionFade,
      transform: [{ scale: lockScale.value * exitScale }],
    };
  });

  // Success checkmark that replaces the lock
  const successCheckStyle = useAnimatedStyle(() => {
    const opacity = interpolate(completionProgress.value, [0.2, 0.6], [0, 1], 'clamp');
    const scale = interpolate(completionProgress.value, [0.2, 0.6], [0.8, 1], 'clamp');
    const exitOpacity = 1 - exitProgress.value;
    return {
      opacity: opacity * exitOpacity,
      transform: [{ scale }],
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

  // Animated props for keyhole
  const keyholeProps = useAnimatedProps(() => ({
    opacity: lockBodyProgress.value,
  }));

  // Animated props for shackle (draws in while raised)
  const shackleProps = useAnimatedProps(() => {
    const progress = lockShackleProgress.value;
    const pathLength = 100;
    return {
      strokeDashoffset: pathLength * (1 - progress),
    };
  });

  // Shackle transform - starts raised, drops down smoothly to lock
  const shackleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(lockCloseProgress.value, [0, 1], [-14, 0]);
    return {
      transform: [{ translateY }],
    };
  });

  // Checkmark animation props
  const checkProps = useAnimatedProps(() => {
    const pathLength = 50;
    return {
      strokeDashoffset: pathLength * (1 - checkProgress.value),
    };
  });

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

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Checkmark draws in smoothly
    completionProgress.value = withTiming(1, { duration: 300, easing: SMOOTH_EASE });
    checkProgress.value = withDelay(100, withTiming(1, { duration: 400, easing: SMOOTH_EASE }));

    // Success haptic when checkmark completes
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 350);

    // Start logo collapse after checkmark
    setTimeout(() => {
      logoExitProgress.value = withTiming(1, { duration: 800, easing: SMOOTH_EASE });
    }, 500);

    // Fade content and navigate
    setTimeout(() => {
      exitProgress.value = withTiming(1, { duration: 300, easing: SMOOTH_EASE });

      setTimeout(() => {
        completeOnboarding();
      }, 250);
    }, 1300);
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
        {/* Lock/Success icon container */}
        <View style={styles.iconWrapper}>
          {/* Lock icon that fades out on completion */}
          <Animated.View style={[styles.lockContainer, lockContainerStyle]}>
            {/* Shackle - animates from raised to locked position */}
            <Animated.View style={[styles.shackleContainer, shackleStyle]}>
              <Svg width={LOCK_SIZE} height={LOCK_SIZE} viewBox="0 0 100 100">
                <AnimatedPath
                  d="M35 40 L35 30 Q35 15 50 15 Q65 15 65 30 L65 40"
                  stroke={colors.textPrimary}
                  strokeWidth={LOCK_STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={100}
                  animatedProps={shackleProps}
                />
              </Svg>
            </Animated.View>
            {/* Lock body and keyhole */}
            <Svg width={LOCK_SIZE} height={LOCK_SIZE} viewBox="0 0 100 100" style={styles.lockBodySvg}>
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
              <AnimatedCircle
                cx="50"
                cy="62"
                r="4"
                fill={colors.textPrimary}
                animatedProps={keyholeProps}
              />
            </Svg>
          </Animated.View>

          {/* Success checkmark that replaces lock */}
          <Animated.View style={[styles.successCheck, successCheckStyle]}>
            <View style={styles.successCircle}>
              <Svg width={50} height={50} viewBox="0 0 50 50">
                <AnimatedPath
                  d="M14 26 L22 34 L36 18"
                  stroke={colors.textPrimary}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={50}
                  animatedProps={checkProps}
                />
              </Svg>
            </View>
          </Animated.View>
        </View>

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
        >
          <LinearGradient
            colors={[colors.accentLight, colors.accent]}
            locations={[0.68, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Allow photo access</Text>
          </LinearGradient>
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
    iconWrapper: {
      width: LOCK_SIZE,
      height: LOCK_SIZE,
      marginBottom: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lockContainer: {
      position: 'absolute',
      width: LOCK_SIZE,
      height: LOCK_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shackleContainer: {
      position: 'absolute',
      width: LOCK_SIZE,
      height: LOCK_SIZE,
    },
    lockBodySvg: {
      position: 'absolute',
    },
    successCheck: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    successCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2.5,
      borderColor: colors.textPrimary,
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
      overflow: 'hidden',
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

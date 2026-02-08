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
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import type { StepInfo } from './StepIndicator';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);

// Small logo size (logo shrinks on step pages)
const LOGO_SIZE_SMALL = 220;
// Step indicator height in layout (~45px)
const INDICATOR_HEIGHT = 50;

// All 4 steps — exported for the layout's persistent StepIndicator
export const STEP_DATA: StepInfo[] = [
  { icon: 'camera', label: 'Selfie' },
  { icon: 'users', label: 'Inspo' },
  { icon: 'scissors', label: 'Attributes' },
  { icon: 'zap', label: 'Magic' },
];

interface OnboardingStepProps {
  stepIndex: number;
  headline: string;
  headlineDim: string;
  description: string;
  nextRoute: string;
  goBack?: boolean; // If true, Continue navigates back instead of pushing nextRoute
  children: React.ReactNode;
}

export interface HeroAnimationContext {
  contentExitProgress: SharedValue<number>;
}

export default function OnboardingStep({
  stepIndex,
  headline,
  headlineDim,
  description,
  nextRoute,
  goBack,
  children,
}: OnboardingStepProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const BASE = 250;

  // Entrance values (no indicator — it's in the layout now)
  const headlineEntry = useSharedValue(0);
  const headlineTranslateY = useSharedValue(14);
  const headlineStartX = stepIndex % 2 === 0 ? -30 : 30;
  const headlineTranslateX = useSharedValue(headlineStartX);
  const descEntry = useSharedValue(0);
  const descTranslateY = useSharedValue(8);
  const buttonEntry = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  // Exit
  const contentExitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    // Headline — staggered with X slide
    headlineEntry.value = withDelay(BASE + 200, withTiming(1, { duration: 700, easing: EASE }));
    headlineTranslateY.value = withDelay(BASE + 200, withSpring(0, { damping: 22, stiffness: 85 }));
    headlineTranslateX.value = withDelay(BASE + 200, withSpring(0, { damping: 22, stiffness: 85 }));

    // Description
    descEntry.value = withDelay(BASE + 350, withTiming(1, { duration: 500, easing: EASE }));
    descTranslateY.value = withDelay(BASE + 350, withSpring(0, { damping: 20, stiffness: 120 }));

    // Button
    buttonEntry.value = withDelay(BASE + 450, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
    buttonTranslateY.value = withDelay(BASE + 450, withSpring(0, { damping: 20, stiffness: 90 }));
  }, []);

  // --- Animated styles ---
  const headlineStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTx = interpolate(contentExitProgress.value, [0, 1], [0, headlineStartX * -1]);
    return {
      opacity: headlineEntry.value * exitOp,
      transform: [
        { translateX: headlineTranslateX.value + exitTx },
        { translateY: headlineTranslateY.value },
      ],
    };
  });

  const descStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    return {
      opacity: descEntry.value * exitOp,
      transform: [{ translateY: descTranslateY.value }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTy = interpolate(contentExitProgress.value, [0, 1], [0, 40]);
    return {
      opacity: buttonEntry.value * exitOp,
      transform: [{ translateY: buttonTranslateY.value + exitTy }, { scale: buttonScale.value }],
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 0.7], [1, 0]);
    return { opacity: exitOp };
  });

  const heroWrapperStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitScale = interpolate(contentExitProgress.value, [0, 1], [1, 0.85]);
    return { opacity: exitOp, transform: [{ scale: exitScale }] };
  });

  const handleContinue = () => {
    if (isExiting.value) return;
    isExiting.value = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const EXIT_DURATION = 400;
    contentExitProgress.value = withTiming(1, {
      duration: EXIT_DURATION,
      easing: SMOOTH_EASE,
    });

    setTimeout(() => {
      if (goBack) {
        router.back();
      } else {
        router.push(nextRoute as any);
      }
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

      <View style={styles.content}>
        {/* Spacer for small logo + persistent indicator in layout */}
        <View style={styles.logoSpacer} />

        {/* Hero — each step provides unique content */}
        <Animated.View style={[styles.hero, heroWrapperStyle]}>
          {children}
        </Animated.View>

        {/* Headline — slides from alternating directions */}
        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={[styles.headline, styles.headlineDim]}>{headlineDim}</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View style={[styles.descContainer, descStyle]}>
          <Text style={styles.desc}>{description}</Text>
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
      // Clears the small logo (220px) + step indicator (~50px) in the layout
      marginTop: insets.top - 40,
      height: LOGO_SIZE_SMALL + INDICATOR_HEIGHT,
    },
    hero: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      height: 150,
    },
    headlineContainer: {
      alignItems: 'center',
      marginBottom: 12,
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
    descContainer: {
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    desc: {
      ...typography.bodyLarge,
      fontSize: 15,
      color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)',
      textAlign: 'center',
      lineHeight: 22,
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

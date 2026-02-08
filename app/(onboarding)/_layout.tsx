import { useEffect, useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { STEP_DATA } from '@/components/onboarding/OnboardingStep';

// Logo layer images - dark versions for light mode, light versions for dark mode
const lineImageDark = require('@/assets/line.png');
const swooshImageDark = require('@/assets/swoosh.png');
const nameImageDark = require('@/assets/name.png');
const lineImageLight = require('@/assets/line-light.png');
const swooshImageLight = require('@/assets/swoosh-light.png');
const nameImageLight = require('@/assets/name-light.png');

// Logo sizes
const LOGO_SIZE_LARGE = 280;
const LOGO_SIZE_SMALL = 220;

const STEP_SCREENS = ['step1', 'step2', 'step3', 'step4'];

function getStepIndex(screen: string): number {
  const idx = STEP_SCREENS.indexOf(screen);
  return idx >= 0 ? idx : -1;
}

function OnboardingLayoutContent() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { logoExitProgress, indicatorCount } = useOnboarding();
  const { colors, isDark } = useTheme();

  // Get current screen from segments
  const currentScreen = segments[segments.length - 1] || 'index';
  const isStepScreen = STEP_SCREENS.includes(currentScreen);
  const isSmallLogo = isStepScreen || currentScreen === 'permissions' || currentScreen === 'howitworks';

  // Logo animation progress (0 = large/top position, 1 = small/higher position)
  const logoProgress = useSharedValue(0);

  // Logo reveal animations (for the 3-layer intro animation)
  const lineReveal = useSharedValue(0);
  const swooshReveal = useSharedValue(0);
  const nameReveal = useSharedValue(0);
  const hasPlayedIntro = useSharedValue(false);

  // Step indicator visibility
  const indicatorOpacity = useSharedValue(0);

  // Intro logo animation (runs once on first mount)
  useEffect(() => {
    if (!hasPlayedIntro.value) {
      hasPlayedIntro.value = true;
      const REVEAL_EASE = Easing.out(Easing.cubic);
      lineReveal.value = withDelay(200, withTiming(1, { duration: 500, easing: REVEAL_EASE }));
      swooshReveal.value = withDelay(700, withTiming(1, { duration: 500, easing: REVEAL_EASE }));
      nameReveal.value = withDelay(1200, withTiming(1, { duration: 600, easing: REVEAL_EASE }));
    }
  }, []);

  useEffect(() => {
    const SMOOTH_EASE = Easing.bezier(0.4, 0, 0.2, 1);
    const EASE = Easing.out(Easing.cubic);

    if (isSmallLogo) {
      // Logo shrinks to top position on step1 and stays there
      logoProgress.value = withTiming(1, { duration: 600, easing: SMOOTH_EASE });
    } else {
      // Index: large logo position
      logoProgress.value = withTiming(0, { duration: 500, easing: EASE });
    }

    // Step indicator: visible on step screens, and on howitworks once cards start flying up
    if (isStepScreen || (currentScreen === 'howitworks' && indicatorCount > 0)) {
      indicatorOpacity.value = withTiming(1, { duration: 300, easing: EASE });
    } else {
      indicatorOpacity.value = withTiming(0, { duration: 300, easing: EASE });
    }
  }, [currentScreen, indicatorCount]);

  const logoContainerStyle = useAnimatedStyle(() => {
    const scaleOffset = (LOGO_SIZE_LARGE - LOGO_SIZE_SMALL) / 2;
    const topLarge = 80;
    const topSmall = insets.top - 60 - scaleOffset;

    const top = interpolate(logoProgress.value, [0, 1], [topLarge, topSmall]);
    const scale = interpolate(logoProgress.value, [0, 1], [1, LOGO_SIZE_SMALL / LOGO_SIZE_LARGE]);

    return {
      top,
      transform: [{ scale }],
    };
  });

  // Logo layer styles
  const lineLayerStyle = useAnimatedStyle(() => {
    const revealWidth = interpolate(lineReveal.value, [0, 1], [0, LOGO_SIZE_LARGE]);
    const exitMultiplier = interpolate(logoExitProgress.value, [0.7, 1.0], [1, 0], 'clamp');
    return { width: revealWidth * exitMultiplier };
  });

  const swooshLayerStyle = useAnimatedStyle(() => {
    const revealWidth = interpolate(swooshReveal.value, [0, 1], [0, LOGO_SIZE_LARGE]);
    const exitMultiplier = interpolate(logoExitProgress.value, [0.35, 0.7], [1, 0], 'clamp');
    return { width: revealWidth * exitMultiplier };
  });

  const nameLayerStyle = useAnimatedStyle(() => {
    const revealWidth = interpolate(nameReveal.value, [0, 1], [0, LOGO_SIZE_LARGE]);
    const exitMultiplier = interpolate(logoExitProgress.value, [0, 0.35], [1, 0], 'clamp');
    return { width: revealWidth * exitMultiplier };
  });

  // Step indicator position: just below the small logo
  // Small logo visual bottom ≈ insets.top + 160
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  const showLogo = !currentScreen || currentScreen === '(onboarding)' || ['index', 'howitworks', 'step1', 'step2', 'step3', 'step4', 'permissions'].includes(currentScreen);

  const isHowItWorks = currentScreen === 'howitworks';
  // On howitworks, currentStep = indicatorCount so collected dots show as "completed"
  // On step screens, currentStep is the actual step index (0-3)
  const currentStep = isHowItWorks ? indicatorCount : getStepIndex(currentScreen);
  // Progressive indicator: only show dots that have been "collected" from card exits
  const indicatorVisibleCount = indicatorCount;
  const dynamicStyles = useMemo(() => ({
    indicatorContainer: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      // Position below the small logo
      top: insets.top + 165,
      alignItems: 'center' as const,
      zIndex: 100,
    },
  }), [insets.top]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      {/* Persistent logo */}
      {showLogo && (
        <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
          <View style={styles.logoLayersWrapper}>
            <Animated.View style={[styles.logoLayerClip, lineLayerStyle]}>
              <Image
                source={isDark ? lineImageLight : lineImageDark}
                style={styles.logoLayerImage}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.View style={[styles.logoLayerClipRight, swooshLayerStyle]}>
              <Image
                source={isDark ? swooshImageLight : swooshImageDark}
                style={styles.logoLayerImageRight}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.View style={[styles.logoLayerClip, nameLayerStyle]}>
              <Image
                source={isDark ? nameImageLight : nameImageDark}
                style={styles.logoLayerImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {/* Persistent step indicator — stays across step pages */}
      <Animated.View style={[dynamicStyles.indicatorContainer, indicatorStyle]}>
        <StepIndicator currentStep={currentStep} steps={STEP_DATA} visibleCount={indicatorVisibleCount} />
      </Animated.View>

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'none',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="howitworks" options={{ animation: 'none' }} />
        <Stack.Screen name="step1" options={{ animation: 'none' }} />
        <Stack.Screen name="step2" options={{ animation: 'none' }} />
        <Stack.Screen name="step3" options={{ animation: 'none' }} />
        <Stack.Screen name="step4" options={{ animation: 'none' }} />
      </Stack>
    </View>
  );
}

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingLayoutContent />
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  logoLayersWrapper: {
    width: LOGO_SIZE_LARGE,
    height: LOGO_SIZE_LARGE,
    position: 'relative',
  },
  logoLayerClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: LOGO_SIZE_LARGE,
    overflow: 'hidden',
  },
  logoLayerClipRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: LOGO_SIZE_LARGE,
    overflow: 'hidden',
  },
  logoLayerImage: {
    width: LOGO_SIZE_LARGE,
    height: LOGO_SIZE_LARGE,
  },
  logoLayerImageRight: {
    width: LOGO_SIZE_LARGE,
    height: LOGO_SIZE_LARGE,
    position: 'absolute',
    right: 0,
  },
});

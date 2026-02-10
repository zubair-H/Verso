import { useEffect } from 'react';
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

const DEMO_SCREENS = ['demo1', 'demo2', 'demo3'];

function OnboardingLayoutContent() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { logoExitProgress, logoVisible } = useOnboarding();
  const { colors, isDark } = useTheme();

  // Get current screen from segments
  const currentScreen = segments[segments.length - 1] || 'index';
  const isDemoScreen = DEMO_SCREENS.includes(currentScreen);
  const isSmallLogo = isDemoScreen || currentScreen === 'permissions' || currentScreen === 'howitworks';

  // Logo animation progress (0 = large/top position, 1 = small/higher position)
  const logoProgress = useSharedValue(0);

  // Logo reveal animations (for the 3-layer intro animation)
  const lineReveal = useSharedValue(0);
  const swooshReveal = useSharedValue(0);
  const nameReveal = useSharedValue(0);
  const hasPlayedIntro = useSharedValue(false);

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
      logoProgress.value = withTiming(1, { duration: 600, easing: SMOOTH_EASE });
    } else {
      // Index: large logo position
      logoProgress.value = withTiming(0, { duration: 500, easing: EASE });
    }
  }, [currentScreen]);

  const logoContainerStyle = useAnimatedStyle(() => {
    const scaleOffset = (LOGO_SIZE_LARGE - LOGO_SIZE_SMALL) / 2;
    const topLarge = 80;
    const topSmall = insets.top - 60 - scaleOffset;

    const top = interpolate(logoProgress.value, [0, 1], [topLarge, topSmall]);
    const scale = interpolate(logoProgress.value, [0, 1], [1, LOGO_SIZE_SMALL / LOGO_SIZE_LARGE]);

    return {
      top,
      opacity: logoVisible.value,
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

  const showLogo = !currentScreen || currentScreen === '(onboarding)' || ['index', 'howitworks', 'demo1', 'demo2', 'demo3', 'permissions'].includes(currentScreen);

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
        <Stack.Screen name="demo1" options={{ animation: 'none' }} />
        <Stack.Screen name="demo2" options={{ animation: 'none' }} />
        <Stack.Screen name="demo3" options={{ animation: 'none' }} />
        <Stack.Screen name="permissions" options={{ animation: 'none' }} />
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

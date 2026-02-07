import { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
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
import { BlurView } from 'expo-blur';
import { AttributesCarousel } from '@/components/ui';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';

// Logo layer images - dark versions for light mode, light versions for dark mode
const lineImageDark = require('@/assets/line.png');
const swooshImageDark = require('@/assets/swoosh.png');
const nameImageDark = require('@/assets/name.png');
const lineImageLight = require('@/assets/line-light.png');
const swooshImageLight = require('@/assets/swoosh-light.png');
const nameImageLight = require('@/assets/name-light.png');
const { height: screenHeight } = Dimensions.get('window');

// Logo sizes
const LOGO_SIZE_LARGE = 280;
const LOGO_SIZE_SMALL = 220;

function OnboardingLayoutContent() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { logoExitProgress, carouselExitProgress } = useOnboarding();
  const { colors, isDark } = useTheme();

  // Get current screen from segments
  const currentScreen = segments[segments.length - 1] || 'index';

  // Logo animation progress (0 = large/top position, 1 = small/higher position)
  const logoProgress = useSharedValue(0);

  // Logo reveal animations (for the 3-layer intro animation)
  const lineReveal = useSharedValue(0);
  const swooshReveal = useSharedValue(0);
  const nameReveal = useSharedValue(0);
  const hasPlayedIntro = useSharedValue(false);

  // Carousel visibility and blur state
  const carouselOpacity = useSharedValue(0);
  const carouselTranslateY = useSharedValue(0);
  const blurMaskTop = useSharedValue(0);
  const hasEnteredCarouselScreen = useSharedValue(false);

  // Intro logo animation (runs once on first mount)
  useEffect(() => {
    if (!hasPlayedIntro.value) {
      hasPlayedIntro.value = true;
      const REVEAL_EASE = Easing.out(Easing.cubic);

      // Line: reveals from left to right (starts at 200ms, 500ms duration)
      lineReveal.value = withDelay(200, withTiming(1, { duration: 500, easing: REVEAL_EASE }));

      // Swoosh: reveals from right to left (starts at 700ms, 500ms duration)
      swooshReveal.value = withDelay(700, withTiming(1, { duration: 500, easing: REVEAL_EASE }));

      // Name: reveals from left to right (starts at 1200ms, 600ms duration)
      nameReveal.value = withDelay(1200, withTiming(1, { duration: 600, easing: REVEAL_EASE }));
    }
  }, []);

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);
    const SMOOTH_EASE = Easing.bezier(0.4, 0, 0.2, 1);

    if (currentScreen === 'howitworks' || currentScreen === 'splash' || currentScreen === 'permissions') {
      // Show carousel with fade-in on howitworks (starts first)
      if (currentScreen === 'howitworks' && !hasEnteredCarouselScreen.value) {
        hasEnteredCarouselScreen.value = true;
        // Carousel fades in immediately
        carouselOpacity.value = withTiming(1, { duration: 800, easing: SMOOTH_EASE });
        // Logo animates after a slight delay with the carousel, preventing jump
        logoProgress.value = withDelay(
          100,
          withTiming(1, { duration: 600, easing: SMOOTH_EASE })
        );
      } else if (currentScreen === 'splash') {
        // On splash, logo should be in small position
        logoProgress.value = withTiming(1, { duration: 300, easing: EASE });
        // Animate blur out on splash
        blurMaskTop.value = withDelay(
          200,
          withTiming(screenHeight, {
            duration: 1000,
            easing: Easing.inOut(Easing.cubic),
          })
        );
      } else if (currentScreen === 'permissions') {
        // Carousel exit is now triggered from splash via carouselExitProgress
        // On permissions, keep logo in small position
        logoProgress.value = withTiming(1, { duration: 300, easing: EASE });
      }
    } else {
      // Animate to larger, lower position
      logoProgress.value = withTiming(0, { duration: 500, easing: EASE });
      // Reset carousel state when going back
      carouselOpacity.value = 0;
      carouselTranslateY.value = 0;
      blurMaskTop.value = 0;
      hasEnteredCarouselScreen.value = false;
    }
  }, [currentScreen]);

  const logoContainerStyle = useAnimatedStyle(() => {
    const scaleOffset = (LOGO_SIZE_LARGE - LOGO_SIZE_SMALL) / 2;
    const topLarge = 80;
    const topSmall = insets.top - 60 - scaleOffset;

    const top = interpolate(logoProgress.value, [0, 1], [topLarge, topSmall]);
    const scale = interpolate(logoProgress.value, [0, 1], [1, LOGO_SIZE_SMALL / LOGO_SIZE_LARGE]);

    // Logo container stays in place - only layers animate during exit
    return {
      top,
      transform: [{ scale }],
    };
  });

  // Animated styles for logo layers (clip-path reveal effect via width)
  // Exit animation: sequential collapse matching HTML style
  // Order: name → swoosh → line (each completes before next starts)
  const lineLayerStyle = useAnimatedStyle(() => {
    // Reveal from left to right
    const revealWidth = interpolate(lineReveal.value, [0, 1], [0, LOGO_SIZE_LARGE]);
    // During exit, line masks LAST (70%-100% of progress)
    const exitMultiplier = interpolate(logoExitProgress.value, [0.7, 1.0], [1, 0], 'clamp');
    return { width: revealWidth * exitMultiplier };
  });

  const swooshLayerStyle = useAnimatedStyle(() => {
    // Reveal from right to left
    const revealWidth = interpolate(swooshReveal.value, [0, 1], [0, LOGO_SIZE_LARGE]);
    // During exit, swoosh masks SECOND (35%-70% of progress)
    const exitMultiplier = interpolate(logoExitProgress.value, [0.35, 0.7], [1, 0], 'clamp');
    return { width: revealWidth * exitMultiplier };
  });

  const nameLayerStyle = useAnimatedStyle(() => {
    // Reveal from left to right
    const revealWidth = interpolate(nameReveal.value, [0, 1], [0, LOGO_SIZE_LARGE]);
    // During exit, name masks FIRST (0%-35% of progress)
    const exitMultiplier = interpolate(logoExitProgress.value, [0, 0.35], [1, 0], 'clamp');
    return { width: revealWidth * exitMultiplier };
  });

  // Carousel animated styles
  const carouselStyle = useAnimatedStyle(() => {
    // Use carouselExitProgress for smooth exit triggered from splash
    const exitTranslateY = interpolate(carouselExitProgress.value, [0, 1], [0, -screenHeight]);
    const exitOpacity = interpolate(carouselExitProgress.value, [0.6, 1], [1, 0], 'clamp');

    return {
      opacity: carouselOpacity.value * exitOpacity,
      transform: [{ translateY: carouselTranslateY.value + exitTranslateY }],
    };
  });

  const blurMaskStyle = useAnimatedStyle(() => ({
    top: blurMaskTop.value,
  }));

  // Check if we should show carousel (on howitworks, splash, or permissions for exit animation)
  const showCarousel = currentScreen === 'howitworks' || currentScreen === 'splash' || currentScreen === 'permissions';

  // Only show logo on onboarding screens
  const showLogo = !currentScreen || currentScreen === '(onboarding)' || ['index', 'welcome', 'possibilities', 'howitworks', 'splash', 'permissions'].includes(currentScreen);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      {/* Shared carousel background - persists across howitworks and splash */}
      {showCarousel && (
        <Animated.View style={[styles.carouselContainer, carouselStyle]}>
          {/* Single carousel instance that persists */}
          <AttributesCarousel
            blurIntensity={100}
            blurTint={isDark ? 'dark' : 'light'}
            topPadding={100 + insets.top}
          />
          {/* Blur overlay that animates down on splash to reveal carousel */}
          <Animated.View style={[styles.blurMask, blurMaskStyle]}>
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={styles.blurFill}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* Persistent logo - only on onboarding screens */}
      {showLogo && (
        <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
          <View style={styles.logoLayersWrapper}>
            {/* Line layer - reveals from left to right */}
            <Animated.View style={[styles.logoLayerClip, lineLayerStyle]}>
              <Image
                source={isDark ? lineImageLight : lineImageDark}
                style={styles.logoLayerImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Swoosh layer - reveals from right to left */}
            <Animated.View style={[styles.logoLayerClipRight, swooshLayerStyle]}>
              <Image
                source={isDark ? swooshImageLight : swooshImageDark}
                style={styles.logoLayerImageRight}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Name layer - reveals from left to right */}
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
        {/* No animation between pages for seamless logo continuity */}
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="welcome" options={{ animation: 'none' }} />
        <Stack.Screen name="possibilities" options={{ animation: 'none' }} />
        <Stack.Screen name="howitworks" options={{ animation: 'none' }} />
        <Stack.Screen name="splash" options={{ animation: 'none' }} />
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
  carouselContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight,
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
  blurMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blurFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: screenHeight,
  },
});

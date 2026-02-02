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

const logoImage = require('@/assets/ios-tinted.png');
const { height: screenHeight } = Dimensions.get('window');

// Logo sizes
const LOGO_SIZE_LARGE = 280;
const LOGO_SIZE_SMALL = 220;

export default function OnboardingLayout() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // Get current screen from segments
  const currentScreen = segments[segments.length - 1] || 'index';

  // Logo animation progress (0 = large/top position, 1 = small/higher position)
  const logoProgress = useSharedValue(0);

  // Carousel visibility and blur state
  const carouselOpacity = useSharedValue(0);
  const blurMaskTop = useSharedValue(0);
  const hasEnteredCarouselScreen = useSharedValue(false);

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);
    const SMOOTH_EASE = Easing.bezier(0.4, 0, 0.2, 1);

    if (currentScreen === 'howitworks' || currentScreen === 'splash') {
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
        // On splash, logo should already be at position 1, just ensure it's there
        logoProgress.value = withTiming(1, { duration: 300, easing: EASE });
        // Animate blur out (reveal carousel)
        blurMaskTop.value = withDelay(
          200,
          withTiming(screenHeight, {
            duration: 1000,
            easing: Easing.inOut(Easing.cubic),
          })
        );
      }
    } else {
      // Animate to larger, lower position
      logoProgress.value = withTiming(0, { duration: 500, easing: EASE });
      // Reset carousel state when going back
      carouselOpacity.value = 0;
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

    return {
      top,
      transform: [{ scale }],
    };
  });

  // Carousel animated styles
  const carouselStyle = useAnimatedStyle(() => ({
    opacity: carouselOpacity.value,
  }));

  const blurMaskStyle = useAnimatedStyle(() => ({
    top: blurMaskTop.value,
  }));

  // Check if we should show carousel (on howitworks or splash)
  const showCarousel = currentScreen === 'howitworks' || currentScreen === 'splash';

  return (
    <View style={styles.container}>
      {/* Shared carousel background - persists across howitworks and splash */}
      {showCarousel && (
        <Animated.View style={[StyleSheet.absoluteFill, carouselStyle]}>
          {/* Single carousel instance that persists */}
          <AttributesCarousel
            blurIntensity={100}
            blurTint="light"
            topPadding={100 + insets.top}
          />
          {/* Blur overlay that animates down on splash to reveal carousel */}
          <Animated.View style={[styles.blurMask, blurMaskStyle]}>
            <BlurView
              intensity={100}
              tint="light"
              style={styles.blurFill}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* Persistent logo across all screens */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        <Image
          source={logoImage}
          style={{ width: LOGO_SIZE_LARGE, height: LOGO_SIZE_LARGE }}
          resizeMode="contain"
        />
      </Animated.View>

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
          animationDuration: 350,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {/* No animation between pages for seamless logo continuity */}
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="possibilities" options={{ animation: 'none' }} />
        <Stack.Screen name="howitworks" options={{ animation: 'none' }} />
        <Stack.Screen name="splash" options={{ animation: 'none' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FC',
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
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

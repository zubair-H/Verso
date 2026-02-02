import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { MasonryBackground } from '@/components/ui';
import { createSplashStyles } from '@/styles/splash.styles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Logo asset
const logoImage = require('@/assets/ios-tinted.png');

// Logo size
const LOGO_SIZE = 220;

const DURATION = 350;
const EASE = Easing.out(Easing.quad);

export default function SplashScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Logo animation - starts large (like first page), shrinks and moves up
  const logoProgress = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Bottom panel animation - slides up from bottom
  const bottomPanelTranslateY = useSharedValue(300);

  // Typing animation values
  const headlineWidth = useSharedValue(0);
  const subheadlineWidth = useSharedValue(0);

  useEffect(() => {
    // Animation sequence: Logo → Blur unmask → Bottom content

    // 1. Logo moves first (starts at 200ms, finishes at 800ms)
    const logoDelay = 200;
    const logoDuration = 600;

    logoProgress.value = withDelay(
      logoDelay,
      withTiming(1, { duration: logoDuration, easing: Easing.out(Easing.cubic) })
    );

    // 2. Blur unmask happens via MasonryBackground props (starts at 600ms, finishes at 1600ms)
    const blurUnmaskFinished = 600 + 1000; // blurOutDelay + blurOutDuration = 1600ms

    // 3. Bottom panel slides up before content appears
    const panelStartDelay = blurUnmaskFinished - 400; // Panel starts sliding up
    bottomPanelTranslateY.value = withDelay(
      panelStartDelay,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // 4. Bottom content appears after panel is in place
    const contentStartDelay = panelStartDelay + 300; // Content starts as panel is almost done

    // Headline types out
    headlineWidth.value = withDelay(contentStartDelay, withTiming(100, { duration: 800, easing: Easing.out(Easing.quad) }));

    // Subheadline types out after headline
    subheadlineWidth.value = withDelay(contentStartDelay + 400, withTiming(100, { duration: 600, easing: Easing.out(Easing.quad) }));

    // Button appears last
    buttonOpacity.value = withDelay(contentStartDelay + 700, withTiming(1, { duration: DURATION, easing: EASE }));
  }, []);

  // Logo animated style - shrinks from large to small and moves up
  // Logo starts at page 1 position (marginTop: 80) and moves to very top
  // Since scale transforms from center, we need to compensate by moving top much higher
  const logoContainerStyle = useAnimatedStyle(() => {
    const top = interpolate(
      logoProgress.value,
      [0, 1],
      [80, insets.top - 60]
    );

    return {
      top,
    };
  });

  const headlineStyle = useAnimatedStyle(() => ({
    width: `${headlineWidth.value}%`,
  }));

  const subheadlineStyle = useAnimatedStyle(() => ({
    width: `${subheadlineWidth.value}%`,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const bottomPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomPanelTranslateY.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/potential');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createSplashStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Masonry Grid - blur animates out after logo moves */}
      <MasonryBackground
        animateBlurOut
        blurIntensity={80}
        blurTint="light"
        blurOutDelay={600}
        blurOutDuration={1000}
        topPadding={100 + insets.top}
      />

      {/* Logo - starts at same position as page 1 (marginTop: 80), animates up and shrinks */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        <Image
          source={logoImage}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Bottom Panel - slides up from bottom */}
      <Animated.View style={[styles.bottomPanel, bottomPanelStyle, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.textContent}>
          <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingClip, headlineStyle]}>
              <Text style={styles.headline} numberOfLines={1}>See what's possible.</Text>
            </Animated.View>
          </View>
          <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingClip, subheadlineStyle]}>
              <Text style={styles.subline} numberOfLines={1}>Unlimited looks. Zero commitment.</Text>
            </Animated.View>
          </View>
        </View>

        <Animated.View style={buttonStyle}>
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>Continue</Text>
            </View>
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
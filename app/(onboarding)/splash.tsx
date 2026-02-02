import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable } from 'react-native';
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
import { createSplashStyles } from '@/styles/splash.styles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DURATION = 350;
const EASE = Easing.out(Easing.quad);
const EXIT_DURATION = 400;
const EXIT_EASE = Easing.bezier(0.33, 1, 0.68, 1);

export default function SplashScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Logo is already in position from page 2 (no animation needed)
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Bottom panel animation - slides up from bottom
  const bottomPanelTranslateY = useSharedValue(300);

  // Typing animation values
  const headlineWidth = useSharedValue(0);
  const subheadlineWidth = useSharedValue(0);

  // Exit animation values
  const exitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    // Animation sequence: Blur unmask → Bottom content
    // Logo is already in position from page 2, no animation needed

    const blurUnmaskDelay = 200;
    const blurUnmaskDuration = 1000;
    const blurUnmaskFinished = blurUnmaskDelay + blurUnmaskDuration;

    // 1. Bottom panel slides up
    const panelStartDelay = blurUnmaskFinished - 400;
    bottomPanelTranslateY.value = withDelay(
      panelStartDelay,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // 3. Bottom content appears after panel is in place
    const contentStartDelay = panelStartDelay + 300;

    // Headline types out
    headlineWidth.value = withDelay(contentStartDelay, withTiming(100, { duration: 800, easing: Easing.out(Easing.quad) }));

    // Subheadline types out after headline
    subheadlineWidth.value = withDelay(contentStartDelay + 400, withTiming(100, { duration: 600, easing: Easing.out(Easing.quad) }));

    // Button appears last
    buttonOpacity.value = withDelay(contentStartDelay + 700, withTiming(1, { duration: DURATION, easing: EASE }));
  }, []);

  const headlineStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(exitProgress.value, [0, 1], [0, -40]);
    return {
      width: `${headlineWidth.value}%`,
      opacity: exitOpacity,
      transform: [{ translateX: exitTranslateX }],
    };
  });

  const subheadlineStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateX = interpolate(exitProgress.value, [0, 1], [0, 40]);
    return {
      width: `${subheadlineWidth.value}%`,
      opacity: exitOpacity,
      transform: [{ translateX: exitTranslateX }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitTranslateY = interpolate(exitProgress.value, [0, 1], [0, 30]);
    return {
      opacity: buttonOpacity.value * exitOpacity,
      transform: [{ scale: buttonScale.value }, { translateY: exitTranslateY }],
    };
  });

  const bottomPanelStyle = useAnimatedStyle(() => {
    const exitTranslateY = interpolate(exitProgress.value, [0, 1], [0, 80]);
    return {
      transform: [{ translateY: bottomPanelTranslateY.value + exitTranslateY }],
    };
  });

  const handleContinue = () => {
    // Prevent double taps
    if (isExiting.value) return;
    isExiting.value = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate content out elegantly
    exitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: EXIT_EASE });

    // Navigate after exit animation
    setTimeout(() => {
      router.push('/(onboarding)/permissions');
    }, EXIT_DURATION - 80);
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
      {/* Carousel is handled in layout - blur animates out there */}

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
              <Text style={styles.subline} numberOfLines={1}>Your attributes. Celebrity styles.</Text>
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

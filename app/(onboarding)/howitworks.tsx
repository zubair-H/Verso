import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AttributesCarousel } from '@/components/ui';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const logoImage = require('@/assets/ios-tinted.png');
const LOGO_SIZE = 280; // Same size as page 1

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DURATION = 400;
const EASE = Easing.out(Easing.quad);

export default function HowItWorksScreen() {
  const insets = useSafeAreaInsets();

  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Text appears
    textOpacity.value = withDelay(300, withTiming(1, { duration: DURATION, easing: EASE }));

    // Button appears last
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: DURATION, easing: EASE }));
  }, []);

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/splash');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createStyles(insets), [insets]);

  return (
    <View style={styles.container}>
      {/* Attributes carousel with light blur */}
      <AttributesCarousel showBlur blurIntensity={100} blurTint="light" />

      {/* Content - same layout as page 1 */}
      <View style={styles.content}>
        {/* Logo - same position as page 1 */}
        <View style={styles.logoContainer}>
          <Image
            source={logoImage}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
        </View>

        {/* Text content */}
        <View style={styles.textSection}>
          <Animated.View style={textStyle}>
            <Text style={styles.headline}>How it works.</Text>
            <Text style={styles.subheadline}>Pick any attribute. See it transform into celebrity styles.</Text>
          </Animated.View>
        </View>
      </View>

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

const createStyles = (insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    logoContainer: {
      marginTop: 80, // Same as page 1
      marginBottom: 48, // Same as page 1
    },
    textSection: {
      alignItems: 'center',
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 38,
      fontWeight: '700',
      color: '#1A1F2E',
      textAlign: 'center',
      lineHeight: 46,
      letterSpacing: -1,
    },
    subheadline: {
      ...typography.bodyLarge,
      fontSize: 17,
      color: '#0D1017',
      textAlign: 'center',
      lineHeight: 24,
      marginTop: 20,
      opacity: 0.7,
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

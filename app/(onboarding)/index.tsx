import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { MasonryBackground } from '@/components/ui';
import { createStyles } from '@/styles/welcome.styles';

const logoImage = require('@/assets/ios-light.png');
const LOGO_SIZE = 220;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DURATION = 400;
const EASE = Easing.out(Easing.quad);

export default function WelcomeScreen() {
  const { colors } = useTheme();

  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: DURATION, easing: EASE });
    textOpacity.value = withDelay(800, withTiming(1, { duration: DURATION, easing: EASE }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: DURATION, easing: EASE }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/splash');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <MasonryBackground showBlur blurIntensity={100} blurTint="dark" overlayOpacity={0.55} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={logoImage}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.centerSection}>
          <Animated.View style={[styles.textBlock, textStyle]}>
            <Text style={styles.headline}>Try any look.</Text>
            <Text style={styles.headline}>Risk nothing.</Text>
            <Text style={styles.subheadline}>See yourself in new styles before you commit.</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

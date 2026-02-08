import React, { useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { springs } from '@/constants/spacing';

interface AnimatedLogoProps {
  size?: 'header' | 'small' | 'medium' | 'large';
  animate?: boolean;
  revealFromBottom?: boolean;
  revealDelay?: number;
}

const lightLogo = require('@/assets/ios-tinted.png');
const darkLogo = require('@/assets/ios-tinted.png');

export function AnimatedLogo({
  size = 'large',
  animate = true,
  revealFromBottom = false,
  revealDelay = 0,
}: AnimatedLogoProps) {
  const { isDark } = useTheme();
  const scale = useSharedValue(animate && !revealFromBottom ? 0.95 : 1);
  const opacity = useSharedValue(animate && !revealFromBottom ? 0 : 1);

  const sizeStyles = {
    header: { width: 40, height: 40 },
    small: { width: 100, height: 100 },
    medium: { width: 160, height: 160 },
    large: { width: 220, height: 220 },
  };
  const currentSize = sizeStyles[size];

  // Bottom-up reveal animation - mask height grows from 0 to full
  const revealHeight = useSharedValue(revealFromBottom ? 0 : currentSize.height);

  useEffect(() => {
    if (animate && !revealFromBottom) {
      scale.value = withSpring(1, springs.smooth);
      opacity.value = withSpring(1, springs.smooth);
    }
    if (revealFromBottom) {
      revealHeight.value = withDelay(
        revealDelay,
        withTiming(currentSize.height, { duration: 1800, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [animate, revealFromBottom]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const revealClipStyle = useAnimatedStyle(() => ({
    height: revealHeight.value,
  }));

  const logoSource = isDark ? darkLogo : lightLogo;

  if (revealFromBottom) {
    return (
      <View style={[styles.revealWrapper, currentSize]}>
        <Animated.View style={[styles.revealClip, { width: currentSize.width }, revealClipStyle]}>
          <Image
            source={logoSource}
            style={[styles.logo, currentSize]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image
        source={logoSource}
        style={[styles.logo, currentSize]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealWrapper: {
    justifyContent: 'flex-end',
  },
  revealClip: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  logo: {
    // Size is applied dynamically
  },
});

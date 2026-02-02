import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { springs } from '@/constants/spacing';

interface AnimatedLogoProps {
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}

const lightLogo = require('@/assets/ios-tinted.png');
const darkLogo = require('@/assets/ios-tinted.png');

export function AnimatedLogo({ size = 'large', animate = true }: AnimatedLogoProps) {
  const { isDark } = useTheme();
  const scale = useSharedValue(animate ? 0.95 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      scale.value = withSpring(1, springs.smooth);
      opacity.value = withSpring(1, springs.smooth);
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const sizeStyles = {
    small: { width: 100, height: 100 },
    medium: { width: 160, height: 160 },
    large: { width: 220, height: 220 },
  };

  const currentSize = sizeStyles[size];
  const logoSource = isDark ? darkLogo : lightLogo;

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
  logo: {
    // Size is applied dynamically
  },
});

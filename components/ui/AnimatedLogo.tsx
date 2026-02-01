import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface AnimatedLogoProps {
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}

export function AnimatedLogo({ size = 'large', animate = true }: AnimatedLogoProps) {
  const scale = useSharedValue(animate ? 0.95 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      scale.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const sizeStyles = {
    small: { fontSize: 24, starSize: 12 },
    medium: { fontSize: 36, starSize: 16 },
    large: { fontSize: 48, starSize: 20 },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.logoRow}>
        <Text style={[styles.star, { fontSize: currentSize.starSize }]}>✦</Text>
        <Text style={[styles.logoText, { fontSize: currentSize.fontSize }]}>
          LOOKR
        </Text>
        <Text style={[styles.star, { fontSize: currentSize.starSize }]}>✦</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 4,
    marginHorizontal: 8,
  },
  star: {
    color: colors.accentPrimary,
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { borderRadius } from '@/constants/spacing';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  haptic?: 'light' | 'medium' | 'heavy';
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  size = 'large',
  icon,
  haptic = 'light',
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    if (disabled || loading) return;

    const hapticType =
      haptic === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy;

    await Haptics.impactAsync(hapticType);
    onPress();
  };

  const sizeStyles = {
    small: { height: 40, paddingHorizontal: 16 },
    medium: { height: 48, paddingHorizontal: 24 },
    large: { height: 56, paddingHorizontal: 32 },
  };

  const textStyles = {
    small: typography.labelMedium,
    medium: typography.labelLarge,
    large: typography.labelLarge,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, style]}
    >
      <LinearGradient
        colors={disabled ? ['#333', '#333'] : colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          sizeStyles[size],
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <>
            {icon && <>{icon}</>}
            <Text
              style={[
                styles.label,
                textStyles[size],
                icon ? styles.labelWithIcon : undefined,
                disabled ? styles.labelDisabled : undefined,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  labelWithIcon: {
    marginLeft: 8,
  },
  labelDisabled: {
    opacity: 0.7,
  },
});

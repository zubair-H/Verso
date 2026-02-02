import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
}: SecondaryButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      ['transparent', colors.accentMuted]
    ),
    borderColor: interpolateColor(
      pressed.value,
      [0, 1],
      [colors.border, colors.borderAccent]
    ),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
    pressed.value = withSpring(1, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
    pressed.value = withSpring(0, springs.smooth);
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isDisabled = disabled || loading;

  const styles = useMemo(() => StyleSheet.create({
    button: {
      height: layout.buttonHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    label: {
      ...typography.labelLarge,
      color: colors.textPrimary,
    },
    labelDisabled: {
      color: colors.textTertiary,
    },
    icon: {
      marginRight: 8,
    },
  }), [colors]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[animatedStyle, style]}
    >
      <Animated.View
        style={[
          styles.button,
          animatedButtonStyle,
          isDisabled && styles.buttonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} size="small" />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={isDisabled ? colors.textTertiary : colors.textPrimary}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.label,
                isDisabled && styles.labelDisabled,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  variant?: 'default' | 'success';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  variant = 'default',
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(0.95, springs.snappy),
      withSpring(1.02, springs.bouncy),
      withSpring(1, springs.snappy)
    );
    onPress();
  };

  const isDisabled = disabled || loading;
  const isSuccess = variant === 'success';

  const styles = useMemo(() => StyleSheet.create({
    button: {
      height: layout.buttonHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    buttonSuccess: {
      backgroundColor: colors.success,
      shadowColor: colors.success,
    },
    buttonDisabled: {
      backgroundColor: colors.bgCard,
      shadowOpacity: 0,
      elevation: 0,
    },
    label: {
      ...typography.labelLarge,
      color: colors.textOnAccent,
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
      <View
        style={[
          styles.button,
          isSuccess && styles.buttonSuccess,
          isDisabled && styles.buttonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnAccent} size="small" />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={isDisabled ? colors.textTertiary : colors.textOnAccent}
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
      </View>
    </AnimatedPressable>
  );
}

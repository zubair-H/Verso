import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, springs } from '@/constants/spacing';

interface SelectableChipProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SelectableChip({
  label,
  icon,
  selected,
  onPress,
  fullWidth = false,
}: SelectableChipProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const prevSelected = useSharedValue(selected);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (selected && !prevSelected.value) {
      scale.value = withSequence(
        withSpring(0.92, springs.snappy),
        withSpring(1.05, springs.celebration),
        withSpring(1, springs.snappy)
      );
    }
    prevSelected.value = selected;
  }, [selected]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(
      selected ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    onPress();
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '47%',
      marginBottom: 12,
    },
    fullWidth: {
      width: '100%',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
    },
    chipFullWidth: {
      paddingVertical: 18,
      justifyContent: 'center',
    },
    chipUnselected: {
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.bgTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    iconContainerSelected: {
      backgroundColor: colors.accent,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textSecondary,
      flex: 1,
    },
    labelSelected: {
      color: colors.textPrimary,
    },
    checkmark: {
      marginLeft: 8,
    },
  }), [colors]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        animatedStyle,
        fullWidth && styles.fullWidth,
      ]}
    >
      <View
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
          fullWidth && styles.chipFullWidth,
        ]}
      >
        <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
          <Ionicons
            name={icon as any}
            size={22}
            color={selected ? colors.textOnAccent : colors.textSecondary}
          />
        </View>
        <Text
          style={[
            styles.label,
            selected && styles.labelSelected,
          ]}
        >
          {label}
        </Text>
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={colors.accent}
            style={styles.checkmark}
          />
        )}
      </View>
    </AnimatedPressable>
  );
}

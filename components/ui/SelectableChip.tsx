import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useAnimatedProps,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { borderRadius } from '@/constants/spacing';

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
  const scale = useSharedValue(1);
  const selectedAnim = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    selectedAnim.value = withSpring(selected ? 1 : 0, {
      damping: 15,
      stiffness: 400,
    });
  }, [selected, selectedAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

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
      {selected ? (
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.chip, fullWidth && styles.chipFullWidth]}
        >
          <Ionicons name={icon as any} size={24} color="#FFFFFF" style={styles.icon} />
          <Text style={[styles.label, styles.labelSelected]}>{label}</Text>
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.chip, styles.chipUnselected, fullWidth && styles.chipFullWidth]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.overlay]} />
          <Ionicons name={icon as any} size={24} color={colors.textSecondary} style={styles.icon} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  chipFullWidth: {
    paddingVertical: 20,
  },
  chipUnselected: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  icon: {
    marginRight: 10,
  },
  label: {
    ...typography.labelLarge,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    marginLeft: 'auto',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

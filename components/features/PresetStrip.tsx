import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { borderRadius, springs } from '@/constants/spacing';
import { presets, Preset } from '@/utils/presets';

interface PresetStripProps {
  onSelectPreset: (preset: Preset) => void;
}

interface ColorsType {
  accent: string;
  bgSecondary: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetStrip({ onSelectPreset }: PresetStripProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {presets.slice(0, 8).map((preset) => (
        <PresetItem
          key={preset.id}
          preset={preset}
          onSelect={() => onSelectPreset(preset)}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
}

function PresetItem({
  preset,
  onSelect,
  colors,
}: {
  preset: Preset;
  onSelect: () => void;
  colors: ColorsType;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  const itemStyles = useMemo(() => ({
    presetBorder: {
      padding: 2,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    presetImageContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden' as const,
      backgroundColor: colors.bgSecondary,
    },
  }), [colors]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.presetItem, animatedStyle]}
    >
      {/* Solid mint border instead of gradient */}
      <View style={itemStyles.presetBorder}>
        <View style={itemStyles.presetImageContainer}>
          <Image source={{ uri: preset.image }} style={styles.presetImage} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  presetItem: {
    marginRight: 16,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

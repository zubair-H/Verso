import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/spacing';
import { presets, Preset } from '@/utils/presets';

interface PresetStripProps {
  onSelectPreset: (preset: Preset) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetStrip({ onSelectPreset }: PresetStripProps) {
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
        />
      ))}
    </ScrollView>
  );
}

function PresetItem({
  preset,
  onSelect,
}: {
  preset: Preset;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.presetItem, animatedStyle]}
    >
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.presetBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.presetImageContainer}>
          <Image source={{ uri: preset.image }} style={styles.presetImage} />
        </View>
      </LinearGradient>
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
  presetBorder: {
    padding: 2,
    borderRadius: borderRadius.full,
  },
  presetImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

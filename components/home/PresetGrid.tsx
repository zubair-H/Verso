import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';
import type { Preset, PresetSection } from '@/utils/presets';

interface PresetGridProps {
  section: PresetSection;
  onSelectPreset: (presetImage: string) => void;
  onSeeAll: () => void;
  animationDelay?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - layout.screenPadding * 2 - GAP) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GridCard({
  preset,
  index,
  onPress,
}: {
  preset: Preset;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: CARD_WIDTH,
          height: CARD_WIDTH,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.bgSecondary,
        },
        image: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        splitLine: {
          position: 'absolute',
          top: CARD_WIDTH * 0.15,
          left: CARD_WIDTH / 2 - 0.75,
          width: 1.5,
          height: CARD_WIDTH * 0.7,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          borderRadius: 1,
        },
        overlay: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 10,
          paddingBottom: 10,
          paddingTop: 28,
        },
        name: {
          ...typography.labelSmall,
          color: '#FFFFFF',
        },
      }),
    [colors]
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify().damping(20).stiffness(200)}
        style={styles.card}
      >
        <Image source={{ uri: preset.image }} style={styles.image} />
        <View style={styles.splitLine} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.overlay}
        >
          <Text style={styles.name} numberOfLines={1}>
            {preset.name}
          </Text>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function PresetGrid({
  section,
  onSelectPreset,
  onSeeAll,
  animationDelay = 0,
}: PresetGridProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: layout.screenPadding,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        title: {
          ...typography.headlineMedium,
          color: colors.textPrimary,
        },
        seeAll: {
          ...typography.caption,
          color: colors.accent,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: GAP,
        },
      }),
    [colors]
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(animationDelay).springify().damping(20).stiffness(200)}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={section.icon as any} size={18} color={colors.textSecondary} />
          <Text style={styles.title}>{section.title}</Text>
        </View>
        <Pressable onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {section.presets.map((preset, index) => (
          <GridCard
            key={preset.id}
            preset={preset}
            index={index}
            onPress={() => onSelectPreset(preset.image)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';
import { getPresetsForCategory } from '@/utils/presets';
import type { Preset, GroupedSection } from '@/utils/presets';

interface PresetGridProps {
  section: GroupedSection;
  onSelectPreset: (presetImage: string) => void;
  onSeeAll: (sectionId: string) => void;
  animationDelay?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_CARD_SIZE = 120;
const HORIZONTAL_GAP = 10;

// Alternating tilts for cards — intentionally imperfect but symmetric
const CARD_TILTS = [-1.8, 1.2, 2, -1.5, -0.8, 1.8];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HorizontalCard({
  preset,
  index,
  onPress,
}: {
  preset: Preset;
  index: number;
  onPress: () => void;
}) {
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
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
          width: HORIZONTAL_CARD_SIZE,
          height: HORIZONTAL_CARD_SIZE,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.bgSecondary,
          transform: [{ rotate: `${tilt}deg` }],
        },
        image: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        splitLine: {
          position: 'absolute',
          top: HORIZONTAL_CARD_SIZE * 0.15,
          left: HORIZONTAL_CARD_SIZE / 2 - 0.75,
          width: 1.5,
          height: HORIZONTAL_CARD_SIZE * 0.7,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          borderRadius: 1,
        },
      }),
    [colors, tilt]
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <View style={styles.card}>
        <Image source={{ uri: preset.image }} style={styles.image} />
        <View style={styles.splitLine} />
      </View>
    </AnimatedPressable>
  );
}

const GAP = 12;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - layout.screenPadding * 2 - GAP) / 2;

function GridCard({
  preset,
  index,
  onPress,
}: {
  preset: Preset;
  index: number;
  onPress: () => void;
}) {
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
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
          width: GRID_CARD_WIDTH,
          height: GRID_CARD_WIDTH,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.bgSecondary,
          transform: [{ rotate: `${tilt}deg` }],
        },
        image: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        splitLine: {
          position: 'absolute',
          top: GRID_CARD_WIDTH * 0.15,
          left: GRID_CARD_WIDTH / 2 - 0.75,
          width: 1.5,
          height: GRID_CARD_WIDTH * 0.7,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          borderRadius: 1,
        },
      }),
    [colors, tilt]
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
      </Animated.View>
    </AnimatedPressable>
  );
}

function SubCategoryRow({
  categoryId,
  title,
  onSelectPreset,
  onSeeAll,
  rowIndex,
  animationDelay,
}: {
  categoryId: string;
  title: string;
  onSelectPreset: (presetImage: string) => void;
  onSeeAll: (sectionId: string) => void;
  rowIndex: number;
  animationDelay: number;
}) {
  const { colors } = useTheme();
  const category = getPresetsForCategory(categoryId);
  if (!category) return null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          marginBottom: 24,
        },
        rowHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: layout.screenPadding,
          marginBottom: 10,
        },
        rowTitle: {
          ...typography.labelMedium,
          color: colors.textPrimary,
        },
        seeAll: {
          ...typography.caption,
          color: colors.accent,
        },
        scrollContent: {
          paddingHorizontal: layout.screenPadding,
          gap: HORIZONTAL_GAP,
        },
      }),
    [colors]
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(animationDelay + rowIndex * 120).springify().damping(20).stiffness(200)}
      style={styles.row}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Pressable onPress={() => onSeeAll(categoryId)}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {category.presets.map((preset, index) => (
          <HorizontalCard
            key={preset.id}
            preset={preset}
            index={index}
            onPress={() => onSelectPreset(preset.image)}
          />
        ))}
      </ScrollView>
    </Animated.View>
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
        container: {},
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: layout.screenPadding,
          marginBottom: 14,
        },
        title: {
          ...typography.labelLarge,
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
          paddingHorizontal: layout.screenPadding,
        },
      }),
    [colors]
  );

  // If no sub-categories (filtered view), show 2-column grid
  if (!section.subCategories || section.subCategories.length === 0) {
    return (
      <Animated.View
        entering={FadeInDown.delay(animationDelay).springify().damping(20).stiffness(200)}
        style={styles.container}
      >
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

  // Default: group title + horizontal rows per sub-category
  return (
    <Animated.View
      entering={FadeInDown.delay(animationDelay).springify().damping(20).stiffness(200)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{section.title}</Text>
      </View>

      {section.subCategories.map((cat, rowIndex) => (
        <SubCategoryRow
          key={cat.id}
          categoryId={cat.id}
          title={cat.title}
          onSelectPreset={onSelectPreset}
          onSeeAll={onSeeAll}
          rowIndex={rowIndex}
          animationDelay={animationDelay}
        />
      ))}
    </Animated.View>
  );
}

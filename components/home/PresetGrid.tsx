import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
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
import { SeeAllOverlay } from './SeeAllOverlay';

interface PresetGridProps {
  section: GroupedSection;
  onSelectPreset: (presetImage: string) => void;
  animationDelay?: number;
}

// Alternating tilts for cards — intentionally imperfect but symmetric
const CARD_TILTS = [-1.8, 1.2, 2, -1.5, -0.8, 1.8];

// Horizontal row card width + per-row heights for masonry stagger
const HORIZONTAL_WIDTH = 120;
const ROW_HEIGHTS = [150, 120, 165, 130, 140, 110];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HorizontalCard({
  preset,
  index,
  rowHeight,
  onPress,
}: {
  preset: Preset;
  index: number;
  rowHeight: number;
  onPress: () => void;
}) {
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const cardHeight = rowHeight;
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
          width: HORIZONTAL_WIDTH,
          height: cardHeight,
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
          top: cardHeight * 0.15,
          left: HORIZONTAL_WIDTH / 2 - 0.75,
          width: 1.5,
          height: cardHeight * 0.7,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          borderRadius: 1,
        },
      }),
    [colors, tilt, cardHeight]
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

function SubCategoryRow({
  categoryId,
  title,
  onSelectPreset,
  rowIndex,
  animationDelay,
}: {
  categoryId: string;
  title: string;
  onSelectPreset: (presetImage: string) => void;
  rowIndex: number;
  animationDelay: number;
}) {
  const { colors } = useTheme();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const category = getPresetsForCategory(categoryId);
  if (!category) return null;

  const rowHeight = ROW_HEIGHTS[rowIndex % ROW_HEIGHTS.length];

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
          gap: 10,
          alignItems: 'center',
        },
      }),
    [colors]
  );

  const handleSeeAll = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOverlayVisible(true);
  };

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(animationDelay + rowIndex * 120).springify().damping(20).stiffness(200)}
        style={styles.row}
      >
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Pressable onPress={handleSeeAll}>
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
              rowHeight={rowHeight}
              onPress={() => onSelectPreset(preset.image)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <SeeAllOverlay
        visible={overlayVisible}
        title={title}
        presets={category.presets}
        onSelectPreset={onSelectPreset}
        onClose={() => setOverlayVisible(false)}
      />
    </>
  );
}

export function PresetGrid({
  section,
  onSelectPreset,
  animationDelay = 0,
}: PresetGridProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {},
        header: {
          paddingHorizontal: layout.screenPadding,
          marginBottom: 14,
        },
        title: {
          ...typography.labelLarge,
          color: colors.textPrimary,
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
        <Text style={styles.title}>{section.title}</Text>
      </View>

      {section.subCategories.map((cat, rowIndex) => (
        <SubCategoryRow
          key={cat.id}
          categoryId={cat.id}
          title={cat.title}
          onSelectPreset={onSelectPreset}
          rowIndex={rowIndex}
          animationDelay={animationDelay}
        />
      ))}
    </Animated.View>
  );
}

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius, springs } from '@/constants/spacing';
import { presets, categories, getPresetsByCategory, Preset } from '@/utils/presets';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_GAP = 12;
const CARD_WIDTH = (width - layout.screenPadding * 2 - CARD_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ColorsType {
  bgPrimary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;
  accent: string;
  bgTertiary: string;
  border: string;
}

export default function PresetsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPresets = useMemo(() => {
    let result = getPresetsByCategory(selectedCategory);
    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [selectedCategory, searchQuery]);

  const handleSelectPreset = async (preset: Preset) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(tabs)',
      params: { presetImage: preset.image },
    });
  };

  const handleCategorySelect = async (categoryId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  };

  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    title: {
      ...typography.displayMedium,
      color: colors.textPrimary,
    },
    searchBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bgTertiary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
    sectionTitle: {
      ...typography.headlineMedium,
      color: colors.textPrimary,
    },
    presetName: {
      ...typography.caption,
      color: colors.textPrimary,
    },
  }), [colors]);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={dynamicStyles.title}>Discover</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={dynamicStyles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search looks..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.label}
            icon={category.icon}
            selected={selectedCategory === category.id}
            onPress={() => handleCategorySelect(category.id)}
            colors={colors}
          />
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={dynamicStyles.sectionTitle}>
            {selectedCategory === 'all' ? 'Trending Now' : categories.find(c => c.id === selectedCategory)?.label}
          </Text>
          {selectedCategory === 'all' && (
            <Ionicons name="flame" size={20} color={colors.accent} style={styles.flameIcon} />
          )}
        </View>

        <View style={styles.grid}>
          {filteredPresets.map((preset, index) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              index={index}
              onPress={() => handleSelectPreset(preset)}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CategoryChip({
  label,
  icon,
  selected,
  onPress,
  colors,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  colors: ColorsType;
}) {
  const chipStyles = useMemo(() => ({
    categoryInner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: borderRadius.full,
      backgroundColor: selected ? colors.accent : colors.bgTertiary,
      borderWidth: 1,
      borderColor: selected ? colors.accent : colors.border,
    },
    categoryLabel: {
      ...typography.labelMedium,
      color: selected ? colors.textOnAccent : colors.textSecondary,
    },
  }), [colors, selected]);

  return (
    <Pressable onPress={onPress} style={styles.categoryChip}>
      <View style={chipStyles.categoryInner}>
        <Ionicons
          name={icon as any}
          size={14}
          color={selected ? colors.textOnAccent : colors.textSecondary}
          style={styles.categoryIcon}
        />
        <Text style={chipStyles.categoryLabel}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function PresetCard({
  preset,
  index,
  onPress,
  colors,
}: {
  preset: Preset;
  index: number;
  onPress: () => void;
  colors: ColorsType;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const cardStyles = useMemo(() => ({
    presetName: {
      ...typography.caption,
      color: colors.textPrimary,
    },
  }), [colors]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.presetCard, animatedStyle]}
    >
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Image source={{ uri: preset.image }} style={styles.presetImage} />
        <View style={styles.presetOverlay}>
          <Text style={cardStyles.presetName} numberOfLines={1}>
            {preset.name}
          </Text>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  searchContainer: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: layout.screenPadding,
  },
  categoryChip: {
    marginRight: 12,
  },
  categoryIcon: {
    marginRight: 6,
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.tabBarHeight + 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flameIcon: {
    marginLeft: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -CARD_GAP / 2,
  },
  presetCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    marginHorizontal: CARD_GAP / 2,
    marginBottom: CARD_GAP,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  presetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  presetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});

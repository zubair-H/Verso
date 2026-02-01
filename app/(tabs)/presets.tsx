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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { presets, categories, getPresetsByCategory, Preset } from '@/utils/presets';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_GAP = 12;
const CARD_WIDTH = (width - layout.screenPadding * 2 - CARD_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PresetsScreen() {
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
    // Navigate back to home with preset selected
    router.push({
      pathname: '/(tabs)',
      params: { presetImage: preset.image },
    });
  };

  const handleCategorySelect = async (categoryId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.06)', 'rgba(0, 0, 0, 0)', 'rgba(0, 191, 165, 0.04)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Looks</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
          <View style={styles.searchInner}>
            <Ionicons name="search" size={16} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search looks..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={14} color={colors.textTertiary} style={styles.clearIcon} />
              </Pressable>
            )}
          </View>
        </BlurView>
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
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Trending Now' : categories.find(c => c.id === selectedCategory)?.label}
          </Text>
          {selectedCategory === 'all' && (
            <Ionicons name="flame" size={20} color={colors.accentPrimary} style={styles.flameIcon} />
          )}
        </View>

        <View style={styles.grid}>
          {filteredPresets.map((preset, index) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              index={index}
              onPress={() => handleSelectPreset(preset)}
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
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.categoryChip}>
      {selected ? (
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.categoryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name={icon as any} size={14} color={colors.textPrimary} style={styles.categoryIcon} />
          <Text style={[styles.categoryLabel, styles.categoryLabelSelected]}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.categoryInactive}>
          <Ionicons name={icon as any} size={14} color={colors.textSecondary} style={styles.categoryIcon} />
          <Text style={styles.categoryLabel}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function PresetCard({
  preset,
  index,
  onPress,
}: {
  preset: Preset;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.presetCard, animatedStyle]}
    >
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Image source={{ uri: preset.image }} style={styles.presetImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.presetOverlay}
        >
          <Text style={styles.presetName} numberOfLines={1}>
            {preset.name}
          </Text>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },
  searchContainer: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: 16,
  },
  searchBlur: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  clearIcon: {
    padding: 4,
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
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
  },
  categoryInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  categoryLabelSelected: {
    color: colors.textPrimary,
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
  sectionTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
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
  },
  presetName: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
});

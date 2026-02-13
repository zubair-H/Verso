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
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius, springs } from '@/constants/spacing';
import { presetSections, searchPresets, Preset } from '@/utils/presets';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 130;
const CARD_HEIGHT = 170;

// Grid card dimensions for search results
const COLUMN_COUNT = 3;
const GRID_GAP = 12;
const GRID_CARD_WIDTH = (width - layout.screenPadding * 2 - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PresetCard({
  preset,
  onPress,
}: {
  preset: Preset;
  onPress: () => void;
}) {
  const { colors } = useTheme();
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

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[staticStyles.cardWrapper, animatedStyle]}
    >
      <View style={[staticStyles.card, { backgroundColor: colors.bgSecondary }]}>
        <Image source={{ uri: preset.image }} style={staticStyles.cardImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={staticStyles.cardOverlay}
        >
          <Text style={staticStyles.cardName} numberOfLines={1}>
            {preset.name}
          </Text>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

function GridPresetCard({
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
    scale.value = withSpring(0.95, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const cardStyles = useMemo(() => ({
    name: {
      ...typography.caption,
      color: colors.textPrimary,
    },
  }), [colors]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[staticStyles.gridCard, animatedStyle]}
    >
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Image source={{ uri: preset.image }} style={staticStyles.gridCardImage} />
        <View style={staticStyles.gridCardOverlay}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {preset.name}
          </Text>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

export default function PresetsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return searchPresets(searchQuery);
  }, [searchQuery, isSearching]);

  const handleSelectPreset = async (preset: Preset) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(tabs)',
      params: { presetImage: preset.image },
    });
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
      ...typography.labelLarge,
      color: colors.textPrimary,
    },
    sectionIcon: {
      color: colors.textSecondary,
    },
    emptyText: {
      ...typography.bodyMedium,
      color: colors.textTertiary,
      textAlign: 'center' as const,
      marginTop: 40,
    },
  }), [colors]);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={staticStyles.header}>
        <Text style={dynamicStyles.title}>Ambassadors</Text>
      </View>

      {/* Search Bar */}
      <View style={staticStyles.searchContainer}>
        <View style={dynamicStyles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textTertiary} style={staticStyles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search ambassadors or looks..."
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

      {/* Content */}
      <ScrollView
        style={staticStyles.scrollView}
        contentContainerStyle={staticStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSearching ? (
          // Search results as grid
          <>
            {searchResults.length > 0 ? (
              <View style={staticStyles.grid}>
                {searchResults.map((preset, index) => (
                  <GridPresetCard
                    key={preset.id}
                    preset={preset}
                    index={index}
                    onPress={() => handleSelectPreset(preset)}
                  />
                ))}
              </View>
            ) : (
              <Text style={dynamicStyles.emptyText}>No ambassador looks found</Text>
            )}
          </>
        ) : (
          // Browse by sections
          presetSections.map((section, sectionIndex) => (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(sectionIndex * 100).springify().damping(20).stiffness(200)}
              style={staticStyles.sectionContainer}
            >
              <View style={staticStyles.sectionHeader}>
                <View style={staticStyles.sectionTitleRow}>
                  <Ionicons
                    name={section.icon as any}
                    size={16}
                    style={dynamicStyles.sectionIcon}
                  />
                  <Text style={dynamicStyles.sectionTitle}>{section.title}</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={staticStyles.sectionScroll}
              >
                {section.presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onPress={() => handleSelectPreset(preset)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const staticStyles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  searchContainer: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: layout.tabBarHeight + 20,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionScroll: {
    paddingLeft: layout.screenPadding,
    paddingRight: 12,
  },
  cardWrapper: {
    marginRight: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 24,
  },
  cardName: {
    ...typography.labelSmall,
    fontSize: 11,
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: layout.screenPadding,
    marginHorizontal: -GRID_GAP / 2,
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    height: GRID_CARD_WIDTH * 1.3,
    marginHorizontal: GRID_GAP / 2,
    marginBottom: GRID_GAP,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});

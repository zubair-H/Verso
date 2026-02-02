import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
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
import { PrimaryButton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius, springs } from '@/constants/spacing';
import { useStorage, SavedLook } from '@/hooks/useStorage';

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
  accent: string;
  bgTertiary: string;
  border: string;
}

export default function SavedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedLooks, toggleFavorite, isLoading } = useStorage();
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const displayedLooks = activeTab === 'favorites'
    ? savedLooks.filter((look) => look.isFavorite)
    : savedLooks;

  const handleTabChange = async (tab: 'all' | 'favorites') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleLongPress = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const handlePress = async (id: string) => {
    if (selectionMode) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(id);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleCompare = () => {
    // Navigate to compare view
  };

  const handleTryALook = () => {
    router.push('/(tabs)');
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
    editButton: {
      ...typography.labelLarge,
      color: colors.accent,
    },
    tabsContainer: {
      flexDirection: 'row' as const,
      marginHorizontal: layout.screenPadding,
      marginBottom: 24,
      backgroundColor: colors.bgTertiary,
      borderRadius: borderRadius.md,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center' as const,
      borderRadius: borderRadius.sm,
    },
    tabActive: {
      backgroundColor: colors.border,
    },
    tabText: {
      ...typography.labelMedium,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.textPrimary,
    },
    emptyTitle: {
      ...typography.headlineLarge,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    emptyDescription: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: 32,
    },
    savedCardSelected: {
      borderColor: colors.accent,
    },
    favoriteBadge: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.bgTertiary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    selectionIndicator: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'transparent',
    },
    selectionIndicatorActive: {
      borderWidth: 0,
      backgroundColor: colors.accent,
    },
  }), [colors]);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={dynamicStyles.title}>Saved Looks</Text>
        {selectionMode ? (
          <Pressable onPress={exitSelectionMode}>
            <Text style={dynamicStyles.editButton}>Done</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setSelectionMode(true)}>
            <Text style={dynamicStyles.editButton}>Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabsContainer}>
        <Pressable
          onPress={() => handleTabChange('all')}
          style={[dynamicStyles.tab, activeTab === 'all' && dynamicStyles.tabActive]}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'all' && dynamicStyles.tabTextActive]}>
            All ({savedLooks.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleTabChange('favorites')}
          style={[dynamicStyles.tab, activeTab === 'favorites' && dynamicStyles.tabActive]}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'favorites' && dynamicStyles.tabTextActive]}>
            Favorites
          </Text>
        </Pressable>
      </View>

      {/* Grid or Empty State */}
      {displayedLooks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={64} color={colors.textTertiary} style={styles.emptyIcon} />
          <Text style={dynamicStyles.emptyTitle}>
            {activeTab === 'favorites' ? 'No favorites yet' : 'Start your collection'}
          </Text>
          <Text style={dynamicStyles.emptyDescription}>
            {activeTab === 'favorites'
              ? 'Tap the heart on any saved look to add it here.'
              : 'Explore some looks and save your favorites to build your style inspiration board!'}
          </Text>
          {activeTab === 'all' && (
            <PrimaryButton
              label="Try a Look"
              onPress={handleTryALook}
              style={styles.emptyButton}
            />
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {displayedLooks.map((look, index) => (
              <SavedLookCard
                key={look.id}
                look={look}
                index={index}
                selected={selectedIds.includes(look.id)}
                selectionMode={selectionMode}
                onPress={() => handlePress(look.id)}
                onLongPress={() => handleLongPress(look.id)}
                onToggleFavorite={() => handleToggleFavorite(look.id)}
                colors={colors}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Compare Button */}
      {selectionMode && selectedIds.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.compareContainer}>
          <PrimaryButton
            label={`Compare (${selectedIds.length})`}
            onPress={handleCompare}
            disabled={selectedIds.length !== 2}
            style={styles.compareButton}
          />
        </Animated.View>
      )}
    </View>
  );
}

function SavedLookCard({
  look,
  index,
  selected,
  selectionMode,
  onPress,
  onLongPress,
  onToggleFavorite,
  colors,
}: {
  look: SavedLook;
  index: number;
  selected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleFavorite: () => void;
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
    savedCard: {
      width: CARD_WIDTH,
      height: CARD_WIDTH * 1.3,
      marginHorizontal: CARD_GAP / 2,
      marginBottom: CARD_GAP,
      borderRadius: borderRadius.md,
      overflow: 'hidden' as const,
      borderWidth: 2,
      borderColor: selected ? colors.accent : 'transparent',
    },
    favoriteBadge: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.bgTertiary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    selectionIndicator: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: selected ? 0 : 2,
      borderColor: colors.textSecondary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: selected ? colors.accent : 'transparent',
    },
  }), [colors, selected]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[cardStyles.savedCard, animatedStyle]}
    >
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Image source={{ uri: look.result }} style={styles.savedImage} />

        {/* Favorite badge */}
        {look.isFavorite && !selectionMode && (
          <View style={cardStyles.favoriteBadge}>
            <Ionicons name="heart" size={12} color={colors.accent} />
          </View>
        )}

        {/* Selection indicator */}
        {selectionMode && (
          <View style={cardStyles.selectionIndicator}>
            {selected && <Ionicons name="checkmark" size={14} color={colors.textPrimary} />}
          </View>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.tabBarHeight + 80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -CARD_GAP / 2,
  },
  savedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  compareContainer: {
    position: 'absolute',
    bottom: layout.tabBarHeight + 20,
    left: layout.screenPadding,
    right: layout.screenPadding,
  },
  compareButton: {
    width: '100%',
  },
});

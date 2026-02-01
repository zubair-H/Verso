import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GradientButton, GlassCard } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { useStorage, SavedLook } from '@/hooks/useStorage';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_GAP = 12;
const CARD_WIDTH = (width - layout.screenPadding * 2 - CARD_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SavedScreen() {
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
    } else {
      // View look details
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
    // Navigate to compare view with selected looks
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
        <Text style={styles.title}>Saved Looks</Text>
        {selectionMode ? (
          <Pressable onPress={exitSelectionMode}>
            <Text style={styles.editButton}>Done</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setSelectionMode(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => handleTabChange('all')}
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({savedLooks.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleTabChange('favorites')}
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </Pressable>
      </View>

      {/* Grid or Empty State */}
      {displayedLooks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="camera" size={64} color={colors.textTertiary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No saved looks yet</Text>
          <Text style={styles.emptyDescription}>
            Generate some looks and save your favorites here!
          </Text>
          <GradientButton
            label="Try a Look"
            onPress={() => {}}
            size="medium"
            style={styles.emptyButton}
          />
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
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Compare Button */}
      {selectionMode && selectedIds.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.compareContainer}>
          <GradientButton
            label={`Compare (${selectedIds.length})`}
            onPress={handleCompare}
            disabled={selectedIds.length < 2 || selectedIds.length > 2}
            size="large"
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
}: {
  look: SavedLook;
  index: number;
  selected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleFavorite: () => void;
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
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.savedCard, animatedStyle]}
    >
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <Image source={{ uri: look.result }} style={styles.savedImage} />

        {/* Favorite badge */}
        {look.isFavorite && !selectionMode && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="heart" size={12} color={colors.accentPrimary} />
          </View>
        )}

        {/* Selection indicator */}
        {selectionMode && (
          <View
            style={[
              styles.selectionIndicator,
              selected && styles.selectionIndicatorActive,
            ]}
          >
            {selected && (
              <LinearGradient
                colors={colors.gradientPrimary}
                style={StyleSheet.absoluteFill}
              />
            )}
            {selected && <Ionicons name="checkmark" size={14} color={colors.textPrimary} />}
          </View>
        )}

        {/* Gradient border when selected */}
        {selected && (
          <View style={styles.selectedBorder}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.selectedBorderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },
  editButton: {
    ...typography.labelLarge,
    color: colors.accentPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: layout.screenPadding,
    marginBottom: 24,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.bgCardHover,
  },
  tabText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
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
  emptyTitle: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
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
  savedCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    marginHorizontal: CARD_GAP / 2,
    marginBottom: CARD_GAP,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  savedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectionIndicatorActive: {
    borderWidth: 0,
  },
  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.md,
  },
  selectedBorderGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.md,
    borderWidth: 3,
    borderColor: 'transparent',
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

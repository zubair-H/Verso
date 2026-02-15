import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { borderRadius, layout, springs } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/contexts/ThemeContext';
import { SavedLook, useStorage } from '@/hooks/useStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const CARD_GAP = 14;
const CARD_WIDTH = (SCREEN_WIDTH - layout.screenPadding * 2 - CARD_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.42;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterTab = 'all' | 'favorites';

export default function SavedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedLooks, toggleFavorite, deleteLook, isLoading } = useStorage();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const favoriteCount = useMemo(
    () => savedLooks.filter((look) => look.isFavorite).length,
    [savedLooks]
  );

  const recentCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return savedLooks.filter((look) => look.createdAt >= weekAgo).length;
  }, [savedLooks]);

  const displayedLooks = useMemo(() => {
    const filtered = activeTab === 'favorites'
      ? savedLooks.filter((look) => look.isFavorite)
      : savedLooks;

    return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  }, [activeTab, savedLooks]);

  const toggleSelection = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const handleCardPress = async (id: string) => {
    if (!selectionMode) {
      return;
    }
    await toggleSelection(id);
  };

  const handleCardLongPress = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([id]);
      return;
    }
    await toggleSelection(id);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Promise.all(selectedIds.map(async (id) => deleteLook(id)));
    exitSelectionMode();
  };

  const handleCompare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Compare flow is not wired yet.
  };

  const handleTabChange = async (tab: FilterTab) => {
    await Haptics.selectionAsync();
    setActiveTab(tab);
    exitSelectionMode();
  };

  const handleTryALook = () => {
    router.push('/(tabs)/create');
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.bgPrimary,
        },
        screenGradient: {
          ...StyleSheet.absoluteFillObject,
        },
        headerTitle: {
          ...typography.displayMedium,
          color: colors.textPrimary,
        },
        headerSubtitle: {
          ...typography.bodyMedium,
          color: colors.textSecondary,
          marginTop: 4,
        },
        editButton: {
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: selectionMode ? colors.accent : colors.border,
          backgroundColor: selectionMode ? colors.accentMuted : colors.bgSecondary,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        editText: {
          ...typography.labelMedium,
          color: colors.accent,
        },
        statChip: {
          flex: 1,
          borderRadius: borderRadius.lg,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
          gap: 6,
        },
        statChipTop: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        statChipIcon: {
          width: 18,
          height: 18,
          borderRadius: borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentMuted,
        },
        statPill: {
          flex: 1,
          borderRadius: borderRadius.lg,
          paddingVertical: 11,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
        },
        statLabel: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        statValue: {
          ...typography.headlineMedium,
          color: colors.textPrimary,
        },
        tabsWrap: {
          flexDirection: 'row',
          marginTop: 16,
          gap: 10,
        },
        tab: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          borderRadius: borderRadius.full,
          flexDirection: 'row',
          gap: 6,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
        },
        tabActive: {
          backgroundColor: colors.bgCard,
          borderColor: colors.accent,
        },
        tabText: {
          ...typography.labelMedium,
          color: colors.textSecondary,
        },
        tabTextActive: {
          color: colors.textPrimary,
        },
        countBadge: {
          minWidth: 22,
          paddingHorizontal: 6,
          height: 18,
          borderRadius: borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentMuted,
        },
        countBadgeActive: {
          backgroundColor: colors.accent,
        },
        countBadgeText: {
          ...typography.labelSmall,
          color: colors.textPrimary,
        },
        countBadgeTextActive: {
          color: colors.textOnAccent,
        },
        gridHeading: {
          ...typography.labelLarge,
          color: colors.textPrimary,
          marginTop: 18,
          marginBottom: 10,
        },
        emptyTitle: {
          ...typography.headlineLarge,
          color: colors.textPrimary,
          marginTop: 16,
        },
        emptyDescription: {
          ...typography.bodyMedium,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 30,
        },
        loadingText: {
          ...typography.bodyMedium,
          color: colors.textSecondary,
          marginTop: 12,
        },
        bottomBar: {
          position: 'absolute',
          left: layout.screenPadding,
          right: layout.screenPadding,
          bottom: insets.bottom + layout.tabBarHeight + 8,
          borderRadius: borderRadius.xl,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 10,
          gap: 10,
        },
        bottomBarTop: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        bottomBarDone: {
          ...typography.labelMedium,
          color: colors.accent,
        },
        bottomBarActions: {
          flexDirection: 'row',
          gap: 10,
        },
        bottomMeta: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: 2,
        },
      }),
    [colors, insets.bottom, selectionMode]
  );

  const showEmpty = !isLoading && displayedLooks.length === 0;

  return (
    <View style={[dynamicStyles.screen, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.bgSecondary, colors.bgPrimary, colors.bgPrimary]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={dynamicStyles.screenGradient}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: selectionMode ? layout.tabBarHeight + 120 : layout.tabBarHeight + 30 },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={dynamicStyles.headerTitle}>Saved</Text>
            <Text style={dynamicStyles.headerSubtitle}>Your transformation archive</Text>
          </View>
          <Pressable
            onPress={selectionMode ? exitSelectionMode : () => setSelectionMode(true)}
            style={dynamicStyles.editButton}
          >
            <Text style={dynamicStyles.editText}>{selectionMode ? 'Done' : 'Select'}</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={dynamicStyles.statChip}>
            <View style={dynamicStyles.statChipTop}>
              <View style={dynamicStyles.statChipIcon}>
                <Ionicons name="images-outline" size={11} color={colors.accent} />
              </View>
              <Text style={dynamicStyles.statLabel}>Total Looks</Text>
            </View>
            <Text style={dynamicStyles.statValue}>{savedLooks.length}</Text>
          </View>
          <View style={dynamicStyles.statChip}>
            <View style={dynamicStyles.statChipTop}>
              <View style={dynamicStyles.statChipIcon}>
                <Ionicons name="calendar-outline" size={11} color={colors.accent} />
              </View>
              <Text style={dynamicStyles.statLabel}>Saved This Week</Text>
            </View>
            <Text style={dynamicStyles.statValue}>{recentCount}</Text>
          </View>
        </View>

        <View style={dynamicStyles.tabsWrap}>
          <Pressable
            style={[dynamicStyles.tab, activeTab === 'all' && dynamicStyles.tabActive]}
            onPress={() => handleTabChange('all')}
          >
            <Text style={[dynamicStyles.tabText, activeTab === 'all' && dynamicStyles.tabTextActive]}>All</Text>
            <View style={[dynamicStyles.countBadge, activeTab === 'all' && dynamicStyles.countBadgeActive]}>
              <Text
                style={[
                  dynamicStyles.countBadgeText,
                  activeTab === 'all' && dynamicStyles.countBadgeTextActive,
                ]}
              >
                {savedLooks.length}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[dynamicStyles.tab, activeTab === 'favorites' && dynamicStyles.tabActive]}
            onPress={() => handleTabChange('favorites')}
          >
            <Text style={[dynamicStyles.tabText, activeTab === 'favorites' && dynamicStyles.tabTextActive]}>Favorites</Text>
            <View style={[dynamicStyles.countBadge, activeTab === 'favorites' && dynamicStyles.countBadgeActive]}>
              <Text
                style={[
                  dynamicStyles.countBadgeText,
                  activeTab === 'favorites' && dynamicStyles.countBadgeTextActive,
                ]}
              >
                {favoriteCount}
              </Text>
            </View>
          </Pressable>
        </View>

        {isLoading && savedLooks.length === 0 && (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={dynamicStyles.loadingText}>Loading your saved looks...</Text>
          </View>
        )}

        {showEmpty && (
          <View style={styles.centerState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.bgTertiary }]}>
              <Ionicons name={activeTab === 'favorites' ? 'heart-outline' : 'images-outline'} size={32} color={colors.textSecondary} />
            </View>
            <Text style={dynamicStyles.emptyTitle}>
              {activeTab === 'favorites' ? 'No favorites yet' : 'No saved looks yet'}
            </Text>
            <Text style={dynamicStyles.emptyDescription}>
              {activeTab === 'favorites'
                ? 'Tap the heart on any look to keep your top picks here.'
                : 'Generate looks to build your personal transformation library.'}
            </Text>
            <PrimaryButton label="Create a look" onPress={handleTryALook} style={styles.emptyButton} />
          </View>
        )}

        {!showEmpty && displayedLooks.length > 0 && (
          <>
            <Text style={dynamicStyles.gridHeading}>Recent Looks</Text>
            <View style={styles.grid}>
              {displayedLooks.map((look, index) => (
                <SavedLookCard
                  key={look.id}
                  look={look}
                  index={index}
                  selected={selectedIds.includes(look.id)}
                  selectionMode={selectionMode}
                  onPress={() => handleCardPress(look.id)}
                  onLongPress={() => handleCardLongPress(look.id)}
                  onToggleFavorite={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleFavorite(look.id);
                  }}
                  colors={colors}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {selectionMode && (
        <Animated.View entering={FadeIn} style={dynamicStyles.bottomBar}>
          <View style={dynamicStyles.bottomBarTop}>
            <View>
              <Text style={dynamicStyles.bottomMeta}>Selection</Text>
              <Text style={[typography.labelLarge, { color: colors.textPrimary }]}>
                {selectedIds.length} selected
              </Text>
            </View>
            <Pressable onPress={exitSelectionMode}>
              <Text style={dynamicStyles.bottomBarDone}>Done</Text>
            </Pressable>
          </View>
          <View style={dynamicStyles.bottomBarActions}>
            <SecondaryButton
              label="Delete"
              icon="trash-outline"
              onPress={handleDeleteSelected}
              disabled={!selectedIds.length}
              style={styles.selectionAction}
            />
            <PrimaryButton
              label="Compare"
              onPress={handleCompare}
              disabled={selectedIds.length !== 2}
              style={styles.selectionAction}
            />
          </View>
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
  colors: {
    bgCard: string;
    border: string;
    accent: string;
    accentMuted: string;
    textPrimary: string;
    textSecondary: string;
    textOnAccent: string;
  };
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          backgroundColor: colors.bgCard,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? colors.accent : colors.border,
        },
        topMetaBadge: {
          position: 'absolute',
          top: 10,
          left: 10,
          borderRadius: borderRadius.full,
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: 'rgba(0,0,0,0.38)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          zIndex: 3,
        },
        topMetaText: {
          ...typography.labelSmall,
          color: '#FFFFFF',
        },
        favoriteButton: {
          position: 'absolute',
          top: 10,
          right: 10,
          width: 32,
          height: 32,
          borderRadius: borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.38)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          zIndex: 3,
        },
        selectionIndicator: {
          position: 'absolute',
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: borderRadius.full,
          borderWidth: selected ? 0 : 2,
          borderColor: 'rgba(255,255,255,0.75)',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? colors.accent : 'rgba(0,0,0,0.25)',
        },
        footerTitle: {
          ...typography.labelMedium,
          color: '#FFFFFF',
        },
        footerMeta: {
          ...typography.caption,
          color: 'rgba(255,255,255,0.86)',
          marginTop: 2,
        },
      }),
    [colors, selected]
  );

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const title = look.elements?.length ? look.elements[0] : 'Custom look';
  const subtitle = formatSavedDate(look.createdAt, look.elements?.length ?? 0);
  const badgeText = look.elements?.length ? `${look.elements.length} traits` : 'Saved look';

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.cardWrap, animatedStyle]}
    >
      <Animated.View entering={FadeIn.delay(Math.min(index * 40, 240))} style={cardStyles.card}>
        <Image source={{ uri: look.result }} style={styles.savedImage} />
        <View style={cardStyles.topMetaBadge}>
          <Text style={cardStyles.topMetaText}>{badgeText}</Text>
        </View>

        {!selectionMode && (
          <Pressable style={cardStyles.favoriteButton} onPress={onToggleFavorite} hitSlop={8}>
            <Ionicons name={look.isFavorite ? 'heart' : 'heart-outline'} size={16} color="#FFFFFF" />
          </Pressable>
        )}

        {selectionMode && (
          <View style={cardStyles.selectionIndicator}>
            {selected && <Ionicons name="checkmark" size={16} color={colors.textOnAccent} />}
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.cardFooter}
        >
          <Text numberOfLines={1} style={cardStyles.footerTitle}>
            {title}
          </Text>
          <Text numberOfLines={1} style={cardStyles.footerMeta}>
            {subtitle}
          </Text>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

function formatSavedDate(timestamp: number, elementCount: number) {
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));

  if (!elementCount) return dateLabel;
  return `${dateLabel} • ${elementCount} traits`;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  headerTextWrap: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 56,
  },
  emptyIconWrap: {
    width: 74,
    height: 74,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButton: {
    minWidth: 190,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  cardWrap: {
    width: CARD_WIDTH,
  },
  savedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 24,
    paddingBottom: 10,
  },
  selectionAction: {
    flex: 1,
  },
});

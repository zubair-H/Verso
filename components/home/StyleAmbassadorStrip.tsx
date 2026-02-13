import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';
import type { StylePersona } from '@/utils/personas';

interface StyleAmbassadorStripProps {
  personas: StylePersona[];
  selectedPersonaId: string | null;
  onSelectPersona: (persona: StylePersona) => void;
  analysisTiles?: AnalysisGridTile[];
}

export interface AnalysisGridTile {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string, string];
  onPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_HORIZONTAL_GAP = 4;
const GRID_VERTICAL_GAP = 10;
const GRID_TARGET_SIDE_PADDING = 6;
const CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - GRID_TARGET_SIDE_PADDING * 2 - GRID_HORIZONTAL_GAP) / 2
);
const GRID_PADDING =
  (SCREEN_WIDTH - CARD_WIDTH * 2 - GRID_HORIZONTAL_GAP) / 2;
const CONTENT_HEIGHT = 92;
const SHORT_CARD_HEIGHT = 248;
const LONG_CARD_HEIGHT = SHORT_CARD_HEIGHT * 2 + GRID_VERTICAL_GAP;
const ANALYSIS_CARD_HEIGHT = 210;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PersonaGridTile {
  id: string;
  persona: StylePersona;
  image: string;
  tileTitle: string;
  kind: 'headshot' | 'outfit';
  cardHeight: number;
}

type FeedBlock =
  | {
      id: string;
      type: 'mosaic';
      longTile: PersonaGridTile;
      shortTop: PersonaGridTile;
      shortBottom: PersonaGridTile;
      longOnLeft: boolean;
    }
  | { id: string; type: 'short-row'; left: PersonaGridTile; right: PersonaGridTile }
  | { id: string; type: 'analysis'; tile: AnalysisGridTile };

function AmbassadorCard({
  tile,
  isSelected,
  onPress,
  withBottomGap = false,
}: {
  tile: PersonaGridTile;
  isSelected: boolean;
  onPress: () => void;
  withBottomGap?: boolean;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
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
        wrapper: {
          marginBottom: withBottomGap ? GRID_VERTICAL_GAP : 0,
        },
        card: {
          width: '100%',
          height: tile.cardHeight,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: isSelected ? colors.accent : colors.border,
          backgroundColor: colors.bgCard,
        },
        image: {
          width: '100%',
          height: tile.cardHeight - CONTENT_HEIGHT,
          resizeMode: 'cover',
          backgroundColor: colors.bgSecondary,
        },
        content: {
          height: CONTENT_HEIGHT,
          padding: 12,
          justifyContent: 'space-between',
        },
        nameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        },
        name: {
          ...typography.labelLarge,
          color: colors.textPrimary,
          flex: 1,
        },
        badge: {
          backgroundColor: isSelected ? colors.accent : colors.accentMuted,
          borderRadius: borderRadius.full,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
        badgeText: {
          ...typography.caption,
          fontSize: 11,
          color: isSelected ? colors.textOnAccent : colors.accent,
        },
        title: {
          ...typography.labelSmall,
          color: colors.textSecondary,
          marginTop: 2,
        },
        lore: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          marginTop: 8,
        },
      }),
    [colors, isSelected, tile.cardHeight, withBottomGap]
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.wrapper, animatedStyle]}
    >
      <View style={styles.card}>
        <Image source={{ uri: tile.image }} style={styles.image} />
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{tile.persona.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {tile.kind === 'outfit' ? 'OUTFIT' : 'HEADSHOT'}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{tile.tileTitle}</Text>
          <Text style={styles.lore} numberOfLines={2}>
            {tile.persona.lore}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function AnalysisBannerCard({ tile }: { tile: AnalysisGridTile }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tile.onPress();
  };

  const styles = StyleSheet.create({
    wrapper: {
      width: '100%',
      marginBottom: GRID_VERTICAL_GAP,
    },
    card: {
      width: '100%',
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    body: {
      minHeight: ANALYSIS_CARD_HEIGHT,
      padding: 16,
      justifyContent: 'space-between',
    },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: borderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingVertical: 4,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeText: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.95)',
    },
    title: {
      ...typography.labelLarge,
      color: '#FFFFFF',
      marginTop: 12,
    },
    subtitle: {
      ...typography.bodySmall,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 6,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
    },
    ctaText: {
      ...typography.labelSmall,
      color: '#FFFFFF',
    },
  });

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.wrapper, animatedStyle]}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={tile.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.body}
        >
          <View>
            <View style={styles.badge}>
              <Ionicons name={tile.icon} size={12} color="rgba(255,255,255,0.95)" />
              <Text style={styles.badgeText}>{tile.badge}</Text>
            </View>
            <Text style={styles.title}>{tile.title}</Text>
            <Text style={styles.subtitle}>{tile.subtitle}</Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Open</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

export function StyleAmbassadorStrip({
  personas,
  selectedPersonaId,
  onSelectPersona,
  analysisTiles = [],
}: StyleAmbassadorStripProps) {
  const { colors } = useTheme();
  const personaTiles = useMemo(() => {
    let extraHeadshotsAdded = 0;

    return personas.reduce((acc, persona) => {
      acc.push({
        id: `${persona.id}-headshot`,
        persona,
        image: persona.headshotImage,
        tileTitle: `${persona.title} Headshot`,
        kind: 'headshot',
        cardHeight: SHORT_CARD_HEIGHT,
      });

      if (persona.outfitImage && extraHeadshotsAdded < 4) {
        acc.push({
          id: `${persona.id}-detail`,
          persona,
          image: persona.headshotImage,
          tileTitle: `${persona.title} Detail`,
          kind: 'headshot',
          cardHeight: SHORT_CARD_HEIGHT,
        });
        extraHeadshotsAdded += 1;
      }

      if (persona.outfitImage) {
        acc.push({
          id: `${persona.id}-outfit`,
          persona,
          image: persona.outfitImage,
          tileTitle: `${persona.title} Outfit`,
          kind: 'outfit',
          cardHeight: LONG_CARD_HEIGHT,
        });
      }

      return acc;
    }, [] as PersonaGridTile[]);
  }, [personas]);

  const feedBlocks = useMemo<FeedBlock[]>(() => {
    const longTiles = personaTiles.filter((tile) => tile.kind === 'outfit');
    const shortTiles = personaTiles.filter((tile) => tile.kind === 'headshot');
    const blocks: FeedBlock[] = [];
    let longIndex = 0;
    let shortIndex = 0;
    let analysisIndex = 0;
    let longOnLeft = true;

    while (longIndex < longTiles.length && shortIndex + 1 < shortTiles.length) {
      const longTile = longTiles[longIndex];
      const shortTop = shortTiles[shortIndex];
      const shortBottom = shortTiles[shortIndex + 1];

      blocks.push({
        id: `mosaic-${longTile.id}`,
        type: 'mosaic',
        longTile,
        shortTop,
        shortBottom,
        longOnLeft,
      });

      longIndex += 1;
      shortIndex += 2;
      longOnLeft = !longOnLeft;

      if (analysisTiles[analysisIndex]) {
        blocks.push({
          id: `analysis-${analysisTiles[analysisIndex].id}`,
          type: 'analysis',
          tile: analysisTiles[analysisIndex],
        });
        analysisIndex += 1;
      }
    }

    while (shortIndex + 1 < shortTiles.length) {
      const left = shortTiles[shortIndex];
      const right = shortTiles[shortIndex + 1];
      blocks.push({
        id: `short-row-${left.id}-${right.id}`,
        type: 'short-row',
        left,
        right,
      });
      shortIndex += 2;

      if (analysisTiles[analysisIndex]) {
        blocks.push({
          id: `analysis-${analysisTiles[analysisIndex].id}`,
          type: 'analysis',
          tile: analysisTiles[analysisIndex],
        });
        analysisIndex += 1;
      }
    }

    while (analysisIndex < analysisTiles.length) {
      blocks.push({
        id: `analysis-${analysisTiles[analysisIndex].id}`,
        type: 'analysis',
        tile: analysisTiles[analysisIndex],
      });
      analysisIndex += 1;
    }

    return blocks;
  }, [personaTiles, analysisTiles]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: 28,
        },
        header: {
          paddingHorizontal: layout.screenPadding,
          marginBottom: 10,
        },
        title: {
          ...typography.labelLarge,
          color: colors.textPrimary,
        },
        subtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: 4,
        },
        feed: {
          paddingHorizontal: GRID_PADDING,
        },
        masonry: {
          flexDirection: 'row',
          marginBottom: GRID_VERTICAL_GAP,
        },
        column: {
          width: CARD_WIDTH,
        },
        columnGap: {
          marginRight: GRID_HORIZONTAL_GAP,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Celebrity-Inspired Personas</Text>
        <Text style={styles.subtitle}>
          Each persona includes a headshot; outfit personas include full-body references.
        </Text>
      </View>
      <View style={styles.feed}>
        {feedBlocks.map((block) => {
          if (block.type === 'analysis') {
            return <AnalysisBannerCard key={block.id} tile={block.tile} />;
          }

          if (block.type === 'short-row') {
            return (
              <View key={block.id} style={styles.masonry}>
                <View style={[styles.column, styles.columnGap]}>
                  <AmbassadorCard
                    tile={block.left}
                    isSelected={selectedPersonaId === block.left.persona.id}
                    onPress={() => onSelectPersona({ ...block.left.persona, image: block.left.image })}
                  />
                </View>
                <View style={styles.column}>
                  <AmbassadorCard
                    tile={block.right}
                    isSelected={selectedPersonaId === block.right.persona.id}
                    onPress={() => onSelectPersona({ ...block.right.persona, image: block.right.image })}
                  />
                </View>
              </View>
            );
          }

          return (
            <View key={block.id} style={styles.masonry}>
              {block.longOnLeft ? (
                <>
                  <View style={[styles.column, styles.columnGap]}>
                    <AmbassadorCard
                      tile={block.longTile}
                      isSelected={selectedPersonaId === block.longTile.persona.id}
                      onPress={() => onSelectPersona({ ...block.longTile.persona, image: block.longTile.image })}
                    />
                  </View>
                  <View style={styles.column}>
                    <AmbassadorCard
                      tile={block.shortTop}
                      isSelected={selectedPersonaId === block.shortTop.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortTop.persona, image: block.shortTop.image })}
                      withBottomGap
                    />
                    <AmbassadorCard
                      tile={block.shortBottom}
                      isSelected={selectedPersonaId === block.shortBottom.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortBottom.persona, image: block.shortBottom.image })}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.column, styles.columnGap]}>
                    <AmbassadorCard
                      tile={block.shortTop}
                      isSelected={selectedPersonaId === block.shortTop.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortTop.persona, image: block.shortTop.image })}
                      withBottomGap
                    />
                    <AmbassadorCard
                      tile={block.shortBottom}
                      isSelected={selectedPersonaId === block.shortBottom.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortBottom.persona, image: block.shortBottom.image })}
                    />
                  </View>
                  <View style={styles.column}>
                    <AmbassadorCard
                      tile={block.longTile}
                      isSelected={selectedPersonaId === block.longTile.persona.id}
                      onPress={() => onSelectPersona({ ...block.longTile.persona, image: block.longTile.image })}
                    />
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

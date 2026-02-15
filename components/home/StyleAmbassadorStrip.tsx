import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
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
import type { StylePersona, PersonaAttribute } from '@/utils/personas';

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
const SHORT_CARD_HEIGHT = 188;
const LONG_CARD_HEIGHT = SHORT_CARD_HEIGHT * 2 + GRID_VERTICAL_GAP;
const ANALYSIS_CARD_HEIGHT = 210;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const UNIQUE_TILE_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'eye-outline',
  'eye-off-outline',
  'glasses-outline',
  'happy-outline',
  'sad-outline',
  'heart-outline',
  'heart-half-outline',
  'cut-outline',
  'color-palette-outline',
  'sparkles-outline',
  'body-outline',
  'accessibility-outline',
  'man-outline',
  'woman-outline',
  'male-female-outline',
  'walk-outline',
  'fitness-outline',
  'hand-left-outline',
  'hand-right-outline',
  'finger-print-outline',
  'medkit-outline',
  'bandage-outline',
  'shirt-outline',
  'diamond-outline',
  'flower-outline',
  'leaf-outline',
  'rose-outline',
  'water-outline',
  'flame-outline',
  'moon-outline',
  'sunny-outline',
  'star-outline',
];
const LIGHT_TILE_COLORS = [
  '#8FA8D6',
  '#D7A6B8',
  '#93C7B8',
  '#D9B38C',
  '#9CA8E8',
  '#8FBFD2',
  '#C7A38A',
  '#A6B6D3',
  '#C2D29A',
  '#C7A5D4',
  '#9DC6AE',
  '#E1B9A1',
];
const DARK_TILE_COLORS = [
  '#35507A',
  '#6A3F5E',
  '#2E6A5A',
  '#7B5537',
  '#4B4F86',
  '#2E637C',
  '#785542',
  '#4A5F7B',
  '#5E6D3A',
  '#604271',
  '#3D6A56',
  '#8A5E48',
];

interface PersonaGridTile {
  id: string;
  persona: StylePersona;
  image?: string;
  tileTitle: string;
  attribute: PersonaAttribute;
  kind: 'headshot' | 'outfit';
  cardHeight: number;
  icon: keyof typeof Ionicons.glyphMap;
  visualIndex: number;
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
  | { id: string; type: 'long-row'; left: PersonaGridTile; right: PersonaGridTile }
  | { id: string; type: 'analysis'; tile: AnalysisGridTile };

const ATTRIBUTE_ORDER: PersonaAttribute[] = ['hair', 'face', 'color', 'style'];

function inferAnalysisAttribute(tile: AnalysisGridTile): PersonaAttribute | 'global' {
  const key = `${tile.id} ${tile.title}`.toLowerCase();

  if (key.includes('hair')) {
    return 'hair';
  }
  if (key.includes('face') || key.includes('skin')) {
    return 'face';
  }
  if (key.includes('color') || key.includes('tone')) {
    return 'color';
  }
  if (key.includes('style')) {
    return 'style';
  }

  return 'global';
}

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
  const { colors, isDark } = useTheme();
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
          borderRadius: 30,
          borderCurve: 'continuous',
          overflow: 'hidden',
          backgroundColor: colors.bgCard,
          borderWidth: isSelected ? 1 : 0.6,
          borderColor: isSelected ? colors.accent : colors.border,
        },
        cardBody: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, isSelected, tile.cardHeight, withBottomGap]
  );

  const palette = isDark ? DARK_TILE_COLORS : LIGHT_TILE_COLORS;
  const tileColor = palette[tile.visualIndex % palette.length];
  const icon = tile.icon;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.wrapper, animatedStyle]}
    >
      <View style={styles.card}>
        <View style={[styles.cardBody, { backgroundColor: tileColor }]}>
          <Ionicons name={icon} size={tile.kind === 'outfit' ? 44 : 36} color="#FFFFFF" />
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
    const tiles = personas.reduce((acc, persona) => {
      acc.push({
        id: `${persona.id}-headshot`,
        persona,
        tileTitle: `${persona.title} Headshot`,
        attribute: persona.attribute,
        kind: 'headshot',
        cardHeight: SHORT_CARD_HEIGHT,
        icon: 'sparkles-outline',
        visualIndex: 0,
      });

      if (persona.outfitImage) {
        const detailSource = persona.detailImage;
        if (detailSource && detailSource !== persona.headshotImage) {
          acc.push({
            id: `${persona.id}-detail`,
            persona,
            tileTitle: `${persona.title} Detail`,
            attribute: persona.attribute,
            kind: 'headshot',
            cardHeight: SHORT_CARD_HEIGHT,
            icon: 'sparkles-outline',
            visualIndex: 0,
          });
        }
      }

      if (persona.outfitImage) {
        acc.push({
          id: `${persona.id}-outfit`,
          persona,
          tileTitle: `${persona.title} Outfit`,
          attribute: persona.attribute,
          kind: 'outfit',
          cardHeight: LONG_CARD_HEIGHT,
          icon: 'sparkles-outline',
          visualIndex: 0,
        });
      }

      return acc;
    }, [] as PersonaGridTile[]);
    return tiles.map((tile, index) => ({
      ...tile,
      icon: UNIQUE_TILE_ICONS[index % UNIQUE_TILE_ICONS.length],
      visualIndex: index,
    }));
  }, [personas]);

  const feedBlocks = useMemo<FeedBlock[]>(() => {
    const blocks: FeedBlock[] = [];
    const analysisBuckets: Record<PersonaAttribute | 'global', AnalysisGridTile[]> = {
      hair: [],
      face: [],
      color: [],
      style: [],
      global: [],
    };
    const tilesByAttribute: Record<PersonaAttribute, PersonaGridTile[]> = {
      hair: [],
      face: [],
      color: [],
      style: [],
    };

    analysisTiles.forEach((tile) => {
      analysisBuckets[inferAnalysisAttribute(tile)].push(tile);
    });

    personaTiles.forEach((tile) => {
      tilesByAttribute[tile.attribute].push(tile);
    });

    let longOnLeft = true;

    ATTRIBUTE_ORDER.forEach((attribute) => {
      const categoryTiles = tilesByAttribute[attribute];
      if (!categoryTiles.length) {
        return;
      }
      const attributeBlocks: FeedBlock[] = [];
      const attributeAnalysis = analysisBuckets[attribute];
      const longTiles = categoryTiles.filter((tile) => tile.kind === 'outfit');
      const shortTiles = categoryTiles.filter((tile) => tile.kind === 'headshot');
      let longIndex = 0;
      let shortIndex = 0;

      while (longIndex < longTiles.length && shortIndex + 1 < shortTiles.length) {
        const longTile = longTiles[longIndex];
        const shortTop = shortTiles[shortIndex];
        const shortBottom = shortTiles[shortIndex + 1];

        attributeBlocks.push({
          id: `mosaic-${attribute}-${longTile.id}`,
          type: 'mosaic',
          longTile,
          shortTop,
          shortBottom,
          longOnLeft,
        });

        longIndex += 1;
        shortIndex += 2;
        longOnLeft = !longOnLeft;
      }

      while (shortIndex + 1 < shortTiles.length) {
        const left = shortTiles[shortIndex];
        const right = shortTiles[shortIndex + 1];
        attributeBlocks.push({
          id: `short-row-${attribute}-${left.id}-${right.id}`,
          type: 'short-row',
          left,
          right,
        });
        shortIndex += 2;
      }

      while (longIndex + 1 < longTiles.length) {
        const left = longTiles[longIndex];
        const right = longTiles[longIndex + 1];
        attributeBlocks.push({
          id: `long-row-${attribute}-${left.id}-${right.id}`,
          type: 'long-row',
          left,
          right,
        });
        longIndex += 2;
      }

      if (attributeBlocks.length === 0) {
        attributeAnalysis.forEach((tile) => {
          blocks.push({
            id: `analysis-${attribute}-${tile.id}`,
            type: 'analysis',
            tile,
          });
        });
        return;
      }

      // Keep banners inside each attribute section, but place the first banner
      // after one long-vertical tile block when available.
      let firstBannerInserted = false;
      const firstLongBlockIndex = attributeBlocks.findIndex(
        (block) => block.type === 'mosaic' || block.type === 'long-row'
      );
      const bannerInsertAfterIndex = firstLongBlockIndex >= 0 ? firstLongBlockIndex : 0;

      attributeBlocks.forEach((block, index) => {
        blocks.push(block);
        if (!firstBannerInserted && attributeAnalysis[0] && index === bannerInsertAfterIndex) {
          blocks.push({
            id: `analysis-${attribute}-${attributeAnalysis[0].id}`,
            type: 'analysis',
            tile: attributeAnalysis[0],
          });
          firstBannerInserted = true;
        }
      });

      for (let i = 1; i < attributeAnalysis.length; i += 1) {
        blocks.push({
          id: `analysis-${attribute}-${attributeAnalysis[i].id}`,
          type: 'analysis',
          tile: attributeAnalysis[i],
        });
      }
    });

    analysisBuckets.global.forEach((tile) => {
      blocks.push({
        id: `analysis-global-${tile.id}`,
        type: 'analysis',
        tile,
      });
    });

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
        <Text style={styles.title}>Attribute Style Cards</Text>
        <Text style={styles.subtitle}>
          Pick clean icon cards for hair, eyes, brows, and outfit tone combinations.
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
                    onPress={() => onSelectPersona({ ...block.left.persona, image: block.left.image || block.left.persona.image })}
                  />
                </View>
                <View style={styles.column}>
                  <AmbassadorCard
                    tile={block.right}
                    isSelected={selectedPersonaId === block.right.persona.id}
                    onPress={() => onSelectPersona({ ...block.right.persona, image: block.right.image || block.right.persona.image })}
                  />
                </View>
              </View>
            );
          }

          if (block.type === 'long-row') {
            return (
              <View key={block.id} style={styles.masonry}>
                <View style={[styles.column, styles.columnGap]}>
                  <AmbassadorCard
                    tile={block.left}
                    isSelected={selectedPersonaId === block.left.persona.id}
                    onPress={() => onSelectPersona({ ...block.left.persona, image: block.left.image || block.left.persona.image })}
                  />
                </View>
                <View style={styles.column}>
                  <AmbassadorCard
                    tile={block.right}
                    isSelected={selectedPersonaId === block.right.persona.id}
                    onPress={() => onSelectPersona({ ...block.right.persona, image: block.right.image || block.right.persona.image })}
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
                      onPress={() => onSelectPersona({ ...block.longTile.persona, image: block.longTile.image || block.longTile.persona.image })}
                    />
                  </View>
                  <View style={styles.column}>
                    <AmbassadorCard
                      tile={block.shortTop}
                      isSelected={selectedPersonaId === block.shortTop.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortTop.persona, image: block.shortTop.image || block.shortTop.persona.image })}
                      withBottomGap
                    />
                    <AmbassadorCard
                      tile={block.shortBottom}
                      isSelected={selectedPersonaId === block.shortBottom.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortBottom.persona, image: block.shortBottom.image || block.shortBottom.persona.image })}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.column, styles.columnGap]}>
                    <AmbassadorCard
                      tile={block.shortTop}
                      isSelected={selectedPersonaId === block.shortTop.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortTop.persona, image: block.shortTop.image || block.shortTop.persona.image })}
                      withBottomGap
                    />
                    <AmbassadorCard
                      tile={block.shortBottom}
                      isSelected={selectedPersonaId === block.shortBottom.persona.id}
                      onPress={() => onSelectPersona({ ...block.shortBottom.persona, image: block.shortBottom.image || block.shortBottom.persona.image })}
                    />
                  </View>
                  <View style={styles.column}>
                    <AmbassadorCard
                      tile={block.longTile}
                      isSelected={selectedPersonaId === block.longTile.persona.id}
                      onPress={() => onSelectPersona({ ...block.longTile.persona, image: block.longTile.image || block.longTile.persona.image })}
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

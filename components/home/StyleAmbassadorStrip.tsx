import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
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
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_HORIZONTAL_GAP = 6;
const GRID_VERTICAL_GAP = 8;
const GRID_PADDING = layout.screenPadding;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_HORIZONTAL_GAP) / 2;
const HEADSHOT_IMAGE_HEIGHT = 182;
const OUTFIT_IMAGE_HEIGHT = 298;
const CARD_TEXT_ESTIMATE = 110;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AmbassadorCard({
  tile,
  isSelected,
  onPress,
}: {
  tile: {
    id: string;
    persona: StylePersona;
    image: string;
    tileTitle: string;
    kind: 'headshot' | 'outfit';
    imageHeight: number;
  };
  isSelected: boolean;
  onPress: () => void;
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
          marginBottom: GRID_VERTICAL_GAP,
        },
        card: {
          width: '100%',
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: isSelected ? colors.accent : colors.border,
          backgroundColor: colors.bgCard,
        },
        image: {
          width: '100%',
          height: tile.imageHeight,
          resizeMode: 'cover',
          backgroundColor: colors.bgSecondary,
        },
        content: {
          padding: 12,
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
    [colors, isSelected]
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

export function StyleAmbassadorStrip({
  personas,
  selectedPersonaId,
  onSelectPersona,
}: StyleAmbassadorStripProps) {
  const { colors } = useTheme();
  const personaTiles = useMemo(() => {
    return personas.flatMap((persona) => {
      const tiles: Array<{
        id: string;
        persona: StylePersona;
        image: string;
        tileTitle: string;
        kind: 'headshot' | 'outfit';
        imageHeight: number;
      }> = [
        {
          id: `${persona.id}-headshot`,
          persona,
          image: persona.headshotImage,
          tileTitle: `${persona.title} Headshot`,
          kind: 'headshot',
          imageHeight: HEADSHOT_IMAGE_HEIGHT,
        },
      ];

      if (persona.outfitImage) {
        tiles.push({
          id: `${persona.id}-outfit`,
          persona,
          image: persona.outfitImage,
          tileTitle: `${persona.title} Outfit`,
          kind: 'outfit',
          imageHeight: OUTFIT_IMAGE_HEIGHT,
        });
      }

      return tiles;
    });
  }, [personas]);

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: typeof personaTiles = [];
    const right: typeof personaTiles = [];
    let leftHeight = 0;
    let rightHeight = 0;

    personaTiles.forEach((tile) => {
      const estimatedCardHeight = tile.imageHeight + CARD_TEXT_ESTIMATE + GRID_VERTICAL_GAP;
      if (leftHeight <= rightHeight) {
        left.push(tile);
        leftHeight += estimatedCardHeight;
      } else {
        right.push(tile);
        rightHeight += estimatedCardHeight;
      }
    });

    return { leftColumn: left, rightColumn: right };
  }, [personaTiles]);

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
        masonry: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: GRID_PADDING,
        },
        column: {
          width: CARD_WIDTH,
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
      <View style={styles.masonry}>
        <View style={styles.column}>
          {leftColumn.map((tile) => (
            <AmbassadorCard
              key={tile.id}
              tile={tile}
              isSelected={selectedPersonaId === tile.persona.id}
              onPress={() => onSelectPersona({ ...tile.persona, image: tile.image })}
            />
          ))}
        </View>
        <View style={styles.column}>
          {rightColumn.map((tile) => (
            <AmbassadorCard
              key={tile.id}
              tile={tile}
              isSelected={selectedPersonaId === tile.persona.id}
              onPress={() => onSelectPersona({ ...tile.persona, image: tile.image })}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

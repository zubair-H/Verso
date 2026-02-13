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
const GRID_GAP = 8;
const GRID_PADDING = layout.screenPadding;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_IMAGE_HEIGHT = 210;
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
          width: CARD_WIDTH,
          marginBottom: GRID_GAP,
        },
        card: {
          width: CARD_WIDTH,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: isSelected ? colors.accent : colors.border,
          backgroundColor: colors.bgCard,
        },
        image: {
          width: '100%',
          height: CARD_IMAGE_HEIGHT,
          resizeMode: tile.kind === 'outfit' ? 'contain' : 'cover',
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
      }> = [
        {
          id: `${persona.id}-headshot`,
          persona,
          image: persona.headshotImage,
          tileTitle: `${persona.title} Headshot`,
          kind: 'headshot',
        },
      ];

      if (persona.outfitImage) {
        tiles.push({
          id: `${persona.id}-outfit`,
          persona,
          image: persona.outfitImage,
          tileTitle: `${persona.title} Outfit`,
          kind: 'outfit',
        });
      }

      return tiles;
    });
  }, [personas]);

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
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: GRID_PADDING,
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
      <View style={styles.grid}>
        {personaTiles.map((tile) => (
          <AmbassadorCard
            key={tile.id}
            tile={tile}
            isSelected={selectedPersonaId === tile.persona.id}
            onPress={() => onSelectPersona({ ...tile.persona, image: tile.image })}
          />
        ))}
      </View>
    </View>
  );
}

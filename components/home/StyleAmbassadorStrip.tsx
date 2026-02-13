import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
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

const CARD_WIDTH = 220;
const CARD_IMAGE_HEIGHT = 170;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AmbassadorCard({
  persona,
  isSelected,
  onPress,
}: {
  persona: StylePersona;
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
          marginRight: 12,
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
        <Image source={{ uri: persona.image }} style={styles.image} />
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{persona.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.title}>{persona.title}</Text>
          <Text style={styles.lore} numberOfLines={2}>
            {persona.lore}
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
        scrollContent: {
          paddingLeft: layout.screenPadding,
          paddingRight: 12,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fictional Style Ambassadors</Text>
        <Text style={styles.subtitle}>
          Pick Aria, Luna, or Max as your starting style DNA.
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {personas.map((persona) => (
          <AmbassadorCard
            key={persona.id}
            persona={persona}
            isSelected={selectedPersonaId === persona.id}
            onPress={() => onSelectPersona(persona)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

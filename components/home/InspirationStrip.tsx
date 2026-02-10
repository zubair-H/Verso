import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';
import type { Preset, PresetSection } from '@/utils/presets';
import { SeeAllOverlay } from './SeeAllOverlay';

interface InspirationSectionsProps {
  sections: PresetSection[];
  selectedPresetImage: string | null;
  onSelectPreset: (presetImage: string) => void;
}

const CARD_SIZE = 110;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function InspirationCard({
  preset,
  isSelected,
  onPress,
}: {
  preset: Preset;
  isSelected: boolean;
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          marginRight: 12,
        },
        border: {
          borderRadius: borderRadius.lg + 3,
          borderWidth: 2,
          borderColor: isSelected ? colors.accent : 'transparent',
          padding: 2,
        },
        card: {
          width: CARD_SIZE,
          height: CARD_SIZE,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.bgSecondary,
        },
        image: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        splitLine: {
          position: 'absolute',
          top: CARD_SIZE * 0.15,
          left: CARD_SIZE / 2 - 0.75,
          width: 1.5,
          height: CARD_SIZE * 0.7,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 1,
        },
        overlay: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 8,
          paddingBottom: 8,
          paddingTop: 16,
        },
        name: {
          ...typography.labelSmall,
          fontSize: 11,
          color: '#FFFFFF',
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
      <View style={styles.border}>
        <View style={styles.card}>
          <Image source={{ uri: preset.image }} style={styles.image} />
          <View style={styles.splitLine} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={styles.overlay}
          >
            <Text style={styles.name} numberOfLines={1}>
              {preset.name}
            </Text>
          </LinearGradient>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function SectionRow({
  section,
  selectedPresetImage,
  onSelectPreset,
  index,
}: {
  section: PresetSection;
  selectedPresetImage: string | null;
  onSelectPreset: (presetImage: string) => void;
  index: number;
}) {
  const { colors } = useTheme();
  const [overlayVisible, setOverlayVisible] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 28,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: layout.screenPadding,
          marginBottom: 12,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        title: {
          ...typography.labelLarge,
          color: colors.textPrimary,
        },
        seeAll: {
          ...typography.caption,
          color: colors.accent,
        },
        scrollContent: {
          paddingLeft: layout.screenPadding,
          paddingRight: 12,
        },
      }),
    [colors]
  );

  const handleSeeAll = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOverlayVisible(true);
  };

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(800 + index * 150).springify().damping(20).stiffness(200)}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name={section.icon as any} size={16} color={colors.textSecondary} />
            <Text style={styles.title}>{section.title}</Text>
          </View>
          <Pressable onPress={handleSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {section.presets.map((preset) => (
            <InspirationCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPresetImage === preset.image}
              onPress={() => onSelectPreset(preset.image)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <SeeAllOverlay
        visible={overlayVisible}
        title={section.title}
        presets={section.presets}
        onSelectPreset={onSelectPreset}
        onClose={() => setOverlayVisible(false)}
      />
    </>
  );
}

export function InspirationSections({
  sections,
  selectedPresetImage,
  onSelectPreset,
}: InspirationSectionsProps) {
  return (
    <View>
      {sections.map((section, index) => (
        <SectionRow
          key={section.id}
          section={section}
          selectedPresetImage={selectedPresetImage}
          onSelectPreset={onSelectPreset}
          index={index}
        />
      ))}
    </View>
  );
}

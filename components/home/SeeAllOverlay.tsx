import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';
import type { Preset } from '@/utils/presets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 12;
const MASONRY_COL_WIDTH = (SCREEN_WIDTH - layout.screenPadding * 2 - GAP) / 2;

const CARD_TILTS = [-1.8, 1.2, 2, -1.5, -0.8, 1.8];
const HEIGHT_RATIOS = [1.3, 1.0, 1.15, 1.35, 0.95, 1.25];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MasonryCard({
  preset,
  index,
  onPress,
}: {
  preset: Preset;
  index: number;
  onPress: () => void;
}) {
  const tilt = CARD_TILTS[index % CARD_TILTS.length];
  const heightRatio = HEIGHT_RATIOS[index % HEIGHT_RATIOS.length];
  const cardHeight = MASONRY_COL_WIDTH * heightRatio;
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, springs.snappy);
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
        card: {
          width: MASONRY_COL_WIDTH,
          height: cardHeight,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          backgroundColor: colors.bgSecondary,
          transform: [{ rotate: `${tilt}deg` }],
          marginBottom: GAP,
        },
        image: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        splitLine: {
          position: 'absolute',
          top: cardHeight * 0.15,
          left: MASONRY_COL_WIDTH / 2 - 0.75,
          width: 1.5,
          height: cardHeight * 0.7,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          borderRadius: 1,
        },
      }),
    [colors, tilt, cardHeight]
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify().damping(20).stiffness(200)}
        style={styles.card}
      >
        <Image source={{ uri: preset.image }} style={styles.image} />
        <View style={styles.splitLine} />
      </Animated.View>
    </AnimatedPressable>
  );
}

export function MasonryGrid({
  presets,
  onSelectPreset,
}: {
  presets: Preset[];
  onSelectPreset: (presetImage: string) => void;
}) {
  const { leftCol, rightCol } = useMemo(() => {
    const left: { preset: Preset; index: number }[] = [];
    const right: { preset: Preset; index: number }[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    presets.forEach((preset, index) => {
      const ratio = HEIGHT_RATIOS[index % HEIGHT_RATIOS.length];
      const h = MASONRY_COL_WIDTH * ratio;

      if (leftHeight <= rightHeight) {
        left.push({ preset, index });
        leftHeight += h + GAP;
      } else {
        right.push({ preset, index });
        rightHeight += h + GAP;
      }
    });

    return { leftCol: left, rightCol: right };
  }, [presets]);

  return (
    <View style={masonryStyles.container}>
      <View style={masonryStyles.column}>
        {leftCol.map(({ preset, index }) => (
          <MasonryCard
            key={preset.id}
            preset={preset}
            index={index}
            onPress={() => onSelectPreset(preset.image)}
          />
        ))}
      </View>
      <View style={masonryStyles.column}>
        {rightCol.map(({ preset, index }) => (
          <MasonryCard
            key={preset.id}
            preset={preset}
            index={index}
            onPress={() => onSelectPreset(preset.image)}
          />
        ))}
      </View>
    </View>
  );
}

const masonryStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    gap: GAP,
  },
  column: {
    flex: 1,
  },
});

export function SeeAllOverlay({
  visible,
  title,
  presets,
  onSelectPreset,
  onClose,
}: {
  visible: boolean;
  title: string;
  presets: Preset[];
  onSelectPreset: (presetImage: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bgPrimary,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.screenPadding,
          height: 56,
          gap: 12,
        },
        closeButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          ...typography.headlineMedium,
          color: colors.textPrimary,
          flex: 1,
        },
        scrollContent: {
          paddingTop: 12,
          paddingBottom: insets.bottom + 32,
        },
      }),
    [colors, insets.bottom]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <MasonryGrid presets={presets} onSelectPreset={onSelectPreset} />
        </ScrollView>
      </View>
    </Modal>
  );
}

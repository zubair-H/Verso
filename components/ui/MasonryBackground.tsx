import React, { useEffect, useMemo } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height: screenHeight } = Dimensions.get('window');

// Placeholder images for AI-generated looks
const LOOK_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
];

// Card height variants
const CARD_HEIGHTS = {
  sm: 120,
  md: 150,
  lg: 180,
  xl: 210,
};

type CardHeight = keyof typeof CARD_HEIGHTS;

interface CardData {
  height: CardHeight;
  imageIndex: number;
}

// Generate card patterns for each column (doubled for seamless loop)
const generateColumn = (pattern: CardHeight[], offset: number): CardData[] => {
  const cards = pattern.map((height, index) => ({
    height,
    imageIndex: (index + offset) % LOOK_IMAGES.length,
  }));
  return [...cards, ...cards];
};

const COLUMN_1_PATTERN: CardHeight[] = ['lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm'];
const COLUMN_2_PATTERN: CardHeight[] = ['md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg'];
const COLUMN_3_PATTERN: CardHeight[] = ['xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg', 'md'];

const MasonryColumn = ({
  cards,
  paddingTop,
  animationDuration,
}: {
  cards: CardData[];
  paddingTop: number;
  animationDuration: number;
}) => {
  const translateY = useSharedValue(0);

  const singleSetHeight = cards.slice(0, cards.length / 2).reduce(
    (sum, card) => sum + CARD_HEIGHTS[card.height] + 10,
    0
  );

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-singleSetHeight, {
        duration: animationDuration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [singleSetHeight, animationDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.masonryColumn}>
      <Animated.View style={[{ paddingTop }, animatedStyle]}>
        {cards.map((card, index) => (
          <Image
            key={index}
            source={{ uri: LOOK_IMAGES[card.imageIndex] }}
            style={[styles.imageCard, { height: CARD_HEIGHTS[card.height] }]}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
};

interface MasonryBackgroundProps {
  blurIntensity?: number;
  blurTint?: 'light' | 'dark' | 'default';
  showBlur?: boolean;
  animateBlurOut?: boolean;
  blurOutDelay?: number;
  blurOutDuration?: number;
  opacity?: number;
  topPadding?: number;
}

export const MasonryBackground = ({
  blurIntensity = 50,
  blurTint = 'dark',
  showBlur = false,
  animateBlurOut = false,
  blurOutDelay = 300,
  blurOutDuration = 800,
  opacity = 1,
  topPadding,
}: MasonryBackgroundProps) => {
  const insets = useSafeAreaInsets();
  const effectiveTopPadding = topPadding ?? 100 + insets.top;

  // For mask reveal: animate the top position of the blur layer
  const blurMaskTop = useSharedValue(0);

  useEffect(() => {
    if (animateBlurOut) {
      // Animate the blur layer's top position down to reveal content from top to bottom
      blurMaskTop.value = withDelay(
        blurOutDelay,
        withTiming(screenHeight, {
          duration: blurOutDuration,
          easing: Easing.inOut(Easing.cubic),
        })
      );
    }
  }, [animateBlurOut, blurOutDelay, blurOutDuration]);

  const blurMaskStyle = useAnimatedStyle(() => ({
    top: blurMaskTop.value,
  }));

  const column1Cards = useMemo(() => generateColumn(COLUMN_1_PATTERN, 0), []);
  const column2Cards = useMemo(() => generateColumn(COLUMN_2_PATTERN, 4), []);
  const column3Cards = useMemo(() => generateColumn(COLUMN_3_PATTERN, 8), []);

  return (
    <View style={[styles.container, { opacity }]}>
      <View style={[styles.masonry, { paddingTop: effectiveTopPadding }]}>
        <MasonryColumn
          cards={column1Cards}
          paddingTop={30}
          animationDuration={25000}
        />
        <MasonryColumn
          cards={column2Cards}
          paddingTop={0}
          animationDuration={28000}
        />
        <MasonryColumn
          cards={column3Cards}
          paddingTop={50}
          animationDuration={23000}
        />
      </View>
      {showBlur && (
        <BlurView
          intensity={blurIntensity}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
      )}
      {animateBlurOut && (
        <Animated.View style={[styles.blurMask, blurMaskStyle]}>
          <BlurView
            intensity={blurIntensity}
            tint={blurTint}
            style={styles.blurFill}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  masonry: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  masonryColumn: {
    flex: 1,
    gap: 10,
  },
  imageCard: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  blurMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blurFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: screenHeight,
  },
});

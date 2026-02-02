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

// Abstract fashion/style imagery - textures, fabrics, colors, accessories
const LOOK_IMAGES = [
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80', // Abstract fabric folds
  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80', // Clothing rack minimal
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80', // Folded clothes stack
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80', // Color swatches/fabric
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80', // Clothing store rack
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80', // Hanging clothes
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', // Fabric texture close-up
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80', // Pink clothing minimal
  'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400&q=80', // Sewing/thread detail
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80', // Fashion runway blur
  'https://images.unsplash.com/photo-1558191053-9cd3e618a606?w=400&q=80', // Denim texture
  'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=400&q=80', // Clothes on hangers
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
  overlayOpacity?: number; // Semi-transparent overlay on top of blur
  animateOverlayOut?: boolean; // Animate overlay with same mask reveal as blur
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
  overlayOpacity = 0,
  animateOverlayOut = false,
}: MasonryBackgroundProps) => {
  const insets = useSafeAreaInsets();
  const effectiveTopPadding = topPadding ?? 100 + insets.top;

  // For mask reveal: animate the top position of the blur layer
  const blurMaskTop = useSharedValue(0);
  // For overlay mask reveal: same animation for the dark overlay
  const overlayMaskTop = useSharedValue(0);

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

  useEffect(() => {
    if (animateOverlayOut) {
      // Animate the overlay's top position down to reveal content from top to bottom
      overlayMaskTop.value = withDelay(
        blurOutDelay,
        withTiming(screenHeight, {
          duration: blurOutDuration,
          easing: Easing.inOut(Easing.cubic),
        })
      );
    }
  }, [animateOverlayOut, blurOutDelay, blurOutDuration]);

  const blurMaskStyle = useAnimatedStyle(() => ({
    top: blurMaskTop.value,
  }));

  const overlayMaskStyle = useAnimatedStyle(() => ({
    top: overlayMaskTop.value,
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
      {overlayOpacity > 0 && !animateOverlayOut && (
        <View style={[styles.overlay, { opacity: overlayOpacity }]} />
      )}
      {animateOverlayOut && overlayOpacity > 0 && (
        <Animated.View style={[styles.blurMask, overlayMaskStyle]}>
          <View style={[styles.overlayFill, { opacity: overlayOpacity }]} />
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlayFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: screenHeight,
    backgroundColor: '#000',
  },
});

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height: screenHeight } = Dimensions.get('window');

// Muted color palette with variety
const CARD_COLORS = [
  { bg: '#4A6572', iconBg: 'rgba(255,255,255,0.18)', accent: '#B8D4E3' },      // Steel Blue
  { bg: '#5D4E6D', iconBg: 'rgba(255,255,255,0.18)', accent: '#C9B8D9' },      // Muted Purple
  { bg: '#3D5A5B', iconBg: 'rgba(255,255,255,0.18)', accent: '#A8C5C6' },      // Teal Gray
  { bg: '#6B5344', iconBg: 'rgba(255,255,255,0.18)', accent: '#D4C4B5' },      // Warm Brown
  { bg: '#4A5D4A', iconBg: 'rgba(255,255,255,0.18)', accent: '#B5C9B5' },      // Sage Green
  { bg: '#5C4A4A', iconBg: 'rgba(255,255,255,0.18)', accent: '#D1BFBF' },      // Dusty Rose
  { bg: '#3A4F6A', iconBg: 'rgba(255,255,255,0.18)', accent: '#A3B8D1' },      // Navy Blue
  { bg: '#5A5A5A', iconBg: 'rgba(255,255,255,0.18)', accent: '#C8C8C8' },      // Neutral Gray
  { bg: '#4D5D53', iconBg: 'rgba(255,255,255,0.18)', accent: '#B3C4BA' },      // Forest
  { bg: '#6A5A6A', iconBg: 'rgba(255,255,255,0.18)', accent: '#D1C1D1' },      // Mauve
  { bg: '#4F5D6A', iconBg: 'rgba(255,255,255,0.18)', accent: '#B5C3D1' },      // Slate
  { bg: '#5A6A5A', iconBg: 'rgba(255,255,255,0.18)', accent: '#C1D1C1' },      // Moss
];

// Attribute data with icons - representing transformable features
const ATTRIBUTES = [
  { label: 'Hairstyle', icon: 'cut-outline', category: 'Hair', colorIndex: 0 },
  { label: 'Hair Color', icon: 'color-palette-outline', category: 'Hair', colorIndex: 1 },
  { label: 'Hair Length', icon: 'resize-outline', category: 'Hair', colorIndex: 2 },
  { label: 'Facial Hair', icon: 'man-outline', category: 'Face', colorIndex: 3 },
  { label: 'Eyebrows', icon: 'eye-outline', category: 'Face', colorIndex: 4 },
  { label: 'Glasses', icon: 'glasses-outline', category: 'Face', colorIndex: 5 },
  { label: 'Outfit', icon: 'shirt-outline', category: 'Style', colorIndex: 6 },
  { label: 'Accessories', icon: 'watch-outline', category: 'Style', colorIndex: 7 },
  { label: 'Jewelry', icon: 'diamond-outline', category: 'Style', colorIndex: 8 },
  { label: 'Makeup', icon: 'sparkles-outline', category: 'Face', colorIndex: 9 },
  { label: 'Tattoos', icon: 'flame-outline', category: 'Style', colorIndex: 10 },
  { label: 'Piercings', icon: 'ellipse-outline', category: 'Face', colorIndex: 11 },
];

// Celebrity style references that attributes can transform into
const CELEBRITY_STYLES = [
  'Timothée Chalamet',
  'Zendaya',
  'Harry Styles',
  'Billie Eilish',
  'Bad Bunny',
  'Dua Lipa',
  'Tyler the Creator',
  'Rihanna',
  'The Weeknd',
  'Bella Hadid',
  'A$AP Rocky',
  'Hailey Bieber',
];

// Card heights for visual variety
const CARD_HEIGHTS = {
  sm: 110,
  md: 130,
  lg: 150,
  xl: 170,
};

type CardHeight = keyof typeof CARD_HEIGHTS;

interface CardData {
  height: CardHeight;
  attributeIndex: number;
  celebrityIndex: number;
}

// Generate card patterns for each column (doubled for seamless loop)
const generateColumn = (pattern: CardHeight[], attrOffset: number, celebOffset: number): CardData[] => {
  const cards = pattern.map((height, index) => ({
    height,
    attributeIndex: (index + attrOffset) % ATTRIBUTES.length,
    celebrityIndex: (index + celebOffset) % CELEBRITY_STYLES.length,
  }));
  return [...cards, ...cards];
};

const COLUMN_1_PATTERN: CardHeight[] = ['lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm'];
const COLUMN_2_PATTERN: CardHeight[] = ['md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg'];
const COLUMN_3_PATTERN: CardHeight[] = ['xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg', 'md'];

interface AttributeCardProps {
  attribute: typeof ATTRIBUTES[0];
  celebrityStyle: string;
  height: number;
}

const AttributeCard = ({ attribute, celebrityStyle, height }: AttributeCardProps) => {
  const cardColor = CARD_COLORS[attribute.colorIndex];

  return (
    <View style={[styles.attributeCard, { height, backgroundColor: cardColor.bg }]}>
      <View style={[styles.iconContainer, { backgroundColor: cardColor.iconBg }]}>
        <Ionicons
          name={attribute.icon as any}
          size={24}
          color="#FFF"
        />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={[styles.attributeLabel, { color: '#FFF' }]} numberOfLines={1}>
          {attribute.label}
        </Text>
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={[styles.celebrityLabel, { color: cardColor.accent }]} numberOfLines={1}>
          {celebrityStyle}
        </Text>
      </View>
    </View>
  );
};

const AttributeColumn = ({
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
    (sum, card) => sum + CARD_HEIGHTS[card.height] + 12,
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
    <View style={styles.attributeColumn}>
      <Animated.View style={[{ paddingTop }, animatedStyle]}>
        {cards.map((card, index) => (
          <AttributeCard
            key={index}
            attribute={ATTRIBUTES[card.attributeIndex]}
            celebrityStyle={CELEBRITY_STYLES[card.celebrityIndex]}
            height={CARD_HEIGHTS[card.height]}
          />
        ))}
      </Animated.View>
    </View>
  );
};

interface AttributesCarouselProps {
  blurIntensity?: number;
  blurTint?: 'light' | 'dark' | 'default';
  showBlur?: boolean;
  animateBlurOut?: boolean;
  blurOutDelay?: number;
  blurOutDuration?: number;
  opacity?: number;
  topPadding?: number;
  overlayOpacity?: number;
  animateOverlayOut?: boolean;
}

export const AttributesCarousel = ({
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
}: AttributesCarouselProps) => {
  const insets = useSafeAreaInsets();
  const effectiveTopPadding = topPadding ?? 100 + insets.top;

  // For mask reveal: animate the top position of the blur layer
  const blurMaskTop = useSharedValue(0);
  // For overlay mask reveal: same animation for the dark overlay
  const overlayMaskTop = useSharedValue(0);

  useEffect(() => {
    if (animateBlurOut) {
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

  const column1Cards = useMemo(() => generateColumn(COLUMN_1_PATTERN, 0, 0), []);
  const column2Cards = useMemo(() => generateColumn(COLUMN_2_PATTERN, 4, 4), []);
  const column3Cards = useMemo(() => generateColumn(COLUMN_3_PATTERN, 8, 8), []);

  return (
    <View style={[styles.container, { opacity }]}>
      <View style={[styles.carousel, { paddingTop: effectiveTopPadding }]}>
        <AttributeColumn
          cards={column1Cards}
          paddingTop={30}
          animationDuration={30000}
        />
        <AttributeColumn
          cards={column2Cards}
          paddingTop={0}
          animationDuration={35000}
        />
        <AttributeColumn
          cards={column3Cards}
          paddingTop={50}
          animationDuration={28000}
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
  carousel: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  attributeColumn: {
    flex: 1,
    gap: 12,
  },
  attributeCard: {
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    gap: 3,
  },
  attributeLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  arrowContainer: {
    marginVertical: 3,
  },
  celebrityLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
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

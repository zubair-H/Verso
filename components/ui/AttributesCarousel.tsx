import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  useFrameCallback,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: screenHeight } = Dimensions.get('window');

// Muted color palette with variety
const CARD_COLORS = [
  { bg: '#7D8E7A', iconBg: 'rgba(255,255,255,0.18)', accent: '#B5C4B2' },      // Dusty Sage
  { bg: '#9C8B7A', iconBg: 'rgba(255,255,255,0.18)', accent: '#CFC2B5' },      // Warm Taupe
  { bg: '#6B7A8C', iconBg: 'rgba(255,255,255,0.18)', accent: '#A8B5C3' },      // Slate Blue
  { bg: '#B8A0A0', iconBg: 'rgba(255,255,255,0.18)', accent: '#DBCECE' },      // Dusty Rose
  { bg: '#808872', iconBg: 'rgba(255,255,255,0.18)', accent: '#B8BFB0' },      // Muted Olive
  { bg: '#8C8680', iconBg: 'rgba(255,255,255,0.18)', accent: '#C4C1BD' },      // Warm Gray
  { bg: '#8A7B8C', iconBg: 'rgba(255,255,255,0.18)', accent: '#C1B6C3' },      // Soft Plum
  { bg: '#7A8899', iconBg: 'rgba(255,255,255,0.18)', accent: '#B1BBC7' },      // Faded Denim
  { bg: '#A08070', iconBg: 'rgba(255,255,255,0.18)', accent: '#D0C0B3' },      // Clay
  { bg: '#909A8C', iconBg: 'rgba(255,255,255,0.18)', accent: '#C4CBC2' },      // Sage Gray
  { bg: '#787E88', iconBg: 'rgba(255,255,255,0.18)', accent: '#B2B6BD' },      // Steel
  { bg: '#A09098', iconBg: 'rgba(255,255,255,0.18)', accent: '#CEC9CD' },      // Dusty Mauve
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
  // Smaller icon for small cards to prevent overflow
  const isSmall = height <= 110;
  const iconSize = isSmall ? 36 : 48;
  const iconFontSize = isSmall ? 18 : 24;

  return (
    <View style={[styles.attributeCard, { height, backgroundColor: cardColor.bg }]}>
      <View style={[styles.iconContainer, { backgroundColor: cardColor.iconBg, width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}>
        <Ionicons
          name={attribute.icon as any}
          size={iconFontSize}
          color="#FFF"
        />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={[styles.attributeLabel, { color: '#FFF' }]} numberOfLines={1}>
          {attribute.label}
        </Text>
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={10} color="rgba(255,255,255,0.7)" />
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

  // Speed in pixels per millisecond for smooth continuous scrolling
  const speed = singleSetHeight / animationDuration;

  // Use frame callback for truly seamless infinite loop
  useFrameCallback((frameInfo) => {
    if (frameInfo.timeSincePreviousFrame === null) return;

    translateY.value -= speed * frameInfo.timeSincePreviousFrame;

    // Reset seamlessly when we've scrolled past one complete set
    if (translateY.value <= -singleSetHeight) {
      translateY.value += singleSetHeight;
    }
  });

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
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    gap: 2,
    overflow: 'hidden',
  },
  attributeLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  arrowContainer: {
    marginVertical: 2,
  },
  celebrityLabel: {
    fontSize: 11,
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

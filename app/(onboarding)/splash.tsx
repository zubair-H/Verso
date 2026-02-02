import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { createSplashStyles } from '@/styles/splash.styles';
import { springs } from '@/constants/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedImage = Animated.createAnimatedComponent(Image);

// Logo asset
const logoImage = require('@/assets/ios-tinted.png');

// Logo size
const LOGO_SIZE = 220;

// Card colors from the HTML design
const CARD_COLORS = [
  '#E8C4C0', // Dusty rose
  '#7EB8DA', // Sky blue
  '#F4D06F', // Golden yellow
  '#1A1F2E', // Deep navy
  '#D4A5A5', // Muted pink
  '#9ED8C2', // Mint green
  '#C3B1E1', // Lavender
  '#F2A154', // Orange
  '#A8D5BA', // Sage green
  '#FFB5B5', // Coral pink
  '#87CEEB', // Light blue
  '#DDA0DD', // Plum
];

// Card height variants
const CARD_HEIGHTS = {
  sm: 100,
  md: 130,
  lg: 160,
  xl: 190,
};

type CardHeight = keyof typeof CARD_HEIGHTS;

interface CardData {
  height: CardHeight;
  colorIndex: number;
}

// Generate card patterns for each column (doubled for seamless loop)
const generateColumn = (pattern: CardHeight[]): CardData[] => {
  const cards = pattern.map((height, index) => ({
    height,
    colorIndex: index % CARD_COLORS.length,
  }));
  // Double the cards for seamless infinite scroll
  return [...cards, ...cards];
};

const COLUMN_1_PATTERN: CardHeight[] = ['lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm'];
const COLUMN_2_PATTERN: CardHeight[] = ['md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg'];
const COLUMN_3_PATTERN: CardHeight[] = ['sm', 'lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl'];

const MasonryColumn = ({
  cards,
  paddingTop,
  colorOffset,
  animationDuration,
  styles,
}: {
  cards: CardData[];
  paddingTop: number;
  colorOffset: number;
  animationDuration: number;
  styles: ReturnType<typeof createSplashStyles>;
}) => {
  const translateY = useSharedValue(0);

  // Calculate total height of one set of cards (half the array since it's doubled)
  const singleSetHeight = cards.slice(0, cards.length / 2).reduce(
    (sum, card) => sum + CARD_HEIGHTS[card.height] + 10, // 10 is the gap
    0
  );

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-singleSetHeight, {
        duration: animationDuration,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [singleSetHeight, animationDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.masonryColumn}>
      <Animated.View style={[{ paddingTop }, animatedStyle]}>
        {cards.map((card, index) => (
          <View
            key={index}
            style={[
              styles.imageCard,
              {
                height: CARD_HEIGHTS[card.height],
                backgroundColor: CARD_COLORS[(card.colorIndex + colorOffset) % CARD_COLORS.length],
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const DURATION = 350;
const EASE = Easing.out(Easing.quad);

export default function SplashScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Logo animation - starts large (like first page), shrinks and moves up
  const logoProgress = useSharedValue(0);

  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Typing animation values
  const headlineWidth = useSharedValue(0);
  const subheadlineWidth = useSharedValue(0);

  useEffect(() => {
    // Logo stays in place (same as page 1) for 700ms, then animates up and shrinks
    const logoDelay = 700;
    const logoDuration = 600;
    const logoFinished = logoDelay + logoDuration; // 1300ms

    logoProgress.value = withDelay(
      logoDelay,
      withTiming(1, { duration: logoDuration, easing: Easing.out(Easing.cubic) })
    );

    // Masonry content fades in immediately
    contentOpacity.value = withTiming(1, { duration: 400, easing: EASE });

    // Bottom section waits for logo to finish
    // Headline types out after logo finishes
    headlineWidth.value = withDelay(logoFinished, withTiming(100, { duration: 800, easing: Easing.out(Easing.quad) }));

    // Subheadline types out after headline
    subheadlineWidth.value = withDelay(logoFinished + 500, withTiming(100, { duration: 600, easing: Easing.out(Easing.quad) }));

    // Button appears last
    buttonOpacity.value = withDelay(logoFinished + 800, withTiming(1, { duration: DURATION, easing: EASE }));
  }, []);

  // Logo animated style - shrinks from large to small and moves up
  // Logo starts at page 1 position (marginTop: 80) and moves to very top
  // Since scale transforms from center, we need to compensate by moving top much higher
  const logoContainerStyle = useAnimatedStyle(() => {
    const top = interpolate(
      logoProgress.value,
      [0, 1],
      [80, insets.top - 60]
    );

    return {
      top,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const headlineStyle = useAnimatedStyle(() => ({
    width: `${headlineWidth.value}%`,
  }));

  const subheadlineStyle = useAnimatedStyle(() => ({
    width: `${subheadlineWidth.value}%`,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/potential');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createSplashStyles(colors), [colors]);

  const column1Cards = useMemo(() => generateColumn(COLUMN_1_PATTERN), []);
  const column2Cards = useMemo(() => generateColumn(COLUMN_2_PATTERN), []);
  const column3Cards = useMemo(() => generateColumn(COLUMN_3_PATTERN), []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientEdge, colors.bgGradientCenter, colors.bgGradientEdge]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Logo - starts at same position as page 1 (marginTop: 80), animates up and shrinks */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        <Image
          source={logoImage}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Masonry Grid */}
      <Animated.View style={[styles.masonryContainer, contentStyle]}>
        <View style={[styles.masonry, { paddingTop: 100 + insets.top }]}>
          <MasonryColumn
            cards={column1Cards}
            paddingTop={30}
            colorOffset={0}
            animationDuration={25000}
            styles={styles}
          />
          <MasonryColumn
            cards={column2Cards}
            paddingTop={0}
            colorOffset={4}
            animationDuration={28000}
            styles={styles}
          />
          <MasonryColumn
            cards={column3Cards}
            paddingTop={50}
            colorOffset={8}
            animationDuration={23000}
            styles={styles}
          />
        </View>
      </Animated.View>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.textContent}>
          <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingClip, headlineStyle]}>
              <Text style={styles.headline} numberOfLines={1}>See what's possible.</Text>
            </Animated.View>
          </View>
          <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingClip, subheadlineStyle]}>
              <Text style={styles.subline} numberOfLines={1}>Unlimited looks. Zero commitment.</Text>
            </Animated.View>
          </View>
        </View>

        <Animated.View style={buttonStyle}>
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>Continue</Text>
            </View>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </View>
  );
}
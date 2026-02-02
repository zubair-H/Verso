import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { createSplashStyles } from '@/styles/splash.styles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Logo asset
const logoImage = require('@/assets/ios-tinted.png');

// Logo size
const LOGO_SIZE = 220;

// Placeholder images for AI-generated looks (replace with your actual images)
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
  // Double the cards for seamless infinite scroll
  return [...cards, ...cards];
};

const COLUMN_1_PATTERN: CardHeight[] = ['lg', 'md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm'];
const COLUMN_2_PATTERN: CardHeight[] = ['md', 'xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg'];
const COLUMN_3_PATTERN: CardHeight[] = ['xl', 'sm', 'lg', 'md', 'xl', 'sm', 'lg', 'md'];

const MasonryColumn = ({
  cards,
  paddingTop,
  animationDuration,
  styles,
}: {
  cards: CardData[];
  paddingTop: number;
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
          <Image
            key={index}
            source={{ uri: LOOK_IMAGES[card.imageIndex] }}
            style={[
              styles.imageCard,
              { height: CARD_HEIGHTS[card.height] },
            ]}
            resizeMode="cover"
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

  const column1Cards = useMemo(() => generateColumn(COLUMN_1_PATTERN, 0), []);
  const column2Cards = useMemo(() => generateColumn(COLUMN_2_PATTERN, 4), []);
  const column3Cards = useMemo(() => generateColumn(COLUMN_3_PATTERN, 8), []);

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
            animationDuration={25000}
            styles={styles}
          />
          <MasonryColumn
            cards={column2Cards}
            paddingTop={0}
            animationDuration={28000}
            styles={styles}
          />
          <MasonryColumn
            cards={column3Cards}
            paddingTop={50}
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
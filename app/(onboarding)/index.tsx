import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { AnimatedLogo } from '@/components/ui';
import { createStyles } from '@/styles/welcome.styles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedStar = ({
  size,
  style,
  color,
  delay = 0,
}: {
  size: number;
  style?: any;
  color: string;
  delay?: number;
}) => {
  const opacity = useSharedValue(0.4);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Ionicons name="sparkles" size={size} color={color} />
    </Animated.View>
  );
};

const DURATION = 350;
const EASE = Easing.out(Easing.quad);

export default function WelcomeScreen() {
  const { colors } = useTheme();

  const logoOpacity = useSharedValue(0);
  const cardsOpacity = useSharedValue(0);
  const starsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Card shuffle animation values
  const leftCardTranslateY = useSharedValue(60);
  const leftCardOpacity = useSharedValue(0);
  const rightCardTranslateY = useSharedValue(60);
  const rightCardOpacity = useSharedValue(0);
  const mainCardTranslateY = useSharedValue(60);
  const mainCardOpacity = useSharedValue(0);

  // Typing animation values
  const headlineWidth = useSharedValue(0);
  const subheadlineWidth = useSharedValue(0);

  useEffect(() => {
    // Logo reveal takes 1800ms - start next elements slightly before it finishes for smooth transition
    const startNext = 1500;

    logoOpacity.value = withTiming(1, { duration: DURATION, easing: EASE });
    cardsOpacity.value = withDelay(startNext, withTiming(1, { duration: DURATION, easing: EASE }));

    // Sequence: Stars first, then cards, then message, then button
    const cardDuration = 500;
    const cardEase = Easing.out(Easing.back(1.2));

    // 1. Stars appear immediately with the logo
    starsOpacity.value = withTiming(1, { duration: DURATION, easing: EASE });

    // 2. Cards shuffle up after stars
    leftCardOpacity.value = withDelay(startNext + 100, withTiming(1, { duration: cardDuration, easing: EASE }));
    leftCardTranslateY.value = withDelay(startNext + 100, withTiming(0, { duration: cardDuration, easing: cardEase }));

    rightCardOpacity.value = withDelay(startNext + 180, withTiming(1, { duration: cardDuration, easing: EASE }));
    rightCardTranslateY.value = withDelay(startNext + 180, withTiming(0, { duration: cardDuration, easing: cardEase }));

    mainCardOpacity.value = withDelay(startNext + 260, withTiming(1, { duration: cardDuration, easing: EASE }));
    mainCardTranslateY.value = withDelay(startNext + 260, withTiming(0, { duration: cardDuration, easing: cardEase }));

    // 3. Headline types out after cards
    headlineWidth.value = withDelay(startNext + 400, withTiming(100, { duration: 800, easing: Easing.out(Easing.quad) }));

    // 4. Subheadline types out after headline
    subheadlineWidth.value = withDelay(startNext + 900, withTiming(100, { duration: 600, easing: Easing.out(Easing.quad) }));

    // 5. Button appears last
    buttonOpacity.value = withDelay(startNext + 1200, withTiming(1, { duration: DURATION, easing: EASE }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  const cardsStyle = useAnimatedStyle(() => ({ opacity: cardsOpacity.value }));
  const starsStyle = useAnimatedStyle(() => ({ opacity: starsOpacity.value }));

  // Typing animation styles - clip width reveals text from left to right
  const headlineStyle = useAnimatedStyle(() => ({
    width: `${headlineWidth.value}%`,
  }));
  const subheadlineStyle = useAnimatedStyle(() => ({
    width: `${subheadlineWidth.value}%`,
  }));

  const leftCardStyle = useAnimatedStyle(() => ({
    opacity: leftCardOpacity.value,
    transform: [
      { rotate: '-12deg' },
      { translateX: -40 },
      { translateY: leftCardTranslateY.value },
    ],
  }));

  const rightCardStyle = useAnimatedStyle(() => ({
    opacity: rightCardOpacity.value,
    transform: [
      { rotate: '12deg' },
      { translateX: 40 },
      { translateY: rightCardTranslateY.value },
    ],
  }));

  const mainCardStyle = useAnimatedStyle(() => ({
    opacity: mainCardOpacity.value,
    transform: [{ translateY: mainCardTranslateY.value }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/splash');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientEdge, colors.bgGradientCenter, colors.bgGradientEdge]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <AnimatedLogo size="large" animate={false} revealFromBottom revealDelay={0} />
        </Animated.View>

        <View style={styles.cardsSection}>
          <Animated.View style={[styles.cardsWrapper, cardsStyle]}>
            <Animated.View style={[styles.starsContainer, starsStyle]} pointerEvents="none">
              <AnimatedStar size={18} color={colors.textPrimary} style={styles.star1} delay={0} />
              <AnimatedStar size={16} color={colors.textTertiary} style={styles.star3} delay={600} />
              <AnimatedStar size={10} color={colors.textTertiary} style={styles.star4} delay={1000} />
            </Animated.View>
            <Animated.View style={[styles.backCardLeft, leftCardStyle]} />
            <Animated.View style={[styles.backCardRight, rightCardStyle]} />
            <Animated.View style={[styles.mainCard, mainCardStyle]}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="star-outline" size={28} color={colors.bgPrimary} />
              </View>
              <Text style={styles.cardText}>New You</Text>
            </Animated.View>
          </Animated.View>

          <View style={styles.statementContainer}>
            <View style={styles.typingContainer}>
              <Animated.View style={[styles.typingClip, headlineStyle]}>
                <Text style={styles.headline} numberOfLines={1}>Discover what's possible.</Text>
              </Animated.View>
            </View>
            <View style={styles.typingContainer}>
              <Animated.View style={[styles.typingClip, subheadlineStyle]}>
                <Text style={styles.subheadline} numberOfLines={1}>Unlimited styles. Zero commitment.</Text>
              </Animated.View>
            </View>
          </View>
        </View>
      </View>

      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.button}>
            <Text style={styles.buttonText}>Begin</Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

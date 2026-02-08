import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import OnboardingStep from '@/components/onboarding/OnboardingStep';

const SIZE = 140;

// Floating card thumbnails around the icon
const CARDS = [
  { angle: -35, dist: 58, rotate: -12, delay: 700, w: 32, h: 40 },
  { angle: 90, dist: 62, rotate: 8, delay: 850, w: 28, h: 36 },
  { angle: 215, dist: 56, rotate: -6, delay: 1000, w: 30, h: 38 },
];

function InspoHero() {
  const { colors, isDark } = useTheme();

  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const cardEntries = CARDS.map(() => useSharedValue(0));
  const floatPhase = useSharedValue(0);

  useEffect(() => {
    // Icon arrives first with a dramatic spring
    iconScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 70, mass: 1.2 }));
    iconOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

    // Cards fan out from behind the icon, staggered
    cardEntries.forEach((entry, i) => {
      entry.value = withDelay(CARDS[i].delay, withSpring(1, { damping: 14, stiffness: 80 }));
    });

    // Gentle floating loop for cards
    floatPhase.value = withDelay(1200, withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,29,43,0.08)';

  return (
    <View style={heroStyles.container}>
      {/* Floating cards */}
      {CARDS.map((card, i) => {
        const rad = (card.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * card.dist;
        const ty = Math.sin(rad) * card.dist;

        const cardStyle = useAnimatedStyle(() => {
          const scale = interpolate(cardEntries[i].value, [0, 1], [0.3, 1]);
          const opacity = interpolate(cardEntries[i].value, [0, 0.4], [0, 1], 'clamp');
          const entryTx = interpolate(cardEntries[i].value, [0, 1], [0, tx]);
          const entryTy = interpolate(cardEntries[i].value, [0, 1], [0, ty]);
          // Gentle float
          const floatY = interpolate(floatPhase.value, [0, 1], [0, i % 2 === 0 ? -4 : 4]);
          return {
            opacity,
            transform: [
              { translateX: entryTx },
              { translateY: entryTy + floatY },
              { rotate: `${card.rotate}deg` },
              { scale },
            ],
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              heroStyles.card,
              { width: card.w, height: card.h, backgroundColor: cardBg, borderColor: cardBorder },
              cardStyle,
            ]}
          />
        );
      })}

      {/* Central icon */}
      <Animated.View style={iconStyle}>
        <Ionicons name="people-outline" size={56} color={isDark ? colors.textPrimary : '#1a1d2b'} />
      </Animated.View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default function Step2Screen() {
  return (
    <OnboardingStep
      stepIndex={1}
      headline="Find your look."
      headlineDim="Any style, any celeb."
      description="Browse our collection of looks or upload a celeb photo you want to draw from."
      nextRoute="/(onboarding)/step3"
      goBack
    >
      <InspoHero />
    </OnboardingStep>
  );
}

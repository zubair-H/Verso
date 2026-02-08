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
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const SIZE = 140;

const CARDS = [
  { angle: -35, dist: 58, rotate: -12, delay: 700, w: 32, h: 40 },
  { angle: 90, dist: 62, rotate: 8, delay: 850, w: 28, h: 36 },
  { angle: 215, dist: 56, rotate: -6, delay: 1000, w: 30, h: 38 },
];

export default function InspoHero() {
  const { colors, isDark } = useTheme();

  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const cardEntries = CARDS.map(() => useSharedValue(0));
  const floatPhase = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 70, mass: 1.2 }));
    iconOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

    cardEntries.forEach((entry, i) => {
      entry.value = withDelay(CARDS[i].delay, withSpring(1, { damping: 14, stiffness: 80 }));
    });

    floatPhase.value = withDelay(1200, withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const cardBg = colors.accentMuted;
  const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : colors.borderAccent;

  return (
    <View style={styles.container}>
      {CARDS.map((card, i) => {
        const rad = (card.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * card.dist;
        const ty = Math.sin(rad) * card.dist;

        const cardStyle = useAnimatedStyle(() => {
          const scale = interpolate(cardEntries[i].value, [0, 1], [0.3, 1]);
          const opacity = interpolate(cardEntries[i].value, [0, 0.4], [0, 1], 'clamp');
          const entryTx = interpolate(cardEntries[i].value, [0, 1], [0, tx]);
          const entryTy = interpolate(cardEntries[i].value, [0, 1], [0, ty]);
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
              styles.card,
              { width: card.w, height: card.h, backgroundColor: cardBg, borderColor: cardBorder },
              cardStyle,
            ]}
          />
        );
      })}
      <Animated.View style={iconStyle}>
        <Feather name="users" size={56} color={colors.textPrimary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
  },
});

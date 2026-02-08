import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const SIZE = 140;

const CHIPS = [
  { label: 'Hair', angle: -60, dist: 62, delay: 700 },
  { label: 'Style', angle: 0, dist: 68, delay: 800 },
  { label: 'Eyes', angle: 60, dist: 62, delay: 900 },
  { label: 'Brows', angle: 150, dist: 60, delay: 1000 },
  { label: 'Lips', angle: 210, dist: 64, delay: 1100 },
];

export default function AttributesHero() {
  const { colors, isDark } = useTheme();

  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const chipEntries = CHIPS.map(() => useSharedValue(0));

  useEffect(() => {
    iconScale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 100, mass: 0.8 }));
    iconOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));

    chipEntries.forEach((entry, i) => {
      entry.value = withDelay(CHIPS[i].delay, withSpring(1, { damping: 15, stiffness: 120 }));
    });
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const chipBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)';
  const chipText = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,29,43,0.4)';

  return (
    <View style={styles.container}>
      {CHIPS.map((chip, i) => {
        const rad = (chip.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * chip.dist;
        const ty = Math.sin(rad) * chip.dist;

        const chipStyle = useAnimatedStyle(() => {
          const scale = interpolate(chipEntries[i].value, [0, 1], [0.4, 1]);
          const opacity = interpolate(chipEntries[i].value, [0, 0.3], [0, 1], 'clamp');
          const entryTx = interpolate(chipEntries[i].value, [0, 1], [0, tx]);
          const entryTy = interpolate(chipEntries[i].value, [0, 1], [0, ty]);
          return {
            opacity,
            transform: [{ translateX: entryTx }, { translateY: entryTy }, { scale }],
          };
        });

        return (
          <Animated.View key={i} style={[styles.chip, { backgroundColor: chipBg }, chipStyle]}>
            <Text style={[styles.chipText, { color: chipText }]}>{chip.label}</Text>
          </Animated.View>
        );
      })}
      <Animated.View style={iconStyle}>
        <Ionicons name="cut-outline" size={56} color={isDark ? colors.textPrimary : '#1a1d2b'} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  chip: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

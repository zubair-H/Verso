import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 140;
const RING_R = 64;
const RING_CIRC = 2 * Math.PI * RING_R;

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  angle: i * 45,
  startDist: 80,
  endDist: 30 + (i % 3) * 8,
  delay: 700 + i * 80,
  size: 3 + (i % 3),
}));

export default function MagicHero() {
  const { colors, isDark } = useTheme();

  const ringDash = useSharedValue(RING_CIRC);
  const ringGlow = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const particleEntries = PARTICLES.map(() => useSharedValue(0));
  const pulsePhase = useSharedValue(0);

  useEffect(() => {
    ringDash.value = withDelay(300, withTiming(0, { duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
    ringGlow.value = withDelay(800, withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true));

    iconScale.value = withDelay(500, withSpring(1, { damping: 6, stiffness: 180, mass: 0.6 }));
    iconOpacity.value = withDelay(500, withTiming(1, { duration: 250 }));

    particleEntries.forEach((entry, i) => {
      entry.value = withDelay(PARTICLES[i].delay, withSpring(1, { damping: 12, stiffness: 100 }));
    });

    pulsePhase.value = withDelay(1400, withRepeat(withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);

  const ringProps = useAnimatedProps(() => ({
    strokeDasharray: [RING_CIRC, RING_CIRC],
    strokeDashoffset: ringDash.value,
  }));

  const ringGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringGlow.value, [0, 1], [0.15, 0.35]),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const ringStroke = isDark ? colors.accent : '#1A1F2E';
  const ringBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,29,43,0.04)';
  const glowColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.04)';
  const particleColor = isDark ? colors.accent : '#1A1F2E';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { backgroundColor: glowColor }, ringGlowStyle]} />
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} stroke={ringBg} strokeWidth={2} fill="none" />
        <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} stroke={ringStroke} strokeWidth={2} strokeLinecap="round" fill="none" animatedProps={ringProps} />
      </Svg>
      {PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;

        const particleStyle = useAnimatedStyle(() => {
          const dist = interpolate(particleEntries[i].value, [0, 1], [p.startDist, p.endDist]);
          const opacity = interpolate(particleEntries[i].value, [0, 0.2], [0, 1], 'clamp');
          const tx = Math.cos(rad) * dist;
          const ty = Math.sin(rad) * dist;
          const breathe = interpolate(pulsePhase.value, [0, 1], [1, i % 2 === 0 ? 1.4 : 0.7]);
          return {
            opacity: opacity * breathe,
            transform: [{ translateX: tx }, { translateY: ty }],
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: particleColor,
              },
              particleStyle,
            ]}
          />
        );
      })}
      <Animated.View style={iconStyle}>
        <Ionicons name="sparkles-outline" size={56} color={isDark ? colors.textPrimary : '#1a1d2b'} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  glow: { position: 'absolute', width: SIZE + 40, height: SIZE + 40, borderRadius: (SIZE + 40) / 2 },
  particle: { position: 'absolute' },
});

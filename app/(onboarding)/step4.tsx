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
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import OnboardingStep from '@/components/onboarding/OnboardingStep';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 140;
const RING_R = 64;
const RING_CIRC = 2 * Math.PI * RING_R;

// Sparkle particles that converge inward, then pulse
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  angle: i * 45,
  startDist: 80,
  endDist: 30 + (i % 3) * 8,
  delay: 700 + i * 80,
  size: 3 + (i % 3),
}));

function MagicHero() {
  const { colors, isDark } = useTheme();

  const ringDash = useSharedValue(RING_CIRC);
  const ringGlow = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const particleEntries = PARTICLES.map(() => useSharedValue(0));
  const pulsePhase = useSharedValue(0);

  useEffect(() => {
    // Ring draws in fast
    ringDash.value = withDelay(300, withTiming(0, { duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
    // Ring glow pulses after drawing
    ringGlow.value = withDelay(800, withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true));

    // Icon springs in with celebration bounce
    iconScale.value = withDelay(500, withSpring(1, { damping: 6, stiffness: 180, mass: 0.6 }));
    iconOpacity.value = withDelay(500, withTiming(1, { duration: 250 }));

    // Particles converge inward from far out
    particleEntries.forEach((entry, i) => {
      entry.value = withDelay(PARTICLES[i].delay, withSpring(1, { damping: 12, stiffness: 100 }));
    });

    // Gentle pulse for particles after they land
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

  const ringStroke = colors.accent;
  const ringBg = colors.accentMuted;
  const glowColor = colors.accentMuted;
  const particleColor = colors.accent;

  return (
    <View style={heroStyles.container}>
      {/* Glow behind ring */}
      <Animated.View style={[heroStyles.glow, { backgroundColor: glowColor }, ringGlowStyle]} />

      {/* Ring */}
      <Svg width={SIZE} height={SIZE} style={heroStyles.svg}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} stroke={ringBg} strokeWidth={2} fill="none" />
        <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} stroke={ringStroke} strokeWidth={2} strokeLinecap="round" fill="none" animatedProps={ringProps} />
      </Svg>

      {/* Converging particles */}
      {PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;

        const particleStyle = useAnimatedStyle(() => {
          const dist = interpolate(particleEntries[i].value, [0, 1], [p.startDist, p.endDist]);
          const opacity = interpolate(particleEntries[i].value, [0, 0.2], [0, 1], 'clamp');
          const tx = Math.cos(rad) * dist;
          const ty = Math.sin(rad) * dist;
          // Subtle breathing after landing
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
              heroStyles.particle,
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

      {/* Central icon */}
      <Animated.View style={iconStyle}>
        <Feather name="zap" size={56} color={colors.textPrimary} />
      </Animated.View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  glow: { position: 'absolute', width: SIZE + 40, height: SIZE + 40, borderRadius: (SIZE + 40) / 2 },
  particle: { position: 'absolute' },
});

export default function Step4Screen() {
  return (
    <OnboardingStep
      stepIndex={3}
      headline="See the magic."
      headlineDim="AI brings it to life."
      description="AI applies the look to your photo — see yourself transformed in seconds."
      nextRoute="/(onboarding)/permissions"
    >
      <MagicHero />
    </OnboardingStep>
  );
}

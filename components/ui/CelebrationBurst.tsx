import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  delay: number;
}

interface CelebrationBurstProps {
  trigger: boolean;
  particleCount?: number;
  duration?: number;
  particleColors?: string[];
  onComplete?: () => void;
  originX?: number;
  originY?: number;
}

function ParticleComponent({ particle, duration }: { particle: Particle; duration: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const radians = (particle.angle * Math.PI) / 180;
    const distance = particle.velocity * 150;
    const targetX = Math.cos(radians) * distance;
    const targetY = Math.sin(radians) * distance;

    opacity.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 100 })
    );
    scale.value = withDelay(
      particle.delay,
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    translateX.value = withDelay(
      particle.delay,
      withTiming(targetX, {
        duration: duration,
        easing: Easing.out(Easing.cubic),
      })
    );
    translateY.value = withDelay(
      particle.delay,
      withTiming(targetY + 100, {
        duration: duration,
        easing: Easing.out(Easing.cubic),
      })
    );

    rotation.value = withDelay(
      particle.delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: duration,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      particle.delay + duration * 0.6,
      withTiming(0, { duration: duration * 0.4 })
    );
    scale.value = withDelay(
      particle.delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x - particle.size / 2,
          top: particle.y - particle.size / 2,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationBurst({
  trigger,
  particleCount = 20,
  duration = 1000,
  particleColors,
  onComplete,
  originX = SCREEN_WIDTH / 2,
  originY = SCREEN_HEIGHT / 2,
}: CelebrationBurstProps) {
  const { colors } = useTheme();
  const particles = useRef<Particle[]>([]);
  const [isActive, setIsActive] = React.useState(false);

  const defaultColors = [
    colors.accent,
    colors.accentSecondary,
    colors.accentLight,
    colors.success,
    colors.streakGold,
  ];

  const colorsToUse = particleColors ?? defaultColors;

  useEffect(() => {
    if (trigger) {
      particles.current = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: originX,
        y: originY,
        color: colorsToUse[Math.floor(Math.random() * colorsToUse.length)],
        size: 6 + Math.random() * 8,
        angle: (360 / particleCount) * i + Math.random() * 30 - 15,
        velocity: 0.5 + Math.random() * 0.8,
        delay: Math.random() * 100,
      }));
      setIsActive(true);

      const timeout = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration + 200);

      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  if (!isActive) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle) => (
        <ParticleComponent
          key={particle.id}
          particle={particle}
          duration={duration}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
  },
});

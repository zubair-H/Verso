import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 140;
const RING_R = 64;
const RING_CIRC = 2 * Math.PI * RING_R;

const BRACKET_SIZE = 18;
const BRACKET_OFFSET = 12;

export default function ViewfinderHero() {
  const { colors, isDark } = useTheme();

  const ringDash = useSharedValue(RING_CIRC);
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const bracketProgress = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    ringDash.value = withDelay(300, withTiming(0, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
    iconScale.value = withDelay(550, withSpring(1, { damping: 12, stiffness: 55 }));
    iconOpacity.value = withDelay(550, withTiming(1, { duration: 300 }));
    flashOpacity.value = withDelay(700, withTiming(0.6, { duration: 80 }));
    flashOpacity.value = withDelay(780, withTiming(0, { duration: 400 }));
    bracketProgress.value = withDelay(850, withSpring(1, { damping: 16, stiffness: 200 }));
  }, []);

  const ringProps = useAnimatedProps(() => ({
    strokeDasharray: [RING_CIRC, RING_CIRC],
    strokeDashoffset: ringDash.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const bracketTL = useAnimatedStyle(() => {
    const t = interpolate(bracketProgress.value, [0, 1], [-20, 0]);
    return { transform: [{ translateX: t }, { translateY: t }], opacity: bracketProgress.value };
  });
  const bracketTR = useAnimatedStyle(() => {
    const t = interpolate(bracketProgress.value, [0, 1], [20, 0]);
    const ty = interpolate(bracketProgress.value, [0, 1], [-20, 0]);
    return { transform: [{ translateX: t }, { translateY: ty }], opacity: bracketProgress.value };
  });
  const bracketBL = useAnimatedStyle(() => {
    const t = interpolate(bracketProgress.value, [0, 1], [-20, 0]);
    const ty = interpolate(bracketProgress.value, [0, 1], [20, 0]);
    return { transform: [{ translateX: t }, { translateY: ty }], opacity: bracketProgress.value };
  });
  const bracketBR = useAnimatedStyle(() => {
    const t = interpolate(bracketProgress.value, [0, 1], [20, 0]);
    return { transform: [{ translateX: t }, { translateY: t }], opacity: bracketProgress.value };
  });

  const ringStroke = colors.accent;
  const ringBg = colors.accentMuted;
  const bracketColor = isDark ? 'rgba(255,255,255,0.35)' : colors.accentGlow;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} stroke={ringBg} strokeWidth={2} fill="none" />
        <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={RING_R} stroke={ringStroke} strokeWidth={2} strokeLinecap="round" fill="none" animatedProps={ringProps} />
      </Svg>
      <Animated.View style={[styles.flash, flashStyle]} />
      <Animated.View style={[styles.icon, iconStyle]}>
        <Ionicons name="camera-outline" size={56} color={colors.textPrimary} />
      </Animated.View>
      <Animated.View style={[styles.bracket, styles.bracketTL, bracketTL]}>
        <Svg width={BRACKET_SIZE} height={BRACKET_SIZE}>
          <Path d={`M 0 ${BRACKET_SIZE} L 0 0 L ${BRACKET_SIZE} 0`} stroke={bracketColor} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.bracket, styles.bracketTR, bracketTR]}>
        <Svg width={BRACKET_SIZE} height={BRACKET_SIZE}>
          <Path d={`M 0 0 L ${BRACKET_SIZE} 0 L ${BRACKET_SIZE} ${BRACKET_SIZE}`} stroke={bracketColor} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.bracket, styles.bracketBL, bracketBL]}>
        <Svg width={BRACKET_SIZE} height={BRACKET_SIZE}>
          <Path d={`M 0 0 L 0 ${BRACKET_SIZE} L ${BRACKET_SIZE} ${BRACKET_SIZE}`} stroke={bracketColor} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.bracket, styles.bracketBR, bracketBR]}>
        <Svg width={BRACKET_SIZE} height={BRACKET_SIZE}>
          <Path d={`M 0 ${BRACKET_SIZE} L ${BRACKET_SIZE} ${BRACKET_SIZE} L ${BRACKET_SIZE} 0`} stroke={bracketColor} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  icon: { position: 'absolute' },
  flash: { position: 'absolute', width: SIZE - 20, height: SIZE - 20, borderRadius: (SIZE - 20) / 2, backgroundColor: '#fff' },
  bracket: { position: 'absolute' },
  bracketTL: { left: BRACKET_OFFSET, top: BRACKET_OFFSET },
  bracketTR: { right: BRACKET_OFFSET, top: BRACKET_OFFSET },
  bracketBL: { left: BRACKET_OFFSET, bottom: BRACKET_OFFSET },
  bracketBR: { right: BRACKET_OFFSET, bottom: BRACKET_OFFSET },
});

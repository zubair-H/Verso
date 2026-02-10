import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);
const LOGO_SIZE_SMALL = 220;

const VORTEX_SIZE = 200;

// Orbiting particles that get sucked into the vortex
const ORBIT_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: i * 30,
  startDist: 90 + (i % 3) * 15,
  size: 3 + (i % 3),
  speed: 0.8 + (i % 4) * 0.3,
  delay: i * 100,
}));

// Spiral ring layers
const SPIRAL_RINGS = [
  { r: 70, strokeWidth: 1.5, opacity: 0.3, rotateSpeed: 1 },
  { r: 55, strokeWidth: 2, opacity: 0.5, rotateSpeed: -1.5 },
  { r: 40, strokeWidth: 2.5, opacity: 0.7, rotateSpeed: 2 },
  { r: 25, strokeWidth: 3, opacity: 0.9, rotateSpeed: -2.5 },
];

export default function Demo3Screen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Entry animations
  const contentEntry = useSharedValue(0);
  const vortexEntry = useSharedValue(0);
  const cardsEntry = useSharedValue(0);

  // Vortex animation phases
  const vortexSpin = useSharedValue(0);        // Continuous rotation
  const vortexPull = useSharedValue(0);         // Cards get pulled in (0 = outside, 1 = consumed)
  const vortexIntensity = useSharedValue(0);    // Glow and scale intensity
  const flashProgress = useSharedValue(0);      // White flash when merge completes
  const resultReveal = useSharedValue(0);       // Final merged result appears

  // Button
  const buttonEntry = useSharedValue(0);

  // Exit
  const exitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  const triggerMergeHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const triggerSuccessHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    // Stage 1: Content and vortex enter
    contentEntry.value = withDelay(200, withTiming(1, { duration: 600, easing: EASE }));
    vortexEntry.value = withDelay(400, withTiming(1, { duration: 600, easing: EASE }));
    cardsEntry.value = withDelay(700, withTiming(1, { duration: 500, easing: EASE }));

    // Continuous vortex spin
    vortexSpin.value = withDelay(500, withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    ));

    // Stage 2: Cards get pulled in (auto-plays after cards appear)
    vortexPull.value = withDelay(2000, withTiming(1, {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));

    // Vortex intensity builds as cards approach
    vortexIntensity.value = withDelay(2000, withTiming(1, {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));

    // Stage 3: Flash when cards are consumed
    flashProgress.value = withDelay(3400, withTiming(1, { duration: 200, easing: SMOOTH_EASE }));

    // Haptic at merge moment
    setTimeout(() => {
      triggerMergeHaptic();
    }, 3400);

    // Stage 4: Result reveals after flash fades
    resultReveal.value = withDelay(3700, withTiming(1, { duration: 600, easing: SMOOTH_EASE }));

    // Haptic for result
    setTimeout(() => {
      triggerSuccessHaptic();
    }, 3800);

    // Button appears after result
    buttonEntry.value = withDelay(4200, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
  }, []);

  // -- Animated Styles --

  const contentStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    return {
      opacity: contentEntry.value * exitOp,
    };
  });

  // Vortex container
  const vortexStyle = useAnimatedStyle(() => {
    const scale = interpolate(vortexEntry.value, [0, 1], [0.3, 1]);
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitScale = interpolate(exitProgress.value, [0, 1], [1, 0.8]);
    const intensityScale = interpolate(vortexIntensity.value, [0, 0.8, 1], [1, 1.05, 1.1]);
    // After result, shrink vortex
    const postResultScale = interpolate(resultReveal.value, [0, 1], [1, 0.6]);
    const postResultOp = interpolate(resultReveal.value, [0, 0.5, 1], [1, 0.5, 0]);
    return {
      opacity: vortexEntry.value * exitOp * postResultOp,
      transform: [{ scale: scale * exitScale * intensityScale * postResultScale }],
    };
  });

  // User card (left) — gets pulled into vortex
  const userCardStyle = useAnimatedStyle(() => {
    const entryScale = interpolate(cardsEntry.value, [0, 1], [0.5, 1]);
    const entryOp = interpolate(cardsEntry.value, [0, 0.3], [0, 1], 'clamp');
    // Pull animation: starts at left, spirals into center
    const pullX = interpolate(vortexPull.value, [0, 0.5, 0.8, 1], [-80, -40, -10, 0]);
    const pullY = interpolate(vortexPull.value, [0, 0.3, 0.6, 1], [0, -15, 5, 0]);
    const pullScale = interpolate(vortexPull.value, [0, 0.6, 1], [1, 0.7, 0]);
    const pullOp = interpolate(vortexPull.value, [0, 0.7, 1], [1, 0.6, 0], 'clamp');
    const pullRotate = interpolate(vortexPull.value, [0, 1], [0, -180]);
    return {
      opacity: entryOp * pullOp,
      transform: [
        { translateX: pullX },
        { translateY: pullY },
        { scale: entryScale * pullScale },
        { rotate: `${pullRotate}deg` },
      ],
    };
  });

  // Celeb card (right) — gets pulled into vortex
  const celebCardStyle = useAnimatedStyle(() => {
    const entryScale = interpolate(cardsEntry.value, [0, 1], [0.5, 1]);
    const entryOp = interpolate(cardsEntry.value, [0, 0.3], [0, 1], 'clamp');
    const pullX = interpolate(vortexPull.value, [0, 0.5, 0.8, 1], [80, 40, 10, 0]);
    const pullY = interpolate(vortexPull.value, [0, 0.3, 0.6, 1], [0, 15, -5, 0]);
    const pullScale = interpolate(vortexPull.value, [0, 0.6, 1], [1, 0.7, 0]);
    const pullOp = interpolate(vortexPull.value, [0, 0.7, 1], [1, 0.6, 0], 'clamp');
    const pullRotate = interpolate(vortexPull.value, [0, 1], [0, 180]);
    return {
      opacity: entryOp * pullOp,
      transform: [
        { translateX: pullX },
        { translateY: pullY },
        { scale: entryScale * pullScale },
        { rotate: `${pullRotate}deg` },
      ],
    };
  });

  // Flash overlay
  const flashStyle = useAnimatedStyle(() => {
    // Quick flash — ramps up then fades
    const opacity = interpolate(flashProgress.value, [0, 0.3, 1], [0, 0.8, 0], 'clamp');
    return { opacity };
  });

  // Vortex glow
  const vortexGlowStyle = useAnimatedStyle(() => {
    const scale = interpolate(vortexIntensity.value, [0, 1], [0.8, 1.3]);
    const opacity = interpolate(vortexIntensity.value, [0, 0.5, 1], [0.1, 0.3, 0.5]);
    const postResultOp = interpolate(resultReveal.value, [0, 1], [1, 0]);
    return {
      opacity: opacity * postResultOp,
      transform: [{ scale }],
    };
  });

  // Result card
  const resultStyle = useAnimatedStyle(() => {
    const scale = interpolate(resultReveal.value, [0, 1], [0.3, 1]);
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitScale = interpolate(exitProgress.value, [0, 1], [1, 0.9]);
    return {
      opacity: resultReveal.value * exitOp,
      transform: [{ scale: scale * exitScale }],
    };
  });

  // Orbiting particles
  const particleStyles = ORBIT_PARTICLES.map((p, i) => {
    return useAnimatedStyle(() => {
      const angle = (p.angle + vortexSpin.value * 360 * p.speed) * (Math.PI / 180);
      const dist = interpolate(vortexIntensity.value, [0, 1], [p.startDist, 15]);
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const opacity = interpolate(vortexEntry.value, [0, 0.5], [0, 1], 'clamp');
      const fadeOut = interpolate(resultReveal.value, [0, 0.5], [1, 0], 'clamp');
      return {
        opacity: opacity * fadeOut,
        transform: [{ translateX: x }, { translateY: y }],
      };
    });
  });

  // Spiral ring rotation styles
  const ringStyles = SPIRAL_RINGS.map((ring) => {
    return useAnimatedStyle(() => {
      const rotation = vortexSpin.value * 360 * ring.rotateSpeed;
      const scaleIntensity = interpolate(vortexIntensity.value, [0, 1], [1, 0.85]);
      return {
        transform: [{ rotate: `${rotation}deg` }, { scale: scaleIntensity }],
      };
    });
  });

  const buttonStyleAnim = useAnimatedStyle(() => {
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitY = exitProgress.value * 50;
    return {
      opacity: buttonEntry.value * exitOp,
      transform: [{ translateY: exitY }],
    };
  });

  const handleContinue = () => {
    if (isExiting.value) return;
    isExiting.value = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    exitProgress.value = withTiming(1, { duration: 400, easing: SMOOTH_EASE });
    setTimeout(() => {
      router.push('/(onboarding)/permissions' as any);
    }, 300);
  };

  const buttonScale = useSharedValue(1);
  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };
  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const animButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  const particleColor = isDark ? colors.accent : colors.accentSecondary;
  const ringColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.1)';
  const vortexCenterColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,31,46,0.06)';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgSecondary, colors.bgTertiary, colors.bgPrimary]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.logoSpacer} />

      {/* Title */}
      <Animated.View style={[styles.titleContainer, contentStyle]}>
        <Text style={styles.title}>The magic happens.</Text>
        <Text style={[styles.title, styles.titleDim]}>Two become one.</Text>
      </Animated.View>

      {/* Vortex area */}
      <View style={styles.vortexArea}>
        {/* Vortex glow background */}
        <Animated.View style={[styles.vortexGlow, vortexGlowStyle, { backgroundColor: isDark ? colors.accentMuted : colors.accentGlow }]} />

        {/* Vortex spiral */}
        <Animated.View style={[styles.vortexContainer, vortexStyle]}>
          {/* Spiral rings */}
          {SPIRAL_RINGS.map((ring, i) => (
            <Animated.View key={i} style={[styles.ringWrapper, ringStyles[i]]}>
              <Svg width={ring.r * 2 + 4} height={ring.r * 2 + 4}>
                <Circle
                  cx={ring.r + 2}
                  cy={ring.r + 2}
                  r={ring.r}
                  stroke={ringColor}
                  strokeWidth={ring.strokeWidth}
                  fill="none"
                  strokeDasharray={`${ring.r * 0.8} ${ring.r * 0.5}`}
                  opacity={ring.opacity}
                />
              </Svg>
            </Animated.View>
          ))}

          {/* Vortex center dark spot */}
          <View style={[styles.vortexCenter, { backgroundColor: vortexCenterColor }]} />
        </Animated.View>

        {/* Orbiting particles */}
        {ORBIT_PARTICLES.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.orbitParticle,
              { width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: particleColor },
              particleStyles[i],
            ]}
          />
        ))}

        {/* User card (left) — gets sucked in */}
        <Animated.View style={[styles.miniCard, styles.miniCardLeft, userCardStyle]}>
          <Svg width={36} height={40} viewBox="0 0 50 55">
            <Circle cx="25" cy="18" r="14" fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.1)'} stroke={colors.accent} strokeWidth={2} />
            <Circle cx="20" cy="16" r="2" fill={colors.accent} />
            <Circle cx="30" cy="16" r="2" fill={colors.accent} />
            <Path d="M20 22 Q25 27 30 22" stroke={colors.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
            <Path d="M10 50 C10 38 17 33 25 33 C33 33 40 38 40 50" fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,31,46,0.08)'} stroke={colors.accent} strokeWidth={2} />
          </Svg>
          <Text style={[styles.miniCardLabel, { color: colors.textTertiary }]}>You</Text>
        </Animated.View>

        {/* Celeb card (right) — gets sucked in */}
        <Animated.View style={[styles.miniCard, styles.miniCardRight, celebCardStyle]}>
          <Svg width={36} height={40} viewBox="0 0 50 55">
            <Circle cx="25" cy="18" r="14" fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.1)'} stroke={colors.accentTertiary} strokeWidth={2} />
            <Circle cx="20" cy="16" r="2.5" fill={colors.accentTertiary} />
            <Circle cx="30" cy="16" r="2.5" fill={colors.accentTertiary} />
            <Path d="M20 24 Q25 28 30 24" stroke={colors.accentTertiary} strokeWidth={2} fill="none" strokeLinecap="round" />
            <Path d="M10 50 C10 38 17 33 25 33 C33 33 40 38 40 50" fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,31,46,0.08)'} stroke={colors.accentTertiary} strokeWidth={2} />
          </Svg>
          <Text style={[styles.miniCardLabel, { color: colors.accentTertiary }]}>Celeb</Text>
        </Animated.View>

        {/* Flash overlay */}
        <Animated.View style={[styles.flash, flashStyle]} />

        {/* Merged result */}
        <Animated.View style={[styles.resultContainer, resultStyle]}>
          <View style={styles.resultCard}>
            {/* Combined face — has features from both */}
            <Svg width={70} height={80} viewBox="0 0 70 80">
              {/* Head with dual-tone */}
              <Circle cx="35" cy="26" r="18" fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.08)'} />
              {/* Left half stroke (user color) */}
              <Path
                d="M35 8 A18 18 0 0 0 35 44"
                stroke={colors.accent}
                strokeWidth={2}
                fill="none"
              />
              {/* Right half stroke (celeb color) */}
              <Path
                d="M35 8 A18 18 0 0 1 35 44"
                stroke={colors.accentTertiary}
                strokeWidth={2}
                fill="none"
              />
              {/* Left eye (user style) */}
              <Circle cx="28" cy="23" r="2.5" fill={colors.accent} />
              {/* Right eye (celeb style — slightly different) */}
              <Circle cx="42" cy="23" r="2.5" fill={colors.accentTertiary} />
              {/* Combined smile */}
              <Path
                d="M27 31 Q35 38 43 31"
                stroke={colors.accent}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
              {/* Body — gradient from user to celeb color */}
              <Path
                d="M12 72 C12 56 22 48 35 48 C48 48 58 56 58 72"
                fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,31,46,0.06)'}
              />
              <Path
                d="M12 72 C12 56 22 48 35 48"
                stroke={colors.accent}
                strokeWidth={2}
                fill="none"
              />
              <Path
                d="M35 48 C48 48 58 56 58 72"
                stroke={colors.accentTertiary}
                strokeWidth={2}
                fill="none"
              />
              {/* Sparkle */}
              <Path d="M55 12 L57 16 L61 14 L58 18 L62 20 L58 21 L59 25 L56 22 L53 25 L54 21 L50 20 L54 18 L52 14 L56 16 Z" fill={colors.accentTertiary} opacity={0.6} />
            </Svg>
            <Text style={styles.resultLabel}>Your new look</Text>
          </View>
        </Animated.View>
      </View>

      {/* Description */}
      <Animated.View style={[styles.descContainer, contentStyle]}>
        <Text style={styles.desc}>
          AI merges the best of both — extracting any attribute into your photo. Limitless possibilities.
        </Text>
      </Animated.View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyleAnim]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={animButtonStyle}
        >
          <LinearGradient
            colors={[colors.accentLight, colors.accent]}
            locations={[0.68, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any, insets: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgTertiary,
    },
    logoSpacer: {
      marginTop: insets.top - 40,
      height: LOGO_SIZE_SMALL,
    },
    titleContainer: {
      paddingHorizontal: layout.screenPadding,
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      ...typography.displayLarge,
      fontSize: 32,
      fontWeight: '400',
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    titleDim: {
      color: colors.textTertiary,
    },
    vortexArea: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 260,
      marginVertical: 12,
    },
    vortexGlow: {
      position: 'absolute',
      width: VORTEX_SIZE + 80,
      height: VORTEX_SIZE + 80,
      borderRadius: (VORTEX_SIZE + 80) / 2,
    },
    vortexContainer: {
      width: VORTEX_SIZE,
      height: VORTEX_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringWrapper: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    vortexCenter: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    orbitParticle: {
      position: 'absolute',
    },
    miniCard: {
      position: 'absolute',
      width: 70,
      height: 80,
      borderRadius: borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    miniCardLeft: {
      borderColor: colors.accent,
      shadowColor: colors.accent,
    },
    miniCardRight: {
      borderColor: colors.accentTertiary,
      shadowColor: colors.accentTertiary,
    },
    miniCardLabel: {
      ...typography.caption,
      fontSize: 9,
      marginTop: 2,
    },
    flash: {
      position: 'absolute',
      width: VORTEX_SIZE + 60,
      height: VORTEX_SIZE + 60,
      borderRadius: (VORTEX_SIZE + 60) / 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)',
    },
    resultContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultCard: {
      width: 130,
      height: 150,
      borderRadius: borderRadius.xl,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)',
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 8,
    },
    resultLabel: {
      ...typography.labelSmall,
      color: colors.textTertiary,
      marginTop: 6,
    },
    descContainer: {
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    desc: {
      ...typography.bodyMedium,
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 22,
    },
    bottomSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Math.max(insets.bottom, 16) + 24,
    },
    button: {
      width: '100%',
      height: 56,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    buttonText: {
      ...typography.labelLarge,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textOnAccent,
    },
  });

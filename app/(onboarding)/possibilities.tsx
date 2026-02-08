import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = 280;

// Card dimensions — smaller than index to fit 4 cards
const CARD_W = 130;
const CARD_H = 150;
const CARD_BR = 16;
const H_GAP = 50; // horizontal gap for arrow
const V_GAP = 36; // vertical gap for arrow
const CONTAINER_W = CARD_W * 2 + H_GAP;
const CONTAINER_H = CARD_H * 2 + V_GAP;

// Avatar icon size (same as index page)
const AVATAR_SIZE = 48;
const AVATAR_BR = 12;

// Steps data
const STEPS = [
  { icon: 'camera-outline' as const, title: 'Upload Selfie', desc: 'Snap or pick your photo' },
  { icon: 'people-outline' as const, title: 'Find Inspo', desc: 'Browse looks or upload a celeb pic' },
  { icon: 'cut-outline' as const, title: 'Pick Attributes', desc: 'Hair, style, features & more' },
  { icon: 'sparkles-outline' as const, title: 'See Yourself', desc: 'AI applies the look to you' },
];

// --- Animated arrow that draws with stroke-dash ---
function DrawArrow({
  d,
  pathLength,
  arrowD,
  arrowLength,
  delay,
  color,
  sw,
  width: w,
  height: h,
  style,
}: {
  d: string;
  pathLength: number;
  arrowD: string;
  arrowLength: number;
  delay: number;
  color: string;
  sw: number;
  width: number;
  height: number;
  style?: any;
}) {
  const progress = useSharedValue(pathLength);
  const arrowProgress = useSharedValue(arrowLength);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    arrowProgress.value = withDelay(
      delay + 500,
      withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const pathProps = useAnimatedProps(() => ({
    strokeDasharray: [pathLength, pathLength],
    strokeDashoffset: progress.value,
  }));

  const arrowProps = useAnimatedProps(() => ({
    strokeDasharray: [arrowLength, arrowLength],
    strokeDashoffset: arrowProgress.value,
  }));

  return (
    <View style={style} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <AnimatedPath
          d={d}
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          animatedProps={pathProps}
        />
        <AnimatedPath
          d={arrowD}
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animatedProps={arrowProps}
        />
      </Svg>
    </View>
  );
}

export default function PossibilitiesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Base delay — logo has already animated on index, so we start faster
  const BASE = 300;

  // Card entry animations
  const card1Entry = useSharedValue(0);
  const card2Entry = useSharedValue(0);
  const card3Entry = useSharedValue(0);
  const card4Entry = useSharedValue(0);

  // Headline + button
  const headlineEntry = useSharedValue(0);
  const headlineTranslateY = useSharedValue(14);
  const buttonEntry = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  // Exit
  const exitProgress = useSharedValue(0);
  const contentExitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  const arrowColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,29,43,0.22)';
  const arrowSW = 1.75;

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    // Card 1 appears first (starting point)
    card1Entry.value = withDelay(BASE, withSpring(1, { damping: 14, stiffness: 60, mass: 1 }));
    // Arrow right draws → then Card 2 appears
    card2Entry.value = withDelay(BASE + 700, withSpring(1, { damping: 14, stiffness: 60, mass: 1 }));
    // Arrow down draws → then Card 3 appears
    card3Entry.value = withDelay(BASE + 1400, withSpring(1, { damping: 14, stiffness: 60, mass: 1 }));
    // Arrow left draws → then Card 4 appears
    card4Entry.value = withDelay(BASE + 2100, withSpring(1, { damping: 14, stiffness: 60, mass: 1 }));

    // Headline
    headlineEntry.value = withDelay(BASE + 2300, withTiming(1, { duration: 700, easing: EASE }));
    headlineTranslateY.value = withDelay(BASE + 2300, withSpring(0, { damping: 22, stiffness: 85 }));

    // Button
    buttonEntry.value = withDelay(BASE + 2500, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
    buttonTranslateY.value = withDelay(BASE + 2500, withSpring(0, { damping: 20, stiffness: 90 }));
  }, []);

  // --- Card animated styles ---
  const card1Style = useAnimatedStyle(() => {
    const opacity = interpolate(card1Entry.value, [0, 0.3], [0, 1], 'clamp');
    const tx = interpolate(card1Entry.value, [0, 1], [-140, 0]);
    const ty = interpolate(card1Entry.value, [0, 1], [50, 0]);
    const scale = interpolate(card1Entry.value, [0, 1], [0.5, 1]);
    const rotate = interpolate(card1Entry.value, [0, 1], [-12, 0]);
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTx = interpolate(contentExitProgress.value, [0, 1], [0, -50]);
    return {
      opacity: opacity * exitOp,
      transform: [{ translateX: tx + exitTx }, { translateY: ty }, { rotate: `${rotate}deg` }, { scale }],
    };
  });

  const card2Style = useAnimatedStyle(() => {
    const opacity = interpolate(card2Entry.value, [0, 0.3], [0, 1], 'clamp');
    const tx = interpolate(card2Entry.value, [0, 1], [140, 0]);
    const ty = interpolate(card2Entry.value, [0, 1], [50, 0]);
    const scale = interpolate(card2Entry.value, [0, 1], [0.5, 1]);
    const rotate = interpolate(card2Entry.value, [0, 1], [12, 0]);
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTx = interpolate(contentExitProgress.value, [0, 1], [0, 50]);
    return {
      opacity: opacity * exitOp,
      transform: [{ translateX: tx + exitTx }, { translateY: ty }, { rotate: `${rotate}deg` }, { scale }],
    };
  });

  const card3Style = useAnimatedStyle(() => {
    const opacity = interpolate(card3Entry.value, [0, 0.3], [0, 1], 'clamp');
    const tx = interpolate(card3Entry.value, [0, 1], [140, 0]);
    const ty = interpolate(card3Entry.value, [0, 1], [50, 0]);
    const scale = interpolate(card3Entry.value, [0, 1], [0.5, 1]);
    const rotate = interpolate(card3Entry.value, [0, 1], [12, 0]);
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTx = interpolate(contentExitProgress.value, [0, 1], [0, 50]);
    return {
      opacity: opacity * exitOp,
      transform: [{ translateX: tx + exitTx }, { translateY: ty }, { rotate: `${rotate}deg` }, { scale }],
    };
  });

  const card4Style = useAnimatedStyle(() => {
    const opacity = interpolate(card4Entry.value, [0, 0.3], [0, 1], 'clamp');
    const tx = interpolate(card4Entry.value, [0, 1], [-140, 0]);
    const ty = interpolate(card4Entry.value, [0, 1], [50, 0]);
    const scale = interpolate(card4Entry.value, [0, 1], [0.5, 1]);
    const rotate = interpolate(card4Entry.value, [0, 1], [-12, 0]);
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTx = interpolate(contentExitProgress.value, [0, 1], [0, -50]);
    return {
      opacity: opacity * exitOp,
      transform: [{ translateX: tx + exitTx }, { translateY: ty }, { rotate: `${rotate}deg` }, { scale }],
    };
  });

  const headlineStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTy = interpolate(contentExitProgress.value, [0, 1], [0, -20]);
    return {
      opacity: headlineEntry.value * exitOp,
      transform: [{ translateY: headlineTranslateY.value + exitTy }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTy = interpolate(contentExitProgress.value, [0, 1], [0, 40]);
    return {
      opacity: buttonEntry.value * exitOp,
      transform: [{ translateY: buttonTranslateY.value + exitTy }, { scale: buttonScale.value }],
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(contentExitProgress.value, [0, 0.7], [1, 0]);
    return { opacity: exitOp };
  });

  const handleContinue = () => {
    if (isExiting.value) return;
    isExiting.value = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const EXIT_DURATION = 450;
    const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1);

    contentExitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: EASE_OUT });
    exitProgress.value = withTiming(1, { duration: EXIT_DURATION, easing: EASE_OUT });

    setTimeout(() => {
      router.push('/(onboarding)/howitworks');
    }, EXIT_DURATION - 100);
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };
  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  // --- Arrow geometry ---
  const hAW = H_GAP;
  const hAH = 20;
  const vAW = 20;
  const vAH = V_GAP;

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={isDark ? [colors.bgSecondary, colors.bgTertiary, colors.bgPrimary] : ['#F3F4F6', '#F5F6F8', '#F8F9FB']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.content}>
        {/* Logo spacer */}
        <View style={styles.logoSpacer} />

        {/* Cards grid */}
        <View style={styles.hero}>
          <View style={styles.cardsContainer}>
            {/* Card 1 — top left */}
            <Animated.View style={[styles.card, styles.card1, card1Style]}>
              <View style={[styles.cardAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' }]}>
                <Ionicons name={STEPS[0].icon} size={22} color={isDark ? colors.textSecondary : '#1a1d2b'} />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>{STEPS[0].title}</Text>
              <Text style={[styles.cardDesc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.3)' }]}>{STEPS[0].desc}</Text>
            </Animated.View>

            {/* Card 2 — top right */}
            <Animated.View style={[styles.card, styles.card2, card2Style]}>
              <View style={[styles.cardAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' }]}>
                <Ionicons name={STEPS[1].icon} size={22} color={isDark ? colors.textSecondary : '#1a1d2b'} />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>{STEPS[1].title}</Text>
              <Text style={[styles.cardDesc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.3)' }]}>{STEPS[1].desc}</Text>
            </Animated.View>

            {/* Card 3 — bottom right */}
            <Animated.View style={[styles.card, styles.card3, card3Style]}>
              <View style={[styles.cardAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' }]}>
                <Ionicons name={STEPS[2].icon} size={22} color={isDark ? colors.textSecondary : '#1a1d2b'} />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>{STEPS[2].title}</Text>
              <Text style={[styles.cardDesc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.3)' }]}>{STEPS[2].desc}</Text>
            </Animated.View>

            {/* Card 4 — bottom left */}
            <Animated.View style={[styles.card, styles.card4, card4Style]}>
              <View style={[styles.cardAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' }]}>
                <Ionicons name={STEPS[3].icon} size={22} color={isDark ? colors.textSecondary : '#1a1d2b'} />
              </View>
              <Text style={[styles.cardTitle, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>{STEPS[3].title}</Text>
              <Text style={[styles.cardDesc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.3)' }]}>{STEPS[3].desc}</Text>
            </Animated.View>

            {/* Arrow: left → right (Step 1 → Step 2) — draws before Card 2 */}
            <DrawArrow
              d={`M 6 ${hAH / 2} C ${hAW * 0.4} ${hAH / 2 - 4}, ${hAW * 0.6} ${hAH / 2 + 4}, ${hAW - 12} ${hAH / 2}`}
              pathLength={70}
              arrowD={`M ${hAW - 19} ${hAH / 2 - 5} L ${hAW - 10} ${hAH / 2} L ${hAW - 19} ${hAH / 2 + 5}`}
              arrowLength={25}
              delay={BASE + 200}
              color={arrowColor}
              sw={arrowSW}
              width={hAW}
              height={hAH}
              style={styles.arrowRight}
            />

            {/* Arrow: top → bottom (Step 2 → Step 3) — draws before Card 3 */}
            <DrawArrow
              d={`M ${vAW / 2} 5 C ${vAW / 2 + 3} ${vAH * 0.4}, ${vAW / 2 - 3} ${vAH * 0.6}, ${vAW / 2} ${vAH - 10}`}
              pathLength={50}
              arrowD={`M ${vAW / 2 - 5} ${vAH - 17} L ${vAW / 2} ${vAH - 8} L ${vAW / 2 + 5} ${vAH - 17}`}
              arrowLength={25}
              delay={BASE + 900}
              color={arrowColor}
              sw={arrowSW}
              width={vAW}
              height={vAH}
              style={styles.arrowDown}
            />

            {/* Arrow: right → left (Step 3 → Step 4) — draws before Card 4 */}
            <DrawArrow
              d={`M ${hAW - 6} ${hAH / 2} C ${hAW * 0.6} ${hAH / 2 + 4}, ${hAW * 0.4} ${hAH / 2 - 4}, 12 ${hAH / 2}`}
              pathLength={70}
              arrowD={`M 19 ${hAH / 2 - 5} L 10 ${hAH / 2} L 19 ${hAH / 2 + 5}`}
              arrowLength={25}
              delay={BASE + 1600}
              color={arrowColor}
              sw={arrowSW}
              width={hAW}
              height={hAH}
              style={styles.arrowLeft}
            />
          </View>
        </View>

        {/* Headline */}
        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>How it works.</Text>
          <Text style={[styles.headline, styles.headlineDim]}>Simple as that.</Text>
        </Animated.View>
      </View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={isDark ? [colors.accentLight, colors.accent] : ['#1A1F2E', '#0D1017']}
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
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    logoSpacer: {
      marginTop: 80,
      height: LOGO_SIZE,
      marginBottom: 10,
    },
    hero: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    cardsContainer: {
      width: CONTAINER_W,
      height: CONTAINER_H,
      position: 'relative',
    },

    // --- Cards (same visual style as index page) ---
    card: {
      position: 'absolute',
      width: CARD_W,
      height: CARD_H,
      borderRadius: CARD_BR,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.bgSecondary : '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    card1: { left: 0, top: 0 },
    card2: { right: 0, top: 0 },
    card3: { right: 0, bottom: 0 },
    card4: { left: 0, bottom: 0 },

    cardAvatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_BR,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 3,
    },
    cardDesc: {
      fontSize: 9,
      fontWeight: '400',
      textAlign: 'center',
      paddingHorizontal: 14,
      lineHeight: 13,
    },

    // --- Arrows ---
    arrowRight: {
      position: 'absolute',
      left: CARD_W,
      top: CARD_H / 2 - 10,
      zIndex: 10,
    },
    arrowDown: {
      position: 'absolute',
      right: CARD_W / 2 - 10,
      top: CARD_H,
      zIndex: 10,
    },
    arrowLeft: {
      position: 'absolute',
      left: CARD_W,
      bottom: CARD_H / 2 - 10,
      zIndex: 10,
    },

    // --- Headline ---
    headlineContainer: {
      alignItems: 'center',
      marginBottom: 38,
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 38,
      fontWeight: '400',
      color: isDark ? colors.textPrimary : '#1a1d2b',
      textAlign: 'center',
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    headlineDim: {
      color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,29,43,0.2)',
    },

    // --- Button ---
    bottomSection: {
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

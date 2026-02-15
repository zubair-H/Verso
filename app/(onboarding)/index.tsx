import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Rect, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const LOGO_SIZE = 280;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);

// Card dimensions
const CARD_WIDTH = 152;
const CARD_HEIGHT = 200;
const CARD_BORDER_RADIUS = 16;
const CARDS_CONTAINER_WIDTH = 270;
const CARDS_CONTAINER_HEIGHT = 300;

// Avatar/icon dimensions (for outline drawing animation)
const AVATAR_SIZE = 52;
const AVATAR_BORDER_RADIUS = 12;
const AVATAR_STRAIGHT = 2 * (AVATAR_SIZE - 2 * AVATAR_BORDER_RADIUS) + 2 * (AVATAR_SIZE - 2 * AVATAR_BORDER_RADIUS);
const AVATAR_ARCS = 2 * Math.PI * AVATAR_BORDER_RADIUS;
const AVATAR_PERIMETER = AVATAR_STRAIGHT + AVATAR_ARCS;
// Each line draws just under half so they barely meet without overlapping
const HALF_PERIMETER = AVATAR_PERIMETER / 2 - 1;

// Particle configuration
const NUM_PARTICLES = 8;

// Shape silhouettes for particles (10x10 viewBox)
const PARTICLE_SHAPES = [
  'M0.5,5.5 a2.2,1.8 0 1,1 4.4,0 a2.2,1.8 0 1,1 -4.4,0 M5.1,5.5 a2.2,1.8 0 1,1 4.4,0 a2.2,1.8 0 1,1 -4.4,0', // glasses
  'M0.5,5 Q5,1 9.5,5 Q5,9 0.5,5', // lips
  'M5,0 C5.8,3.5 6.5,4.2 10,5 C6.5,5.8 5.8,6.5 5,10 C4.2,6.5 3.5,5.8 0,5 C3.5,4.2 4.2,3.5 5,0', // sparkle
  'M5,9 C0,6 0,1.5 3.2,1.5 C4.5,1.5 5,3 5,3 C5,3 5.5,1.5 6.8,1.5 C10,1.5 10,6 5,9', // heart
  'M5,0.5 L9.5,5 L5,9.5 L0.5,5 Z', // diamond
  'M5,0.5 C9,2.5 9.5,7.5 5,9.5 C0.5,7.5 1,2.5 5,0.5', // leaf
  'M1,8 L5,1.5 L9,8 Z', // hat
  'M0.5,2 L5,5 L0.5,8 Z M9.5,2 L5,5 L9.5,8 Z', // bowtie
];

// Bezier curve for particle path
const FROM_X = 76;
const FROM_Y = 116;
const TO_X = 194;
const TO_Y = 136;
const MID_X = (FROM_X + TO_X) / 2;
const MID_Y = (FROM_Y + TO_Y) / 2 - 20;

function getPointOnCurve(t: number) {
  'worklet';
  return {
    x: (1 - t) * (1 - t) * FROM_X + 2 * (1 - t) * t * MID_X + t * t * TO_X,
    y: (1 - t) * (1 - t) * FROM_Y + 2 * (1 - t) * t * MID_Y + t * t * TO_Y,
  };
}

// Single animated particle — subtle dot with soft halo and trailing dot
function Particle({
  index,
  exitProgress,
  entryProgress,
  particleColor,
}: {
  index: number;
  exitProgress: SharedValue<number>;
  entryProgress: SharedValue<number>;
  particleColor: string;
}) {
  const progress = useSharedValue(0);
  const offset = index / NUM_PARTICLES;
  const offsetY = ((index % 3) - 1) * 5;
  const dotSize = 2 + (index % 3) * 0.4;

  useEffect(() => {
    progress.value = withDelay(
      3200,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  // Main shape
  const shape = PARTICLE_SHAPES[index % PARTICLE_SHAPES.length];
  const mainStyle = useAnimatedStyle(() => {
    const t = (progress.value + offset) % 1;
    const pt = getPointOnCurve(t);
    const edgeFade = Math.pow(Math.sin(t * Math.PI), 0.6);
    const entryOpacity = entryProgress.value;
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);

    return {
      position: 'absolute',
      left: pt.x - dotSize,
      top: pt.y + offsetY - dotSize,
      width: dotSize * 2,
      height: dotSize * 2,
      opacity: 0.18 * edgeFade * entryOpacity * exitOpacity,
    };
  });

  // Soft halo glow
  const haloSize = dotSize * 3;
  const haloStyle = useAnimatedStyle(() => {
    const t = (progress.value + offset) % 1;
    const pt = getPointOnCurve(t);
    const edgeFade = Math.pow(Math.sin(t * Math.PI), 0.6);
    const entryOpacity = entryProgress.value;
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);

    return {
      position: 'absolute',
      left: pt.x - haloSize,
      top: pt.y + offsetY - haloSize,
      width: haloSize * 2,
      height: haloSize * 2,
      borderRadius: haloSize,
      backgroundColor: particleColor,
      opacity: 0.18 * 0.08 * edgeFade * entryOpacity * exitOpacity,
    };
  });

  // Trailing dot
  const trailSize = dotSize * 0.6;
  const trailStyle = useAnimatedStyle(() => {
    const t = (progress.value + offset) % 1;
    const trailT = t - 0.03 < 0 ? t - 0.03 + 1 : t - 0.03;
    const pt = getPointOnCurve(trailT);
    const edgeFade = Math.pow(Math.sin(trailT * Math.PI), 0.6);
    const entryOpacity = entryProgress.value;
    const exitOpacity = interpolate(exitProgress.value, [0, 1], [1, 0]);

    return {
      position: 'absolute',
      left: pt.x - trailSize,
      top: pt.y + offsetY - trailSize,
      width: trailSize * 2,
      height: trailSize * 2,
      borderRadius: trailSize,
      backgroundColor: particleColor,
      opacity: 0.18 * 0.35 * edgeFade * entryOpacity * exitOpacity,
    };
  });

  return (
    <>
      <Animated.View style={haloStyle} />
      <Animated.View style={trailStyle} />
      <Animated.View style={mainStyle}>
        <Svg width={dotSize * 2} height={dotSize * 2} viewBox="0 0 10 10">
          <Path d={shape} fill={particleColor} />
        </Svg>
      </Animated.View>
    </>
  );
}

// Animated outline on the avatar icon — draws from two points then fades out
function IconOutline({
  drawProgress,
  fadeProgress,
  strokeColor,
}: {
  drawProgress: SharedValue<number>;
  fadeProgress: SharedValue<number>;
  strokeColor: string;
}) {
  // Line A: draws first half from top-left going clockwise
  const lineAProps = useAnimatedProps(() => ({
    strokeDashoffset: HALF_PERIMETER * (1 - drawProgress.value),
  }));

  // Line B: same progress, SVG flipped 180° to draw from bottom-right
  const lineBProps = useAnimatedProps(() => ({
    strokeDashoffset: HALF_PERIMETER * (1 - drawProgress.value),
  }));

  // Fade in as drawing starts, then fade out via fadeProgress
  const opacityStyle = useAnimatedStyle(() => {
    const drawOpacity = interpolate(drawProgress.value, [0, 0.05], [0, 1], 'clamp');
    const fadeOut = interpolate(fadeProgress.value, [0, 1], [1, 0]);
    return { opacity: drawOpacity * fadeOut };
  });

  const svgInset = 0.75;

  return (
    <>
      {/* Line A — draws from top-left corner clockwise */}
      <Animated.View style={[iconOutlineStyles.overlay, opacityStyle]}>
        <Svg width={AVATAR_SIZE} height={AVATAR_SIZE}>
          <AnimatedRect
            x={svgInset}
            y={svgInset}
            width={AVATAR_SIZE - svgInset * 2}
            height={AVATAR_SIZE - svgInset * 2}
            rx={AVATAR_BORDER_RADIUS}
            ry={AVATAR_BORDER_RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeLinecap="butt"
            strokeDasharray={`${HALF_PERIMETER} ${AVATAR_PERIMETER}`}
            animatedProps={lineAProps}
          />
        </Svg>
      </Animated.View>
      {/* Line B — flipped 180°, draws from bottom-right corner */}
      <Animated.View style={[iconOutlineStyles.overlay, iconOutlineStyles.flipped, opacityStyle]}>
        <Svg width={AVATAR_SIZE} height={AVATAR_SIZE}>
          <AnimatedRect
            x={svgInset}
            y={svgInset}
            width={AVATAR_SIZE - svgInset * 2}
            height={AVATAR_SIZE - svgInset * 2}
            rx={AVATAR_BORDER_RADIUS}
            ry={AVATAR_BORDER_RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeLinecap="butt"
            strokeDasharray={`${HALF_PERIMETER} ${AVATAR_PERIMETER}`}
            animatedProps={lineBProps}
          />
        </Svg>
      </Animated.View>
    </>
  );
}

const iconOutlineStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
});

export default function IntroScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Wait for logo animation to complete (~1800ms) before showing content
  const LOGO_ANIMATION_DELAY = 1900;

  // Entry animations
  const cardLeftEntry = useSharedValue(0);
  const cardRightEntry = useSharedValue(0);
  const headlineEntry = useSharedValue(0);
  const headlineTranslateY = useSharedValue(14);
  const buttonEntry = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  const particleEntry = useSharedValue(0);

  // Outline draw progress (0 = invisible, 1 = fully drawn) and fade out
  const leftOutlineDraw = useSharedValue(0);
  const rightOutlineDraw = useSharedValue(0);
  const leftOutlineFade = useSharedValue(0);
  const rightOutlineFade = useSharedValue(0);

  // Exit animation
  const exitProgress = useSharedValue(0);
  const contentExitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  const outlineColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(26,29,43,0.18)';

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);
    const DRAW_EASE = Easing.bezier(0.4, 0, 0.2, 1);

    // Left card sweeps in from far left
    cardLeftEntry.value = withDelay(
      LOGO_ANIMATION_DELAY,
      withSpring(1, { damping: 12, stiffness: 55, mass: 1 })
    );

    // Right card sweeps in from far right (more stagger)
    cardRightEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 400,
      withSpring(1, { damping: 12, stiffness: 55, mass: 1 })
    );

    // Outline draws around each icon after card settles, then fades out
    leftOutlineDraw.value = withDelay(
      LOGO_ANIMATION_DELAY + 700,
      withTiming(1, { duration: 800, easing: DRAW_EASE })
    );
    // Fade out left outline after draw completes (700 + 800 = 1500, + 200 pause)
    leftOutlineFade.value = withDelay(
      LOGO_ANIMATION_DELAY + 1700,
      withTiming(1, { duration: 400, easing: SMOOTH_EASE })
    );

    rightOutlineDraw.value = withDelay(
      LOGO_ANIMATION_DELAY + 1100,
      withTiming(1, { duration: 800, easing: DRAW_EASE })
    );
    // Fade out right outline after draw completes (1100 + 800 = 1900, + 200 pause)
    rightOutlineFade.value = withDelay(
      LOGO_ANIMATION_DELAY + 2100,
      withTiming(1, { duration: 400, easing: SMOOTH_EASE })
    );

    // Particles fade in after icon outline animations complete
    particleEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 1400,
      withTiming(1, { duration: 800, easing: SMOOTH_EASE })
    );

    // Headline fades up
    headlineEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 800,
      withTiming(1, { duration: 800, easing: EASE })
    );
    headlineTranslateY.value = withDelay(
      LOGO_ANIMATION_DELAY + 800,
      withSpring(0, { damping: 22, stiffness: 85 })
    );

    // Button appears
    buttonEntry.value = withDelay(
      LOGO_ANIMATION_DELAY + 1000,
      withTiming(1, { duration: 500, easing: SMOOTH_EASE })
    );
    buttonTranslateY.value = withDelay(
      LOGO_ANIMATION_DELAY + 1000,
      withSpring(0, { damping: 20, stiffness: 90 })
    );
  }, []);

  // Card styles — dramatic entry from far off-screen with rotation and scale
  // On exit, cards scale down, lose rotation, and move toward center to suggest splitting into 4
  const cardLeftStyle = useAnimatedStyle(() => {
    const entryOpacity = interpolate(cardLeftEntry.value, [0, 0.2], [0, 1], 'clamp');
    const entryTranslateX = interpolate(cardLeftEntry.value, [0, 1], [-200, 0]);
    const entryTranslateY = interpolate(cardLeftEntry.value, [0, 1], [100, 0]);
    const entryScale = interpolate(cardLeftEntry.value, [0, 1], [0.3, 1]);
    const entryRotate = interpolate(cardLeftEntry.value, [0, 1], [-25, -6]);
    const exitOpacity = interpolate(contentExitProgress.value, [0.6, 1], [1, 0]);
    const exitTranslateX = interpolate(contentExitProgress.value, [0, 1], [0, 20]);
    const exitTranslateY = interpolate(contentExitProgress.value, [0, 1], [0, -30]);
    const exitRotate = interpolate(contentExitProgress.value, [0, 1], [0, 6]);
    const exitScale = interpolate(contentExitProgress.value, [0, 1], [1, 0.7]);

    return {
      opacity: entryOpacity * exitOpacity,
      transform: [
        { translateX: entryTranslateX + exitTranslateX },
        { translateY: entryTranslateY + exitTranslateY },
        { rotate: `${entryRotate + exitRotate}deg` },
        { scale: entryScale * exitScale },
      ],
    };
  });

  const cardRightStyle = useAnimatedStyle(() => {
    const entryOpacity = interpolate(cardRightEntry.value, [0, 0.2], [0, 1], 'clamp');
    const entryTranslateX = interpolate(cardRightEntry.value, [0, 1], [200, 0]);
    const entryTranslateY = interpolate(cardRightEntry.value, [0, 1], [100, 0]);
    const entryScale = interpolate(cardRightEntry.value, [0, 1], [0.3, 1]);
    const entryRotate = interpolate(cardRightEntry.value, [0, 1], [22, 4]);
    const exitOpacity = interpolate(contentExitProgress.value, [0.6, 1], [1, 0]);
    const exitTranslateX = interpolate(contentExitProgress.value, [0, 1], [0, -20]);
    const exitTranslateY = interpolate(contentExitProgress.value, [0, 1], [0, -30]);
    const exitRotate = interpolate(contentExitProgress.value, [0, 1], [0, -4]);
    const exitScale = interpolate(contentExitProgress.value, [0, 1], [1, 0.7]);

    return {
      opacity: entryOpacity * exitOpacity,
      transform: [
        { translateX: entryTranslateX + exitTranslateX },
        { translateY: entryTranslateY + exitTranslateY },
        { rotate: `${entryRotate + exitRotate}deg` },
        { scale: entryScale * exitScale },
      ],
    };
  });

  const headlineStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTranslateY = interpolate(contentExitProgress.value, [0, 1], [0, -20]);
    return {
      opacity: headlineEntry.value * exitOpacity,
      transform: [{ translateY: headlineTranslateY.value + exitTranslateY }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(contentExitProgress.value, [0, 1], [1, 0]);
    const exitTranslateY = interpolate(contentExitProgress.value, [0, 1], [0, 40]);
    return {
      opacity: buttonEntry.value * exitOpacity,
      transform: [
        { translateY: buttonTranslateY.value + exitTranslateY },
        { scale: buttonScale.value },
      ],
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const exitOpacity = interpolate(contentExitProgress.value, [0, 0.7], [1, 0]);
    return { opacity: exitOpacity };
  });

  const handleGetStarted = () => {
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

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={[colors.bgSecondary, colors.bgTertiary, colors.bgPrimary]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo spacer */}
        <View style={styles.logoSpacer} />

        {/* Hero section with cards */}
        <View style={styles.hero}>
          <View style={styles.cardsContainer}>
            {/* Left card - "Pick a style" */}
            <Animated.View style={[styles.card, styles.cardLeft, cardLeftStyle]}>
              <View style={styles.avatarWrapper}>
                <View style={[styles.cardAvatar, { backgroundColor: colors.accentMuted }]}>
                  <Ionicons
                    name="image-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
                <IconOutline drawProgress={leftOutlineDraw} fadeProgress={leftOutlineFade} strokeColor={outlineColor} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Pick a style
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textTertiary }]}>
                Choose any celebrity look
              </Text>
            </Animated.View>

            {/* Right card - "See it on you" */}
            <Animated.View style={[styles.card, styles.cardRight, cardRightStyle]}>
              <View style={styles.avatarWrapper}>
                <View style={[styles.cardAvatar, { backgroundColor: colors.accentMuted }]}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
                <IconOutline drawProgress={rightOutlineDraw} fadeProgress={rightOutlineFade} strokeColor={outlineColor} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                See it on you
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textTertiary }]}>
                Try before you commit
              </Text>
            </Animated.View>

            {/* Animated particles flowing between cards */}
            <View style={styles.particleLayer}>
              {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
                <Particle
                  key={i}
                  index={i}
                  exitProgress={exitProgress}
                  entryProgress={particleEntry}
                  particleColor={colors.textPrimary}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Headline */}
        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>Try any look.</Text>
          <Text style={[styles.headline, styles.headlineDim]}>Risk nothing.</Text>
        </Animated.View>
      </View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={[colors.accentLight, colors.accent]}
            locations={[0.68, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
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
      width: CARDS_CONTAINER_WIDTH,
      height: CARDS_CONTAINER_HEIGHT,
      position: 'relative',
    },
    card: {
      position: 'absolute',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: CARD_BORDER_RADIUS,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgCard,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 32,
      elevation: 12,
    },
    cardLeft: {
      left: 0,
      top: 16,
      zIndex: 2,
    },
    cardRight: {
      right: 0,
      top: 36,
      zIndex: 3,
    },
    avatarWrapper: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      marginBottom: 14,
      position: 'relative',
    },
    cardAvatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_BORDER_RADIUS,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    cardDesc: {
      fontSize: 9,
      fontWeight: '400',
      textAlign: 'center',
      paddingHorizontal: 14,
      lineHeight: 13,
    },
    particleLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: CARDS_CONTAINER_WIDTH,
      height: CARDS_CONTAINER_HEIGHT,
      zIndex: 4,
    },
    headlineContainer: {
      alignItems: 'center',
      marginBottom: 38,
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 38,
      fontWeight: '400',
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    headlineDim: {
      color: isDark ? 'rgba(255,255,255,0.2)' : colors.textTertiary,
    },
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

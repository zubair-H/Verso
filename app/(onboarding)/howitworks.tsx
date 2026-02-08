import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const LOGO_SIZE_SMALL = 220;
const INDICATOR_HEIGHT = 50;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card data for the 4 steps
const CARD_DATA = [
  { icon: 'camera' as const, title: 'Selfie', desc: 'Snap a quick photo of yourself' },
  { icon: 'users' as const, title: 'Inspo', desc: 'Browse celebrity looks you love' },
  { icon: 'scissors' as const, title: 'Attributes', desc: 'Fine-tune the details' },
  { icon: 'zap' as const, title: 'Magic', desc: 'See the transformation' },
];

// Card dimensions
const CARD_HEIGHT = 150;
const CARD_RADIUS = 16;

// Stack depth positions: how cards behind the front card appear
const STACK = [
  { scale: 1, ty: 0, opacity: 1 },       // depth 0: front
  { scale: 0.94, ty: 14, opacity: 0.5 },  // depth 1: next behind
  { scale: 0.88, ty: 26, opacity: 0.2 },  // depth 2
  { scale: 0.82, ty: 36, opacity: 0 },    // depth 3+
];

// Indicator dot center X offsets from screen center
// Indicator: 4×56 stepContainer + 3×24 line = 296px centered
// Dot centers: -120, -40, +40, +120 from screen center
const EXIT_TX = [-120, -40, 40, 120];

const EXIT_DURATION = 500;

export default function HowItWorksScreen() {
  const { colors, isDark } = useTheme();
  const { indicatorCount, setIndicatorCount } = useOnboarding();
  const insets = useSafeAreaInsets();

  // Shared values for smooth card stack animation
  // Initialize from context so returning from a step page shows the correct card
  const currentIndex = useSharedValue(indicatorCount);
  const exitProgress = useSharedValue(0);

  // React state for UI updates and navigation
  const [reactIndex, setReactIndex] = useState(indicatorCount);
  const isAnimating = useRef(false);

  // Step routes corresponding to each card
  const STEP_ROUTES = [
    '/(onboarding)/step1',
    '/(onboarding)/step2',
    '/(onboarding)/step3',
    '/(onboarding)/step4',
  ] as const;

  // Entry animations
  const headlineEntry = useSharedValue(0);
  const headlineTranslateY = useSharedValue(20);
  const subtitleEntry = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(10);
  const stackEntry = useSharedValue(0);
  const buttonEntry = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  // Compute exit Y: distance from card center to indicator center
  const topPad = insets.top + 230 + 52; // logo spacer (with indicator) + headline area
  const bottomPad = Math.max(insets.bottom, 16) + 24 + 56;
  const cardCenterY = (topPad + SCREEN_HEIGHT - bottomPad) / 2;
  const indicatorCenterY = insets.top + 165 + 14;
  const EXIT_TY = indicatorCenterY - cardCenterY;

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);
    const SMOOTH = Easing.bezier(0.33, 1, 0.68, 1);

    headlineEntry.value = withDelay(500, withTiming(1, { duration: 700, easing: EASE }));
    headlineTranslateY.value = withDelay(500, withSpring(0, { damping: 22, stiffness: 85 }));

    subtitleEntry.value = withDelay(650, withTiming(1, { duration: 500, easing: EASE }));
    subtitleTranslateY.value = withDelay(650, withSpring(0, { damping: 20, stiffness: 120 }));

    stackEntry.value = withDelay(800, withSpring(1, { damping: 14, stiffness: 80 }));

    buttonEntry.value = withDelay(1100, withTiming(1, { duration: 500, easing: SMOOTH }));
    buttonTranslateY.value = withDelay(1100, withSpring(0, { damping: 20, stiffness: 90 }));
  }, []);

  const handleContinue = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate current card flying to indicator
    exitProgress.value = withTiming(1, {
      duration: EXIT_DURATION,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    // Update indicator count mid-animation so the dot springs in
    setTimeout(() => {
      setIndicatorCount(reactIndex + 1);
    }, 200);

    // After animation: advance card state and navigate to corresponding step page
    setTimeout(() => {
      const nextIdx = reactIndex + 1;
      currentIndex.value = nextIdx;
      exitProgress.value = 0;
      setReactIndex(nextIdx);
      isAnimating.current = false;

      // Push the corresponding step page (step1 for card 0, step2 for card 1, etc.)
      // howitworks stays on the stack — step pages use router.back() to return here
      router.push(STEP_ROUTES[reactIndex] as any);
    }, EXIT_DURATION + 50);
  };

  // --- Animated styles ---

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineEntry.value,
    transform: [{ translateY: headlineTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleEntry.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonEntry.value,
    transform: [{ translateY: buttonTranslateY.value }, { scale: buttonScale.value }],
  }));

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? [colors.bgSecondary, colors.bgTertiary, colors.bgPrimary] : ['#F3F4F6', '#F5F6F8', '#F8F9FB']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.logoSpacer} />

        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>Here's how it works</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>
            Step {reactIndex + 1} of 4
          </Text>
        </Animated.View>

        {/* Card stack */}
        <View style={styles.cardStackContainer}>
          {CARD_DATA.map((card, i) => {
            // Card position animation based on depth in stack
            const cardStyle = useAnimatedStyle(() => {
              const depth = i - currentIndex.value;
              const entryScale = interpolate(stackEntry.value, [0, 1], [0.5, 1]);
              const entryOp = interpolate(stackEntry.value, [0, 0.3], [0, 1], 'clamp');

              // Card already collected — hide it
              if (depth < -0.5) {
                return {
                  opacity: 0,
                  zIndex: 0,
                  transform: [{ translateX: 0 }, { translateY: EXIT_TY }, { scale: 0.1 }],
                };
              }

              // Current card — flies to indicator on exit
              if (depth >= -0.5 && depth <= 0.5) {
                const tx = interpolate(exitProgress.value, [0, 1], [0, EXIT_TX[i]]);
                const ty = interpolate(exitProgress.value, [0, 1], [0, EXIT_TY]);
                // Scale down to roughly indicator dot size (~28px from card width)
                // But cap at 0.2 so the card doesn't become invisible during flight
                const scale = interpolate(exitProgress.value, [0, 0.7, 1], [1, 0.35, 0.2]);
                const op = interpolate(exitProgress.value, [0, 0.5, 1], [1, 0.6, 0]);

                return {
                  opacity: op * entryOp,
                  zIndex: 10,
                  transform: [
                    { translateX: tx },
                    { translateY: ty },
                    { scale: scale * entryScale },
                  ],
                };
              }

              // Stack card — sits behind current, shifts forward during exit
              const d = Math.min(Math.round(depth), 3);
              const from = STACK[d];
              const to = STACK[Math.max(d - 1, 0)];

              const ty = interpolate(exitProgress.value, [0, 1], [from.ty, to.ty]);
              const scale = interpolate(exitProgress.value, [0, 1], [from.scale, to.scale]);
              const op = interpolate(exitProgress.value, [0, 1], [from.opacity, to.opacity]);

              return {
                opacity: op * entryOp,
                zIndex: 10 - d,
                transform: [
                  { translateX: 0 },
                  { translateY: ty },
                  { scale: scale * entryScale },
                ],
              };
            });

            // Card text only visible on front card, fades out quickly during exit
            const textStyle = useAnimatedStyle(() => {
              const depth = i - currentIndex.value;
              if (depth < -0.5 || depth > 0.5) return { opacity: 0 };
              const exitOp = interpolate(exitProgress.value, [0, 0.2], [1, 0]);
              return { opacity: exitOp };
            });

            return (
              <Animated.View key={i} style={[styles.stackCard, cardStyle]}>
                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' },
                  ]}
                >
                  <Feather name={card.icon} size={22} color={isDark ? colors.textPrimary : '#1a1d2b'} />
                </View>
                <Animated.View style={textStyle}>
                  <Text style={[styles.cardTitle, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardDesc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.4)' }]}>
                    {card.desc}
                  </Text>
                </Animated.View>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={() => { buttonScale.value = withTiming(0.97, { duration: 100 }); }}
          onPressOut={() => { buttonScale.value = withTiming(1, { duration: 100 }); }}
        >
          <LinearGradient
            colors={isDark ? [colors.accentLight, colors.accent] : ['#1A1F2E', '#0D1017']}
            locations={[0.68, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {reactIndex === 3 ? "Let's go" : 'Continue'}
            </Text>
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
      marginTop: insets.top - 40,
      height: LOGO_SIZE_SMALL + INDICATOR_HEIGHT,
    },
    headlineContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 34,
      fontWeight: '400',
      color: isDark ? colors.textPrimary : '#1a1d2b',
      textAlign: 'center',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...typography.bodyLarge,
      fontSize: 14,
      color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)',
      textAlign: 'center',
      marginBottom: 28,
      fontWeight: '500',
    },
    cardStackContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    stackCard: {
      position: 'absolute',
      left: 16,
      right: 16,
      height: CARD_HEIGHT,
      borderRadius: CARD_RADIUS,
      backgroundColor: isDark ? colors.bgSecondary : '#fff',
      paddingVertical: 24,
      paddingHorizontal: 24,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4,
    },
    cardDesc: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
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

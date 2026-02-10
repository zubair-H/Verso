import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, LayoutRectangle } from 'react-native';
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
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);
const LOGO_SIZE_SMALL = 220;

const PLACEHOLDER_SIZE = 120;
const CARD_W = 90;
const CARD_H = 110;
const SNAP_THRESHOLD = 80;

export default function Demo1Screen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Layout measurement refs
  const placeholderLayout = useRef<LayoutRectangle | null>(null);
  const cardLayout = useRef<LayoutRectangle | null>(null);
  const areaLayout = useRef<LayoutRectangle | null>(null);

  // Entry animations
  const contentEntry = useSharedValue(0);
  const placeholderEntry = useSharedValue(0);
  const cardEntry = useSharedValue(0);
  const hintEntry = useSharedValue(0);
  const buttonEntry = useSharedValue(0);

  // Card drag state
  const cardTranslateX = useSharedValue(0);
  const cardTranslateY = useSharedValue(0);
  const cardStartX = useSharedValue(0);
  const cardStartY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const isSnapped = useSharedValue(false);

  // Target snap offset (calculated from layout)
  const snapTargetX = useSharedValue(0);
  const snapTargetY = useSharedValue(0);

  // Snap animation
  const snapProgress = useSharedValue(0);

  // Exit
  const exitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    contentEntry.value = withDelay(200, withTiming(1, { duration: 600, easing: EASE }));
    placeholderEntry.value = withDelay(400, withTiming(1, { duration: 500, easing: EASE }));
    cardEntry.value = withDelay(700, withTiming(1, { duration: 500, easing: EASE }));
    hintEntry.value = withDelay(1000, withTiming(1, { duration: 500, easing: EASE }));
    buttonEntry.value = withDelay(1200, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
  }, []);

  const triggerSuccessHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const calculateSnapTarget = () => {
    const pl = placeholderLayout.current;
    const cl = cardLayout.current;
    if (!pl || !cl) return;
    // Calculate how much to translate the card so its center aligns with placeholder center
    const phCenterX = pl.x + pl.width / 2;
    const phCenterY = pl.y + pl.height / 2;
    const cardCenterX = cl.x + cl.width / 2;
    const cardCenterY = cl.y + cl.height / 2;
    snapTargetX.value = phCenterX - cardCenterX;
    snapTargetY.value = phCenterY - cardCenterY;
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isSnapped.value) return;
      isDragging.value = true;
      cardStartX.value = cardTranslateX.value;
      cardStartY.value = cardTranslateY.value;
    })
    .onUpdate((e) => {
      if (isSnapped.value) return;
      cardTranslateX.value = cardStartX.value + e.translationX;
      cardTranslateY.value = cardStartY.value + e.translationY;
    })
    .onEnd(() => {
      if (isSnapped.value) return;
      isDragging.value = false;

      // Check distance from current card position to snap target
      const dx = cardTranslateX.value - snapTargetX.value;
      const dy = cardTranslateY.value - snapTargetY.value;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < SNAP_THRESHOLD) {
        // Snap!
        isSnapped.value = true;
        cardTranslateX.value = withTiming(snapTargetX.value, { duration: 250, easing: SMOOTH_EASE });
        cardTranslateY.value = withTiming(snapTargetY.value, { duration: 250, easing: SMOOTH_EASE });
        snapProgress.value = withTiming(1, { duration: 350, easing: SMOOTH_EASE });
        runOnJS(triggerSuccessHaptic)();
      } else {
        // Return to origin
        cardTranslateX.value = withTiming(0, { duration: 300, easing: SMOOTH_EASE });
        cardTranslateY.value = withTiming(0, { duration: 300, easing: SMOOTH_EASE });
      }
    });

  // Styles
  const contentStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitY = exitProgress.value * -30;
    return {
      opacity: contentEntry.value * exitOp,
      transform: [{ translateY: exitY }],
    };
  });

  const placeholderAnimStyle = useAnimatedStyle(() => {
    const scale = interpolate(placeholderEntry.value, [0, 1], [0.85, 1]);
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    return {
      opacity: placeholderEntry.value * exitOp,
      transform: [{ scale }],
    };
  });

  const placeholderBorderStyle = useAnimatedStyle(() => {
    // Solid border + glow when snapped, dashed when not
    const borderOpacity = interpolate(snapProgress.value, [0, 1], [0.3, 1]);
    return {
      borderColor: isDark
        ? `rgba(255,255,255,${borderOpacity})`
        : `rgba(26,31,46,${borderOpacity})`,
    };
  });

  const cardAnimStyle = useAnimatedStyle(() => {
    const baseScale = interpolate(cardEntry.value, [0, 1], [0.8, 1]);
    const dragScale = isDragging.value ? 1.05 : 1;
    const snapScale = interpolate(snapProgress.value, [0, 0.5, 1], [1, 1.04, 0.95]);
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitScale = interpolate(exitProgress.value, [0, 1], [1, 0.9]);
    return {
      opacity: cardEntry.value * exitOp,
      transform: [
        { translateX: cardTranslateX.value },
        { translateY: cardTranslateY.value },
        { scale: baseScale * dragScale * snapScale * exitScale },
      ],
    };
  });

  const hintAnimStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const snapFade = interpolate(snapProgress.value, [0, 0.3], [1, 0], 'clamp');
    return {
      opacity: hintEntry.value * exitOp * snapFade,
    };
  });

  // Button: hidden until snapped, then fades in
  const buttonAnimStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    const exitY = exitProgress.value * 50;
    const snapReveal = interpolate(snapProgress.value, [0.5, 1], [0, 1], 'clamp');
    return {
      opacity: buttonEntry.value * exitOp * snapReveal,
      transform: [{ translateY: exitY }],
      pointerEvents: snapProgress.value > 0.5 ? 'auto' : 'none',
    };
  });

  const handleContinue = () => {
    if (isExiting.value || !isSnapped.value) return;
    isExiting.value = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    exitProgress.value = withTiming(1, { duration: 400, easing: SMOOTH_EASE });
    setTimeout(() => {
      router.push('/(onboarding)/demo2' as any);
    }, 300);
  };

  const buttonScale = useSharedValue(1);
  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };
  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

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
        <Text style={styles.title}>This is you.</Text>
        <Text style={[styles.title, styles.titleDim]}>Drop your photo in.</Text>
      </Animated.View>

      {/* Interactive area */}
      <View
        style={styles.demoArea}
        onLayout={(e) => { areaLayout.current = e.nativeEvent.layout; }}
      >
        {/* Placeholder — centered */}
        <Animated.View
          style={[styles.placeholderWrapper, placeholderAnimStyle]}
          onLayout={(e) => {
            placeholderLayout.current = e.nativeEvent.layout;
            calculateSnapTarget();
          }}
        >
          <Animated.View style={[styles.placeholder, placeholderBorderStyle]}>
            <Svg width={60} height={60} viewBox="0 0 60 60">
              <Circle cx="30" cy="20" r="10" fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,31,46,0.08)'} />
              <Path
                d="M10 55 C10 40 20 32 30 32 C40 32 50 40 50 55"
                fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,31,46,0.08)'}
              />
            </Svg>
            <Text style={styles.placeholderLabel}>You</Text>
          </Animated.View>
        </Animated.View>

        {/* Draggable card — positioned bottom-right */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.cardWrapper, cardAnimStyle]}
            onLayout={(e) => {
              cardLayout.current = e.nativeEvent.layout;
              calculateSnapTarget();
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardFace}>
                <Svg width={50} height={55} viewBox="0 0 50 55">
                  <Circle cx="25" cy="18" r="14" fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.1)'} stroke={colors.accent} strokeWidth={1.5} />
                  <Circle cx="20" cy="16" r="2" fill={colors.accent} />
                  <Circle cx="30" cy="16" r="2" fill={colors.accent} />
                  <Path d="M20 22 Q25 27 30 22" stroke={colors.accent} strokeWidth={1.5} fill="none" strokeLinecap="round" />
                  <Path d="M10 50 C10 38 17 33 25 33 C33 33 40 38 40 50" fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,31,46,0.08)'} stroke={colors.accent} strokeWidth={1.5} />
                </Svg>
              </View>
              <Text style={styles.cardLabel}>Your photo</Text>
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Drag hint */}
        <Animated.View style={[styles.hintContainer, hintAnimStyle]}>
          <Feather name="move" size={14} color={colors.textTertiary} />
          <Text style={styles.hintText}>Drag & drop</Text>
        </Animated.View>
      </View>

      {/* Description */}
      <Animated.View style={[styles.descContainer, contentStyle]}>
        <Text style={styles.desc}>
          Upload a photo of yourself — any clear shot works.
        </Text>
      </Animated.View>

      {/* Bottom button — only appears after snap */}
      <Animated.View style={[styles.bottomSection, buttonAnimStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={scaleStyle}
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
    demoArea: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 260,
      marginVertical: 12,
    },
    placeholderWrapper: {
      position: 'absolute',
      // Slightly left of center
      left: SCREEN_WIDTH / 2 - PLACEHOLDER_SIZE / 2 - 30,
      top: (260 - PLACEHOLDER_SIZE) / 2 - 10,
    },
    placeholder: {
      width: PLACEHOLDER_SIZE,
      height: PLACEHOLDER_SIZE,
      borderRadius: borderRadius.xl,
      borderWidth: 2,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,31,46,0.03)',
    },
    placeholderLabel: {
      ...typography.labelSmall,
      color: colors.textTertiary,
      marginTop: 6,
    },
    cardWrapper: {
      position: 'absolute',
      // Bottom-right area
      right: SCREEN_WIDTH * 0.08,
      bottom: 20,
      zIndex: 10,
    },
    card: {
      width: CARD_W,
      height: CARD_H,
      borderRadius: borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    cardFace: {
      marginBottom: 4,
    },
    cardLabel: {
      ...typography.caption,
      fontSize: 10,
      color: colors.textTertiary,
    },
    hintContainer: {
      position: 'absolute',
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    hintText: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    descContainer: {
      paddingHorizontal: 50,
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

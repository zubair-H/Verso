import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);
const LOGO_SIZE_SMALL = 220;

const PLACEHOLDER_SIZE = 130;
const USER_SLOT_SIZE = 90;
const CARD_W = 90;
const CARD_H = 110;
const SNAP_THRESHOLD = 100;

export default function Demo2Screen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Refs for measureInWindow (absolute screen coords)
  const placeholderRef = useRef<View>(null);
  const cardRef = useRef<View>(null);

  // Entry
  const contentEntry = useSharedValue(0);
  const placeholderEntry = useSharedValue(0);
  const userSlotEntry = useSharedValue(0);
  const cardEntry = useSharedValue(0);
  const hintEntry = useSharedValue(0);
  const buttonEntry = useSharedValue(0);

  // Celeb card drag
  const cardTranslateX = useSharedValue(0);
  const cardTranslateY = useSharedValue(0);
  const cardStartX = useSharedValue(0);
  const cardStartY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const isSnapped = useSharedValue(false);

  // Snap target (calculated from layout)
  const snapTargetX = useSharedValue(0);
  const snapTargetY = useSharedValue(0);

  // Snap
  const snapProgress = useSharedValue(0);

  // Exit
  const exitProgress = useSharedValue(0);
  const isExiting = useSharedValue(false);

  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    contentEntry.value = withDelay(200, withTiming(1, { duration: 600, easing: EASE }));
    userSlotEntry.value = withDelay(300, withTiming(1, { duration: 500, easing: EASE }));
    placeholderEntry.value = withDelay(500, withTiming(1, { duration: 500, easing: EASE }));
    cardEntry.value = withDelay(800, withTiming(1, { duration: 500, easing: EASE }));
    hintEntry.value = withDelay(1100, withTiming(1, { duration: 500, easing: EASE }));
    buttonEntry.value = withDelay(1300, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
  }, []);

  const triggerSuccessHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const calculateSnapTarget = () => {
    // Use measureInWindow to get absolute screen coords, avoiding parent-relative issues
    const phView = placeholderRef.current;
    const cardView = cardRef.current;
    if (!phView || !cardView) return;

    phView.measureInWindow((phX, phY, phW, phH) => {
      cardView.measureInWindow((cX, cY, cW, cH) => {
        if (phW === 0 || cW === 0) return;
        const phCenterX = phX + phW / 2;
        const phCenterY = phY + phH / 2;
        const cardCenterX = cX + cW / 2;
        const cardCenterY = cY + cH / 2;
        snapTargetX.value = phCenterX - cardCenterX;
        snapTargetY.value = phCenterY - cardCenterY;
      });
    });
  };

  // Recalculate after layout settles
  useEffect(() => {
    const timer = setTimeout(calculateSnapTarget, 100);
    return () => clearTimeout(timer);
  }, []);

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

      const dx = cardTranslateX.value - snapTargetX.value;
      const dy = cardTranslateY.value - snapTargetY.value;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < SNAP_THRESHOLD) {
        isSnapped.value = true;
        cardTranslateX.value = withTiming(snapTargetX.value, { duration: 250, easing: SMOOTH_EASE });
        cardTranslateY.value = withTiming(snapTargetY.value, { duration: 250, easing: SMOOTH_EASE });
        snapProgress.value = withTiming(1, { duration: 350, easing: SMOOTH_EASE });
        runOnJS(triggerSuccessHaptic)();
      } else {
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

  const userSlotStyle = useAnimatedStyle(() => {
    const scale = interpolate(userSlotEntry.value, [0, 1], [0.85, 1]);
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    return {
      opacity: userSlotEntry.value * exitOp,
      transform: [{ scale }],
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
    const borderOpacity = interpolate(snapProgress.value, [0, 1], [0.3, 1]);
    const snapped = snapProgress.value > 0.5;
    return {
      borderColor: snapped
        ? colors.accentTertiary
        : isDark
          ? `rgba(255,255,255,${borderOpacity})`
          : `rgba(26,31,46,${borderOpacity})`,
      borderStyle: snapped ? 'solid' as const : 'dashed' as const,
    };
  });

  const checkBadgeSnapStyle = useAnimatedStyle(() => {
    const scale = interpolate(snapProgress.value, [0.5, 1], [0, 1], 'clamp');
    const opacity = interpolate(snapProgress.value, [0.5, 1], [0, 1], 'clamp');
    return {
      opacity,
      transform: [{ scale }],
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

  // Button: hidden until snapped
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

  const plusStyle = useAnimatedStyle(() => {
    const exitOp = interpolate(exitProgress.value, [0, 1], [1, 0]);
    return {
      opacity: contentEntry.value * exitOp,
    };
  });

  const handleContinue = () => {
    if (isExiting.value || !isSnapped.value) return;
    isExiting.value = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    exitProgress.value = withTiming(1, { duration: 400, easing: SMOOTH_EASE });
    setTimeout(() => {
      router.push('/(onboarding)/demo3' as any);
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
        <Text style={styles.title}>Now the inspo.</Text>
        <Text style={[styles.title, styles.titleDim]}>Pick any celebrity.</Text>
      </Animated.View>

      {/* Interactive area */}
      <View style={styles.demoArea}>
        {/* Row: User slot + plus + celeb placeholder */}
        <View style={styles.slotsRow}>
          {/* User photo (completed) */}
          <Animated.View style={[styles.userSlotOuter, userSlotStyle]}>
            <View style={styles.userSlotInner}>
              <Svg width={40} height={45} viewBox="0 0 50 55">
                <Circle cx="25" cy="18" r="14" fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.1)'} stroke={colors.accent} strokeWidth={1.5} />
                <Circle cx="20" cy="16" r="2" fill={colors.accent} />
                <Circle cx="30" cy="16" r="2" fill={colors.accent} />
                <Path d="M20 22 Q25 27 30 22" stroke={colors.accent} strokeWidth={1.5} fill="none" strokeLinecap="round" />
                <Path d="M10 50 C10 38 17 33 25 33 C33 33 40 38 40 50" fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,31,46,0.08)'} stroke={colors.accent} strokeWidth={1.5} />
              </Svg>
              <Text style={styles.slotLabel}>You</Text>
              <View style={styles.checkBadge}>
                <Feather name="check" size={10} color={colors.textOnAccent} />
              </View>
            </View>
          </Animated.View>

          {/* Plus */}
          <Animated.View style={[styles.plusContainer, plusStyle]}>
            <Feather name="plus" size={22} color={colors.textTertiary} />
          </Animated.View>

          {/* Celeb placeholder */}
          <Animated.View
            style={[styles.celebPlaceholderOuter, placeholderAnimStyle]}
          >
            <Animated.View
              ref={placeholderRef as any}
              style={[styles.placeholder, placeholderBorderStyle]}
              onLayout={() => calculateSnapTarget()}
            >
              <Svg width={50} height={50} viewBox="0 0 60 60">
                <Circle cx="30" cy="18" r="10" fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,31,46,0.08)'} />
                <Path
                  d="M10 55 C10 40 20 32 30 32 C40 32 50 40 50 55"
                  fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,31,46,0.08)'}
                />
                <Polygon
                  points="30,2 32,8 38,8 33,12 35,18 30,14 25,18 27,12 22,8 28,8"
                  fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.12)'}
                />
              </Svg>
              <Text style={styles.placeholderLabel}>Celebrity</Text>
              {/* Check badge — appears on snap */}
              <Animated.View style={[styles.snapCheckBadge, checkBadgeSnapStyle]}>
                <Feather name="check" size={10} color={isDark ? colors.bgPrimary : '#fff'} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Draggable celeb card — bottom-left */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            ref={cardRef as any}
            style={[styles.celebCard, cardAnimStyle]}
            onLayout={() => calculateSnapTarget()}
          >
            <View style={styles.card}>
              <View style={styles.cardFace}>
                <Svg width={50} height={55} viewBox="0 0 50 55">
                  <Circle cx="25" cy="18" r="14" fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,31,46,0.1)'} stroke={colors.accentTertiary} strokeWidth={1.5} />
                  <Rect x="14" y="13" width="10" height="7" rx="2" fill={colors.accentTertiary} opacity={0.7} />
                  <Rect x="26" y="13" width="10" height="7" rx="2" fill={colors.accentTertiary} opacity={0.7} />
                  <Path d="M24 16.5 L26 16.5" stroke={colors.accentTertiary} strokeWidth={1} />
                  <Path d="M20 24 Q25 28 30 24" stroke={colors.accentTertiary} strokeWidth={1.5} fill="none" strokeLinecap="round" />
                  <Path d="M10 50 C10 38 17 33 25 33 C33 33 40 38 40 50" fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,31,46,0.08)'} stroke={colors.accentTertiary} strokeWidth={1.5} />
                </Svg>
              </View>
              <Text style={[styles.cardLabel, { color: colors.accentTertiary }]}>Celebrity</Text>
              <View style={[styles.starBadge, { backgroundColor: colors.accentTertiary }]}>
                <Feather name="star" size={8} color={isDark ? colors.bgPrimary : '#fff'} />
              </View>
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Drag hint */}
        <Animated.View style={[styles.hintContainer, hintAnimStyle]}>
          <Feather name="move" size={14} color={colors.textTertiary} />
          <Text style={styles.hintText}>Drag the celeb in</Text>
        </Animated.View>
      </View>

      {/* Description */}
      <Animated.View style={[styles.descContainer, contentStyle]}>
        <Text style={styles.desc}>
          Choose any celebrity whose look you want to borrow — hair, makeup, style, anything.
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
    slotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -20,
    },
    userSlotOuter: {},
    userSlotInner: {
      width: USER_SLOT_SIZE,
      height: USER_SLOT_SIZE,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,31,46,0.03)',
    },
    slotLabel: {
      ...typography.caption,
      fontSize: 9,
      color: colors.textTertiary,
      marginTop: 1,
    },
    checkBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plusContainer: {
      marginHorizontal: 16,
    },
    celebPlaceholderOuter: {},
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
      marginTop: 4,
    },
    snapCheckBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.accentTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    celebCard: {
      position: 'absolute',
      left: 24,
      bottom: 15,
      zIndex: 10,
    },
    card: {
      width: CARD_W,
      height: CARD_H,
      borderRadius: borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      borderWidth: 1.5,
      borderColor: colors.accentTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accentTertiary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 5,
    },
    cardFace: {
      marginBottom: 4,
    },
    cardLabel: {
      ...typography.caption,
      fontSize: 10,
    },
    starBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
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

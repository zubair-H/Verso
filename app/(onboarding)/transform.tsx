import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, Image, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { MasonryBackground } from '@/components/ui';
import { typography } from '@/constants/typography';
import { layout, borderRadius, springs } from '@/constants/spacing';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Logo asset
const logoImage = require('@/assets/ios-tinted.png');
const LOGO_SIZE = 220;

// Transformation attributes that cycle through
const TRANSFORMATIONS = [
  { from: 'Your hair', to: 'Celebrity style', icon: 'cut-outline' },
  { from: 'Your outfit', to: 'Designer look', icon: 'shirt-outline' },
  { from: 'Your color', to: 'New palette', icon: 'color-palette-outline' },
];

export default function TransformScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Content animations
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  // Transformation card animations
  const card1Progress = useSharedValue(0);
  const card2Progress = useSharedValue(0);
  const card3Progress = useSharedValue(0);

  // Arrow pulse animation
  const arrowPulse = useSharedValue(1);

  // Bottom panel
  const bottomPanelTranslateY = useSharedValue(300);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);

    // Content fades in
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: EASE }));
    contentTranslateY.value = withDelay(100, withTiming(0, { duration: 600, easing: EASE }));

    // Cards animate in with stagger
    card1Progress.value = withDelay(300, withSpring(1, springs.smooth));
    card2Progress.value = withDelay(450, withSpring(1, springs.smooth));
    card3Progress.value = withDelay(600, withSpring(1, springs.smooth));

    // Arrow pulse animation
    arrowPulse.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Bottom panel slides up
    bottomPanelTranslateY.value = withDelay(700, withTiming(0, { duration: 500, easing: EASE }));

    // Button appears
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 400, easing: EASE }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Progress.value,
    transform: [
      { translateY: interpolate(card1Progress.value, [0, 1], [30, 0]) },
      { scale: interpolate(card1Progress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Progress.value,
    transform: [
      { translateY: interpolate(card2Progress.value, [0, 1], [30, 0]) },
      { scale: interpolate(card2Progress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Progress.value,
    transform: [
      { translateY: interpolate(card3Progress.value, [0, 1], [30, 0]) },
      { scale: interpolate(card3Progress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const cardStyles = [card1Style, card2Style, card3Style];

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: arrowPulse.value }],
  }));

  const bottomPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomPanelTranslateY.value }],
  }));

  const buttonContainerStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/options');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <View style={styles.container}>
      {/* Masonry Grid - visible, no blur */}
      <MasonryBackground
        topPadding={100 + insets.top}
        opacity={0.15}
      />

      {/* Logo at top */}
      <View style={styles.logoContainer}>
        <Image
          source={logoImage}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </View>

      {/* Content area */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Watch the magic</Text>
          <Text style={styles.subheadline}>Your features, reimagined with any style</Text>
        </View>

        {/* Transformation cards */}
        <View style={styles.cardsContainer}>
          {TRANSFORMATIONS.map((transform, index) => (
            <Animated.View key={transform.from} style={[styles.transformCard, cardStyles[index]]}>
              <View style={styles.transformRow}>
                {/* From */}
                <View style={styles.attributeBox}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.bgTertiary }]}>
                    <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.attributeLabel}>{transform.from}</Text>
                </View>

                {/* Arrow */}
                <Animated.View style={[styles.arrowContainer, arrowStyle]}>
                  <Ionicons name="arrow-forward" size={20} color={colors.accent} />
                </Animated.View>

                {/* To */}
                <View style={styles.attributeBox}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name={transform.icon as any} size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.attributeLabel, { color: colors.accent }]}>{transform.to}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Bottom panel */}
      <Animated.View style={[styles.bottomPanel, bottomPanelStyle]}>
        <View style={styles.textContent}>
          <Text style={styles.ctaHeadline}>Endless possibilities.</Text>
          <Text style={styles.ctaSubline}>Your style, reimagined.</Text>
        </View>

        <Animated.View style={buttonContainerStyle}>
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>Explore Styles</Text>
              <Ionicons name="sparkles" size={18} color={colors.bgPrimary} />
            </View>
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    logoContainer: {
      position: 'absolute',
      top: insets.top - 60,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 100,
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: insets.top + LOGO_SIZE - 40,
    },
    headlineContainer: {
      marginBottom: 32,
    },
    headline: {
      ...typography.headlineLarge,
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subheadline: {
      ...typography.bodyMedium,
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
    },
    cardsContainer: {
      gap: 16,
    },
    transformCard: {
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.xl,
      padding: 20,
    },
    transformRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    attributeBox: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attributeLabel: {
      ...typography.labelSmall,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    arrowContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 8,
    },
    bottomPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bgPrimary,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: layout.screenPadding,
      paddingTop: 32,
      paddingBottom: Math.max(insets.bottom, 16) + 16,
      zIndex: 50,
    },
    textContent: {
      alignItems: 'center',
      marginBottom: 20,
    },
    ctaHeadline: {
      ...typography.headlineLarge,
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    ctaSubline: {
      ...typography.bodyMedium,
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    button: {
      width: '100%',
      height: 56,
      backgroundColor: colors.textPrimary,
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonText: {
      ...typography.labelLarge,
      color: colors.bgPrimary,
    },
  });

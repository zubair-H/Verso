import React, { useEffect, useMemo } from 'react';
import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius, springs } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Logo size for spacing reference (logo is in layout)
const LOGO_SIZE_SMALL = 220;

// Transformation categories with their options
const TRANSFORMATION_CATEGORIES = [
  {
    title: 'Hair',
    options: [
      { label: 'Hairstyle', icon: 'cut-outline' },
      { label: 'Hair Color', icon: 'color-palette-outline' },
      { label: 'Hair Length', icon: 'resize-outline' },
    ],
  },
  {
    title: 'Face',
    options: [
      { label: 'Facial Hair', icon: 'man-outline' },
      { label: 'Eyebrows', icon: 'eye-outline' },
      { label: 'Glasses', icon: 'glasses-outline' },
    ],
  },
  {
    title: 'Style',
    options: [
      { label: 'Outfit', icon: 'shirt-outline' },
      { label: 'Accessories', icon: 'watch-outline' },
      { label: 'Jewelry', icon: 'diamond-outline' },
    ],
  },
];

export default function OptionsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  // Category animations
  const category1Progress = useSharedValue(0);
  const category2Progress = useSharedValue(0);
  const category3Progress = useSharedValue(0);

  // Bottom panel
  const bottomPanelTranslateY = useSharedValue(300);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);

    // Content area appears
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: EASE }));
    contentTranslateY.value = withDelay(100, withTiming(0, { duration: 600, easing: EASE }));

    // Categories animate in sequence
    category1Progress.value = withDelay(400, withSpring(1, springs.smooth));
    category2Progress.value = withDelay(550, withSpring(1, springs.smooth));
    category3Progress.value = withDelay(700, withSpring(1, springs.smooth));

    // Bottom panel slides up
    bottomPanelTranslateY.value = withDelay(900, withTiming(0, { duration: 500, easing: EASE }));

    // Button appears
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 400, easing: EASE }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const category1Style = useAnimatedStyle(() => ({
    opacity: category1Progress.value,
    transform: [
      { translateY: interpolate(category1Progress.value, [0, 1], [20, 0]) },
    ],
  }));

  const category2Style = useAnimatedStyle(() => ({
    opacity: category2Progress.value,
    transform: [
      { translateY: interpolate(category2Progress.value, [0, 1], [20, 0]) },
    ],
  }));

  const category3Style = useAnimatedStyle(() => ({
    opacity: category3Progress.value,
    transform: [
      { translateY: interpolate(category3Progress.value, [0, 1], [20, 0]) },
    ],
  }));

  const categoryStyles = [category1Style, category2Style, category3Style];

  const bottomPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomPanelTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/story');
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
      {/* Content area */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Explore your style</Text>
          <Text style={styles.subheadline}>Pick any look and see yourself transformed</Text>
        </View>

        {/* Categories */}
        <ScrollView
          style={styles.categoriesScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {TRANSFORMATION_CATEGORIES.map((category, categoryIndex) => (
            <Animated.View
              key={category.title}
              style={[styles.categorySection, categoryStyles[categoryIndex]]}
            >
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.optionsRow}>
                {category.options.map((option) => (
                  <View key={option.label} style={styles.optionCard}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color={colors.textPrimary}
                      />
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Bottom panel - same style as previous pages */}
      <Animated.View style={[styles.bottomPanel, bottomPanelStyle]}>
        <View style={styles.textContent}>
          <Text style={styles.ctaHeadline}>Endless possibilities.</Text>
          <Text style={styles.ctaSubline}>Your style, reimagined.</Text>
        </View>

        <Animated.View style={buttonStyle}>
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>Continue</Text>
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
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: insets.top + LOGO_SIZE_SMALL - 40,
    },
    headlineContainer: {
      marginBottom: 24,
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
    categoriesScroll: {
      flex: 1,
    },
    categoriesContent: {
      paddingBottom: 20,
    },
    categorySection: {
      marginBottom: 28,
    },
    categoryTitle: {
      ...typography.labelLarge,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    optionCard: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.lg,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 8,
    },
    optionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.bgTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionLabel: {
      ...typography.labelSmall,
      fontSize: 12,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    bottomPanel: {
      backgroundColor: colors.bgPrimary,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: layout.screenPadding,
      paddingTop: 32,
      paddingBottom: Math.max(insets.bottom, 16) + 16,
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      ...typography.labelLarge,
      color: colors.bgPrimary,
    },
  });

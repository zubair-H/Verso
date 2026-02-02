import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, springs, borderRadius } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Feature {
  icon: string;
  title: string;
  description: string;
  unlockDelay: number;
}

const features: Feature[] = [
  {
    icon: 'sparkles',
    title: 'Try Any Look',
    description: 'Celebrity styles, haircuts, outfits, makeup — all on you',
    unlockDelay: 400,
  },
  {
    icon: 'grid-outline',
    title: 'Mix & Match',
    description: 'Combine elements. Hair from one, glasses from another',
    unlockDelay: 700,
  },
  {
    icon: 'heart-outline',
    title: 'Save Favorites',
    description: 'Build your style inspiration board',
    unlockDelay: 1000,
  },
];

interface ColorsType {
  accent: string;
  success: string;
  textOnAccent: string;
  bgPrimary: string;
  textPrimary: string;
  bgCard: string;
  border: string;
  accentMuted: string;
  textSecondary: string;
  successMuted: string;
}

function FeatureCard({ feature, index, colors }: { feature: Feature; index: number; colors: ColorsType }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);
  const unlocked = useSharedValue(0);

  useEffect(() => {
    // Card enters
    opacity.value = withDelay(feature.unlockDelay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(feature.unlockDelay, withSpring(0, springs.smooth));
    scale.value = withDelay(feature.unlockDelay, withSequence(
      withSpring(1.02, springs.unlock),
      withSpring(1, springs.snappy)
    ));

    // Unlock animation
    unlocked.value = withDelay(feature.unlockDelay + 200, withSpring(1, springs.bouncy));

    // Haptic when unlocked
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, feature.unlockDelay);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: unlocked.value,
    transform: [{ scale: unlocked.value }],
  }));

  const cardStyles = useMemo(() => ({
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.accentMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    featureTitle: {
      ...typography.labelLarge,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    featureDescription: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  }), [colors]);

  return (
    <Animated.View style={[cardStyles.card, cardStyle]}>
      <View style={styles.cardContent}>
        <View style={cardStyles.iconContainer}>
          <Ionicons name={feature.icon as any} size={24} color={colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={cardStyles.featureTitle}>{feature.title}</Text>
          <Text style={cardStyles.featureDescription}>{feature.description}</Text>
        </View>
        <Animated.View style={[styles.checkContainer, checkStyle]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export default function FeaturesScreen() {
  const { colors } = useTheme();
  const headerOpacity = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });

    // Badge appears after all features unlock
    badgeOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
    badgeScale.value = withDelay(1400, withSpring(1, springs.celebration));

    buttonOpacity.value = withDelay(1600, withTiming(1, { duration: 400 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/permissions');
  };

  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, springs.snappy);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, springs.snappy);
  };

  const buttonPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    title: {
      ...typography.displayMedium,
      color: colors.textPrimary,
    },
    unlockedBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: colors.successMuted,
      borderRadius: borderRadius.full,
      alignSelf: 'center' as const,
    },
    unlockedText: {
      ...typography.labelMedium,
      color: colors.success,
    },
    button: {
      width: '100%' as const,
      height: 60,
      backgroundColor: colors.accent,
      borderRadius: borderRadius.lg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 10,
    },
    buttonText: {
      ...typography.labelLarge,
      color: colors.textOnAccent,
      fontSize: 18,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={dynamicStyles.title}>Your Transformation{'\n'}Toolkit</Text>
      </Animated.View>

      {/* Feature cards */}
      <View style={styles.cardsContainer}>
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} colors={colors} />
        ))}

        {/* All unlocked badge */}
        <Animated.View style={[dynamicStyles.unlockedBadge, badgeStyle]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={dynamicStyles.unlockedText}>All features unlocked!</Text>
        </Animated.View>
      </View>

      {/* Bottom */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={buttonPressStyle}
        >
          <View style={dynamicStyles.button}>
            <Text style={dynamicStyles.buttonText}>Almost There</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textOnAccent} />
          </View>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 80,
    paddingHorizontal: layout.screenPadding,
    marginBottom: 40,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    gap: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  textContainer: {
    flex: 1,
  },
  checkContainer: {
    marginLeft: 8,
  },
  bottomSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 50,
  },
});

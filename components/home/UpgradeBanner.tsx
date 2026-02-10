import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, springs } from '@/constants/spacing';

interface UpgradeBannerProps {
  onChoosePlan: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UpgradeBanner({ onChoosePlan }: UpgradeBannerProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChoosePlan();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        },
        gradient: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 24,
        },
        content: {
          flex: 1,
        },
        iconRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        },
        heading: {
          ...typography.headlineMedium,
          color: colors.textPrimary,
        },
        subtitle: {
          ...typography.bodyMedium,
          color: colors.textSecondary,
          marginTop: 4,
        },
        ctaButton: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: borderRadius.full,
          alignSelf: 'flex-end',
        },
        ctaText: {
          ...typography.labelMedium,
          color: colors.textOnAccent,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.upgradeBannerStart, colors.upgradeBannerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconRow}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
            <Ionicons name="star" size={14} color={colors.streakGold} />
          </View>
          <Text style={styles.heading}>Unlock All Looks</Text>
          <Text style={styles.subtitle}>Get unlimited transformations</Text>
        </View>

        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.ctaButton, animatedStyle]}
        >
          <Text style={styles.ctaText}>Choose Plan</Text>
        </AnimatedPressable>
      </LinearGradient>
    </View>
  );
}

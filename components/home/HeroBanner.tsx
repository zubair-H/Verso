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

interface HeroBannerProps {
  onStartNow: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeroBanner({ onStartNow }: HeroBannerProps) {
  const { colors, isDark } = useTheme();
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
    onStartNow();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
        },
        gradient: {
          flexDirection: 'row',
          padding: 24,
          minHeight: 200,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
          paddingRight: 12,
        },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: borderRadius.full,
          gap: 4,
          marginBottom: 12,
        },
        badgeText: {
          fontSize: 11,
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)',
        },
        title: {
          ...typography.headlineLarge,
          color: '#FFFFFF',
        },
        subtitle: {
          ...typography.bodySmall,
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: 6,
        },
        ctaButton: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: '#FFFFFF',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: borderRadius.full,
          gap: 6,
          marginTop: 16,
        },
        ctaText: {
          ...typography.labelMedium,
          color: isDark ? colors.heroBannerStart : '#1A1035',
        },
        visual: {
          width: 120,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardBack: {
          width: 70,
          height: 90,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          position: 'absolute',
          transform: [{ rotate: '-8deg' }, { translateX: -10 }],
        },
        cardFront: {
          width: 70,
          height: 90,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          position: 'absolute',
          transform: [{ rotate: '8deg' }, { translateX: 10 }],
        },
        splitLine: {
          width: 1.5,
          height: 70,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 1,
        },
        sparkleOverlay: {
          position: 'absolute',
          top: 20,
          right: 10,
        },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.heroBannerStart, colors.heroBannerMid, colors.heroBannerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={10} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.badgeText}>Featured</Text>
          </View>
          <Text style={styles.title}>Celebrity{'\n'}Look Transfer</Text>
          <Text style={styles.subtitle}>
            Extract any style from your favorite celebrity onto your photo
          </Text>
          <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.ctaButton, animatedStyle]}
          >
            <Text style={styles.ctaText}>Start Now</Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={isDark ? colors.heroBannerStart : '#1A1035'}
            />
          </AnimatedPressable>
        </View>

        <View style={styles.visual}>
          <View style={styles.cardBack} />
          <View style={styles.cardFront} />
          <View style={styles.splitLine} />
          <Ionicons
            name="sparkles"
            size={16}
            color="rgba(255, 255, 255, 0.4)"
            style={styles.sparkleOverlay}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

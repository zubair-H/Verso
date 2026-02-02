import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, springs, borderRadius } from '@/constants/spacing';
import { CelebrationBurst } from '@/components/ui/CelebrationBurst';

const { width, height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DEMO_BEFORE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop';
const DEMO_AFTER = 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop';

const CARD_WIDTH = (width - layout.screenPadding * 2 - 40) / 2;

export default function PotentialScreen() {
  const { colors } = useTheme();
  const [showCelebration, setShowCelebration] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);

  // Header
  const headerOpacity = useSharedValue(0);

  // Before image
  const beforeOpacity = useSharedValue(0);
  const beforeScale = useSharedValue(0.9);

  // Divider line
  const dividerWidth = useSharedValue(0);
  const dividerGlow = useSharedValue(0);

  // After image
  const afterOpacity = useSharedValue(0);
  const afterScale = useSharedValue(0.8);

  // Progress ring
  const progressValue = useSharedValue(0);

  // Button
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    // Header
    headerOpacity.value = withTiming(1, { duration: 600 });

    // Before image appears
    beforeOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    beforeScale.value = withDelay(300, withSpring(1, springs.smooth));

    // Divider line animates across
    dividerWidth.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    dividerGlow.value = withDelay(800, withTiming(1, { duration: 300 }));

    // After image reveals with dramatic effect
    afterOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    afterScale.value = withDelay(1400, withSpring(1, springs.dramatic));

    // Progress fills up
    progressValue.value = withDelay(1400, withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    }));

    // Trigger celebration when after image appears
    setTimeout(() => {
      setShowCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRevealComplete(true);
    }, 2000);

    // Button appears last
    buttonOpacity.value = withDelay(2200, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(2200, withSpring(0, springs.smooth));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const beforeStyle = useAnimatedStyle(() => ({
    opacity: beforeOpacity.value,
    transform: [{ scale: beforeScale.value }],
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: dividerWidth.value }],
    opacity: dividerGlow.value,
  }));

  const afterStyle = useAnimatedStyle(() => ({
    opacity: afterOpacity.value,
    transform: [{ scale: afterScale.value }],
  }));

  const buttonContainerStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/story');
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
      marginBottom: 12,
    },
    subtitle: {
      ...typography.bodyLarge,
      color: colors.textSecondary,
      lineHeight: 26,
    },
    imageCard: {
      width: CARD_WIDTH,
      height: CARD_WIDTH * 1.3,
      borderRadius: borderRadius.xl,
      overflow: 'hidden' as const,
      backgroundColor: colors.bgCard,
    },
    imageLabelBefore: {
      position: 'absolute' as const,
      bottom: 12,
      left: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.overlay,
      borderRadius: borderRadius.sm,
    },
    imageLabelAfter: {
      position: 'absolute' as const,
      bottom: 12,
      left: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.accent,
      borderRadius: borderRadius.sm,
    },
    imageLabelText: {
      ...typography.labelSmall,
      color: colors.textPrimary,
    },
    dividerLine: {
      width: 2,
      height: 80,
      backgroundColor: colors.accent,
      borderRadius: 1,
    },
    dividerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginVertical: 8,
    },
    magicLabel: {
      ...typography.bodyLarge,
      color: colors.accent,
      fontWeight: '600' as const,
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
      <CelebrationBurst
        trigger={showCelebration}
        particleCount={24}
        duration={1200}
        originY={height * 0.45}
      />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={dynamicStyles.title}>See Your Potential</Text>
        <Text style={dynamicStyles.subtitle}>
          Ever wondered how you'd look with that celebrity haircut?
        </Text>
      </Animated.View>

      {/* Transformation showcase */}
      <View style={styles.transformationContainer}>
        <View style={styles.imagesRow}>
          {/* Before */}
          <Animated.View style={[dynamicStyles.imageCard, beforeStyle]}>
            <Image source={{ uri: DEMO_BEFORE }} style={styles.image} />
            <View style={dynamicStyles.imageLabelBefore}>
              <Text style={dynamicStyles.imageLabelText}>Before</Text>
            </View>
          </Animated.View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <Animated.View style={[dynamicStyles.dividerLine, dividerStyle]} />
            <View style={dynamicStyles.dividerIcon}>
              <Ionicons name="arrow-forward" size={20} color={colors.accent} />
            </View>
          </View>

          {/* After */}
          <Animated.View style={[dynamicStyles.imageCard, afterStyle]}>
            <Image source={{ uri: DEMO_AFTER }} style={styles.image} />
            <View style={dynamicStyles.imageLabelAfter}>
              <Text style={dynamicStyles.imageLabelText}>After</Text>
            </View>
            {revealComplete && (
              <View style={styles.sparkle}>
                <Ionicons name="sparkles" size={24} color={colors.streakGold} />
              </View>
            )}
          </Animated.View>
        </View>

        {/* Magic text */}
        {revealComplete && (
          <Animated.View
            entering={undefined}
            style={styles.magicText}
          >
            <Text style={dynamicStyles.magicLabel}>Now you can know — in seconds</Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom */}
      <Animated.View style={[styles.bottomSection, buttonContainerStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={buttonPressStyle}
        >
          <View style={dynamicStyles.button}>
            <Text style={dynamicStyles.buttonText}>Show Me More</Text>
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
    marginBottom: 32,
  },
  transformationContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sparkle: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  dividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  magicText: {
    marginTop: 32,
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 50,
  },
});

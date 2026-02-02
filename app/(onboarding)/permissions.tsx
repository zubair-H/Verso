import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, springs, borderRadius } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';
import { CelebrationBurst } from '@/components/ui/CelebrationBurst';

const { height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Logo size from layout
const LOGO_SIZE_SMALL = 220;

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  // Main button
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0.4);

  // Success state
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  // Skip link
  const skipOpacity = useSharedValue(0);

  // Trust badge
  const trustOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500 });
    contentTranslateY.value = withSpring(0, springs.smooth);

    // Pulsing glow on button
    buttonGlow.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1,
      true
    ));

    skipOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    trustOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    shadowOpacity: buttonGlow.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
  }));

  const trustStyle = useAnimatedStyle(() => ({
    opacity: trustOpacity.value,
  }));

  const handleAllowAccess = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status === 'granted') {
      setPermissionGranted(true);

      // Celebration animation
      checkOpacity.value = withTiming(1, { duration: 200 });
      checkScale.value = withSpring(1, springs.celebration);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCelebration(true);

      // Wait for celebration, then navigate
      setTimeout(async () => {
        await completeOnboarding();
      }, 1500);
    } else {
      // Still complete onboarding even without permission
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@lookr/onboarding_complete', 'true');
    trackEvent('onboarding_completed');
    router.replace('/(tabs)');
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, springs.snappy);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, springs.snappy);
  };

  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: '#F0F6FC',
    },
    logoSpacer: {
      height: LOGO_SIZE_SMALL,
      marginTop: insets.top - 40,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.accentMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 32,
    },
    title: {
      ...typography.displayMedium,
      color: colors.textPrimary,
      textAlign: 'center' as const,
      marginBottom: 16,
    },
    description: {
      ...typography.bodyLarge,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 26,
      marginBottom: 32,
      maxWidth: 300,
    },
    trustBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: colors.accentTertiaryMuted,
      borderRadius: borderRadius.full,
    },
    trustText: {
      ...typography.bodySmall,
      color: colors.accentTertiary,
      fontWeight: '500' as const,
    },
    button: {
      width: '100%' as const,
      height: 60,
      backgroundColor: colors.accent,
      borderRadius: borderRadius.lg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 10,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 24,
      elevation: 10,
    },
    buttonText: {
      ...typography.labelLarge,
      color: colors.textOnAccent,
      fontSize: 18,
    },
    skipText: {
      ...typography.bodyMedium,
      color: colors.textTertiary,
    },
  }), [colors, insets]);

  return (
    <View style={dynamicStyles.container}>
      <CelebrationBurst
        trigger={showCelebration}
        particleCount={30}
        duration={1200}
        originY={height * 0.4}
      />

      {/* Logo spacer - actual logo is in layout */}
      <View style={dynamicStyles.logoSpacer} />

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        <View style={dynamicStyles.iconCircle}>
          {permissionGranted ? (
            <Animated.View style={checkStyle}>
              <Ionicons name="checkmark" size={48} color={colors.success} />
            </Animated.View>
          ) : (
            <Ionicons name="camera" size={48} color={colors.accent} />
          )}
        </View>

        <Text style={dynamicStyles.title}>
          {permissionGranted ? "You're all set!" : "Let's Make Magic"}
        </Text>
        <Text style={dynamicStyles.description}>
          {permissionGranted
            ? "Get ready to discover your next look"
            : "To visualize looks on yourself, we need access to your photos."}
        </Text>

        {/* Trust badge */}
        <Animated.View style={[dynamicStyles.trustBadge, trustStyle]}>
          <Ionicons name="shield-checkmark" size={18} color={colors.accentTertiary} />
          <Text style={dynamicStyles.trustText}>
            Your photos never leave your device
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
        {!permissionGranted && (
          <>
            <AnimatedPressable
              onPress={handleAllowAccess}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View style={[dynamicStyles.button, buttonAnimatedStyle]}>
                <Ionicons name="camera-outline" size={22} color={colors.textOnAccent} />
                <Text style={dynamicStyles.buttonText}>Enable Photo Access</Text>
              </Animated.View>
            </AnimatedPressable>

            <Animated.View style={skipStyle}>
              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={dynamicStyles.skipText}>I'll do this later</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 20,
  },
  bottomSection: {
    paddingHorizontal: layout.screenPadding,
    gap: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});

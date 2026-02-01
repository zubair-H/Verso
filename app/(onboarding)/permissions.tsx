import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { GradientButton, GlassCard } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PermissionsScreen() {
  // Orchestrated entrance animations
  const iconProgress = useSharedValue(0);
  const contentProgress = useSharedValue(0);
  const cardProgress = useSharedValue(0);
  const bottomProgress = useSharedValue(0);
  const progressWidth = useSharedValue(0.99);

  useEffect(() => {
    // Animate progress bar to 100%
    progressWidth.value = withSpring(1, {
      damping: 20,
      stiffness: 150,
    });

    // Staggered entrance sequence
    iconProgress.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    contentProgress.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    cardProgress.value = withDelay(
      400,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    bottomProgress.value = withDelay(
      600,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(iconProgress.value, [0, 1], [0.9, 1]);
    return {
      opacity: iconProgress.value,
      transform: [{ scale }],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const translateY = interpolate(contentProgress.value, [0, 1], [30, 0]);
    return {
      opacity: contentProgress.value,
      transform: [{ translateY }],
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const translateY = interpolate(cardProgress.value, [0, 1], [40, 0]);
    return {
      opacity: cardProgress.value,
      transform: [{ translateY }],
    };
  });

  const bottomStyle = useAnimatedStyle(() => {
    const translateY = interpolate(bottomProgress.value, [0, 1], [60, 0]);
    return {
      opacity: bottomProgress.value,
      transform: [{ translateY }],
    };
  });

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const handleAllowAccess = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status === 'granted') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    await completeOnboarding();
  };

  const handleMaybeLater = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@lookr/onboarding_complete', 'true');
    trackEvent('onboarding_completed');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Ambient background */}
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.04)', 'transparent', 'rgba(0, 191, 165, 0.03)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Progress indicator - almost complete */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillContainer, progressStyle]}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <View style={styles.iconBackground}>
            <Ionicons name="images" size={48} color={colors.textPrimary} />
          </View>
        </Animated.View>

        {/* Title and description */}
        <Animated.View style={[styles.textContainer, contentStyle]}>
          <Text style={styles.title}>One last thing</Text>
          <Text style={styles.description}>
            We need access to your photos to work our magic.
          </Text>
        </Animated.View>

        {/* Privacy card */}
        <Animated.View style={[styles.cardContainer, cardStyle]}>
          <GlassCard style={styles.privacyCard} padding={20}>
            <View style={styles.privacyRow}>
              <View style={styles.privacyIconContainer}>
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={colors.accentSecondary}
                />
              </View>
              <View style={styles.privacyTextContainer}>
                <Text style={styles.privacyTitle}>Private by design</Text>
                <Text style={styles.privacyDescription}>
                  Your photos never leave your device.
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </View>

      {/* Bottom section */}
      <Animated.View style={[styles.bottomSection, bottomStyle]}>
        <GradientButton
          label="Allow Photo Access"
          onPress={handleAllowAccess}
          size="large"
          haptic="medium"
          style={styles.button}
        />

        <AnimatedPressable onPress={handleMaybeLater} style={styles.maybeLater}>
          <Text style={styles.maybeLaterText}>I'll do this later</Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: layout.screenPadding,
    right: layout.screenPadding,
    zIndex: 10,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillContainer: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  cardContainer: {
    width: '100%',
  },
  privacyCard: {
    width: '100%',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyTitle: {
    ...typography.labelLarge,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  privacyDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bottomSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 50,
  },
  button: {
    width: '100%',
  },
  maybeLater: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  maybeLaterText: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
  },
});

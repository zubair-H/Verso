import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedLogo, GradientButton } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  // Individual element states
  const logoProgress = useSharedValue(0);
  const taglineProgress = useSharedValue(0);
  const bottomProgress = useSharedValue(0);

  useEffect(() => {
    // Orchestrated entrance sequence
    logoProgress.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic)
    });

    taglineProgress.value = withDelay(
      400,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    bottomProgress.value = withDelay(
      700,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    const scale = interpolate(logoProgress.value, [0, 1], [0.95, 1]);
    return {
      opacity: logoProgress.value,
      transform: [{ scale }],
    };
  });

  const taglineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(taglineProgress.value, [0, 1], [20, 0]);
    return {
      opacity: taglineProgress.value,
      transform: [{ translateY }],
    };
  });

  const secondaryTaglineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(taglineProgress.value, [0, 1], [24, 0]);
    const opacity = interpolate(taglineProgress.value, [0.2, 1], [0, 1]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const bottomStyle = useAnimatedStyle(() => {
    const translateY = interpolate(bottomProgress.value, [0, 1], [40, 0]);
    return {
      opacity: bottomProgress.value,
      transform: [{ translateY }],
    };
  });

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/features');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      {/* Static gradient background */}
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.05)', 'transparent', 'rgba(0, 191, 165, 0.03)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={[styles.progressFill, { width: '33%' }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <AnimatedLogo size="large" animate />
        </Animated.View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Animated.Text style={[styles.tagline, taglineStyle]}>
            See any look on yourself
          </Animated.Text>
          <Animated.Text style={[styles.taglineSecondary, secondaryTaglineStyle]}>
            before you commit
          </Animated.Text>
        </View>
      </View>

      {/* Bottom section */}
      <Animated.View style={[styles.bottomSection, bottomStyle]}>
        <GradientButton
          label="Get Started"
          onPress={handleGetStarted}
          size="large"
          haptic="medium"
          style={styles.button}
        />

        <AnimatedPressable
          onPress={handleSignIn}
          style={styles.signInContainer}
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInLink}>Sign in</Text>
          </Text>
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
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  logoContainer: {
    marginBottom: 48,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  taglineSecondary: {
    ...typography.headlineLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  bottomSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 50,
  },
  button: {
    width: '100%',
  },
  signInContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
  },
  signInLink: {
    color: colors.accentPrimary,
    fontWeight: '500',
  },
});

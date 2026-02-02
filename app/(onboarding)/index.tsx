import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { AnimatedLogo } from '@/components/ui';
import { typography } from '@/constants/typography';
import { layout, springs, borderRadius } from '@/constants/spacing';

const { width, height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Floating orb component for ambient background
function FloatingOrb({
  size,
  color,
  initialX,
  initialY,
  delay = 0,
}: {
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  delay?: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 2000 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
          withTiming(15, { duration: 5000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Decorative accent line
function AccentLine({ delay = 0 }: { delay?: number }) {
  const { colors } = useTheme();
  const scaleX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 800 }));
    scaleX.value = withDelay(delay, withSpring(1, { damping: 20, stiffness: 80 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: scaleX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 48,
          height: 1.5,
          backgroundColor: colors.accentTertiary,
          borderRadius: 1,
          marginBottom: 24,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function WelcomeScreen() {
  const { colors } = useTheme();

  // Logo animations
  const logoScale = useSharedValue(0.92);
  const logoOpacity = useSharedValue(0);

  // Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(16);

  // Subtitle
  const subtitleOpacity = useSharedValue(0);

  // Button
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(24);

  // Footer
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo entrance - smooth and elegant
    logoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90 });

    // Tagline slides up
    taglineOpacity.value = withDelay(450, withTiming(1, { duration: 700 }));
    taglineTranslateY.value = withDelay(450, withSpring(0, { damping: 18, stiffness: 100 }));

    // Subtitle fades in
    subtitleOpacity.value = withDelay(650, withTiming(1, { duration: 600 }));

    // Button appears
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(900, withSpring(0, springs.smooth));

    // Footer last
    footerOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonContainerStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/potential');
  };

  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.975, springs.snappy);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, springs.snappy);
  };

  const buttonPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bgPrimary,
        },
        gradientBackground: {
          ...StyleSheet.absoluteFillObject,
        },
        orbContainer: {
          ...StyleSheet.absoluteFillObject,
          overflow: 'hidden',
        },
        centerContent: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: layout.screenPadding,
        },
        taglineContainer: {
          alignItems: 'center',
          marginTop: 36,
        },
        tagline: {
          ...typography.displayMedium,
          color: colors.textPrimary,
          textAlign: 'center',
          letterSpacing: -0.5,
          lineHeight: 42,
        },
        subtitle: {
          marginTop: 16,
          ...typography.bodyLarge,
          color: colors.textTertiary,
          textAlign: 'center',
          maxWidth: 300,
          lineHeight: 24,
        },
        bottomSection: {
          paddingHorizontal: layout.screenPadding,
          paddingBottom: 50,
          gap: 28,
        },
        button: {
          width: '100%',
          height: 58,
          backgroundColor: colors.textPrimary,
          borderRadius: borderRadius.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        },
        buttonText: {
          ...typography.labelLarge,
          color: colors.bgPrimary,
          fontSize: 17,
          letterSpacing: 0.2,
        },
        footer: {
          alignItems: 'center',
        },
        footerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        footerText: {
          ...typography.caption,
          color: colors.textTertiary,
          letterSpacing: 0.2,
        },
        footerHighlight: {
          color: colors.accentTertiary,
          fontWeight: '600',
        },
        dividerDot: {
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.textTertiary,
          opacity: 0.4,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={[colors.bgPrimary, colors.bgSecondary, colors.bgPrimary]}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Ambient floating orbs - teal and soft purple */}
      <View style={styles.orbContainer}>
        <FloatingOrb
          size={width * 0.75}
          color="rgba(78, 205, 196, 0.07)"
          initialX={-width * 0.25}
          initialY={height * 0.06}
          delay={100}
        />
        <FloatingOrb
          size={width * 0.55}
          color="rgba(139, 128, 186, 0.05)"
          initialX={width * 0.55}
          initialY={height * 0.52}
          delay={300}
        />
        <FloatingOrb
          size={width * 0.4}
          color="rgba(78, 205, 196, 0.04)"
          initialX={width * 0.65}
          initialY={height * 0.12}
          delay={500}
        />
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Animated.View style={logoStyle}>
          <AnimatedLogo size="large" animate={false} />
        </Animated.View>

        <View style={styles.taglineContainer}>
          <AccentLine delay={550} />
          <Animated.View style={taglineStyle}>
            <Text style={styles.tagline}>Your next look{'\n'}is waiting</Text>
          </Animated.View>
          <Animated.View style={subtitleStyle}>
            <Text style={styles.subtitle}>
              Discover styles that feel like you, before you commit
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <Animated.View style={buttonContainerStyle}>
          <AnimatedPressable
            onPress={handleGetStarted}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={buttonPressStyle}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.bgPrimary} />
            </View>
          </AnimatedPressable>
        </Animated.View>

        <Animated.View style={[styles.footer, footerStyle]}>
          <View style={styles.footerRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.footerText}>Private & secure</Text>
            <View style={styles.dividerDot} />
            <Text style={styles.footerText}>
              <Text style={styles.footerHighlight}>100K+</Text> style explorers
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { AnimatedLogo } from '@/components/ui';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Star = ({ size, style, color }: { size: number; style?: any; color: string }) => (
  <View style={style}>
    <Ionicons name="sparkles" size={size} color={color} />
  </View>
);

const DURATION = 350;
const EASE = Easing.out(Easing.quad);

export default function WelcomeScreen() {
  const { colors } = useTheme();

  const logoOpacity = useSharedValue(0);
  const cardsOpacity = useSharedValue(0);
  const starsOpacity = useSharedValue(0);
  const statementOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: DURATION, easing: EASE });
    cardsOpacity.value = withDelay(150, withTiming(1, { duration: DURATION, easing: EASE }));
    starsOpacity.value = withDelay(300, withTiming(1, { duration: DURATION, easing: EASE }));
    statementOpacity.value = withDelay(400, withTiming(1, { duration: DURATION, easing: EASE }));
    buttonOpacity.value = withDelay(500, withTiming(1, { duration: DURATION, easing: EASE }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  const cardsStyle = useAnimatedStyle(() => ({ opacity: cardsOpacity.value }));
  const starsStyle = useAnimatedStyle(() => ({ opacity: starsOpacity.value }));
  const statementStyle = useAnimatedStyle(() => ({ opacity: statementOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/potential');
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bgPrimary,
        },
        gradient: {
          ...StyleSheet.absoluteFillObject,
        },
        content: {
          flex: 1,
          paddingHorizontal: layout.screenPadding,
        },
        logoContainer: {
          alignItems: 'center',
          marginTop: 80,
        },
        cardsSection: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        cardsWrapper: {
          width: 280,
          height: 340,
          justifyContent: 'center',
          alignItems: 'center',
        },
        backCardLeft: {
          position: 'absolute',
          width: 180,
          height: 240,
          backgroundColor: colors.bgTertiary,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ rotate: '-12deg' }, { translateX: -40 }],
        },
        backCardRight: {
          position: 'absolute',
          width: 180,
          height: 240,
          backgroundColor: colors.bgTertiary,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ rotate: '12deg' }, { translateX: 40 }],
        },
        mainCard: {
          width: 180,
          height: 240,
          backgroundColor: colors.textPrimary,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        },
        cardIconContainer: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        },
        cardText: {
          ...typography.headlineMedium,
          color: colors.bgPrimary,
          letterSpacing: -0.3,
        },
        statementContainer: {
          alignItems: 'center',
          marginTop: 40,
          paddingHorizontal: 20,
        },
        statement: {
          ...typography.bodyLarge,
          color: colors.textTertiary,
          textAlign: 'center',
          lineHeight: 24,
        },
        starsContainer: {
          position: 'absolute',
          top: 180,
          left: 0,
          right: 0,
          bottom: 280,
        },
        star1: {
          position: 'absolute',
          top: 30,
          left: '10%',
        },
        star2: {
          position: 'absolute',
          top: 10,
          right: '20%',
        },
        star3: {
          position: 'absolute',
          top: '40%',
          right: '6%',
        },
        star4: {
          position: 'absolute',
          bottom: 40,
          left: '6%',
        },
        star5: {
          position: 'absolute',
          bottom: 80,
          right: '10%',
        },
        bottomSection: {
          paddingHorizontal: layout.screenPadding,
          paddingBottom: 56,
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
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientEdge, colors.bgGradientCenter, colors.bgGradientEdge]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <Animated.View style={[styles.starsContainer, starsStyle]} pointerEvents="none">
        <Star size={20} color={colors.textTertiary} style={styles.star1} />
        <Star size={16} color={colors.textPrimary} style={styles.star2} />
        <Star size={12} color={colors.textTertiary} style={styles.star3} />
        <Star size={16} color={colors.textTertiary} style={styles.star4} />
        <Star size={14} color={colors.textTertiary} style={styles.star5} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <AnimatedLogo size="large" animate={false} />
        </Animated.View>

        <View style={styles.cardsSection}>
          <Animated.View style={[styles.cardsWrapper, cardsStyle]}>
            <View style={styles.backCardLeft} />
            <View style={styles.backCardRight} />
            <View style={styles.mainCard}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="star-outline" size={28} color={colors.bgPrimary} />
              </View>
              <Text style={styles.cardText}>New You</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.statementContainer, statementStyle]}>
            <Text style={styles.statement}>Discover the best version of yourself</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.button}>
            <Text style={styles.buttonText}>Begin</Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

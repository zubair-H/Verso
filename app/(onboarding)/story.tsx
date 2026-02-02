import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, springs, borderRadius } from '@/constants/spacing';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StoryCard {
  quote: string;
  outcome: string;
  icon: string;
  colorKey: 'accent' | 'accentSecondary' | 'accentTertiary';
}

const stories: StoryCard[] = [
  {
    quote: "I tried my interview look before the big day",
    outcome: "Confidence boost",
    icon: 'briefcase-outline',
    colorKey: 'accent',
  },
  {
    quote: "Found my wedding style before saying yes",
    outcome: "Decisions made easier",
    icon: 'heart-outline',
    colorKey: 'accentSecondary',
  },
  {
    quote: "Finally tried that haircut I'd been scared of",
    outcome: "Fear conquered",
    icon: 'cut-outline',
    colorKey: 'accentTertiary',
  },
];

export default function StoryScreen() {
  const { colors } = useTheme();
  const headerOpacity = useSharedValue(0);
  const card1Opacity = useSharedValue(0);
  const card1TranslateX = useSharedValue(40);
  const card2Opacity = useSharedValue(0);
  const card2TranslateX = useSharedValue(40);
  const card3Opacity = useSharedValue(0);
  const card3TranslateX = useSharedValue(40);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Header
    headerOpacity.value = withTiming(1, { duration: 500 });

    // Cards stagger in from right
    card1Opacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    card1TranslateX.value = withDelay(300, withSpring(0, springs.smooth));

    card2Opacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    card2TranslateX.value = withDelay(500, withSpring(0, springs.smooth));

    card3Opacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    card3TranslateX.value = withDelay(700, withSpring(0, springs.smooth));

    // Button
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateX: card1TranslateX.value }],
  }));

  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateX: card2TranslateX.value }],
  }));

  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Opacity.value,
    transform: [{ translateX: card3TranslateX.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const cardStyles = [card1Style, card2Style, card3Style];

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/features');
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
    card: {
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: 'hidden' as const,
    },
    cardInner: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      padding: 20,
      backgroundColor: colors.glassBg,
      gap: 16,
    },
    quote: {
      ...typography.bodyLarge,
      color: colors.textPrimary,
      fontStyle: 'italic' as const,
      marginBottom: 12,
      lineHeight: 26,
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
        <Text style={dynamicStyles.title}>Every Look{'\n'}Tells a Story</Text>
      </Animated.View>

      {/* Story cards */}
      <View style={styles.cardsContainer}>
        {stories.map((story, index) => {
          const storyColor = colors[story.colorKey];
          return (
            <Animated.View key={index} style={[styles.cardWrapper, cardStyles[index]]}>
              <BlurView intensity={20} tint="dark" style={dynamicStyles.card}>
                <View style={dynamicStyles.cardInner}>
                  <View style={[styles.iconContainer, { backgroundColor: storyColor + '20' }]}>
                    <Ionicons name={story.icon as any} size={24} color={storyColor} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={dynamicStyles.quote}>"{story.quote}"</Text>
                    <View style={styles.outcomeContainer}>
                      <View style={[styles.outcomeDot, { backgroundColor: storyColor }]} />
                      <Text style={[styles.outcome, { color: storyColor }]}>{story.outcome}</Text>
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          );
        })}
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
            <Text style={dynamicStyles.buttonText}>I'm Ready</Text>
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
  cardWrapper: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outcomeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  outcome: {
    ...typography.labelMedium,
  },
  bottomSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 50,
  },
});

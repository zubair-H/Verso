import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { GradientButton } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout } from '@/constants/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_SPACING = 24;

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
}

const features: FeatureCard[] = [
  {
    id: '1',
    title: 'Try Any Look',
    description: 'Upload a celebrity or influencer photo. See their style on you.',
    icon: 'sparkles',
    accentColor: '#00D4FF',
  },
  {
    id: '2',
    title: 'Mix & Match',
    description: 'Hair from one look. Outfit from another. Glasses from a third. You control everything.',
    icon: 'color-palette',
    accentColor: '#00BFA5',
  },
  {
    id: '3',
    title: 'Save & Compare',
    description: 'Save your favorite looks. Compare side by side. Never regret a haircut again.',
    icon: 'layers',
    accentColor: '#00E676',
  },
];

export default function FeaturesScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const progressWidth = useSharedValue(0.33);
  const isAnimating = useRef(false);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0] && !isAnimating.current) {
        const index = viewableItems[0].index ?? 0;
        if (index !== currentIndex) {
          setCurrentIndex(index);
          // Calculate progress: 33% base + 33% per step
          const newProgress = 0.33 + (index + 1) * 0.22;
          progressWidth.value = withSpring(Math.min(newProgress, 0.99), {
            damping: 20,
            stiffness: 150,
          });
          runOnJS(triggerHaptic)();
        }
      }
    }
  ).current;

  const handleNext = useCallback(() => {
    if (currentIndex < features.length - 1) {
      isAnimating.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setTimeout(() => {
        isAnimating.current = false;
      }, 400);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/(onboarding)/permissions');
    }
  }, [currentIndex]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const renderCard = useCallback(
    ({ item, index }: { item: FeatureCard; index: number }) => (
      <FeatureCardComponent
        item={item}
        index={index}
        scrollX={scrollX}
        currentIndex={currentIndex}
      />
    ),
    [currentIndex]
  );

  return (
    <View style={styles.container}>
      {/* Ambient background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(0, 212, 255, 0.04)', 'transparent', 'rgba(0, 191, 165, 0.03)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />
      </View>

      {/* Progress indicator */}
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

      <View style={styles.contentContainer}>
        <FlatList
          ref={flatListRef}
          data={features}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
          onScroll={(e) => {
            scrollX.value = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="center"
        />

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {currentIndex + 1} of {features.length}
          </Text>
        </View>
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        <GradientButton
          label={currentIndex === features.length - 1 ? "Let's Go" : 'Continue'}
          onPress={handleNext}
          size="large"
          haptic="medium"
          style={styles.button}
        />
      </View>
    </View>
  );
}

function FeatureCardComponent({
  item,
  index,
  scrollX,
}: {
  item: FeatureCard;
  index: number;
  scrollX: Animated.SharedValue<number>;
  currentIndex: number;
}) {
  const cardStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <View style={styles.cardWrapper}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.iconSection}>
          <View style={[styles.iconGlow, { backgroundColor: item.accentColor }]} />
          <View style={styles.iconContainer}>
            <Ionicons
              name={item.icon}
              size={48}
              color={item.accentColor}
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </View>
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
  contentContainer: {
    flex: 1,
    paddingTop: 100,
  },
  listContent: {
    alignItems: 'center',
  },
  cardWrapper: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CARD_SPACING,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.08,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  textContainer: {
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardDescription: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  stepIndicator: {
    alignItems: 'center',
    marginTop: 32,
  },
  stepText: {
    ...typography.labelMedium,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  buttonContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 50,
  },
  button: {
    width: '100%',
  },
});

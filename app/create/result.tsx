import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { GradientButton, GlassCard } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { useStorage } from '@/hooks/useStorage';
import { trackEvent } from '@/utils/analytics';
import { getProductsForElements, Product } from '@/utils/mockProducts';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - layout.screenPadding * 2;

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    selfie: string;
    look: string;
    elements: string;
  }>();
  const { saveLook, useFreeTry } = useStorage();

  const [isLoading, setIsLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const elements = params.elements?.split(',') || [];
  const products = getProductsForElements(elements);

  // Animation values
  const shimmerPosition = useSharedValue(-1);
  const imageOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.95);
  const glowOpacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    startLoadingAnimation();
    // Simulate AI processing delay
    const timer = setTimeout(() => {
      revealResult();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const startLoadingAnimation = () => {
    // Shimmer animation
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  };

  const revealResult = async () => {
    setIsLoading(false);

    // Stop shimmer
    shimmerPosition.value = -1;

    // Image fade in with scale
    imageOpacity.value = withTiming(1, { duration: 400 });
    imageScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Glow pulse
    glowOpacity.value = withDelay(
      200,
      withSequence(
        withTiming(0.8, { duration: 300 }),
        withTiming(0.3, { duration: 500 })
      )
    );

    // Confetti burst
    confettiOpacity.value = withDelay(
      100,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 400 }))
      )
    );

    // Haptic success
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    runOnJS(setIsRevealed)(true);
    runOnJS(trackEventWrapper)();
    runOnJS(decrementTry)();
  };

  const trackEventWrapper = () => {
    trackEvent('look_generated', { elements: params.elements });
  };

  const decrementTry = async () => {
    await useFreeTry();
  };

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaved(true);

    await saveLook({
      selfie: params.selfie || '',
      reference: params.look || '',
      result: params.look || '', // Using look as result for mock
      elements,
    });

    trackEvent('look_saved');
  };

  const handleRegenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setIsRevealed(false);

    imageOpacity.value = 0;
    imageScale.value = 0.95;

    startLoadingAnimation();

    setTimeout(() => {
      revealResult();
    }, 2000);
  };

  const handleTryAnother = () => {
    router.replace('/(tabs)');
  };

  // Animated styles
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * IMAGE_WIDTH * 1.5 }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const elementsText = elements.includes('entire_look')
    ? 'Entire Look'
    : elements.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(' + ');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.08)', 'rgba(0, 0, 0, 0)', 'rgba(0, 191, 165, 0.05)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Result Image Container */}
        <View style={styles.resultContainer}>
          {/* Glow effect */}
          <Animated.View style={[styles.glow, glowStyle]}>
            <LinearGradient
              colors={[colors.accentPrimary, colors.accentSecondary]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Image with loading state */}
          <GlassCard padding={8} style={styles.imageCard}>
            {/* Shimmer loading */}
            {isLoading && (
              <View style={styles.shimmerContainer}>
                <View style={styles.shimmerPlaceholder} />
                <Animated.View style={[styles.shimmer, shimmerStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
                    style={styles.shimmerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </Animated.View>
              </View>
            )}

            {/* Actual result image */}
            <Animated.Image
              source={{ uri: params.look }}
              style={[styles.resultImage, imageStyle]}
            />

            {/* Confetti burst */}
            <Animated.View style={[styles.confetti, confettiStyle]}>
              <Ionicons name="sparkles" size={40} color={colors.accentPrimary} style={styles.confettiEmoji} />
              <MaterialCommunityIcons name="party-popper" size={40} color={colors.accentSecondary} style={[styles.confettiEmoji, styles.confettiTopLeft]} />
              <Ionicons name="sparkles" size={40} color={colors.accentPrimary} style={[styles.confettiEmoji, styles.confettiTopRight]} />
              <MaterialCommunityIcons name="party-popper" size={40} color={colors.accentSecondary} style={[styles.confettiEmoji, styles.confettiBottomLeft]} />
              <Ionicons name="sparkles" size={40} color={colors.accentPrimary} style={[styles.confettiEmoji, styles.confettiBottomRight]} />
            </Animated.View>
          </GlassCard>
        </View>

        {/* Title */}
        {isRevealed && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.resultTitle}>Your new look </Text>
              <Ionicons name="sparkles" size={24} color={colors.accentPrimary} />
            </View>
            <Text style={styles.resultSubtitle}>{elementsText}</Text>
          </Animated.View>
        )}

        {/* Action Buttons */}
        {isRevealed && (
          <Animated.View entering={SlideInUp.delay(300)} style={styles.actionsContainer}>
            <Pressable
              onPress={handleSave}
              style={[styles.actionButton, isSaved && styles.actionButtonSaved]}
            >
              <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={24} color={isSaved ? colors.accentPrimary : colors.textPrimary} />
              <Text style={styles.actionLabel}>Save</Text>
            </Pressable>

            <Pressable onPress={handleRegenerate} style={styles.actionButton}>
              <Ionicons name="refresh" size={24} color={colors.textPrimary} />
              <Text style={styles.actionLabel}>Re-gen</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Products Section */}
        {isRevealed && products.length > 0 && (
          <Animated.View entering={SlideInUp.delay(400)} style={styles.productsSection}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.sectionTitle}>Get the products</Text>
              <View style={styles.dividerLine} />
            </View>

            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Animated.View>
        )}

        {/* Try Another Button */}
        {isRevealed && (
          <Animated.View entering={SlideInUp.delay(500)} style={styles.tryAnotherContainer}>
            <GradientButton
              label="Try Another Look"
              onPress={handleTryAnother}
              size="large"
              style={styles.tryAnotherButton}
            />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable style={styles.productCard}>
      <GlassCard padding={12}>
        <View style={styles.productContent}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.productPrice}>{product.price}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 40,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  glow: {
    position: 'absolute',
    width: IMAGE_WIDTH + 40,
    height: IMAGE_WIDTH * 1.3 + 40,
    borderRadius: borderRadius.xl + 20,
    top: -20,
    left: -20,
  },
  imageCard: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 1.3,
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  shimmerPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgTertiary,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerGradient: {
    width: '50%',
    height: '100%',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
    resizeMode: 'cover',
  },
  confetti: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  confettiEmoji: {
    fontSize: 40,
    position: 'absolute',
  },
  confettiTopLeft: {
    top: 20,
    left: 20,
  },
  confettiTopRight: {
    top: 30,
    right: 30,
  },
  confettiBottomLeft: {
    bottom: 30,
    left: 30,
  },
  confettiBottomRight: {
    bottom: 20,
    right: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minWidth: 100,
  },
  actionButtonSaved: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: colors.accentPrimary,
  },
  actionLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  productsSection: {
    marginBottom: 32,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginHorizontal: 16,
  },
  productCard: {
    marginBottom: 12,
  },
  productContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  productPrice: {
    ...typography.labelMedium,
    color: colors.accentPrimary,
  },
  tryAnotherContainer: {
    marginTop: 8,
  },
  tryAnotherButton: {
    width: '100%',
  },
});

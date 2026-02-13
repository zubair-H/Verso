import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'react-native-reanimated';
import { PrimaryButton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius, springs } from '@/constants/spacing';
import { useStorage } from '@/hooks/useStorage';
import { trackEvent } from '@/utils/analytics';
import { getProductsForElements, Product } from '@/utils/mockProducts';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - layout.screenPadding * 2;

interface ColorsType {
  bgPrimary: string;
  bgSecondary: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentMuted: string;
  accentGlow: string;
  bgTertiary: string;
  border: string;
}

export default function ResultScreen() {
  const { colors } = useTheme();
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
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const elements = params.elements?.split(',') || [];
  const products = getProductsForElements(elements);

  // Animation values - THE SIGNATURE REVEAL
  const loaderScale = useSharedValue(1);
  const loaderOpacity = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.95);
  const glowOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const actionsOpacity = useSharedValue(0);
  const vortexSpin = useSharedValue(0);
  const ambientPulse = useSharedValue(0);

  useEffect(() => {
    startLoadingAnimation();
    startAmbientAnimation();
    // Simulate AI processing delay
    const timer = setTimeout(() => {
      runSignatureReveal();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Phase 1: Anticipation - Pulsing loader
  const startLoadingAnimation = () => {
    loaderScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  };

  const startAmbientAnimation = () => {
    vortexSpin.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.linear }),
      -1,
      false
    );
    ambientPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  };

  // THE SIGNATURE REVEAL - 1200ms cinematic sequence
  const runSignatureReveal = useCallback(async () => {
    // Phase 1 ends - fade out loader
    loaderOpacity.value = withTiming(0, { duration: 200 });

    // Phase 2: Reveal (300-800ms) - Image fade + scale with dramatic spring
    setTimeout(() => {
      runOnJS(setIsLoading)(false);

      // Image fade in
      imageOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });

      // Image scale with dramatic spring
      imageScale.value = withSpring(1, springs.dramatic);

      // Subtle mint glow pulse
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: 300 }),
        withTiming(0.2, { duration: 400 })
      );
    }, 300);

    // Phase 3: Settling (800-1100ms) - Text fades in
    setTimeout(() => {
      runOnJS(setShowTitle)(true);
      titleOpacity.value = withTiming(1, { duration: 300 });
      titleTranslateY.value = withSpring(0, springs.smooth);
    }, 800);

    // Subtitle with 100ms stagger
    setTimeout(() => {
      runOnJS(setShowSubtitle)(true);
      subtitleOpacity.value = withTiming(1, { duration: 300 });
      subtitleTranslateY.value = withSpring(0, springs.smooth);
    }, 900);

    // Phase 4: Actions (1100-1200ms) - Buttons fade in + Heavy haptic
    setTimeout(async () => {
      runOnJS(setShowActions)(true);
      actionsOpacity.value = withTiming(1, { duration: 200 });

      // Heavy haptic - the satisfying finale
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      runOnJS(setIsRevealed)(true);
      runOnJS(trackEventWrapper)();
      runOnJS(decrementTry)();
    }, 1100);

    // Products appear last
    setTimeout(() => {
      runOnJS(setShowProducts)(true);
    }, 1300);
  }, []);

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
      result: params.look || '',
      elements,
    });

    trackEvent('look_saved');
  };

  const handleRegenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset states
    setIsLoading(true);
    setIsRevealed(false);
    setShowTitle(false);
    setShowSubtitle(false);
    setShowActions(false);
    setShowProducts(false);

    // Reset animation values
    imageOpacity.value = 0;
    imageScale.value = 0.95;
    glowOpacity.value = 0;
    titleOpacity.value = 0;
    titleTranslateY.value = 20;
    subtitleOpacity.value = 0;
    subtitleTranslateY.value = 20;
    actionsOpacity.value = 0;
    loaderOpacity.value = 1;

    startLoadingAnimation();

    setTimeout(() => {
      runSignatureReveal();
    }, 2000);
  };

  const handleTryAnother = () => {
    router.replace('/(tabs)');
  };

  // Animated styles
  const loaderStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
    transform: [{ scale: loaderScale.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  const vortexStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${vortexSpin.value * 360}deg` }],
  }));

  const counterVortexStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-vortexSpin.value * 260}deg` }],
  }));

  const ambientGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + ambientPulse.value * 0.35,
    transform: [{ scale: 0.94 + ambientPulse.value * 0.12 }],
  }));

  const elementsText = elements.includes('entire_look')
    ? 'Entire look'
    : elements.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(' + ');

  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    backgroundGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    topAura: {
      position: 'absolute' as const,
      top: 72,
      left: -40,
      right: -40,
      height: 220,
      borderRadius: 200,
      backgroundColor: colors.accentMuted,
    },
    imageStage: {
      width: IMAGE_WIDTH,
      height: IMAGE_WIDTH * 1.3,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    vortexRingOuter: {
      position: 'absolute' as const,
      width: IMAGE_WIDTH - 18,
      height: IMAGE_WIDTH - 18,
      borderRadius: (IMAGE_WIDTH - 18) / 2,
      borderWidth: 1,
      borderColor: colors.border,
      opacity: 0.65,
    },
    vortexRingInner: {
      position: 'absolute' as const,
      width: IMAGE_WIDTH - 72,
      height: IMAGE_WIDTH - 72,
      borderRadius: (IMAGE_WIDTH - 72) / 2,
      borderWidth: 1,
      borderColor: colors.borderLight,
      opacity: 0.8,
    },
    orbitDot: {
      position: 'absolute' as const,
      top: 4,
      left: IMAGE_WIDTH / 2 - 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      opacity: 0.75,
    },
    glow: {
      position: 'absolute' as const,
      width: IMAGE_WIDTH + 40,
      height: IMAGE_WIDTH * 1.3 + 40,
      borderRadius: borderRadius.xl + 20,
      top: -20,
      left: -20,
      backgroundColor: colors.accentGlow,
    },
    imageCard: {
      width: IMAGE_WIDTH,
      height: IMAGE_WIDTH * 1.3,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgSecondary,
      overflow: 'hidden' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    loaderOuter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accentMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 16,
    },
    loaderInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.bgTertiary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loaderText: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
    },
    resultTitle: {
      ...typography.headlineLarge,
      color: colors.textPrimary,
    },
    resultSubtitle: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
    },
    actionButton: {
      alignItems: 'center' as const,
      paddingVertical: 16,
      paddingHorizontal: 32,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minWidth: 100,
    },
    actionButtonSaved: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
    },
    actionLabel: {
      ...typography.labelMedium,
      color: colors.textSecondary,
      marginTop: 4,
    },
    actionLabelSaved: {
      color: colors.accent,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    sectionTitle: {
      ...typography.labelSmall,
      color: colors.textTertiary,
      marginHorizontal: 16,
    },
    productCardInner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 12,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    productName: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    productPrice: {
      ...typography.labelMedium,
      color: colors.accent,
    },
  }), [colors]);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.bgSecondary, colors.bgPrimary]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={dynamicStyles.backgroundGradient}
      />
      <Animated.View style={[dynamicStyles.topAura, ambientGlowStyle]} />

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
          <View style={dynamicStyles.imageStage}>
            <Animated.View style={[dynamicStyles.vortexRingOuter, vortexStyle]}>
              <View style={dynamicStyles.orbitDot} />
            </Animated.View>
            <Animated.View style={[dynamicStyles.vortexRingInner, counterVortexStyle]}>
              <View style={dynamicStyles.orbitDot} />
            </Animated.View>
            <Animated.View style={[dynamicStyles.glow, glowStyle, ambientGlowStyle]} />

            {/* Image container - solid with border */}
            <View style={dynamicStyles.imageCard}>
              {/* Pulsing loader */}
              {isLoading && (
                <Animated.View style={[styles.loaderContainer, loaderStyle]}>
                  <View style={dynamicStyles.loaderOuter}>
                    <View style={dynamicStyles.loaderInner}>
                      <Ionicons name="sparkles" size={32} color={colors.accent} />
                    </View>
                  </View>
                  <Text style={dynamicStyles.loaderText}>Creating your transformation...</Text>
                </Animated.View>
              )}

              {/* Actual result image */}
              <Animated.Image
                source={{ uri: params.look }}
                style={[styles.resultImage, imageStyle]}
              />
            </View>
          </View>
        </View>

        {/* Title */}
        {showTitle && (
          <Animated.View style={[styles.titleContainer, titleStyle]}>
            <View style={styles.titleRow}>
              <Text style={dynamicStyles.resultTitle}>Look at you!</Text>
              <Ionicons name="sparkles" size={24} color={colors.accent} style={styles.sparkleIcon} />
            </View>
          </Animated.View>
        )}

        {/* Subtitle */}
        {showSubtitle && (
          <Animated.View style={[styles.subtitleContainer, subtitleStyle]}>
            <Text style={dynamicStyles.resultSubtitle}>{elementsText}</Text>
          </Animated.View>
        )}

        {/* Action Buttons */}
        {showActions && (
          <Animated.View style={[styles.actionsContainer, actionsStyle]}>
            <Pressable
              onPress={handleSave}
              style={[dynamicStyles.actionButton, isSaved && dynamicStyles.actionButtonSaved]}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={24}
                color={isSaved ? colors.accent : colors.textPrimary}
              />
              <Text style={[dynamicStyles.actionLabel, isSaved && dynamicStyles.actionLabelSaved]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>

            <Pressable onPress={handleRegenerate} style={dynamicStyles.actionButton}>
              <Ionicons name="refresh" size={24} color={colors.textPrimary} />
              <Text style={dynamicStyles.actionLabel}>Re-gen</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Products Section */}
        {showProducts && products.length > 0 && (
          <Animated.View style={styles.productsSection}>
            <View style={styles.sectionDivider}>
              <View style={dynamicStyles.dividerLine} />
              <Text style={dynamicStyles.sectionTitle}>Get the products</Text>
              <View style={dynamicStyles.dividerLine} />
            </View>

            {products.map((product) => (
              <ProductCard key={product.id} product={product} colors={colors} />
            ))}
          </Animated.View>
        )}

        {/* Try Another Button */}
        {isRevealed && (
          <View style={styles.tryAnotherContainer}>
            <PrimaryButton
              label="Ready for more?"
              onPress={handleTryAnother}
              style={styles.tryAnotherButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProductCard({ product, colors }: { product: Product; colors: ColorsType }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const cardStyles = useMemo(() => ({
    productCardInner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 12,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    productName: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    productPrice: {
      ...typography.labelMedium,
      color: colors.accent,
    },
  }), [colors]);

  return (
    <Animated.View style={[styles.productCard, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={cardStyles.productCardInner}
      >
        <Image source={{ uri: product.image }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={cardStyles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={cardStyles.productPrice}>{product.price}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  loaderContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  productsSection: {
    marginBottom: 32,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productCard: {
    marginBottom: 12,
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
  tryAnotherContainer: {
    marginTop: 8,
  },
  tryAnotherButton: {
    width: '100%',
  },
});

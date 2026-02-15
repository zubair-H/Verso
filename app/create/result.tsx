import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
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
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius, springs } from '@/constants/spacing';
import { useStorage } from '@/hooks/useStorage';
import { trackEvent } from '@/utils/analytics';
import { API_BASE_URL, generateLook, recolorHair, recolorHairFast, recolorOutfitFast } from '@/utils/api';
import { getHairSwapSession } from '@/utils/hairSwapSession';
import { getOutfitSwapSession } from '@/utils/outfitSwapSession';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - layout.screenPadding * 2;

const OUTFIT_COLOR_LABELS: Record<string, string> = {
  black: 'Black',
  white: 'White',
  beige: 'Beige',
  brown: 'Brown',
  navy: 'Navy',
  green: 'Green',
  red: 'Red',
  pink: 'Pink',
  gray: 'Gray',
  olive: 'Olive',
  blue: 'Blue',
  current: 'Current',
};

export default function ResultScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    selfie: string;
    look: string;
    elements: string;
    hairColorMode?: string;
    sessionId?: string;
    hairColorId?: string;
    hairStyleId?: string;
    swapMode?: string;
    hairHex?: string;
    hairStrength?: string;
    precomputedImage?: string;
    maskUrl?: string;
    debugSummary?: string;
    outfitMode?: string;
    outfitSessionId?: string;
    topColorId?: string;
    bottomColorId?: string;
  }>();
  const { saveLook, useFreeTry } = useStorage();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [resultImageUri, setResultImageUri] = useState(params.look || '');
  const [usedPrecomputed, setUsedPrecomputed] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const hairSession = useMemo(
    () => (params.sessionId ? getHairSwapSession(params.sessionId) : null),
    [params.sessionId]
  );
  const outfitSession = useMemo(
    () => (params.outfitSessionId ? getOutfitSwapSession(params.outfitSessionId) : null),
    [params.outfitSessionId]
  );
  const sourceSelfie = hairSession?.selfie || outfitSession?.imageUri || params.selfie || '';
  const sourceLook = hairSession?.look || outfitSession?.imageUri || params.look || '';
  const sourceElementsRaw = hairSession?.elements || outfitSession?.elements || params.elements || '';
  const sourceColorId = hairSession?.hairColorId || params.hairColorId || '';
  const sourceStyleId = hairSession?.hairStyleId || params.hairStyleId || 'no_change';
  const sourceMode = hairSession?.swapMode || params.swapMode || 'stable';

  const elements = sourceElementsRaw ? sourceElementsRaw.split(',') : [];
  const isHairColorMode = params.hairColorMode === '1';
  const isOutfitMode = params.outfitMode === '1';
  const selectedTopColorId = outfitSession?.topColorId || params.topColorId || 'current';
  const selectedBottomColorId = outfitSession?.bottomColorId || params.bottomColorId || 'current';

  const ensureDataUri = useCallback(async (uri: string): Promise<string> => {
    if (!uri) return uri;
    if (uri.startsWith('data:')) return uri;
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    throw new Error('Local file URI is not supported here. Please re-upload your photo.');
  }, []);

  // Animation values - THE SIGNATURE REVEAL
  const loaderScale = useSharedValue(1);
  const loaderOpacity = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.95);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    startLoadingAnimation();
    runGenerationAndReveal();
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => {
      setLoadingMessageIndex((prev) => prev + 1);
    }, 1200);
    return () => clearInterval(id);
  }, [isLoading]);

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
    }, 300);

    // Phase 3: Actions
    setTimeout(() => {
      runOnJS(setShowActions)(true);
      actionsOpacity.value = withTiming(1, { duration: 240 });

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      runOnJS(trackEventWrapper)();
      runOnJS(decrementTry)();
    }, 820);
  }, []);

  const runGenerationAndReveal = useCallback(async () => {
    try {
      if (isHairColorMode) {
        const mode = sourceMode === 'fast' ? 'fast' : 'stable';
        if (params.precomputedImage && !usedPrecomputed) {
          setResultImageUri(params.precomputedImage);
          setUsedPrecomputed(true);
          return;
        }

        const userImageUrl = await ensureDataUri(sourceSelfie);
        if (mode === 'fast') {
          const response = await recolorHairFast({
            userImageUrl,
            colorId: sourceColorId,
            hairStyleId: sourceStyleId,
          });
          setResultImageUri(response.editedImageUrl || sourceSelfie || sourceLook || '');
        } else {
          const parsedStrength = Number(params.hairStrength);
          const response = await recolorHair({
            userImageUrl,
            colorId: sourceColorId || undefined,
            hex: params.hairHex || undefined,
            strength: Number.isFinite(parsedStrength) ? parsedStrength : undefined,
          });

          setResultImageUri(response.editedImageDataUri || sourceSelfie || sourceLook || '');
        }
      } else if (isOutfitMode) {
        const outfitImage = outfitSession?.imageDataUri || sourceSelfie || sourceLook;
        const userImageUrl = await ensureDataUri(outfitImage);
        const response = await recolorOutfitFast({
          userImageUrl,
          topColorId: outfitSession?.topColorId || params.topColorId || 'current',
          bottomColorId: outfitSession?.bottomColorId || params.bottomColorId || 'current',
        });
        setResultImageUri(response.editedImageUrl || sourceLook || sourceSelfie || '');
      } else {
        const job = await generateLook({
          selfie: sourceSelfie,
          look: sourceLook,
          elements,
        });
        setResultImageUri(job.resultUrl || sourceLook || '');
      }
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Generation failed';
      const isNetworkIssue = /network request failed/i.test(rawMessage);
      const message = isNetworkIssue
        ? `Cannot reach backend at ${API_BASE_URL}. Start API server and ensure your phone/simulator can access your computer on the same network.`
        : rawMessage;
      const title = isHairColorMode
        ? 'Hair color swap failed'
        : isOutfitMode
          ? 'Outfit recolor failed'
          : 'Look generation failed';
      Alert.alert(title, message);
      setResultImageUri(sourceLook || '');
    } finally {
      runSignatureReveal();
    }
  }, [
    elements,
    ensureDataUri,
    isHairColorMode,
    isOutfitMode,
    sourceColorId,
    params.hairHex,
    sourceStyleId,
    params.hairStrength,
    sourceLook,
    params.precomputedImage,
    sourceMode,
    sourceSelfie,
    params.topColorId,
    params.bottomColorId,
    outfitSession,
    runSignatureReveal,
    usedPrecomputed,
  ]);

  const trackEventWrapper = () => {
    trackEvent('look_generated', { elements: sourceElementsRaw });
  };

  const decrementTry = async () => {
    await useFreeTry();
  };

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaved(true);

    await saveLook({
      selfie: sourceSelfie,
      reference: isHairColorMode ? sourceSelfie : sourceLook,
      result: resultImageUri || sourceLook || '',
      elements,
    });

    trackEvent('look_saved');
  };

  const handleRegenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset states
    setIsLoading(true);
    setShowActions(false);

    // Reset animation values
    imageOpacity.value = 0;
    imageScale.value = 0.95;
    actionsOpacity.value = 0;
    loaderOpacity.value = 1;

    startLoadingAnimation();
    await runGenerationAndReveal();
  };

  const handleBackToCreate = async () => {
    await Haptics.selectionAsync();
    router.replace('/(tabs)/create');
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

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  const loadingMessages = useMemo(() => {
    if (isOutfitMode) {
      return [
        'Analyzing your outfit regions...',
        'Applying selected color palette...',
        'Preserving texture and lighting...',
      ];
    }
    if (isHairColorMode) {
      return [
        'Detecting hair region...',
        'Applying your selected tone...',
        'Refining natural details...',
      ];
    }
    return ['Creating your transformation...'];
  }, [isHairColorMode, isOutfitMode]);

  const loadingText = loadingMessages[loadingMessageIndex % loadingMessages.length];
  const outfitLoadingSummary = useMemo(() => {
    if (!isOutfitMode) return '';
    const parts: string[] = [];
    if (selectedTopColorId !== 'current') parts.push(`Top: ${OUTFIT_COLOR_LABELS[selectedTopColorId] || selectedTopColorId}`);
    if (selectedBottomColorId !== 'current') parts.push(`Bottom: ${OUTFIT_COLOR_LABELS[selectedBottomColorId] || selectedBottomColorId}`);
    return parts.join('  •  ');
  }, [isOutfitMode, selectedBottomColorId, selectedTopColorId]);

  const pageTitle = isOutfitMode ? 'Outfit Result' : 'Result';

  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    backgroundGradient: {
      ...StyleSheet.absoluteFillObject,
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
    loaderBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 12,
      paddingHorizontal: 20,
      gap: 12,
    },
    loaderBadge: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: colors.bgSecondary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    loaderText: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      textAlign: 'center' as const,
    },
    loaderSubtext: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    headerTitle: {
      ...typography.labelLarge,
      color: colors.textPrimary,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    actionButtonSaved: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
    },
    actionLabel: {
      ...typography.labelMedium,
      color: colors.textSecondary,
    },
    actionLabelSaved: {
      color: colors.accent,
    },
    backCta: {
      alignSelf: 'center' as const,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgSecondary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginTop: 18,
    },
    backCtaText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  }), [colors]);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.bgSecondary, colors.bgPrimary, colors.bgPrimary]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={dynamicStyles.backgroundGradient}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={dynamicStyles.headerTitle}>{pageTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultContainer}>
          <View style={dynamicStyles.imageCard}>
            {isLoading && (
              <Animated.View style={[dynamicStyles.loaderBackdrop, loaderStyle]}>
                <View style={dynamicStyles.loaderBadge}>
                  <Ionicons name="sparkles" size={28} color={colors.accent} />
                </View>
                <Text style={dynamicStyles.loaderText}>{loadingText}</Text>
                {Boolean(outfitLoadingSummary) && <Text style={dynamicStyles.loaderSubtext}>{outfitLoadingSummary}</Text>}
              </Animated.View>
            )}

            <Animated.Image
              source={{ uri: resultImageUri || params.look }}
              style={[styles.resultImage, imageStyle]}
            />
          </View>
        </View>

        {showActions && (
          <Animated.View style={[styles.actionsContainer, actionsStyle]}>
            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleSave}
                style={[dynamicStyles.actionButton, isSaved && dynamicStyles.actionButtonSaved]}
              >
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isSaved ? colors.accent : colors.textPrimary}
                />
                <Text style={[dynamicStyles.actionLabel, isSaved && dynamicStyles.actionLabelSaved]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>

              <Pressable onPress={handleRegenerate} style={dynamicStyles.actionButton}>
                <Ionicons name="refresh" size={20} color={colors.textPrimary} />
                <Text style={dynamicStyles.actionLabel}>Regenerate</Text>
              </Pressable>
            </View>
            <Pressable onPress={handleBackToCreate} style={dynamicStyles.backCta}>
              <Text style={dynamicStyles.backCtaText}>Back to Create</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 48,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 20,
    marginBottom: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

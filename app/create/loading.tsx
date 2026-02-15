import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout } from '@/constants/spacing';
import { API_BASE_URL, recolorFaceFeaturesFast, recolorHairFast } from '@/utils/api';
import { getHairSwapSession } from '@/utils/hairSwapSession';
import { recolorEyesFast } from '@/utils/api';

async function healthCheck(baseUrl: string): Promise<{ ok: boolean; status?: number; body?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

export default function HairColorLoadingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    sessionId?: string;
  }>();

  const [running, setRunning] = useState(true);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('Preparing your image');
  const stoppedRef = useRef(false);

  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);

  const pushStep = useCallback((message: string, startTime: number) => {
    const atMs = Date.now() - startTime;
    setStatusText(message);
    void atMs;
  }, []);

  const runHairSwap = useCallback(async () => {
    const runStarted = Date.now();
    stoppedRef.current = false;
    setRunning(true);
    setError('');
    setStatusText('Preparing your image');

    try {
      if (!params.sessionId) {
        throw new Error('Missing hair swap session id.');
      }
      const session = getHairSwapSession(params.sessionId);
      if (!session) {
        throw new Error('Hair swap session not found. Please try again from Create page.');
      }
      if (!session.selfie) {
        throw new Error('Missing selfie image in session.');
      }
      const mode = 'fast';

      pushStep('Preparing request payload', runStarted);
      pushStep(`Swap mode: ${mode}`, runStarted);

      pushStep('Checking backend health', runStarted);

      const health = await healthCheck(API_BASE_URL);
      if (!health.ok) {
        throw new Error(
          `Backend unreachable at ${API_BASE_URL} (health status ${health.status || 'unknown'}). Start API and ensure device + computer are on same Wi-Fi.`
        );
      }
      pushStep('Backend health check passed', runStarted);

      let outputImage = session.selfie;
      const shouldApplyHair = Boolean(session.hairColorId || session.hairStyleId);
      if (shouldApplyHair) {
        pushStep('Applying hair style and hair color', runStarted);
        const response = await recolorHairFast({
          userImageUrl: session.selfie,
          colorId: session.hairColorId || 'current',
          hairStyleId: session.hairStyleId || 'no_change',
        });
        outputImage = response.editedImageUrl || outputImage;
      }

      if (session.eyeColorId) {
        pushStep('Applying eye color', runStarted);
        try {
          const eyeResponse = await recolorEyesFast({
            userImageUrl: outputImage,
            eyeColorId: session.eyeColorId,
          });
          outputImage = eyeResponse.editedImageUrl || outputImage;
        } catch {
          pushStep('Eye color step skipped due to model availability', runStarted);
        }
      }

      const shouldApplyFaceFeatures = Boolean(session.lipsId || session.eyebrowColorId);

      if (shouldApplyFaceFeatures) {
        pushStep('Applying lips and eyebrow color changes', runStarted);
        try {
          const featureResponse = await recolorFaceFeaturesFast({
            userImageUrl: outputImage,
            lipsId: session.lipsId || 'no_change',
            eyebrowColorId: session.eyebrowColorId || 'no_change',
          });
          outputImage = featureResponse.editedImageUrl || outputImage;
        } catch {
          pushStep('Face feature step skipped due to model availability', runStarted);
        }
      }

      pushStep('Finalizing result', runStarted);
      if (stoppedRef.current) return;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (stoppedRef.current) return;
      router.replace({
        pathname: '/create/result',
        params: {
          selfie: session.selfie,
          look: session.look || session.selfie,
          elements: session.elements || 'Hair Color',
          hairColorMode: '1',
          hairColorId: session.hairColorId || '',
          hairStyleId: session.hairStyleId || 'no_change',
          swapMode: mode,
          sessionId: session.id,
          precomputedImage: outputImage,
          maskUrl: '',
        },
      });
    } catch (caught) {
      if (stoppedRef.current) return;
      const err = caught as Error & { details?: { debug?: { steps?: Array<{ message?: string }> } } };
      const message = err?.message || 'Hair color swap failed';
      setError(message);
      pushStep(`Error: ${message}`, runStarted);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRunning(false);
    }
  }, [params.sessionId, pushStep]);

  useEffect(() => {
    void runHairSwap();
  }, [runHairSwap]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })),
      -1,
      false
    );
    spin.value = withRepeat(withTiming(360, { duration: 2800, easing: Easing.linear }), -1, false);
  }, [pulse, spin]);

  const handleStopOrBack = async () => {
    stoppedRef.current = true;
    await Haptics.selectionAsync();
    router.back();
  };

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + pulse.value * 0.1 }],
    opacity: 0.55 + pulse.value * 0.35,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
    opacity: 0.72,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bgPrimary,
          paddingTop: insets.top,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: layout.screenPadding,
          height: layout.headerHeight,
        },
        backButton: {
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          ...typography.headlineMedium,
          color: colors.textPrimary,
        },
        subtitle: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        body: {
          flex: 1,
          paddingHorizontal: layout.screenPadding,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
          justifyContent: 'center',
        },
        statusCard: {
          borderRadius: borderRadius.xl,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: 16,
          alignItems: 'center',
          gap: 10,
        },
        loadingVisual: {
          width: 110,
          height: 110,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 2,
        },
        loadingOrb: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.accentMuted,
          position: 'absolute',
        },
        loadingRing: {
          width: 106,
          height: 106,
          borderRadius: 53,
          borderWidth: 2,
          borderColor: colors.accent,
          borderTopColor: 'transparent',
          position: 'absolute',
        },
        statusText: {
          ...typography.labelLarge,
          color: colors.textPrimary,
          textAlign: 'center',
        },
        subtleText: {
          ...typography.caption,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        errorText: {
          ...typography.caption,
          color: '#ef6f6c',
          textAlign: 'center',
        },
        actionsRow: {
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 14,
        },
        actionButton: {
          width: '100%',
          maxWidth: 360,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgCard,
          paddingVertical: 11,
          alignItems: 'center',
        },
        actionText: {
          ...typography.labelMedium,
          color: colors.textPrimary,
        },
      }),
    [colors, insets.bottom, insets.top]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={styles.title}>Analyzing your photo</Text>
          <Text style={styles.subtitle}>Preparing your result</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statusCard}>
          <View style={styles.loadingVisual}>
            <Animated.View style={[styles.loadingOrb, orbStyle]} />
            <Animated.View style={[styles.loadingRing, ringStyle]} />
            <Ionicons name="sparkles" size={26} color={colors.accent} />
          </View>
          <Text style={styles.statusText}>
            {running ? 'Analyzing your photo...' : error ? 'Analysis failed' : 'Done'}
          </Text>
          <Text style={styles.subtleText}>{running ? statusText : 'You can retry if needed.'}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={() => void handleStopOrBack()}>
            <Text style={styles.actionText}>{running ? 'Stop and go back' : 'Go back'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

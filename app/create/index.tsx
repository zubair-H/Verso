import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/ui';
import { TransformationVisualizer, StyleAmbassadorStrip } from '@/components/home';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';
import { stylePersonas } from '@/utils/personas';
import type { StylePersona } from '@/utils/personas';

export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ presetImage?: string; personaId?: string }>();
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [lookImage, setLookImage] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  useEffect(() => {
    if (params.presetImage) {
      setLookImage(params.presetImage);
    }
    if (params.personaId) {
      setSelectedPersonaId(params.personaId);
    }
  }, [params.presetImage, params.personaId]);

  const pickImage = async (type: 'selfie' | 'look') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (type === 'selfie') {
        setSelfieImage(uri);
      } else {
        setLookImage(uri);
        setSelectedPersonaId(null);
      }
      trackEvent('photo_uploaded', { type });
    }
  };

  const selectPersona = async (persona: StylePersona) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLookImage(persona.image);
    setSelectedPersonaId(persona.id);
    trackEvent('preset_selected');
  };

  const handleGenerate = () => {
    if (selfieImage && lookImage) {
      router.push({
        pathname: '/create/select-elements',
        params: { selfie: selfieImage, look: lookImage },
      });
    }
  };

  const getButtonState = () => {
    if (!selfieImage && !lookImage) return { label: 'Add your photos to start', disabled: true };
    if (selfieImage && !lookImage) return { label: 'Now pick an ambassador look', disabled: true };
    if (!selfieImage && lookImage) return { label: 'Now add your photo', disabled: true };
    return { label: 'See Your Look', disabled: false, icon: 'sparkles' as const };
  };

  const buttonState = getButtonState();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      height: layout.headerHeight,
      gap: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.headlineMedium,
      color: colors.textPrimary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    visualizerSection: {
      marginTop: 16,
      paddingHorizontal: layout.screenPadding,
    },
    ctaSection: {
      marginTop: 24,
      paddingHorizontal: layout.screenPadding,
    },
    ctaButton: {
      width: '100%',
    },
    inspirationSection: {
      marginTop: 40,
    },
  }), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Your Look</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload Cards */}
        <Animated.View entering={FadeInDown.delay(100).springify().damping(38).stiffness(200)} style={styles.visualizerSection}>
          <TransformationVisualizer
            selfieImage={selfieImage}
            lookImage={lookImage}
            onSelectSelfie={() => pickImage('selfie')}
            onSelectLook={() => pickImage('look')}
            onRemoveSelfie={() => setSelfieImage(null)}
            onRemoveLook={() => setLookImage(null)}
          />
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.ctaSection}>
          <PrimaryButton
            label={buttonState.label}
            onPress={handleGenerate}
            disabled={buttonState.disabled}
            icon={buttonState.icon}
            style={styles.ctaButton}
          />
        </Animated.View>

        {/* Style Ambassadors */}
        <View style={styles.inspirationSection}>
          <StyleAmbassadorStrip
            personas={stylePersonas}
            selectedPersonaId={selectedPersonaId}
            onSelectPersona={selectPersona}
          />
        </View>
      </ScrollView>
    </View>
  );
}

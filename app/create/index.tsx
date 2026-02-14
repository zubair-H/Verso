import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout } from '@/constants/spacing';
import {
  fetchEyeColors,
  fetchHairColors,
  fetchHairStyles,
  EyeColorPreset,
  HairColorPreset,
  HairStylePreset,
} from '@/utils/api';
import { trackEvent } from '@/utils/analytics';
import { createHairSwapSession } from '@/utils/hairSwapSession';

const DEFAULT_HAIR_COLOR_PRESETS: HairColorPreset[] = [
  { id: 'current', name: 'Current', hex: '#9b9b9b', strength: 0 },
  { id: 'jet_black', name: 'Jet Black', hex: '#111111', strength: 0.75 },
  { id: 'dark_brown', name: 'Dark Brown', hex: '#2a1b12', strength: 0.7 },
  { id: 'light_brown', name: 'Light Brown', hex: '#6b4a2f', strength: 0.65 },
  { id: 'blonde', name: 'Blonde', hex: '#d8c07a', strength: 0.6 },
  { id: 'platinum', name: 'Platinum', hex: '#e8e4da', strength: 0.55 },
  { id: 'auburn', name: 'Auburn', hex: '#8b3a2b', strength: 0.65 },
  { id: 'silver', name: 'Silver', hex: '#c8c8c8', strength: 0.55 },
  { id: 'ash_brown', name: 'Ash Brown', hex: '#5f544b', strength: 0.62 },
  { id: 'chestnut', name: 'Chestnut', hex: '#7b3f2a', strength: 0.66 },
  { id: 'copper', name: 'Copper', hex: '#b4663a', strength: 0.68 },
  { id: 'rose_gold', name: 'Rose Gold', hex: '#c98a86', strength: 0.58 },
  { id: 'mahogany', name: 'Mahogany', hex: '#4b1f1f', strength: 0.7 },
  { id: 'burgundy', name: 'Burgundy', hex: '#5b1f35', strength: 0.68 },
  { id: 'blue_black', name: 'Blue Black', hex: '#1a1f2c', strength: 0.74 },
  { id: 'honey_blonde', name: 'Honey Blonde', hex: '#cfa55f', strength: 0.6 },
  { id: 'caramel', name: 'Caramel', hex: '#a06a3e', strength: 0.63 },
  { id: 'chocolate', name: 'Chocolate', hex: '#4a2f23', strength: 0.69 },
  { id: 'ginger', name: 'Ginger', hex: '#b65d2b', strength: 0.67 },
  { id: 'purple_plum', name: 'Plum', hex: '#4b325f', strength: 0.62 },
  { id: 'navy_tint', name: 'Navy Tint', hex: '#273b6a', strength: 0.6 },
  { id: 'emerald_tint', name: 'Emerald Tint', hex: '#2e6a56', strength: 0.58 },
  { id: 'pastel_pink', name: 'Pastel Pink', hex: '#d9a4b2', strength: 0.52 },
  { id: 'lavender', name: 'Lavender', hex: '#9c8bbf', strength: 0.55 },
];

function mergePresets(apiPresets: HairColorPreset[]): HairColorPreset[] {
  const byId = new Map<string, HairColorPreset>();
  for (const preset of DEFAULT_HAIR_COLOR_PRESETS) byId.set(preset.id, preset);
  for (const preset of apiPresets) byId.set(preset.id, preset);
  return Array.from(byId.values());
}

function UploadTile({
  image,
  onSelect,
  onRemove,
}: {
  image: string | null;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: '100%',
          height: 340,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          backgroundColor: colors.bgCard,
          borderWidth: image ? 0 : 2,
          borderStyle: image ? 'solid' : 'dashed',
          borderColor: image ? colors.borderLight : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        preview: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        placeholder: {
          alignItems: 'center',
          gap: 12,
        },
        iconWrap: {
          width: 58,
          height: 58,
          borderRadius: 16,
          backgroundColor: colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderText: {
          ...typography.bodyMedium,
          color: colors.textSecondary,
        },
        removeButton: {
          position: 'absolute',
          top: 12,
          right: 12,
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, image]
  );

  return (
    <Pressable onPress={onSelect}>
      <View style={styles.card}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={styles.preview} />
            <Pressable onPress={onRemove} style={styles.removeButton}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconWrap}>
              <Ionicons name="image-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.placeholderText}>Upload your selfie</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [hairColorPresets, setHairColorPresets] = useState<HairColorPreset[]>(DEFAULT_HAIR_COLOR_PRESETS);
  const [selectedHairColorId, setSelectedHairColorId] = useState(DEFAULT_HAIR_COLOR_PRESETS[0]?.id || '');
  const [hairStylePresets, setHairStylePresets] = useState<HairStylePreset[]>([
    { id: 'no_change', name: 'Keep Current' },
    { id: 'straight', name: 'Straight' },
    { id: 'wavy', name: 'Wavy' },
    { id: 'curly', name: 'Curly' },
    { id: 'bob', name: 'Bob' },
    { id: 'pixie_cut', name: 'Pixie Cut' },
    { id: 'layered', name: 'Layered' },
    { id: 'soft_waves', name: 'Soft Waves' },
    { id: 'side_parted', name: 'Side-Parted' },
    { id: 'center_parted', name: 'Center-Parted' },
    { id: 'blunt_bangs', name: 'Blunt Bangs' },
    { id: 'side_swept_bangs', name: 'Side-Swept Bangs' },
    { id: 'slicked_back', name: 'Slicked Back' },
    { id: 'shag', name: 'Shag' },
    { id: 'lob', name: 'Lob' },
    { id: 'angled_bob', name: 'Angled Bob' },
    { id: 'a_line_bob', name: 'A-Line Bob' },
    { id: 'faux_hawk', name: 'Faux Hawk' },
    { id: 'high_ponytail', name: 'High Ponytail' },
    { id: 'low_ponytail', name: 'Low Ponytail' },
    { id: 'messy_bun', name: 'Messy Bun' },
    { id: 'top_knot', name: 'Top Knot' },
    { id: 'french_braid', name: 'French Braid' },
    { id: 'dutch_braid', name: 'Dutch Braid' },
    { id: 'fishtail_braid', name: 'Fishtail Braid' },
  ]);
  const [eyeColorPresets, setEyeColorPresets] = useState<EyeColorPreset[]>([
    { id: 'current', name: 'Current' },
    { id: 'brown', name: 'Brown' },
    { id: 'hazel', name: 'Hazel' },
    { id: 'green', name: 'Green' },
    { id: 'blue', name: 'Blue' },
    { id: 'gray', name: 'Gray' },
  ]);
  const [selectedEyeColorId, setSelectedEyeColorId] = useState('current');
  const [selectedHairStyleId, setSelectedHairStyleId] = useState('no_change');
  const [loadingColors, setLoadingColors] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadColors = async () => {
      setLoadingColors(true);
      try {
        const presets = await fetchHairColors();
        const styles = await fetchHairStyles();
        const eyes = await fetchEyeColors();
        if (cancelled) return;
        const merged = mergePresets(presets);
        setHairColorPresets(merged);
        if (styles.length > 0) {
          setHairStylePresets(styles);
          setSelectedHairStyleId((prev) => prev || styles[0].id);
        }
        if (eyes.length > 0) {
          setEyeColorPresets(eyes);
          setSelectedEyeColorId((prev) => prev || eyes[0].id);
        }
        if (merged[0]) {
          setSelectedHairColorId((prev) => prev || merged[0].id);
        }
      } catch {
        if (cancelled) return;
        setHairColorPresets(DEFAULT_HAIR_COLOR_PRESETS);
      } finally {
        if (!cancelled) setLoadingColors(false);
      }
    };

    void loadColors();

    return () => {
      cancelled = true;
    };
  }, []);

  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const dataUri = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
      setSelfieImage(dataUri);
      trackEvent('photo_uploaded', { source: 'library', flow: 'hair_color' });
    }
  };

  const pickImageFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Please allow camera access in Settings.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const dataUri = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
      setSelfieImage(dataUri);
      trackEvent('photo_uploaded', { source: 'camera', flow: 'hair_color' });
    }
  };

  const pickImage = () => {
    Alert.alert('Upload photo', 'Choose how you want to upload.', [
      {
        text: 'Camera',
        onPress: () => {
          void pickImageFromCamera();
        },
      },
      {
        text: 'Photo Library',
        onPress: () => {
          void pickImageFromLibrary();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const canGenerate = Boolean(selfieImage && selectedHairColorId);

  const ctaLabel = useMemo(() => {
    if (!selfieImage) return 'Upload your photo';
    if (!selectedHairColorId) return 'Pick a hair color';
    return 'Apply Hair Color';
  }, [selectedHairColorId, selfieImage]);

  const selectedPreset = hairColorPresets.find((item) => item.id === selectedHairColorId) || null;

  const handleGenerate = async () => {
    if (!canGenerate || !selfieImage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('elements_selected', {
      colorId: selectedHairColorId || 'custom',
      mode: 'hair_color_fast',
    });

    const session = createHairSwapSession({
      selfie: selfieImage,
      look: selfieImage,
      elements: 'Hair Color',
      swapMode: 'fast',
      hairColorId: selectedHairColorId || '',
      hairStyleId: selectedHairStyleId || 'no_change',
      eyeColorId: selectedEyeColorId || 'current',
    });

    router.push({
      pathname: '/create/loading',
      params: {
        sessionId: session.id,
      },
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          paddingHorizontal: layout.screenPadding,
          paddingBottom: 24,
        },
        leadCard: {
          marginTop: 12,
          borderRadius: borderRadius.xl,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: 14,
          gap: 8,
        },
        leadTitle: {
          ...typography.labelLarge,
          color: colors.textPrimary,
        },
        leadText: {
          ...typography.bodySmall,
          color: colors.textSecondary,
        },
        section: {
          marginTop: 16,
        },
        sectionTitle: {
          ...typography.labelLarge,
          color: colors.textPrimary,
          marginBottom: 10,
        },
        colorRow: {
          paddingRight: 6,
        },
        colorChip: {
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginRight: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        colorChipActive: {
          backgroundColor: colors.accentMuted,
          borderColor: colors.accent,
        },
        colorDot: {
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: colors.border,
        },
        colorChipText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        colorChipTextActive: {
          color: colors.textPrimary,
        },
        hint: {
          marginTop: 8,
          ...typography.caption,
          color: colors.textTertiary,
        },
        bottomBar: {
          backgroundColor: colors.bgPrimary,
          paddingHorizontal: layout.screenPadding,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
      }),
    [colors]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Your Look</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 160 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(60).duration(280)} style={styles.leadCard}>
            <Text style={styles.leadTitle}>Hair Color Swap</Text>
            <Text style={styles.leadText}>
              Upload one photo, choose a shade, and apply realistic color without changing your face.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(280)} style={styles.section}>
            <Text style={styles.sectionTitle}>Your Photo</Text>
            <UploadTile
              image={selfieImage}
              onSelect={pickImage}
              onRemove={() => setSelfieImage(null)}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(280)} style={styles.section}>
            <Text style={styles.sectionTitle}>Hair Color</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {hairColorPresets.map((preset) => {
                const active = selectedHairColorId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => setSelectedHairColorId(preset.id)}
                    style={[styles.colorChip, active && styles.colorChipActive]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: preset.hex }]} />
                    <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>
                      {preset.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.hint}>
              {loadingColors
                ? 'Loading preset colors...'
                : selectedPreset
                  ? `${selectedPreset.name} selected`
                  : 'Pick a preset color.'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(280)} style={styles.section}>
            <Text style={styles.sectionTitle}>Hair Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {hairStylePresets.map((style) => {
                const active = selectedHairStyleId === style.id;
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => setSelectedHairStyleId(style.id)}
                    style={[styles.colorChip, active && styles.colorChipActive]}
                  >
                    <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>
                      {style.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.hint}>
              Hairstyle and color are applied together.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(280)} style={styles.section}>
            <Text style={styles.sectionTitle}>Eye Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {eyeColorPresets.map((eye) => {
                const active = selectedEyeColorId === eye.id;
                return (
                  <Pressable
                    key={eye.id}
                    onPress={() => setSelectedEyeColorId(eye.id)}
                    style={[styles.colorChip, active && styles.colorChipActive]}
                  >
                    <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>
                      {eye.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.hint}>
              {selectedEyeColorId === 'current'
                ? 'Current eye color selected.'
                : 'Eye color change will be applied after hair transformation.'}
            </Text>
          </Animated.View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + layout.tabBarHeight + 8 }]}> 
          <PrimaryButton
            label={ctaLabel}
            onPress={handleGenerate}
            disabled={!canGenerate}
            icon={canGenerate ? 'sparkles' : undefined}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

import React, { ReactNode, useEffect, useMemo, useState } from 'react';
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

type OutfitColorPreset = {
  id: string;
  name: string;
  hex: string;
};

const OUTFIT_COLORS: OutfitColorPreset[] = [
  { id: 'no_change', name: 'No Change', hex: '#9AA2B4' },
  { id: 'ivory', name: 'Ivory', hex: '#ECE8DF' },
  { id: 'camel', name: 'Camel', hex: '#B38C5E' },
  { id: 'charcoal', name: 'Charcoal', hex: '#384152' },
  { id: 'sage', name: 'Sage', hex: '#8CA58A' },
  { id: 'teal', name: 'Teal', hex: '#2B7280' },
  { id: 'rust', name: 'Rust', hex: '#A85A3A' },
  { id: 'navy', name: 'Navy', hex: '#2A3E70' },
  { id: 'berry', name: 'Berry', hex: '#7F4063' },
  { id: 'black', name: 'Black', hex: '#191C22' },
];

const EYE_COLOR_HEX: Record<string, string> = {
  current: '#9FA6B8',
  brown: '#6C4B32',
  hazel: '#9A7A44',
  green: '#4E7F52',
  blue: '#456FA0',
  gray: '#828A96',
};

const HAIR_STYLE_ICON_OVERRIDES: Record<string, keyof typeof Ionicons.glyphMap> = {
  no_change: 'remove-circle-outline',
  straight: 'swap-horizontal-outline',
  wavy: 'water-outline',
  soft_waves: 'water-outline',
  curly: 'sync-outline',
  bob: 'cut-outline',
  lob: 'cut-outline',
  angled_bob: 'cut-outline',
  a_line_bob: 'cut-outline',
  pixie_cut: 'cut-outline',
  shag: 'layers-outline',
  layered: 'layers-outline',
  side_parted: 'pause-outline',
  center_parted: 'pause-outline',
  blunt_bangs: 'remove-outline',
  side_swept_bangs: 'remove-outline',
  slicked_back: 'arrow-up-outline',
  faux_hawk: 'flame-outline',
  high_ponytail: 'trending-up-outline',
  low_ponytail: 'trending-down-outline',
  messy_bun: 'ellipse-outline',
  top_knot: 'ellipse-outline',
  french_braid: 'git-branch-outline',
  dutch_braid: 'git-branch-outline',
  fishtail_braid: 'git-branch-outline',
};

type ExpandableSectionKey = 'hairColor' | 'hairStyle' | 'eyeColor' | 'outfitColors';

function mergePresets(apiPresets: HairColorPreset[]): HairColorPreset[] {
  const byId = new Map<string, HairColorPreset>();
  for (const preset of DEFAULT_HAIR_COLOR_PRESETS) byId.set(preset.id, preset);
  for (const preset of apiPresets) byId.set(preset.id, preset);
  return Array.from(byId.values());
}

function getHairStyleIcon(styleId: string): keyof typeof Ionicons.glyphMap {
  const key = styleId.toLowerCase();
  if (HAIR_STYLE_ICON_OVERRIDES[key]) return HAIR_STYLE_ICON_OVERRIDES[key];
  if (key.includes('braid')) return 'git-branch-outline';
  if (key.includes('bun') || key.includes('knot')) return 'ellipse-outline';
  if (key.includes('pony')) return 'trending-up-outline';
  if (key.includes('bang')) return 'remove-outline';
  if (key.includes('part')) return 'pause-outline';
  if (key.includes('bob') || key.includes('pixie') || key.includes('cut')) return 'cut-outline';
  if (key.includes('curly') || key.includes('wavy')) return 'water-outline';
  if (key.includes('layer')) return 'layers-outline';
  return 'sparkles-outline';
}

function getEyeColorHex(eyeColorId: string): string {
  return EYE_COLOR_HEX[eyeColorId] || '#7082A0';
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

function ExpandableSection({
  title,
  expanded,
  onToggle,
  onExpand,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          marginTop: 16,
        },
        header: {
          borderRadius: borderRadius.lg,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.borderLight,
          paddingHorizontal: 12,
          paddingVertical: 11,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        title: {
          ...typography.labelLarge,
          color: colors.textPrimary,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        expandText: {
          ...typography.caption,
          color: colors.accent,
        },
        body: {
          paddingTop: 10,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onExpand}>
            <Text style={styles.expandText}>Expand</Text>
          </Pressable>
          <Pressable onPress={onToggle}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
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
  const [selectedTopColorId, setSelectedTopColorId] = useState('no_change');
  const [selectedBottomColorId, setSelectedBottomColorId] = useState('no_change');
  const [loadingColors, setLoadingColors] = useState(true);
  const [focusedCategory, setFocusedCategory] = useState<ExpandableSectionKey | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<ExpandableSectionKey, boolean>>({
    hairColor: true,
    hairStyle: true,
    eyeColor: true,
    outfitColors: true,
  });

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

  const toggleSection = (key: ExpandableSectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedAttributeCount = useMemo(() => {
    let count = 0;
    if (selectedHairColorId && selectedHairColorId !== 'current') count += 1;
    if (selectedHairStyleId && selectedHairStyleId !== 'no_change') count += 1;
    if (selectedEyeColorId && selectedEyeColorId !== 'current') count += 1;
    if (selectedTopColorId && selectedTopColorId !== 'no_change') count += 1;
    if (selectedBottomColorId && selectedBottomColorId !== 'no_change') count += 1;
    return count;
  }, [selectedBottomColorId, selectedEyeColorId, selectedHairColorId, selectedHairStyleId, selectedTopColorId]);

  const canGenerate = Boolean(selfieImage && selectedAttributeCount > 0);

  const ctaLabel = useMemo(() => {
    if (!selfieImage) return 'Upload your photo';
    if (selectedAttributeCount === 0) return 'Select at least one attribute';
    if (selectedAttributeCount === 1) return 'Apply this attribute';
    return 'Apply selected attributes';
  }, [selectedAttributeCount, selfieImage]);

  const selectedPreset = hairColorPresets.find((item) => item.id === selectedHairColorId) || null;

  const selectedElementLabels = useMemo(() => {
    const labels: string[] = [];
    if (selectedHairColorId !== 'current') labels.push('Hair Color');
    if (selectedHairStyleId !== 'no_change') labels.push('Hair Style');
    if (selectedEyeColorId !== 'current') labels.push('Eye Color');
    if (selectedTopColorId !== 'no_change') labels.push('Top Color');
    if (selectedBottomColorId !== 'no_change') labels.push('Bottom Color');
    return labels;
  }, [selectedBottomColorId, selectedEyeColorId, selectedHairColorId, selectedHairStyleId, selectedTopColorId]);

  const handleGenerate = async () => {
    if (!canGenerate || !selfieImage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('elements_selected', {
      attributeCount: selectedAttributeCount,
      colorId: selectedHairColorId || 'current',
      mode: 'hair_color_fast',
      topColorId: selectedTopColorId,
      bottomColorId: selectedBottomColorId,
    });

    const session = createHairSwapSession({
      selfie: selfieImage,
      look: selfieImage,
      elements: selectedElementLabels.join(', ') || 'Hair Color',
      swapMode: 'fast',
      hairColorId: selectedHairColorId || 'current',
      hairStyleId: selectedHairStyleId || 'no_change',
      eyeColorId: selectedEyeColorId || 'current',
      topColorId: selectedTopColorId,
      bottomColorId: selectedBottomColorId,
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
        iconRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingRight: 6,
        },
        iconChip: {
          width: 46,
          height: 46,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconChipActive: {
          borderColor: colors.accent,
          backgroundColor: colors.accentMuted,
        },
        eyeChip: {
          width: 52,
          height: 52,
          borderRadius: 16,
          borderWidth: 0,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        eyeChipActive: {
          backgroundColor: colors.accentMuted,
        },
        eyeDot: {
          position: 'absolute',
          bottom: 10,
          width: 8,
          height: 8,
          borderRadius: 4,
        },
        outfitRowTitleWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        },
        outfitRowTitle: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        swatchChip: {
          width: 44,
          height: 44,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgCard,
          marginRight: 8,
        },
        swatchChipActive: {
          borderColor: colors.accent,
          backgroundColor: colors.accentMuted,
        },
        swatchFill: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: colors.border,
        },
        focusedOverlay: {
          position: 'absolute',
          top: layout.headerHeight,
          left: 0,
          right: 0,
          bottom: insets.bottom + layout.tabBarHeight + 4,
          backgroundColor: colors.bgPrimary,
          zIndex: 20,
          paddingHorizontal: layout.screenPadding,
          paddingTop: 12,
        },
        focusedHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        focusedTitle: {
          ...typography.labelLarge,
          color: colors.textPrimary,
        },
        shrinkText: {
          ...typography.caption,
          color: colors.accent,
        },
        bottomBar: {
          backgroundColor: colors.bgPrimary,
          paddingHorizontal: layout.screenPadding,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
      }),
    [colors, insets.bottom]
  );

  const renderHairColor = () => (
    <>
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
    </>
  );

  const renderHairStyle = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconRow}>
        {hairStylePresets.map((style) => {
          const active = selectedHairStyleId === style.id;
          const icon = getHairStyleIcon(style.id);
          return (
            <Pressable
              key={style.id}
              accessibilityLabel={style.name}
              onPress={() => setSelectedHairStyleId(style.id)}
              style={[styles.iconChip, active && styles.iconChipActive]}
            >
              <Ionicons
                name={icon}
                size={20}
                color={active ? colors.textPrimary : colors.textSecondary}
              />
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.hint}>Each style has its own icon mapping.</Text>
    </>
  );

  const renderEyeColor = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconRow}>
        {eyeColorPresets.map((eye) => {
          const active = selectedEyeColorId === eye.id;
          const eyeHex = getEyeColorHex(eye.id);
          return (
            <Pressable
              key={eye.id}
              accessibilityLabel={eye.name}
              onPress={() => setSelectedEyeColorId(eye.id)}
              style={[styles.eyeChip, active && styles.eyeChipActive]}
            >
              <Ionicons name="eye-outline" size={22} color={eyeHex} />
              <View style={[styles.eyeDot, { backgroundColor: eyeHex }]} />
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.hint}>Eye icon color previews the selected eye tone.</Text>
    </>
  );

  const renderOutfitColors = () => (
    <>
      <View style={styles.outfitRowTitleWrap}>
        <Ionicons name="shirt-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.outfitRowTitle}>Top</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
        {OUTFIT_COLORS.map((preset) => {
          const active = selectedTopColorId === preset.id;
          return (
            <Pressable
              key={`top-${preset.id}`}
              accessibilityLabel={`Top ${preset.name}`}
              onPress={() => setSelectedTopColorId(preset.id)}
              style={[styles.swatchChip, active && styles.swatchChipActive]}
            >
              <View style={[styles.swatchFill, { backgroundColor: preset.hex }]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.outfitRowTitleWrap, { marginTop: 12 }]}>
        <Ionicons name="walk-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.outfitRowTitle}>Bottom</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
        {OUTFIT_COLORS.map((preset) => {
          const active = selectedBottomColorId === preset.id;
          return (
            <Pressable
              key={`bottom-${preset.id}`}
              accessibilityLabel={`Bottom ${preset.name}`}
              onPress={() => setSelectedBottomColorId(preset.id)}
              style={[styles.swatchChip, active && styles.swatchChipActive]}
            >
              <View style={[styles.swatchFill, { backgroundColor: preset.hex }]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );

  const getFocusedTitle = (key: ExpandableSectionKey): string => {
    if (key === 'hairColor') return 'Hair Color';
    if (key === 'hairStyle') return 'Hair Style';
    if (key === 'eyeColor') return 'Eye Color';
    return 'Outfit Colors';
  };

  const renderCategoryContent = (key: ExpandableSectionKey): ReactNode => {
    if (key === 'hairColor') return renderHairColor();
    if (key === 'hairStyle') return renderHairStyle();
    if (key === 'eyeColor') return renderEyeColor();
    return renderOutfitColors();
  };

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
            <Text style={styles.leadTitle}>Attribute Mixer</Text>
            <Text style={styles.leadText}>
              Combine hair, eyes, hairstyle, and outfit tones. Expand a category into full page, then shrink back.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(280)}>
            <Text style={styles.sectionTitle}>Your Photo</Text>
            <UploadTile
              image={selfieImage}
              onSelect={pickImage}
              onRemove={() => setSelfieImage(null)}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(280)}>
            <ExpandableSection
              title="Hair Color"
              expanded={expandedSections.hairColor}
              onToggle={() => toggleSection('hairColor')}
              onExpand={() => setFocusedCategory('hairColor')}
            >
              {renderHairColor()}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(280)}>
            <ExpandableSection
              title="Hair Style"
              expanded={expandedSections.hairStyle}
              onToggle={() => toggleSection('hairStyle')}
              onExpand={() => setFocusedCategory('hairStyle')}
            >
              {renderHairStyle()}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(280)}>
            <ExpandableSection
              title="Eye Color"
              expanded={expandedSections.eyeColor}
              onToggle={() => toggleSection('eyeColor')}
              onExpand={() => setFocusedCategory('eyeColor')}
            >
              {renderEyeColor()}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(280)}>
            <ExpandableSection
              title="Outfit Colors"
              expanded={expandedSections.outfitColors}
              onToggle={() => toggleSection('outfitColors')}
              onExpand={() => setFocusedCategory('outfitColors')}
            >
              {renderOutfitColors()}
            </ExpandableSection>
          </Animated.View>
        </ScrollView>

        {focusedCategory ? (
          <View style={styles.focusedOverlay}>
            <View style={styles.focusedHeader}>
              <Text style={styles.focusedTitle}>{getFocusedTitle(focusedCategory)}</Text>
              <Pressable onPress={() => setFocusedCategory(null)}>
                <Text style={styles.shrinkText}>Shrink</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderCategoryContent(focusedCategory)}
            </ScrollView>
          </View>
        ) : null}

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

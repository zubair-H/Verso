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
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp, LinearTransition } from 'react-native-reanimated';

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

type ExpandableSectionKey =
  | 'hairColor'
  | 'hairStyle'
  | 'eyeColor'
  | 'lips'
  | 'eyebrows'
  | 'eyebrowColor'
  | 'outfitColors';

type FeaturePreset = {
  id: string;
  name: string;
};

type ColorPreset = {
  id: string;
  name: string;
  hex: string;
};

const DEFAULT_HAIR_COLOR_PRESETS: HairColorPreset[] = [
  { id: 'current', name: 'Current', hex: '#9b9b9b', strength: 0 },
  { id: 'jet_black', name: 'Jet Black', hex: '#111111', strength: 0.75 },
  { id: 'dark_brown', name: 'Dark Brown', hex: '#2a1b12', strength: 0.7 },
  { id: 'light_brown', name: 'Light Brown', hex: '#6b4a2f', strength: 0.65 },
  { id: 'blonde', name: 'Blonde', hex: '#d8c07a', strength: 0.6 },
  { id: 'platinum', name: 'Platinum', hex: '#e8e4da', strength: 0.55 },
  { id: 'auburn', name: 'Auburn', hex: '#8b3a2b', strength: 0.65 },
  { id: 'silver', name: 'Silver', hex: '#c8c8c8', strength: 0.55 },
];

const HAIR_STYLE_PREVIEW_IMAGES: Record<string, string> = {
  no_change: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=520&fit=crop',
  buzz: 'https://images.unsplash.com/photo-1542204625-de293a4f7a17?w=400&h=520&fit=crop',
  'taper-fade': 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=520&fit=crop',
  straight: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=520&fit=crop',
  wavy: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
  curly: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=520&fit=crop',
  bob: 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=400&h=520&fit=crop',
  pixie_cut: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=520&fit=crop',
  layered: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=520&fit=crop',
  soft_waves: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=520&fit=crop',
  side_parted: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=520&fit=crop',
  center_parted: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=520&fit=crop',
  blunt_bangs: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=520&fit=crop',
  side_swept_bangs: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=520&fit=crop',
  slicked_back: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  shag: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=520&fit=crop',
  lob: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  angled_bob: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  a_line_bob: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  faux_hawk: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=520&fit=crop',
  high_ponytail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=520&fit=crop',
  low_ponytail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=520&fit=crop',
  messy_bun: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=520&fit=crop',
  top_knot: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=520&fit=crop',
  french_braid: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
  dutch_braid: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
  fishtail_braid: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
};

const LIP_PRESETS: FeaturePreset[] = [
  { id: 'full', name: 'Full' },
  { id: 'defined_cupid', name: 'Cupid' },
  { id: 'soft_matte', name: 'Soft' },
  { id: 'glossy', name: 'Glossy' },
];

const EYEBROW_PRESETS: FeaturePreset[] = [
  { id: 'natural', name: 'Natural' },
  { id: 'arched', name: 'Arched' },
  { id: 'straight', name: 'Straight' },
  { id: 'feathered', name: 'Feather' },
];

const EYEBROW_COLOR_PRESETS: ColorPreset[] = [
  { id: 'soft_black', name: 'Soft Black', hex: '#1C1E24' },
  { id: 'espresso', name: 'Espresso', hex: '#2F241E' },
  { id: 'cool_brown', name: 'Cool Brown', hex: '#4A3D37' },
  { id: 'warm_brown', name: 'Warm Brown', hex: '#654637' },
  { id: 'taupe', name: 'Taupe', hex: '#7D716A' },
  { id: 'auburn', name: 'Auburn', hex: '#7B4638' },
];

const OUTFIT_COLORS: ColorPreset[] = [
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

function mergePresets(apiPresets: HairColorPreset[]): HairColorPreset[] {
  const byId = new Map<string, HairColorPreset>();
  for (const preset of DEFAULT_HAIR_COLOR_PRESETS) byId.set(preset.id, preset);
  for (const preset of apiPresets) byId.set(preset.id, preset);
  return Array.from(byId.values());
}

function getEyeColorHex(id: string) {
  return EYE_COLOR_HEX[id] || '#7082A0';
}

function getHairPreviewImage(styleId: string) {
  return HAIR_STYLE_PREVIEW_IMAGES[styleId] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop';
}

function UploadTile({ image, onSelect, onRemove }: { image: string | null; onSelect: () => void; onRemove: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: '100%',
          height: 300,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          backgroundColor: colors.bgCard,
          borderWidth: image ? 0 : 2,
          borderStyle: image ? 'solid' : 'dashed',
          borderColor: image ? colors.borderLight : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        preview: { width: '100%', height: '100%', resizeMode: 'cover' },
        placeholder: { alignItems: 'center', gap: 12 },
        iconWrap: {
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderText: { ...typography.bodyMedium, color: colors.textSecondary },
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
  onExpand,
  onClear,
  clearDisabled = false,
  allowExpand = true,
  children,
}: {
  title: string;
  onExpand: () => void;
  onClear: () => void;
  clearDisabled?: boolean;
  allowExpand?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: { marginTop: 16 },
        header: {
          paddingHorizontal: 0,
          paddingVertical: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        title: { ...typography.labelLarge, color: colors.textPrimary },
        actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        clearButton: {
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        actionText: { ...typography.caption, color: colors.accent },
        body: { paddingTop: 10 },
      }),
    [colors]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actions}>
          {allowExpand ? (
            <Pressable onPress={onExpand}>
              <Text style={styles.actionText}>View all</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onClear} disabled={clearDisabled} style={styles.clearButton} hitSlop={8}>
            <Ionicons name="close" size={16} color={clearDisabled ? colors.textTertiary : colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      <Animated.View
        style={styles.body}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        layout={LinearTransition.springify().damping(18).stiffness(180)}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function LipsShapeGlyph({ id, color }: { id: string; color: string }) {
  if (id === 'full') return <View style={{ width: 26, height: 14, borderRadius: 7, backgroundColor: color }} />;
  if (id === 'defined_cupid') return <View style={{ width: 24, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color }} />;
  if (id === 'soft_matte') return <View style={{ width: 22, height: 10, borderRadius: 5, backgroundColor: color, opacity: 0.8 }} />;
  if (id === 'glossy') return <View style={{ width: 22, height: 12, borderRadius: 6, backgroundColor: color, opacity: 0.95 }} />;
  return <View style={{ width: 20, height: 8, borderRadius: 4, borderWidth: 2, borderColor: color }} />;
}

function BrowShapeGlyph({ id, color }: { id: string; color: string }) {
  if (id === 'arched') return <View style={{ width: 24, height: 8, borderRadius: 8, borderWidth: 2, borderColor: color }} />;
  if (id === 'straight') return <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: color }} />;
  if (id === 'feathered') return <View style={{ width: 24, height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.72 }} />;
  if (id === 'natural') return <View style={{ width: 20, height: 6, borderRadius: 3, backgroundColor: color }} />;
  return <View style={{ width: 18, height: 6, borderRadius: 3, borderWidth: 2, borderColor: color }} />;
}

export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [hairColorPresets, setHairColorPresets] = useState<HairColorPreset[]>(DEFAULT_HAIR_COLOR_PRESETS);
  const [hairStylePresets, setHairStylePresets] = useState<HairStylePreset[]>([]);
  const [eyeColorPresets, setEyeColorPresets] = useState<EyeColorPreset[]>([]);
  const [failedHairPreviewIds, setFailedHairPreviewIds] = useState<Record<string, boolean>>({});

  const [selectedHairColorId, setSelectedHairColorId] = useState<string | null>(null);
  const [selectedHairStyleId, setSelectedHairStyleId] = useState<string | null>(null);
  const [selectedEyeColorId, setSelectedEyeColorId] = useState<string | null>(null);
  const [selectedLipsId, setSelectedLipsId] = useState<string | null>(null);
  const [selectedEyebrowsId, setSelectedEyebrowsId] = useState<string | null>(null);
  const [selectedEyebrowColorId, setSelectedEyebrowColorId] = useState<string | null>(null);
  const [selectedTopColorId, setSelectedTopColorId] = useState<string | null>(null);
  const [selectedBottomColorId, setSelectedBottomColorId] = useState<string | null>(null);

  const [loadingColors, setLoadingColors] = useState(true);
  const [focusedCategory, setFocusedCategory] = useState<ExpandableSectionKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingColors(true);
      try {
        const [colorsRes, stylesRes, eyesRes] = await Promise.all([fetchHairColors(), fetchHairStyles(), fetchEyeColors()]);
        if (cancelled) return;
        setHairColorPresets(mergePresets(colorsRes));
        if (stylesRes.length > 0) setHairStylePresets(stylesRes);
        if (eyesRes.length > 0) setEyeColorPresets(eyesRes);
      } catch {
        if (!cancelled) setHairColorPresets(DEFAULT_HAIR_COLOR_PRESETS);
      } finally {
        if (!cancelled) setLoadingColors(false);
      }
    };
    void load();
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
      { text: 'Camera', onPress: () => void pickImageFromCamera() },
      { text: 'Photo Library', onPress: () => void pickImageFromLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openFocusedCategory = (key: ExpandableSectionKey) => {
    setFocusedCategory(key);
  };

  const visibleHairColorPresets = useMemo(() => hairColorPresets.filter((p) => p.id !== 'current'), [hairColorPresets]);
  const visibleHairStylePresets = useMemo(() => hairStylePresets.filter((p) => p.id !== 'no_change'), [hairStylePresets]);
  const visibleEyeColorPresets = useMemo(() => eyeColorPresets.filter((p) => p.id !== 'current'), [eyeColorPresets]);

  const clearCategory = (key: ExpandableSectionKey) => {
    if (key === 'hairColor') setSelectedHairColorId(null);
    if (key === 'hairStyle') setSelectedHairStyleId(null);
    if (key === 'eyeColor') setSelectedEyeColorId(null);
    if (key === 'lips') setSelectedLipsId(null);
    if (key === 'eyebrows') setSelectedEyebrowsId(null);
    if (key === 'eyebrowColor') setSelectedEyebrowColorId(null);
    if (key === 'outfitColors') {
      setSelectedTopColorId(null);
      setSelectedBottomColorId(null);
    }
  };

  const selectedAttributeCount = useMemo(() => {
    let count = 0;
    if (selectedHairColorId) count += 1;
    if (selectedHairStyleId) count += 1;
    if (selectedEyeColorId) count += 1;
    if (selectedLipsId) count += 1;
    if (selectedEyebrowsId) count += 1;
    if (selectedEyebrowColorId) count += 1;
    if (selectedTopColorId) count += 1;
    if (selectedBottomColorId) count += 1;
    return count;
  }, [selectedBottomColorId, selectedEyeColorId, selectedEyebrowColorId, selectedEyebrowsId, selectedHairColorId, selectedHairStyleId, selectedLipsId, selectedTopColorId]);

  const ctaLabel = useMemo(() => {
    if (!selfieImage) return 'Upload your photo';
    if (selectedAttributeCount === 0) return 'Select at least one attribute';
    if (selectedAttributeCount === 1) return 'Apply this attribute';
    return 'Apply selected attributes';
  }, [selectedAttributeCount, selfieImage]);

  const canGenerate = Boolean(selfieImage && selectedAttributeCount > 0);

  const selectedElements = useMemo(() => {
    const labels: string[] = [];
    if (selectedHairColorId) labels.push('Hair Color');
    if (selectedHairStyleId) labels.push('Hair Style');
    if (selectedEyeColorId) labels.push('Eye Color');
    if (selectedLipsId) labels.push('Lips');
    if (selectedEyebrowsId) labels.push('Eyebrows');
    if (selectedEyebrowColorId) labels.push('Eyebrow Color');
    if (selectedTopColorId) labels.push('Top Color');
    if (selectedBottomColorId) labels.push('Bottom Color');
    return labels;
  }, [selectedBottomColorId, selectedEyeColorId, selectedEyebrowColorId, selectedEyebrowsId, selectedHairColorId, selectedHairStyleId, selectedLipsId, selectedTopColorId]);

  const handleGenerate = async () => {
    if (!canGenerate || !selfieImage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const session = createHairSwapSession({
      selfie: selfieImage,
      look: selfieImage,
      elements: selectedElements.join(', ') || 'Hair Color',
      swapMode: 'fast',
      hairColorId: selectedHairColorId || undefined,
      hairStyleId: selectedHairStyleId || undefined,
      eyeColorId: selectedEyeColorId || undefined,
      lipsId: selectedLipsId || undefined,
      eyebrowsId: selectedEyebrowsId || undefined,
      eyebrowColorId: selectedEyebrowColorId || undefined,
      topColorId: selectedTopColorId || undefined,
      bottomColorId: selectedBottomColorId || undefined,
    });

    router.push({ pathname: '/create/loading', params: { sessionId: session.id } });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bgPrimary },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.screenPadding,
          height: layout.headerHeight,
          gap: 12,
        },
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
        scrollView: { flex: 1 },
        scrollContent: { paddingHorizontal: layout.screenPadding, paddingBottom: 24 },
        leadCard: {
          marginTop: 12,
          borderRadius: borderRadius.xl,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: 14,
          gap: 8,
        },
        leadTitle: { ...typography.labelLarge, color: colors.textPrimary },
        leadText: { ...typography.bodySmall, color: colors.textSecondary },
        sectionTitle: { ...typography.labelLarge, color: colors.textPrimary, marginBottom: 10 },
        hint: { marginTop: 8, ...typography.caption, color: colors.textTertiary },
        row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 6 },
        gridWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        },
        squareTileWrap: { width: '31%' },
        squareTile: {
          width: '100%',
          aspectRatio: 1,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          paddingHorizontal: 6,
          paddingVertical: 8,
        },
        squareTileActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
        squareTileSwatch: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: colors.border,
        },
        squareTileText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
        squareTileTextActive: { color: colors.textPrimary },
        chip: {
          width: 64,
          height: 64,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        chipActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
        chipLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
        hairCardWrap: { width: 96, marginRight: 10 },
        hairCardWrapGrid: { width: '31%', marginRight: 0 },
        hairCard: {
          width: '100%',
          aspectRatio: 0.78,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
        },
        hairCardActive: { borderColor: colors.accent, borderWidth: 2 },
        hairImage: { width: '100%', height: '100%', resizeMode: 'cover' },
        hairCardLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
        hairFallback: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgSecondary,
          gap: 4,
        },
        hairFallbackText: { ...typography.caption, color: colors.textSecondary },
        colorChip: {
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgSecondary,
          borderWidth: 1,
          borderColor: colors.borderLight,
          paddingVertical: 9,
          paddingHorizontal: 13,
          marginRight: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        colorChipActive: { borderColor: colors.accent, backgroundColor: colors.bgCard },
        colorDot: {
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: colors.border,
        },
        colorChipText: { ...typography.caption, color: colors.textSecondary },
        colorChipTextActive: { color: colors.textPrimary },
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
        focusedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
        focusedTitle: { ...typography.labelLarge, color: colors.textPrimary },
        shrinkButton: {
          paddingHorizontal: 10,
          paddingVertical: 8,
          marginRight: -10,
        },
        shrinkText: { ...typography.caption, color: colors.accent },
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

  const renderVisualOptions = (
    items: FeaturePreset[],
    selectedId: string | null,
    onSelect: (id: string | null) => void,
    glyph: (id: string, color: string) => ReactNode,
    asGrid = false
  ) => {
    const content = (
      <>
        {items.map((item) => {
          const active = selectedId === item.id;
          return (
            <View key={item.id} style={{ alignItems: 'center' }}>
              <Pressable onPress={() => onSelect(item.id)} style={[styles.chip, active && styles.chipActive]}>
                {glyph(item.id, active ? colors.textPrimary : colors.textSecondary)}
              </Pressable>
              <Text style={styles.chipLabel}>{item.name}</Text>
            </View>
          );
        })}
      </>
    );

    if (asGrid) {
      return <View style={styles.gridWrap}>{content}</View>;
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {content}
      </ScrollView>
    );
  };

  const renderHairStyle = (asGrid = false) => {
    const content = (
      <>
        {visibleHairStylePresets.map((style) => {
          const active = selectedHairStyleId === style.id;
          const previewUri = getHairPreviewImage(style.id);
          return (
            <Pressable
              key={style.id}
              onPress={() => setSelectedHairStyleId(style.id)}
              style={[styles.hairCardWrap, asGrid && styles.hairCardWrapGrid]}
            >
              <View style={[styles.hairCard, active && styles.hairCardActive]}>
                {failedHairPreviewIds[style.id] ? (
                  <View style={styles.hairFallback}>
                    <Ionicons name="cut-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.hairFallbackText}>Preview</Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: previewUri }}
                    style={styles.hairImage}
                    onError={() => setFailedHairPreviewIds((prev) => ({ ...prev, [style.id]: true }))}
                  />
                )}
              </View>
              <Text style={styles.hairCardLabel}>{style.name}</Text>
            </Pressable>
          );
        })}
      </>
    );

    return (
      <>
        {asGrid ? (
          <View style={styles.gridWrap}>{content}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {content}
          </ScrollView>
        )}
      </>
    );
  };

  const renderHairColor = (asGrid = false) => (
    <>
      {asGrid ? (
        <View style={styles.gridWrap}>
          {visibleHairColorPresets.map((preset) => {
            const active = selectedHairColorId === preset.id;
            return (
              <View key={preset.id} style={styles.squareTileWrap}>
                <Pressable
                  onPress={() => setSelectedHairColorId(preset.id)}
                  style={[styles.squareTile, active && styles.squareTileActive]}
                >
                  <View style={[styles.squareTileSwatch, { backgroundColor: preset.hex }]} />
                  <Text style={[styles.squareTileText, active && styles.squareTileTextActive]}>{preset.name}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {visibleHairColorPresets.map((preset) => {
            const active = selectedHairColorId === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() => setSelectedHairColorId(preset.id)}
                style={[styles.colorChip, active && styles.colorChipActive]}
              >
                <View style={[styles.colorDot, { backgroundColor: preset.hex }]} />
                <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>{preset.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
     
    </>
  );

  const renderEyeColor = (asGrid = false) => (
    <>
      {asGrid ? (
        <View style={styles.gridWrap}>
          {visibleEyeColorPresets.map((eye) => {
            const active = selectedEyeColorId === eye.id;
            const eyeHex = getEyeColorHex(eye.id);
            return (
              <View key={eye.id} style={{ alignItems: 'center' }}>
                <Pressable onPress={() => setSelectedEyeColorId(eye.id)} style={[styles.chip, active && styles.chipActive]}>
                  <Ionicons name="eye-outline" size={24} color={eyeHex} />
                </Pressable>
                <Text style={styles.chipLabel}>{eye.name}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {visibleEyeColorPresets.map((eye) => {
            const active = selectedEyeColorId === eye.id;
            const eyeHex = getEyeColorHex(eye.id);
            return (
              <View key={eye.id} style={{ alignItems: 'center' }}>
                <Pressable onPress={() => setSelectedEyeColorId(eye.id)} style={[styles.chip, active && styles.chipActive]}>
                  <Ionicons name="eye-outline" size={24} color={eyeHex} />
                </Pressable>
                <Text style={styles.chipLabel}>{eye.name}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
     
    </>
  );

  const renderEyebrowColor = (asGrid = false) => (
    <>
      {asGrid ? (
        <View style={styles.gridWrap}>
          {EYEBROW_COLOR_PRESETS.map((preset) => {
            const active = selectedEyebrowColorId === preset.id;
            return (
              <View key={preset.id} style={{ alignItems: 'center' }}>
                <Pressable onPress={() => setSelectedEyebrowColorId(preset.id)} style={[styles.chip, active && styles.chipActive]}>
                  <BrowShapeGlyph id="natural" color={preset.hex} />
                </Pressable>
                <Text style={styles.chipLabel}>{preset.name}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {EYEBROW_COLOR_PRESETS.map((preset) => {
            const active = selectedEyebrowColorId === preset.id;
            return (
              <View key={preset.id} style={{ alignItems: 'center' }}>
                <Pressable onPress={() => setSelectedEyebrowColorId(preset.id)} style={[styles.chip, active && styles.chipActive]}>
                  <BrowShapeGlyph id="natural" color={preset.hex} />
                </Pressable>
                <Text style={styles.chipLabel}>{preset.name}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    
    </>
  );

  const renderOutfitColors = (asGrid = false) => (
    <>
      <Text style={styles.hint}>Top</Text>
      {asGrid ? (
        <View style={styles.gridWrap}>
          {OUTFIT_COLORS.map((preset) => {
            const active = selectedTopColorId === preset.id;
            return (
              <View key={`top-${preset.id}`} style={styles.squareTileWrap}>
                <Pressable onPress={() => setSelectedTopColorId(preset.id)} style={[styles.squareTile, active && styles.squareTileActive]}>
                  <View style={[styles.squareTileSwatch, { backgroundColor: preset.hex }]} />
                  <Text style={[styles.squareTileText, active && styles.squareTileTextActive]}>{preset.name}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {OUTFIT_COLORS.map((preset) => {
            const active = selectedTopColorId === preset.id;
            return (
              <Pressable key={`top-${preset.id}`} onPress={() => setSelectedTopColorId(preset.id)} style={[styles.colorChip, active && styles.colorChipActive]}>
                <View style={[styles.colorDot, { backgroundColor: preset.hex }]} />
                <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>{preset.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Text style={styles.hint}>Bottom</Text>
      {asGrid ? (
        <View style={styles.gridWrap}>
          {OUTFIT_COLORS.map((preset) => {
            const active = selectedBottomColorId === preset.id;
            return (
              <View key={`bottom-${preset.id}`} style={styles.squareTileWrap}>
                <Pressable onPress={() => setSelectedBottomColorId(preset.id)} style={[styles.squareTile, active && styles.squareTileActive]}>
                  <View style={[styles.squareTileSwatch, { backgroundColor: preset.hex }]} />
                  <Text style={[styles.squareTileText, active && styles.squareTileTextActive]}>{preset.name}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {OUTFIT_COLORS.map((preset) => {
            const active = selectedBottomColorId === preset.id;
            return (
              <Pressable key={`bottom-${preset.id}`} onPress={() => setSelectedBottomColorId(preset.id)} style={[styles.colorChip, active && styles.colorChipActive]}>
                <View style={[styles.colorDot, { backgroundColor: preset.hex }]} />
                <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>{preset.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  const getFocusedTitle = (key: ExpandableSectionKey): string => {
    if (key === 'hairColor') return 'Hair Color';
    if (key === 'hairStyle') return 'Hair Style';
    if (key === 'eyeColor') return 'Eye Color';
    if (key === 'lips') return 'Lips';
    if (key === 'eyebrows') return 'Eyebrows';
    if (key === 'eyebrowColor') return 'Eyebrow Color';
    return 'Outfit Colors';
  };

  const renderCategoryContent = (key: ExpandableSectionKey): ReactNode => {
    if (key === 'hairColor') return renderHairColor(true);
    if (key === 'hairStyle') return renderHairStyle(true);
    if (key === 'eyeColor') return renderEyeColor(true);
    if (key === 'lips') return renderVisualOptions(LIP_PRESETS, selectedLipsId, setSelectedLipsId, (id, c) => <LipsShapeGlyph id={id} color={c} />, true);
    if (key === 'eyebrows') return renderVisualOptions(EYEBROW_PRESETS, selectedEyebrowsId, setSelectedEyebrowsId, (id, c) => <BrowShapeGlyph id={id} color={c} />, true);
    if (key === 'eyebrowColor') return renderEyebrowColor(true);
    return renderOutfitColors(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Your Look</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 160 }]} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(120).duration(280)}>
            <Text style={styles.sectionTitle}>Your Photo</Text>
            <UploadTile image={selfieImage} onSelect={pickImage} onRemove={() => setSelfieImage(null)} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(280)}>
            <ExpandableSection
              title="Hair Color"
              onExpand={() => openFocusedCategory('hairColor')}
              onClear={() => clearCategory('hairColor')}
              clearDisabled={!selectedHairColorId}
            >
              {renderHairColor()}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(280)}>
            <ExpandableSection
              title="Hair Style"
              onExpand={() => openFocusedCategory('hairStyle')}
              onClear={() => clearCategory('hairStyle')}
              clearDisabled={!selectedHairStyleId}
            >
              {renderHairStyle()}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(280)}>
            <ExpandableSection
              title="Eye Color"
              onExpand={() => openFocusedCategory('eyeColor')}
              onClear={() => clearCategory('eyeColor')}
              clearDisabled={!selectedEyeColorId}
            >
              {renderEyeColor()}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(280).duration(280)}>
            <ExpandableSection
              title="Lips"
              onExpand={() => setFocusedCategory('lips')}
              onClear={() => clearCategory('lips')}
              clearDisabled={!selectedLipsId}
              allowExpand={false}
            >
              {renderVisualOptions(LIP_PRESETS, selectedLipsId, setSelectedLipsId, (id, c) => <LipsShapeGlyph id={id} color={c} />)}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).duration(280)}>
            <ExpandableSection
              title="Eyebrows"
              onExpand={() => setFocusedCategory('eyebrows')}
              onClear={() => clearCategory('eyebrows')}
              clearDisabled={!selectedEyebrowsId}
              allowExpand={false}
            >
              {renderVisualOptions(EYEBROW_PRESETS, selectedEyebrowsId, setSelectedEyebrowsId, (id, c) => <BrowShapeGlyph id={id} color={c} />)}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(360).duration(280)}>
            <ExpandableSection
              title="Eyebrow Color"
              onExpand={() => openFocusedCategory('eyebrowColor')}
              onClear={() => clearCategory('eyebrowColor')}
              clearDisabled={!selectedEyebrowColorId}
            >
              {renderEyebrowColor()}
            </ExpandableSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(280)}>
            <ExpandableSection
              title="Outfit Colors"
              onExpand={() => openFocusedCategory('outfitColors')}
              onClear={() => clearCategory('outfitColors')}
              clearDisabled={!selectedTopColorId && !selectedBottomColorId}
            >
              {renderOutfitColors()}
            </ExpandableSection>
          </Animated.View>
        </ScrollView>

        {focusedCategory ? (
          <Animated.View style={styles.focusedOverlay} entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}>
            <View style={styles.focusedHeader}>
              <Text style={styles.focusedTitle}>{getFocusedTitle(focusedCategory)}</Text>
              <Pressable onPress={() => setFocusedCategory(null)} hitSlop={10} style={styles.shrinkButton}>
                <Text style={styles.shrinkText}>Shrink</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>{renderCategoryContent(focusedCategory)}</ScrollView>
          </Animated.View>
        ) : null}

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + layout.tabBarHeight + 8 }]}> 
          <PrimaryButton label={ctaLabel} onPress={handleGenerate} disabled={!canGenerate} icon={canGenerate ? 'sparkles' : undefined} style={{ width: '100%' }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

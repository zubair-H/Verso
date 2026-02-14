import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/ui';
import { TransformationVisualizer } from '@/components/home';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';

interface AttributeGroup {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tags: string[];
}

type CreateMode = 'create' | 'face' | 'hair' | 'color' | 'skin' | 'style';

interface ModeConfig {
  id: CreateMode;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  singleUpload: boolean;
  groups: AttributeGroup[];
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'create',
    title: 'Create Your Look',
    icon: 'sparkles',
    singleUpload: false,
    groups: [
      {
        id: 'hair',
        title: 'Hair',
        icon: 'cut',
        tags: ['Hair volume', 'Hairline shape', 'Hair texture', 'Parting direction'],
      },
      {
        id: 'face',
        title: 'Face',
        icon: 'scan',
        tags: ['Face shape', 'Jawline contour', 'Eyebrow shape', 'Eye makeup'],
      },
      {
        id: 'color',
        title: 'Color',
        icon: 'color-palette',
        tags: ['Lip tone', 'Skin finish', 'Undertone palette', 'Contrast level'],
      },
      {
        id: 'style',
        title: 'Style',
        icon: 'shirt',
        tags: ['Outfit silhouette', 'Layering style', 'Accessories', 'Entire vibe'],
      },
      {
        id: 'makeup',
        title: 'Makeup',
        icon: 'sparkles',
        tags: ['Blush placement', 'Eyeliner shape', 'Lash style', 'Highlight intensity'],
      },
      {
        id: 'accessories',
        title: 'Accessories',
        icon: 'diamond-outline',
        tags: ['Glasses style', 'Earring shape', 'Necklace layer', 'Hat profile'],
      },
      {
        id: 'beard',
        title: 'Beard',
        icon: 'male-outline',
        tags: ['Beard density', 'Jawline beard shape', 'Mustache style', 'Fade blend'],
      },
      {
        id: 'pose',
        title: 'Pose',
        icon: 'body-outline',
        tags: ['Head tilt', 'Shoulder angle', 'Expression mood', 'Camera framing'],
      },
    ],
  },
  {
    id: 'face',
    title: 'Face Shape Analysis',
    icon: 'scan',
    singleUpload: true,
    groups: [
      {
        id: 'face-structure',
        title: 'Structure',
        icon: 'square-outline',
        tags: ['Forehead width', 'Cheekbone width', 'Jaw taper', 'Chin shape'],
      },
      {
        id: 'face-balance',
        title: 'Balance',
        icon: 'resize-outline',
        tags: ['Facial symmetry', 'Feature spacing', 'Vertical thirds', 'Profile depth'],
      },
      {
        id: 'face-enhance',
        title: 'Enhance',
        icon: 'sparkles-outline',
        tags: ['Contour placement', 'Brow shaping', 'Framing haircut', 'Ideal neckline'],
      },
    ],
  },
  {
    id: 'hair',
    title: 'Hair Texture Analysis',
    icon: 'cut',
    singleUpload: true,
    groups: [
      {
        id: 'hair-texture',
        title: 'Texture',
        icon: 'water-outline',
        tags: ['Wave pattern', 'Curl definition', 'Frizz level', 'Density mapping'],
      },
      {
        id: 'hair-shape',
        title: 'Shape',
        icon: 'ellipse-outline',
        tags: ['Top volume', 'Side weight', 'Back silhouette', 'Part direction'],
      },
      {
        id: 'hair-finish',
        title: 'Finish',
        icon: 'color-wand-outline',
        tags: ['Shine level', 'Root lift', 'Hold strength', 'Style longevity'],
      },
    ],
  },
  {
    id: 'color',
    title: 'Color Analysis',
    icon: 'color-palette',
    singleUpload: true,
    groups: [
      {
        id: 'color-undertone',
        title: 'Undertone',
        icon: 'contrast-outline',
        tags: ['Warm undertone', 'Cool undertone', 'Neutral undertone', 'Olive undertone'],
      },
      {
        id: 'color-contrast',
        title: 'Contrast',
        icon: 'swap-horizontal-outline',
        tags: ['Low contrast palette', 'Medium contrast palette', 'High contrast palette', 'Monochrome range'],
      },
      {
        id: 'color-palette',
        title: 'Palette',
        icon: 'apps-outline',
        tags: ['Best neutrals', 'Statement colors', 'Makeup tones', 'Hair color direction'],
      },
    ],
  },
  {
    id: 'skin',
    title: 'Skin Tone Analysis',
    icon: 'sunny-outline',
    singleUpload: true,
    groups: [
      {
        id: 'skin-tone',
        title: 'Tone',
        icon: 'radio-button-on-outline',
        tags: ['Light-medium tone', 'Medium-deep tone', 'Evenness map', 'Surface redness'],
      },
      {
        id: 'skin-finish',
        title: 'Finish',
        icon: 'sparkles-outline',
        tags: ['Matte finish', 'Natural finish', 'Dewy finish', 'Soft-blur finish'],
      },
      {
        id: 'skin-match',
        title: 'Match',
        icon: 'flask-outline',
        tags: ['Foundation depth', 'Concealer lift', 'Bronzer tone', 'Blush harmony'],
      },
    ],
  },
  {
    id: 'style',
    title: 'Style DNA Analysis',
    icon: 'shirt-outline',
    singleUpload: true,
    groups: [
      {
        id: 'style-vibe',
        title: 'Vibe',
        icon: 'sparkles-outline',
        tags: ['Old money', 'Street luxury', 'Minimal chic', 'Editorial bold'],
      },
      {
        id: 'style-fit',
        title: 'Fit',
        icon: 'expand-outline',
        tags: ['Structured fit', 'Relaxed fit', 'Cropped proportions', 'Layer hierarchy'],
      },
      {
        id: 'style-signature',
        title: 'Signature',
        icon: 'diamond-outline',
        tags: ['Statement accessory', 'Hero piece', 'Texture mix', 'Color blocking'],
      },
    ],
  },
];

const SOFT_LAYOUT = Layout.duration(180);

function normalizeAttribute(input: string) {
  return input.trim().replace(/,+/g, ' ').replace(/\s+/g, ' ');
}

function SingleUploadTile({
  image,
  onSelect,
  onRemove,
  title,
}: {
  image: string | null;
  onSelect: () => void;
  onRemove: () => void;
  title: string;
}) {
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
        preview: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        placeholder: {
          alignItems: 'center',
          gap: 10,
        },
        iconWrap: {
          width: 52,
          height: 52,
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
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.overlay,
        },
        caption: {
          ...typography.labelSmall,
          color: colors.textPrimary,
          marginTop: 10,
          textAlign: 'center',
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
            <Pressable style={styles.removeButton} onPress={onRemove}>
              <Ionicons name="close" size={13} color="#FFFFFF" />
            </Pressable>
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconWrap}>
              <Ionicons name="image-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.placeholderText}>Upload image</Text>
          </View>
        )}
      </View>
      <Text style={styles.caption}>{title}</Text>
    </Pressable>
  );
}

export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ presetImage?: string; mode?: string | string[]; category?: string | string[] }>();

  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [lookImage, setLookImage] = useState<string | null>(null);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [customAttribute, setCustomAttribute] = useState('');
  const [activeMode, setActiveMode] = useState<CreateMode>('create');
  const [activeCategory, setActiveCategory] = useState<string>(MODE_CONFIGS[0].groups[0].id);

  const activeModeConfig = useMemo(
    () => MODE_CONFIGS.find((mode) => mode.id === activeMode) ?? MODE_CONFIGS[0],
    [activeMode]
  );
  const activeGroups = activeModeConfig.groups;

  useEffect(() => {
    if (params.presetImage) {
      setLookImage(params.presetImage);
    }
  }, [params.presetImage]);

  useEffect(() => {
    const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
    const requestedCategory = Array.isArray(params.category) ? params.category[0] : params.category;
    if (!requestedMode) {
      return;
    }
    const matchedMode = MODE_CONFIGS.find((mode) => mode.id === requestedMode);
    if (!matchedMode) {
      return;
    }
    setActiveMode(matchedMode.id);
    const matchedCategory = matchedMode.groups.find((group) => group.id === requestedCategory);
    setActiveCategory(matchedCategory ? matchedCategory.id : matchedMode.groups[0].id);
  }, [params.mode, params.category]);

  const pickImage = async (type: 'selfie' | 'look' | 'analysis') => {
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
      } else if (type === 'look') {
        setLookImage(uri);
      } else {
        setAnalysisImage(uri);
      }
      trackEvent('photo_uploaded', { type });
    }
  };

  const toggleAttribute = async (attribute: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAttributes((prev) => {
      const active = prev.includes(attribute);
      trackEvent('attribute_tag_toggled', { attribute, selected: !active });
      return active ? prev.filter((item) => item !== attribute) : [...prev, attribute];
    });
  };

  const addCustomAttribute = async () => {
    const normalized = normalizeAttribute(customAttribute);
    if (!normalized) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAttributes((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === normalized.toLowerCase());
      if (exists) {
        return prev;
      }
      return [...prev, normalized];
    });
    setCustomAttribute('');
    trackEvent('custom_attribute_added', { attribute: normalized });
  };

  const removeAttribute = async (attribute: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAttributes((prev) => prev.filter((item) => item !== attribute));
  };

  const selectCategory = async (category: string) => {
    if (category === activeCategory) {
      return;
    }
    await Haptics.selectionAsync();
    setActiveCategory(category);
  };

  const selectMode = async (modeId: CreateMode) => {
    if (modeId === activeMode) {
      return;
    }
    const nextMode = MODE_CONFIGS.find((mode) => mode.id === modeId);
    if (!nextMode) {
      return;
    }
    await Haptics.selectionAsync();
    setActiveMode(nextMode.id);
    setActiveCategory(nextMode.groups[0].id);
    setSelectedAttributes([]);
    setCustomAttribute('');
  };

  const clearAttributes = async () => {
    if (selectedAttributes.length === 0) {
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAttributes([]);
  };

  const activeGroup = useMemo(
    () => activeGroups.find((group) => group.id === activeCategory) ?? activeGroups[0],
    [activeCategory, activeGroups]
  );

  const hasRequiredUpload = activeModeConfig.singleUpload
    ? Boolean(analysisImage)
    : Boolean(selfieImage && lookImage);
  const canGenerate = Boolean(hasRequiredUpload && selectedAttributes.length > 0);
  const ctaLabel = useMemo(() => {
    if (activeModeConfig.singleUpload) {
      if (!analysisImage) {
        return `Upload photo for ${activeModeConfig.title}`;
      }
      if (selectedAttributes.length === 0) {
        return 'Select at least one attribute';
      }
      return `Run ${activeModeConfig.title} (${selectedAttributes.length})`;
    }

    if (!selfieImage && !lookImage) {
      return 'Upload both photos';
    }
    if (!selfieImage) {
      return 'Upload your photo';
    }
    if (!lookImage) {
      return 'Upload celebrity photo';
    }
    if (selectedAttributes.length === 0) {
      return 'Select at least one attribute';
    }
    return `Generate Look (${selectedAttributes.length})`;
  }, [activeModeConfig, analysisImage, selfieImage, lookImage, selectedAttributes.length]);

  const handleGenerate = async () => {
    if (!canGenerate) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    const selfieParam = activeModeConfig.singleUpload ? analysisImage : selfieImage;
    const lookParam = activeModeConfig.singleUpload ? analysisImage : lookImage;
    if (!selfieParam || !lookParam) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('elements_selected', {
      elements: selectedAttributes.join(','),
      count: selectedAttributes.length,
      mode: activeModeConfig.id,
    });

    router.push({
      pathname: '/create/result',
      params: {
        selfie: selfieParam,
        look: lookParam,
        elements: selectedAttributes.join(','),
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
          paddingBottom: 32,
        },
        modeScroll: {
          marginTop: 4,
        },
        modeRow: {
          flexDirection: 'row',
          paddingHorizontal: layout.screenPadding,
          paddingRight: layout.screenPadding + 8,
        },
        modeChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgCard,
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginRight: 8,
        },
        modeChipActive: {
          backgroundColor: colors.accentMuted,
        },
        modeChipText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        modeChipTextActive: {
          color: colors.textPrimary,
        },
        section: {
          marginTop: 16,
          paddingHorizontal: layout.screenPadding,
        },
        uploadSection: {
          marginTop: 14,
        },
        attributesSection: {
          marginTop: 32,
        },
        plannerCard: {
          paddingTop: 2,
        },
        plannerHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        plannerTitle: {
          ...typography.labelLarge,
          color: colors.textPrimary,
        },
        clearButton: {
          paddingHorizontal: 6,
          paddingVertical: 4,
        },
        clearText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        customRow: {
          marginTop: 10,
        },
        customComposer: {
          minHeight: 56,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.bgCard,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        customInput: {
          flex: 1,
          minHeight: 40,
          color: colors.textPrimary,
          paddingHorizontal: 8,
          paddingVertical: 8,
          ...typography.bodyMedium,
        },
        composerAddButton: {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        composerAddButtonActive: {
          backgroundColor: colors.accent,
        },
        selectedRow: {
          marginTop: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -4,
        },
        selectedChip: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgTertiary,
          paddingVertical: 6,
          paddingHorizontal: 10,
          marginHorizontal: 4,
          marginBottom: 8,
          gap: 8,
        },
        selectedChipText: {
          ...typography.caption,
          color: colors.textPrimary,
        },
        categoryScroll: {
          marginTop: 12,
        },
        categoryRow: {
          flexDirection: 'row',
          paddingHorizontal: layout.screenPadding,
          paddingRight: layout.screenPadding + 8,
        },
        categoryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgCard,
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginHorizontal: 4,
          marginBottom: 8,
        },
        categoryButtonActive: {
          backgroundColor: colors.accentMuted,
        },
        categoryText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        categoryTextActive: {
          color: colors.textPrimary,
        },
        optionsDivider: {
          marginTop: 4,
          marginBottom: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        optionsDividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.borderLight,
          opacity: 0.7,
        },
        optionsDividerText: {
          ...typography.caption,
          color: colors.textTertiary,
        },
        tagsWrap: {
          marginTop: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -4,
        },
        tag: {
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgCard,
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginHorizontal: 4,
          marginBottom: 8,
        },
        tagActive: {
          backgroundColor: colors.accentMuted,
        },
        tagText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        tagTextActive: {
          color: colors.textPrimary,
        },
        bottomBar: {
          backgroundColor: colors.bgPrimary,
          paddingHorizontal: layout.screenPadding,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        bottomButton: {
          width: '100%',
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 150 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.modeScroll}
            contentContainerStyle={styles.modeRow}
          >
            {MODE_CONFIGS.map((mode) => {
              const active = mode.id === activeMode;
              return (
                <Pressable
                  key={mode.id}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  onPress={() => selectMode(mode.id)}
                >
                  <Ionicons
                    name={mode.icon}
                    size={13}
                    color={active ? colors.textPrimary : colors.textSecondary}
                  />
                  <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                    {mode.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Animated.View
            entering={FadeInDown.delay(80).duration(320)}
            layout={SOFT_LAYOUT}
            style={[styles.section, styles.uploadSection]}
          >
            {activeModeConfig.singleUpload ? (
              <SingleUploadTile
                image={analysisImage}
                onSelect={() => pickImage('analysis')}
                onRemove={() => setAnalysisImage(null)}
                title={`${activeModeConfig.title} photo`}
              />
            ) : (
              <TransformationVisualizer
                selfieImage={selfieImage}
                lookImage={lookImage}
                onSelectSelfie={() => pickImage('selfie')}
                onSelectLook={() => pickImage('look')}
                onRemoveSelfie={() => setSelfieImage(null)}
                onRemoveLook={() => setLookImage(null)}
              />
            )}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(140).duration(320)}
            layout={SOFT_LAYOUT}
            style={[styles.section, styles.attributesSection]}
          >
            <Animated.View style={styles.plannerCard} layout={SOFT_LAYOUT}>
              <Animated.View style={styles.plannerHeader} layout={SOFT_LAYOUT}>
                <Text style={styles.plannerTitle}>Attributes</Text>
                {selectedAttributes.length > 0 && (
                  <Pressable onPress={clearAttributes} style={styles.clearButton}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                )}
              </Animated.View>

              {selectedAttributes.length > 0 && (
                <Animated.View
                  style={styles.selectedRow}
                  layout={SOFT_LAYOUT}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(140)}
                >
                  {selectedAttributes.map((attribute) => (
                    <Animated.View
                      key={attribute}
                      layout={SOFT_LAYOUT}
                      entering={FadeIn.duration(160)}
                      exiting={FadeOut.duration(120)}
                    >
                      <Pressable
                        style={styles.selectedChip}
                        onPress={() => removeAttribute(attribute)}
                      >
                        <Text style={styles.selectedChipText}>{attribute}</Text>
                        <Ionicons name="close" size={12} color={colors.textSecondary} />
                      </Pressable>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}

              <Animated.View style={styles.customRow} layout={SOFT_LAYOUT}>
                <View style={styles.customComposer}>
                  <Ionicons name="create-outline" size={16} color={colors.textTertiary} />
                  <TextInput
                    style={styles.customInput}
                    value={customAttribute}
                    onChangeText={setCustomAttribute}
                    placeholder="Type your own attribute"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={addCustomAttribute}
                  />
                  <Pressable
                    style={[
                      styles.composerAddButton,
                      customAttribute.trim().length > 0 && styles.composerAddButtonActive,
                    ]}
                    onPress={addCustomAttribute}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={customAttribute.trim().length > 0 ? colors.textOnAccent : colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View layout={SOFT_LAYOUT}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryRow}
                >
                  {activeGroups.map((group) => {
                    const active = activeCategory === group.id;
                    return (
                      <Animated.View key={group.id} layout={SOFT_LAYOUT}>
                        <Pressable
                          style={[styles.categoryButton, active && styles.categoryButtonActive]}
                          onPress={() => selectCategory(group.id)}
                        >
                          <Ionicons
                            name={group.icon}
                            size={13}
                            color={active ? colors.textPrimary : colors.textSecondary}
                          />
                          <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                            {group.title}
                          </Text>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
              </Animated.View>

              <Animated.View style={styles.optionsDivider} layout={SOFT_LAYOUT}>
                <View style={styles.optionsDividerLine} />
                <Text style={styles.optionsDividerText}>{activeGroup.title} options</Text>
                <View style={styles.optionsDividerLine} />
              </Animated.View>

              <Animated.View
                key={activeGroup.id}
                style={styles.tagsWrap}
                layout={SOFT_LAYOUT}
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(140)}
              >
                {activeGroup.tags.map((tag) => {
                  const active = selectedAttributes.includes(tag);
                  return (
                    <Animated.View
                      key={`${activeGroup.id}-${tag}`}
                      layout={SOFT_LAYOUT}
                      entering={FadeIn.duration(160)}
                      exiting={FadeOut.duration(120)}
                    >
                      <Pressable
                        style={[styles.tag, active && styles.tagActive]}
                        onPress={() => toggleAttribute(tag)}
                      >
                        <Text style={[styles.tagText, active && styles.tagTextActive]}>
                          {tag}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + layout.tabBarHeight + 8 }]}>
          <Animated.View
            key={ctaLabel}
            layout={SOFT_LAYOUT}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
          >
            <PrimaryButton
              label={ctaLabel}
              onPress={handleGenerate}
              disabled={!canGenerate}
              icon={canGenerate ? 'sparkles' : undefined}
              style={styles.bottomButton}
            />
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

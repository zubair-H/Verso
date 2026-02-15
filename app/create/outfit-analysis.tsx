import React, { ReactNode, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { AnalysisTags } from '@/components/create/AnalysisTags';
import { UploadTile } from '@/components/create/facial/UploadTile';
import { ExpandableSection } from '@/components/create/facial/ExpandableSection';
import { OutfitTypeGlyph, type OutfitGlyphId } from '@/components/create/outfit/OutfitGlyphs';
import { PrimaryButton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout } from '@/constants/spacing';
import { createFacialStyles } from './facial/styles';

type OutfitSectionKey =
  | 'topType'
  | 'topColor'
  | 'bottomType'
  | 'bottomColor'
  | 'styleVibe';

type Option = {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  glyph?: OutfitGlyphId;
};
type SectionDef = { key: OutfitSectionKey; title: string; options: Option[] };
type OutfitSelections = Record<OutfitSectionKey, string | null>;

const SECTIONS: SectionDef[] = [
  {
    key: 'topType',
    title: 'Top Type',
    options: [
      { id: 'tee', label: 'Tee', glyph: 'tee' },
      { id: 'shirt', label: 'Shirt', glyph: 'shirt' },
      { id: 'blouse', label: 'Blouse', glyph: 'blouse' },
      { id: 'hoodie', label: 'Hoodie', glyph: 'hoodie' },
      { id: 'blazer', label: 'Blazer', glyph: 'blazer' },
      { id: 'knitwear', label: 'Knitwear', glyph: 'knitwear' },
    ],
  },
  {
    key: 'topColor',
    title: 'Top Color',
    options: [
      { id: 'black', label: 'Black' },
      { id: 'white', label: 'White' },
      { id: 'beige', label: 'Beige' },
      { id: 'brown', label: 'Brown' },
      { id: 'navy', label: 'Navy' },
      { id: 'green', label: 'Green' },
      { id: 'red', label: 'Red' },
      { id: 'pink', label: 'Pink' },
    ],
  },
  {
    key: 'bottomType',
    title: 'Bottom Type',
    options: [
      { id: 'jeans', label: 'Jeans', glyph: 'jeans' },
      { id: 'trousers', label: 'Trousers', glyph: 'trousers' },
      { id: 'cargo', label: 'Cargo', glyph: 'cargo' },
      { id: 'skirt', label: 'Skirt', glyph: 'skirt' },
      { id: 'shorts', label: 'Shorts', glyph: 'shorts' },
      { id: 'leggings', label: 'Leggings', glyph: 'leggings' },
    ],
  },
  {
    key: 'bottomColor',
    title: 'Bottom Color',
    options: [
      { id: 'black', label: 'Black' },
      { id: 'white', label: 'White' },
      { id: 'beige', label: 'Beige' },
      { id: 'brown', label: 'Brown' },
      { id: 'navy', label: 'Navy' },
      { id: 'gray', label: 'Gray' },
      { id: 'olive', label: 'Olive' },
      { id: 'blue', label: 'Blue' },
    ],
  },
  {
    key: 'styleVibe',
    title: 'Style Vibe',
    options: [
      { id: 'minimal', label: 'Minimal', icon: 'remove-outline' },
      { id: 'street', label: 'Street', icon: 'flash-outline' },
      { id: 'smart-casual', label: 'Smart Casual', icon: 'briefcase-outline' },
      { id: 'classy', label: 'Classy', icon: 'diamond-outline' },
      { id: 'edgy', label: 'Edgy', icon: 'thunderstorm-outline' },
      { id: 'sporty', label: 'Sporty', icon: 'fitness-outline' },
    ],
  },
];

const INITIAL_SELECTIONS: OutfitSelections = {
  topType: null,
  topColor: null,
  bottomType: null,
  bottomColor: null,
  styleVibe: null,
};

const COLOR_SWATCHES: Record<string, string> = {
  black: '#111111',
  white: '#F2F2F2',
  beige: '#D8C3A5',
  brown: '#7A4E2D',
  navy: '#1E3A6D',
  green: '#3C8D40',
  red: '#C53939',
  pink: '#D97AAE',
  gray: '#8C8C8C',
  olive: '#6B7A3D',
  blue: '#2B6ACF',
};

export default function OutfitAnalysisScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createFacialStyles(colors, insets.bottom), [colors, insets.bottom]);
  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        optionPill: {
          borderRadius: layout.screenPadding,
          backgroundColor: colors.bgSecondary,
          borderWidth: 1,
          borderColor: colors.borderLight,
          paddingVertical: 9,
          paddingHorizontal: 13,
          marginRight: 10,
        },
        optionPillActive: {
          borderColor: colors.accent,
          backgroundColor: colors.accentMuted,
        },
        optionText: {
          ...typography.caption,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        optionLabelWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          minWidth: 72,
        },
        optionTextWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        optionTextActive: {
          color: colors.textPrimary,
        },
        helperText: {
          marginTop: 8,
          ...typography.caption,
          color: colors.textTertiary,
        },
        colorDot: {
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: colors.border,
        },
      }),
    [colors]
  );

  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [focusedCategory, setFocusedCategory] = useState<OutfitSectionKey | null>(null);
  const [selections, setSelections] = useState<OutfitSelections>(INITIAL_SELECTIONS);

  const selectedLabels = useMemo(
    () =>
      SECTIONS.map((section) => {
        const selectedId = selections[section.key];
        if (!selectedId) return null;
        return section.options.find((option) => option.id === selectedId)?.label || null;
      }).filter((label): label is string => Boolean(label)),
    [selections]
  );

  const canGenerate = Boolean(analysisImage && selectedLabels.length > 0);

  const ctaLabel = useMemo(() => {
    if (!analysisImage) return 'Upload outfit photo';
    if (selectedLabels.length === 0) return 'Select outfit attributes';
    return `Analyze Outfit (${selectedLabels.length})`;
  }, [analysisImage, selectedLabels.length]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAnalysisImage(result.assets[0].uri);
    }
  };

  const toggleOption = async (key: OutfitSectionKey, id: string) => {
    await Haptics.selectionAsync();
    setSelections((prev) => ({
      ...prev,
      [key]: prev[key] === id ? null : id,
    }));
  };

  const clearCategory = async (key: OutfitSectionKey) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelections((prev) => ({ ...prev, [key]: null }));
  };

  const getSectionByKey = (key: OutfitSectionKey) => SECTIONS.find((section) => section.key === key)!;
  const isColorSection = (key: OutfitSectionKey) => key === 'topColor' || key === 'bottomColor';
  const isGarmentTypeSection = (key: OutfitSectionKey) => key === 'topType' || key === 'bottomType';

  const renderOptionRow = (section: SectionDef): ReactNode => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {section.options.map((option) => {
        const active = selections[section.key] === option.id;
        const colorSection = isColorSection(section.key);
        const garmentSection = isGarmentTypeSection(section.key);
        const swatch = COLOR_SWATCHES[option.id] || colors.textSecondary;
        return (
          <Pressable
            key={option.id}
            onPress={() => toggleOption(section.key, option.id)}
            style={[localStyles.optionPill, active && localStyles.optionPillActive]}
          >
            {colorSection ? (
              <View style={localStyles.optionTextWrap}>
                <View style={[localStyles.colorDot, { backgroundColor: swatch }]} />
                <Text style={[localStyles.optionText, active && localStyles.optionTextActive]}>{option.label}</Text>
              </View>
            ) : (
              <View style={localStyles.optionLabelWrap}>
                {garmentSection && option.glyph ? (
                  <OutfitTypeGlyph id={option.glyph} color={active ? colors.textPrimary : colors.textSecondary} size={21} />
                ) : (
                  <Ionicons
                    name={option.icon || 'sparkles'}
                    size={18}
                    color={active ? colors.textPrimary : colors.textSecondary}
                  />
                )}
                <Text style={[localStyles.optionText, active && localStyles.optionTextActive]}>{option.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderOptionGrid = (section: SectionDef): ReactNode => (
    <View style={styles.gridWrap}>
      {section.options.map((option) => {
        const active = selections[section.key] === option.id;
        const colorSection = isColorSection(section.key);
        const garmentSection = isGarmentTypeSection(section.key);
        const swatch = COLOR_SWATCHES[option.id] || colors.textSecondary;
        return (
          <View key={option.id} style={styles.squareTileWrap}>
            <Pressable
              onPress={() => toggleOption(section.key, option.id)}
              style={[styles.squareTile, active && styles.squareTileActive]}
            >
              {colorSection ? (
                <View style={[localStyles.colorDot, { backgroundColor: swatch }]} />
              ) : (
                <>
                  {garmentSection && option.glyph ? (
                    <OutfitTypeGlyph id={option.glyph} color={active ? colors.textPrimary : colors.textSecondary} size={24} />
                  ) : (
                    <Ionicons
                      name={option.icon || 'sparkles'}
                      size={20}
                      color={active ? colors.textPrimary : colors.textSecondary}
                    />
                  )}
                </>
              )}
              <Text style={[styles.squareTileText, active && styles.squareTileTextActive]}>{option.label}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );

  const handleGenerate = async () => {
    if (!canGenerate || !analysisImage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/create/result',
      params: {
        selfie: analysisImage,
        look: analysisImage,
        elements: selectedLabels.join(','),
      },
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Outfit Analysis</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 160 }]}
          showsVerticalScrollIndicator={false}
        >
          <AnalysisTags activeTab="outfit" />

          <Animated.View entering={FadeInDown.delay(120).duration(280)}>
            <Text style={styles.sectionTitle}>Outfit Photo</Text>
            <UploadTile image={analysisImage} onSelect={pickImage} onRemove={() => setAnalysisImage(null)} />
            <Text style={localStyles.helperText}>Upload one clear full-outfit image for best results.</Text>
          </Animated.View>

          {SECTIONS.map((section, index) => (
            <Animated.View key={section.key} entering={FadeInDown.delay(160 + index * 35).duration(280)}>
              <ExpandableSection
                title={section.title}
                onExpand={() => setFocusedCategory(section.key)}
                onClear={() => clearCategory(section.key)}
                clearDisabled={!selections[section.key]}
              >
                {renderOptionRow(section)}
              </ExpandableSection>
            </Animated.View>
          ))}
        </ScrollView>

        {focusedCategory ? (
          <Animated.View style={styles.focusedOverlay} entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}>
            <View style={styles.focusedHeader}>
              <Text style={styles.focusedTitle}>{getSectionByKey(focusedCategory).title}</Text>
              <Pressable onPress={() => setFocusedCategory(null)} hitSlop={10} style={styles.shrinkButton}>
                <Text style={styles.shrinkText}>Shrink</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>{renderOptionGrid(getSectionByKey(focusedCategory))}</ScrollView>
          </Animated.View>
        ) : null}

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + layout.tabBarHeight + 8 }]}> 
          <PrimaryButton label={ctaLabel} onPress={handleGenerate} disabled={!canGenerate} icon={canGenerate ? 'sparkles' : undefined} style={{ width: '100%' }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

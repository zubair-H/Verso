import React, { ReactNode, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeOut, runOnJS } from 'react-native-reanimated';

import { AnalysisTags } from '@/components/create/AnalysisTags';
import { UploadTile } from '@/components/create/facial/UploadTile';
import { ExpandableSection } from '@/components/create/facial/ExpandableSection';
import { PrimaryButton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout } from '@/constants/spacing';
import { createFacialStyles } from '@/features/create/facial/styles';
import { createOutfitSwapSession } from '@/utils/outfitSwapSession';

type OutfitSectionKey =
  | 'topColor'
  | 'bottomColor';

type Option = {
  id: string;
  label: string;
};
type SectionDef = { key: OutfitSectionKey; title: string; options: Option[] };
type OutfitSelections = Record<OutfitSectionKey, string | null>;

const SECTIONS: SectionDef[] = [
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
];

const INITIAL_SELECTIONS: OutfitSelections = {
  topColor: null,
  bottomColor: null,
};

export default function OutfitAnalysisScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createFacialStyles(colors, insets.bottom), [colors, insets.bottom]);
  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        optionTileWrap: {
          width: 106,
        },
        optionTile: {
          width: '100%',
          aspectRatio: 0.82,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 8,
          paddingVertical: 10,
        },
        optionTileActive: {
          borderColor: colors.accent,
          borderWidth: 2,
          backgroundColor: colors.accentMuted,
        },
        tileLabel: {
          ...typography.caption,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        tileLabelActive: {
          color: colors.textPrimary,
        },
        tileIcon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.borderLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors]
  );

  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisImageDataUri, setAnalysisImageDataUri] = useState<string | null>(null);
  const [focusedCategory, setFocusedCategory] = useState<OutfitSectionKey | null>(null);
  const [selections, setSelections] = useState<OutfitSelections>(INITIAL_SELECTIONS);

  const goToCreate = () => {
    router.replace('/(tabs)/create');
  };

  const swipeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        .hitSlop({ left: 0, width: 24 })
        .activeOffsetX(20)
        .failOffsetY([-20, 20])
        .onEnd((event) => {
          if (event.translationX > 70 && event.velocityX > 280) {
            runOnJS(goToCreate)();
          }
        }),
    []
  );

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
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAnalysisImage(asset.uri);
      const mimeType = asset.mimeType || 'image/jpeg';
      setAnalysisImageDataUri(asset.base64 ? `data:${mimeType};base64,${asset.base64}` : null);
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
  const getTagIcon = (key: OutfitSectionKey): keyof typeof Ionicons.glyphMap =>
    key === 'topColor' ? 'shirt-outline' : 'walk-outline';

  const renderOptionRow = (section: SectionDef): ReactNode => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {section.options.map((option) => {
        const active = selections[section.key] === option.id;
        return (
          <View key={option.id} style={localStyles.optionTileWrap}>
            <Pressable onPress={() => toggleOption(section.key, option.id)} style={[localStyles.optionTile, active && localStyles.optionTileActive]}>
              <View style={localStyles.tileIcon}>
                <Ionicons name={getTagIcon(section.key)} size={16} color={colors.textSecondary} />
              </View>
              <Text style={[localStyles.tileLabel, active && localStyles.tileLabelActive]}>{option.label}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderOptionGrid = (section: SectionDef): ReactNode => (
    <View style={styles.gridWrap}>
      {section.options.map((option) => {
        const active = selections[section.key] === option.id;
        return (
          <View key={option.id} style={styles.squareTileWrap}>
            <Pressable
              onPress={() => toggleOption(section.key, option.id)}
              style={[styles.squareTile, localStyles.optionTile, active && localStyles.optionTileActive]}
            >
              <View style={localStyles.tileIcon}>
                <Ionicons name={getTagIcon(section.key)} size={16} color={colors.textSecondary} />
              </View>
              <Text style={[localStyles.tileLabel, active && localStyles.tileLabelActive]}>{option.label}</Text>
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
    const outfitSession = createOutfitSwapSession({
      imageUri: analysisImage,
      imageDataUri: analysisImageDataUri || undefined,
      elements: selectedLabels.join(','),
      topColorId: selections.topColor || 'current',
      bottomColorId: selections.bottomColor || 'current',
    });

    router.push({
      pathname: '/create/result',
      params: {
        selfie: analysisImage,
        look: analysisImage,
        elements: selectedLabels.join(','),
        outfitMode: '1',
        outfitSessionId: outfitSession.id,
        topColorId: selections.topColor || 'current',
        bottomColorId: selections.bottomColor || 'current',
      },
    });
  };

  const handleBackPress = () => {
    goToCreate();
  };

  return (
    <GestureDetector gesture={swipeBackGesture}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Outfit Analysis</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            <AnalysisTags activeTab="outfit" />

            <Animated.View entering={FadeInDown.delay(120).duration(280)} style={{ marginTop: 16 }}>
              <Text style={styles.sectionTitle}>Outfit Photo</Text>
              <UploadTile
                image={analysisImage}
                onSelect={pickImage}
                onRemove={() => {
                  setAnalysisImage(null);
                  setAnalysisImageDataUri(null);
                }}
              />
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
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>{renderOptionGrid(getSectionByKey(focusedCategory))}</ScrollView>
            </Animated.View>
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
    </GestureDetector>
  );
}

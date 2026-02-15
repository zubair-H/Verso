import React, { ReactNode, useMemo, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

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
  icon?: keyof typeof Ionicons.glyphMap;
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

const OUTFIT_REFERENCE_IMAGES: Record<OutfitSectionKey, Record<string, string>> = {
  topColor: {
    black: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?fit=crop&w=900&q=80&fm=jpg',
    white: 'https://images.unsplash.com/photo-1544717305-2782549b5136?fit=crop&w=900&q=80&fm=jpg',
    beige: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?fit=crop&w=900&q=80&fm=jpg',
    brown: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?fit=crop&w=900&q=80&fm=jpg',
    navy: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?fit=crop&w=900&q=80&fm=jpg',
    green: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=900&q=80&fm=jpg',
    red: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?fit=crop&w=900&q=80&fm=jpg',
    pink: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=900&q=80&fm=jpg',
  },
  bottomColor: {
    black: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?fit=crop&w=900&q=80&fm=jpg',
    white: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?fit=crop&w=900&q=80&fm=jpg',
    beige: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?fit=crop&w=900&q=80&fm=jpg',
    brown: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?fit=crop&w=900&q=80&fm=jpg',
    navy: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?fit=crop&w=900&q=80&fm=jpg',
    gray: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?fit=crop&w=900&q=80&fm=jpg',
    olive: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?fit=crop&w=900&q=80&fm=jpg',
    blue: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?fit=crop&w=900&q=80&fm=jpg',
  },
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
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.borderLight,
          justifyContent: 'flex-end',
          padding: 10,
        },
        optionTileActive: {
          borderColor: colors.accent,
          borderWidth: 2,
        },
        imageFill: {
          ...StyleSheet.absoluteFillObject,
        },
        imageScrim: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.16)',
        },
        tileLabel: {
          ...typography.caption,
          color: '#FFFFFF',
          fontWeight: '600',
          textShadowColor: 'rgba(0, 0, 0, 0.35)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
        tileGlassTag: {
          position: 'absolute',
          top: 8,
          left: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.28)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.45)',
          flexDirection: 'row',
          alignItems: 'center',
        },
        tileGlassTagIcon: {
          marginRight: 5,
        },
        tileGlassTagText: {
          ...typography.caption,
          color: '#FFFFFF',
          fontWeight: '700',
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
      }),
    [colors]
  );

  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisImageDataUri, setAnalysisImageDataUri] = useState<string | null>(null);
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
  const getTagLabel = (key: OutfitSectionKey, optionLabel: string) =>
    `${optionLabel} ${key === 'topColor' ? 'Top' : 'Bottom'}`;
  const getTagIcon = (key: OutfitSectionKey): keyof typeof Ionicons.glyphMap =>
    key === 'topColor' ? 'shirt-outline' : 'walk-outline';

  const renderOptionRow = (section: SectionDef): ReactNode => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {section.options.map((option) => {
        const active = selections[section.key] === option.id;
        const imageUri = OUTFIT_REFERENCE_IMAGES[section.key][option.id];
        return (
          <View key={option.id} style={localStyles.optionTileWrap}>
            <Pressable onPress={() => toggleOption(section.key, option.id)} style={[localStyles.optionTile, active && localStyles.optionTileActive]}>
              <ImageBackground source={{ uri: imageUri }} style={localStyles.imageFill}>
                <View style={localStyles.imageScrim} />
              </ImageBackground>
              <View style={localStyles.tileGlassTag}>
                <Ionicons name={getTagIcon(section.key)} size={12} color="#FFFFFF" style={localStyles.tileGlassTagIcon} />
                <Text style={localStyles.tileGlassTagText}>{getTagLabel(section.key, option.label)}</Text>
              </View>
              <Text style={localStyles.tileLabel}>{option.label}</Text>
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
        const imageUri = OUTFIT_REFERENCE_IMAGES[section.key][option.id];
        return (
          <View key={option.id} style={styles.squareTileWrap}>
            <Pressable
              onPress={() => toggleOption(section.key, option.id)}
              style={[styles.squareTile, localStyles.optionTile, active && localStyles.optionTileActive]}
            >
              <ImageBackground source={{ uri: imageUri }} style={localStyles.imageFill}>
                <View style={localStyles.imageScrim} />
              </ImageBackground>
              <View style={localStyles.tileGlassTag}>
                <Ionicons name={getTagIcon(section.key)} size={12} color="#FFFFFF" style={localStyles.tileGlassTagIcon} />
                <Text style={localStyles.tileGlassTagText}>{getTagLabel(section.key, option.label)}</Text>
              </View>
              <Text style={localStyles.tileLabel}>{option.label}</Text>
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
    router.replace('/(tabs)');
  };

  return (
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
          <PrimaryButton label={ctaLabel} onPress={handleGenerate} disabled={!canGenerate} icon={canGenerate ? 'sparkles' : undefined} style={{ width: '100%' }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

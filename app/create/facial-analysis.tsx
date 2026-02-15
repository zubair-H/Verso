import React, { ReactNode, useMemo } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { layout } from '@/constants/spacing';
import { AnalysisTags } from '@/components/create/AnalysisTags';
import { UploadTile } from '@/components/create/facial/UploadTile';
import { ExpandableSection } from '@/components/create/facial/ExpandableSection';
import { BrowShapeGlyph, LipsShapeGlyph } from '@/components/create/facial/Glyphs';
import { type ExpandableSectionKey, type FeaturePreset } from './facial/types';
import { useFacialAnalysisState } from './facial/useFacialAnalysisState';
import { createFacialStyles } from './facial/styles';
import {
  EYEBROW_COLOR_PRESETS,
  EYEBROW_PRESETS,
  LIP_PRESETS,
  OUTFIT_COLORS,
  getEyeColorHex,
  getHairPreviewImage,
} from './facial/constants';

export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    selfieImage,
    setSelfieImage,
    failedHairPreviewIds,
    setFailedHairPreviewIds,
    selectedHairColorId,
    setSelectedHairColorId,
    selectedHairStyleId,
    setSelectedHairStyleId,
    selectedEyeColorId,
    setSelectedEyeColorId,
    selectedLipsId,
    setSelectedLipsId,
    selectedEyebrowsId,
    setSelectedEyebrowsId,
    selectedEyebrowColorId,
    setSelectedEyebrowColorId,
    selectedTopColorId,
    setSelectedTopColorId,
    selectedBottomColorId,
    setSelectedBottomColorId,
    focusedCategory,
    setFocusedCategory,
    loadingColors,
    visibleHairColorPresets,
    visibleHairStylePresets,
    visibleEyeColorPresets,
    clearCategory,
    ctaLabel,
    canGenerate,
    pickImage,
    handleGenerate,
  } = useFacialAnalysisState();

  const styles = useMemo(() => createFacialStyles(colors, insets.bottom), [colors, insets.bottom]);

  const openFocusedCategory = (key: ExpandableSectionKey) => {
    setFocusedCategory(key);
  };

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
          <AnalysisTags activeTab="facial" />

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

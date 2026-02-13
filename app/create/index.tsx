import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
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
  id: AttributeCategory;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tags: string[];
}

type AttributeCategory = 'hair' | 'face' | 'color' | 'style';

const ATTRIBUTE_GROUPS: AttributeGroup[] = [
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
];

const SOFT_LAYOUT = Layout.duration(180);

function normalizeAttribute(input: string) {
  return input.trim().replace(/,+/g, ' ').replace(/\s+/g, ' ');
}

export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ presetImage?: string }>();

  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [lookImage, setLookImage] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [customAttribute, setCustomAttribute] = useState('');
  const [activeCategory, setActiveCategory] = useState<AttributeCategory>('hair');

  useEffect(() => {
    if (params.presetImage) {
      setLookImage(params.presetImage);
    }
  }, [params.presetImage]);

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

  const selectCategory = async (category: AttributeCategory) => {
    if (category === activeCategory) {
      return;
    }
    await Haptics.selectionAsync();
    setActiveCategory(category);
  };

  const clearAttributes = async () => {
    if (selectedAttributes.length === 0) {
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAttributes([]);
  };

  const activeGroup = useMemo(
    () => ATTRIBUTE_GROUPS.find((group) => group.id === activeCategory) ?? ATTRIBUTE_GROUPS[0],
    [activeCategory]
  );

  const canGenerate = Boolean(selfieImage && lookImage && selectedAttributes.length > 0);
  const ctaLabel = useMemo(() => {
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
  }, [selfieImage, lookImage, selectedAttributes.length]);

  const handleGenerate = async () => {
    if (!canGenerate || !selfieImage || !lookImage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('elements_selected', {
      elements: selectedAttributes.join(','),
      count: selectedAttributes.length,
    });

    router.push({
      pathname: '/create/result',
      params: {
        selfie: selfieImage,
        look: lookImage,
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
        section: {
          marginTop: 16,
          paddingHorizontal: layout.screenPadding,
        },
        plannerCard: {
          paddingTop: 2,
        },
        plannerTitle: {
          ...typography.labelLarge,
          color: colors.textPrimary,
        },
        plannerHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        clearButton: {
          paddingHorizontal: 6,
          paddingVertical: 4,
        },
        clearText: {
          ...typography.caption,
          color: colors.textSecondary,
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
        categoryRow: {
          marginTop: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -4,
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
        tagsWrap: {
          marginTop: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -4,
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
        customRow: {
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        customSearchBar: {
          flex: 1,
          height: 46,
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgCard,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          gap: 8,
        },
        customInput: {
          flex: 1,
          height: '100%',
          color: colors.textPrimary,
          ...typography.bodyMedium,
        },
        clearSearchButton: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.bgTertiary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        addButton: {
          height: 40,
          borderRadius: borderRadius.full,
          paddingHorizontal: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentMuted,
        },
        addButtonActive: {
          backgroundColor: colors.accent,
        },
        addButtonText: {
          ...typography.labelSmall,
          color: colors.textSecondary,
        },
        addButtonTextActive: {
          color: colors.textOnAccent,
        },
        bottomBar: {
          backgroundColor: colors.bgPrimary,
          paddingHorizontal: layout.screenPadding,
          paddingTop: 12,
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
          <Animated.View
            entering={FadeInDown.delay(80).duration(320)}
            layout={SOFT_LAYOUT}
            style={styles.section}
          >
            <TransformationVisualizer
              selfieImage={selfieImage}
              lookImage={lookImage}
              onSelectSelfie={() => pickImage('selfie')}
              onSelectLook={() => pickImage('look')}
              onRemoveSelfie={() => setSelfieImage(null)}
              onRemoveLook={() => setLookImage(null)}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(140).duration(320)}
            layout={SOFT_LAYOUT}
            style={styles.section}
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

              <Animated.View style={styles.categoryRow} layout={SOFT_LAYOUT}>
                {ATTRIBUTE_GROUPS.map((group) => {
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

              <Animated.View style={styles.customRow} layout={SOFT_LAYOUT}>
                <View style={styles.customSearchBar}>
                  <Ionicons name="search" size={16} color={colors.textTertiary} />
                  <TextInput
                    style={styles.customInput}
                    value={customAttribute}
                    onChangeText={setCustomAttribute}
                    placeholder="Search or type custom attribute"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="search"
                    onSubmitEditing={addCustomAttribute}
                  />
                  {customAttribute.trim().length > 0 && (
                    <Pressable
                      style={styles.clearSearchButton}
                      onPress={() => setCustomAttribute('')}
                    >
                      <Ionicons name="close" size={12} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.addButton,
                    customAttribute.trim().length > 0 && styles.addButtonActive,
                  ]}
                  onPress={addCustomAttribute}
                >
                  <Text
                    style={[
                      styles.addButtonText,
                      customAttribute.trim().length > 0 && styles.addButtonTextActive,
                    ]}
                  >
                    Add
                  </Text>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
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

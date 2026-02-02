import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { PrimaryButton, SelectableChip } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';

interface Element {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const elements: Element[] = [
  { id: 'hair', label: 'Hair', icon: 'cut' },
  { id: 'outfit', label: 'Outfit', icon: 'shirt' },
  { id: 'glasses', label: 'Glasses', icon: 'glasses' },
  { id: 'makeup', label: 'Makeup', icon: 'sparkles' },
];

export default function SelectElementsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ selfie: string; look: string }>();
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [entireLook, setEntireLook] = useState(false);

  const toggleElement = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (entireLook) {
      setEntireLook(false);
    }

    setSelectedElements((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleEntireLook = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEntireLook(!entireLook);
    if (!entireLook) {
      setSelectedElements(elements.map((e) => e.id));
    } else {
      setSelectedElements([]);
    }
  };

  const handleGenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const selectedList = entireLook
      ? ['entire_look']
      : selectedElements;

    trackEvent('elements_selected', {
      elements: selectedList.join(','),
      count: selectedList.length,
    });

    router.push({
      pathname: '/create/result',
      params: {
        selfie: params.selfie,
        look: params.look,
        elements: selectedList.join(','),
      },
    });
  };

  const canGenerate = entireLook || selectedElements.length > 0;
  const selectedCount = entireLook ? elements.length : selectedElements.length;

  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    headerTitle: {
      ...typography.headlineMedium,
      color: colors.textPrimary,
    },
    title: {
      ...typography.headlineLarge,
      color: colors.textPrimary,
      textAlign: 'center' as const,
      marginBottom: 24,
    },
    imageCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    bottomSection: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgPrimary,
    },
  }), [colors]);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={dynamicStyles.headerTitle}>Select Elements</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={dynamicStyles.title}>Choose your transformation</Text>
        </Animated.View>

        {/* Reference Image */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.imageContainer}>
          <View style={dynamicStyles.imageCard}>
            <Image
              source={{ uri: params.look }}
              style={styles.referenceImage}
            />
          </View>
        </Animated.View>

        {/* Element Chips */}
        <Animated.View entering={SlideInUp.delay(300)} style={styles.elementsGrid}>
          {elements.map((element) => (
            <SelectableChip
              key={element.id}
              label={element.label}
              icon={element.icon}
              selected={selectedElements.includes(element.id) && !entireLook}
              onPress={() => toggleElement(element.id)}
            />
          ))}
        </Animated.View>

        {/* Entire Look Option */}
        <Animated.View entering={SlideInUp.delay(400)}>
          <SelectableChip
            label="Entire look"
            icon="sparkles"
            selected={entireLook}
            onPress={toggleEntireLook}
            fullWidth
          />
        </Animated.View>
      </ScrollView>

      {/* Bottom Section */}
      <Animated.View
        entering={SlideInUp.delay(500)}
        style={[dynamicStyles.bottomSection, { paddingBottom: insets.bottom + 20 }]}
      >
        <PrimaryButton
          label={`Create my look${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
          onPress={handleGenerate}
          disabled={!canGenerate}
          style={styles.generateButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  referenceImage: {
    width: 200,
    height: 260,
    resizeMode: 'cover',
  },
  elementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  generateButton: {
    width: '100%',
  },
});

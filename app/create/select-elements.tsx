import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { GradientButton, SelectableChip, GlassCard } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';

interface Element {
  id: string;
  label: string;
  icon: string;
}

const elements: Element[] = [
  { id: 'hair', label: 'Hair', icon: '💇' },
  { id: 'outfit', label: 'Outfit', icon: '👔' },
  { id: 'glasses', label: 'Glasses', icon: '👓' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
];

export default function SelectElementsScreen() {
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.06)', 'rgba(0, 0, 0, 0)', 'rgba(0, 191, 165, 0.04)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Select Elements</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={styles.title}>What do you want to try?</Text>
        </Animated.View>

        {/* Reference Image */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.imageContainer}>
          <GlassCard padding={8}>
            <Image
              source={{ uri: params.look }}
              style={styles.referenceImage}
            />
          </GlassCard>
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
            label="ENTIRE LOOK"
            icon="✦"
            selected={entireLook}
            onPress={toggleEntireLook}
            fullWidth
          />
        </Animated.View>
      </ScrollView>

      {/* Bottom Section */}
      <Animated.View
        entering={SlideInUp.delay(500)}
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}
      >
        <GradientButton
          label={`Generate${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
          onPress={handleGenerate}
          disabled={!canGenerate}
          size="large"
          haptic="medium"
          style={styles.generateButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
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
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
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
  title: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  referenceImage: {
    width: 200,
    height: 260,
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  elementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bottomSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: colors.bgPrimary,
  },
  generateButton: {
    width: '100%',
  },
});

import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';

const LIVE_ATTRIBUTES = [
  'Hair texture',
  'Jawline',
  'Eye makeup',
  'Lip tone',
  'Skin finish',
  'Outfit vibe',
];

export default function LiveFiltersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);

  const handleUpload = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bgPrimary,
        },
        header: {
          height: layout.headerHeight,
          paddingHorizontal: layout.screenPadding,
          justifyContent: 'center',
        },
        title: {
          ...typography.headlineMedium,
          color: colors.textPrimary,
        },
        scrollContent: {
          paddingHorizontal: layout.screenPadding,
          paddingBottom: layout.tabBarHeight + 24,
        },
        previewCard: {
          marginTop: 8,
          borderRadius: borderRadius.xl,
          backgroundColor: colors.bgCard,
          overflow: 'hidden',
          minHeight: 330,
          alignItems: 'center',
          justifyContent: 'center',
        },
        previewImage: {
          width: '100%',
          height: 420,
          resizeMode: 'cover',
        },
        uploadPlaceholder: {
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingVertical: 46,
        },
        placeholderText: {
          ...typography.labelMedium,
          color: colors.textSecondary,
        },
        attributePill: {
          position: 'absolute',
          top: 12,
          left: 12,
          borderRadius: borderRadius.full,
          backgroundColor: 'rgba(0,0,0,0.46)',
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        attributePillText: {
          ...typography.caption,
          color: '#FFFFFF',
        },
        sectionTitle: {
          ...typography.labelLarge,
          color: colors.textPrimary,
          marginTop: 18,
          marginBottom: 10,
        },
        chipsWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -4,
        },
        chip: {
          borderRadius: borderRadius.full,
          backgroundColor: colors.bgCard,
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginHorizontal: 4,
          marginBottom: 8,
        },
        chipActive: {
          backgroundColor: colors.accentMuted,
        },
        chipText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        chipTextActive: {
          color: colors.textPrimary,
        },
        uploadButton: {
          marginTop: 14,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.bgCard,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        uploadButtonText: {
          ...typography.labelMedium,
          color: colors.textPrimary,
        },
      }),
    [colors]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Filters</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(80).duration(250)} style={styles.previewCard}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              {selectedAttribute ? (
                <View style={styles.attributePill}>
                  <Text style={styles.attributePillText}>{selectedAttribute}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Pressable onPress={handleUpload} style={styles.uploadPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
              <Text style={styles.placeholderText}>Upload image to preview live filter</Text>
            </Pressable>
          )}
        </Animated.View>

        <Text style={styles.sectionTitle}>Attribute</Text>
        <View style={styles.chipsWrap}>
          {LIVE_ATTRIBUTES.map((item) => {
            const active = selectedAttribute === item;
            return (
              <Pressable
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setSelectedAttribute(item);
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="image-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.uploadButtonText}>{imageUri ? 'Change Image' : 'Upload Image'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

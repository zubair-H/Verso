import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius } from '@/constants/spacing';

export function UploadTile({
  image,
  onSelect,
  onRemove,
}: {
  image: string | null;
  onSelect: () => void;
  onRemove: () => void;
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

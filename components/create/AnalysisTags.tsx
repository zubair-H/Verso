import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { typography } from '@/constants/typography';
import { useTheme } from '@/contexts/ThemeContext';

export type AnalysisTab = 'facial' | 'outfit' | 'health';

export function AnalysisTags({ activeTab }: { activeTab: AnalysisTab }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 10,
          marginBottom: 4,
        },
        tag: {
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgSecondary,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        tagActive: {
          borderColor: colors.accent,
          backgroundColor: colors.accentMuted,
        },
        tagText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        tagTextActive: {
          color: colors.textPrimary,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          if (activeTab !== 'facial') router.replace('/create');
        }}
        style={[styles.tag, activeTab === 'facial' && styles.tagActive]}
      >
        <Text style={[styles.tagText, activeTab === 'facial' && styles.tagTextActive]}>Facial Analysis</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          if (activeTab !== 'outfit') router.replace('/create/outfit-analysis');
        }}
        style={[styles.tag, activeTab === 'outfit' && styles.tagActive]}
      >
        <Text style={[styles.tagText, activeTab === 'outfit' && styles.tagTextActive]}>Outfit Analysis</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          if (activeTab !== 'health') router.replace('/create/health-analysis');
        }}
        style={[styles.tag, activeTab === 'health' && styles.tagActive]}
      >
        <Text style={[styles.tagText, activeTab === 'health' && styles.tagTextActive]}>Health Analysis</Text>
      </Pressable>
    </View>
  );
}

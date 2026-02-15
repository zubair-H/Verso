import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalysisTags } from '@/components/create/AnalysisTags';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout } from '@/constants/spacing';

export default function OutfitAnalysisScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bgPrimary, paddingTop: insets.top },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.screenPadding,
          height: layout.headerHeight,
          gap: 12,
        },
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
        body: { flex: 1, paddingHorizontal: layout.screenPadding },
        card: {
          marginTop: 16,
          borderRadius: borderRadius.xl,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgCard,
          padding: 16,
          gap: 8,
        },
        cardTitle: { ...typography.labelLarge, color: colors.textPrimary },
        cardText: { ...typography.bodySmall, color: colors.textSecondary },
      }),
    [colors, insets.top]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Your Look</Text>
      </View>

      <View style={styles.body}>
        <AnalysisTags activeTab="outfit" />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Outfit Analysis</Text>
          <Text style={styles.cardText}>This page is ready for outfit-specific analysis content.</Text>
        </View>
      </View>
    </View>
  );
}

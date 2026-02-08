import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout } from '@/constants/spacing';

const STEPS = [
  { icon: 'camera-outline' as const, label: 'Upload your photo' },
  { icon: 'search-outline' as const, label: 'Pick a celebrity look' },
  { icon: 'sparkles-outline' as const, label: 'See yourself transformed' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEP_WIDTH = (SCREEN_WIDTH - layout.screenPadding * 2 - 24) / 3;

export function HowItWorks() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: layout.screenPadding,
        },
        title: {
          ...typography.headlineMedium,
          color: colors.textPrimary,
          marginBottom: 16,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        step: {
          width: STEP_WIDTH,
          backgroundColor: colors.bgCard,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
          alignItems: 'center',
        },
        numberCircle: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        number: {
          ...typography.labelSmall,
          color: colors.accent,
        },
        icon: {
          marginTop: 8,
        },
        label: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: 6,
          textAlign: 'center',
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How it works</Text>
      <View style={styles.row}>
        {STEPS.map((step, index) => (
          <View key={index} style={styles.step}>
            <View style={styles.numberCircle}>
              <Text style={styles.number}>{index + 1}</Text>
            </View>
            <Ionicons
              name={step.icon}
              size={24}
              color={colors.textSecondary}
              style={styles.icon}
            />
            <Text style={styles.label}>{step.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

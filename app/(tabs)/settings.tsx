import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useStorage } from '@/hooks/useStorage';
import { typography } from '@/constants/typography';
import { layout } from '@/constants/spacing';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { resetOnboarding } = useStorage();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingVertical: 16,
    },
    title: {
      ...typography.displayMedium,
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    menuItemText: {
      ...typography.bodyLarge,
      color: colors.textPrimary,
      marginLeft: 16,
    },
  }), [colors]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleResetOnboarding = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await resetOnboarding();
    router.replace('/(onboarding)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
      </View>
      <View style={styles.content}>
        <Pressable style={styles.menuItem} onPress={handlePress}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Settings</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={handlePress}>
          <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Help & Support</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={handlePress}>
          <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>About</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={handleResetOnboarding}>
          <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Restart Onboarding</Text>
        </Pressable>
      </View>
    </View>
  );
}

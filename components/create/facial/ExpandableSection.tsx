import React, { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';

export function ExpandableSection({
  title,
  onExpand,
  onClear,
  clearDisabled = false,
  allowExpand = true,
  children,
}: {
  title: string;
  onExpand: () => void;
  onClear: () => void;
  clearDisabled?: boolean;
  allowExpand?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: { marginTop: 16 },
        header: {
          paddingHorizontal: 0,
          paddingVertical: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        title: { ...typography.labelLarge, color: colors.textPrimary },
        actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        clearButton: {
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        actionText: { ...typography.caption, color: colors.accent },
        body: { paddingTop: 10 },
      }),
    [colors]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actions}>
          {allowExpand ? (
            <Pressable onPress={onExpand}>
              <Text style={styles.actionText}>View all</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onClear} disabled={clearDisabled} style={styles.clearButton} hitSlop={8}>
            <Ionicons name="close" size={16} color={clearDisabled ? colors.textTertiary : colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      <Animated.View
        style={styles.body}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        layout={LinearTransition.springify().damping(18).stiffness(180)}
      >
        {children}
      </Animated.View>
    </View>
  );
}

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  blur?: number;
  opacity?: number;
  radius?: number;
  padding?: number;
  hasBorder?: boolean;
  style?: ViewStyle;
}

export function GlassCard({
  children,
  blur = 40,
  opacity = 0.08,
  radius = borderRadius.lg,
  padding = 16,
  hasBorder = true,
  style,
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius,
          borderWidth: hasBorder ? 0.5 : 0,
          borderColor: colors.glassBorder,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <BlurView intensity={blur} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgba(255, 255, 255, ${opacity})` },
        ]}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

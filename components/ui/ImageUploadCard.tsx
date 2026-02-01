import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { borderRadius } from '@/constants/spacing';

interface ImageUploadCardProps {
  label: string;
  image: string | null;
  onSelect: () => void;
  onRemove: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ImageUploadCard({
  label,
  image,
  onSelect,
  onRemove,
}: ImageUploadCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  const handleRemove = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.card}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.overlay]} />

        {image ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.imageContainer}
          >
            <Image source={{ uri: image }} style={styles.image} />
            <Pressable onPress={handleRemove} style={styles.removeButton}>
              <Text style={styles.removeText}>x</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.plusIcon}>+</Text>
            <Text style={styles.tapText}>Tap to upload</Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 40,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  tapText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginTop: 12,
  },
});

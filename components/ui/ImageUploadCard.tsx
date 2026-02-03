import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout, springs } from '@/constants/spacing';

interface ImageUploadCardProps {
  label: string;
  sublabel?: string;
  image: string | null;
  onSelect: () => void;
  onRemove: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - layout.screenPadding * 2 - 16) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ImageUploadCard({
  label,
  sublabel,
  image,
  onSelect,
  onRemove,
}: ImageUploadCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const imageScale = useSharedValue(1.1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  const handleRemove = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove();
  };

  React.useEffect(() => {
    if (image) {
      imageScale.value = withSpring(1, springs.bouncy);
    } else {
      imageScale.value = 1.1;
    }
  }, [image]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: CARD_WIDTH,
      alignItems: 'center',
    },
    card: {
      width: CARD_WIDTH,
      height: CARD_WIDTH * 1.3,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
    },
    cardEmpty: {
      backgroundColor: colors.bgCard,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    cardFilled: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    addIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tapText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
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
      top: 10,
      right: 10,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBadge: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.labelMedium,
      color: colors.textPrimary,
      marginTop: 12,
    },
    sublabel: {
      ...typography.caption,
      color: colors.textTertiary,
      marginTop: 2,
    },
  }), [colors]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <View style={[styles.card, image ? styles.cardFilled : styles.cardEmpty]}>
        {image ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.imageContainer}
          >
            <Animated.Image
              source={{ uri: image }}
              style={[styles.image, imageAnimatedStyle]}
            />
            <Pressable onPress={handleRemove} style={styles.removeButton}>
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.addIconContainer}>
              <Ionicons name="camera-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.tapText}>Tap to add</Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
      {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
    </AnimatedPressable>
  );
}

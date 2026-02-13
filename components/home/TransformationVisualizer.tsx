import React, { useEffect, useMemo } from 'react';
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
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, springs } from '@/constants/spacing';

interface TransformationVisualizerProps {
  selfieImage: string | null;
  lookImage: string | null;
  onSelectSelfie: () => void;
  onSelectLook: () => void;
  onRemoveSelfie: () => void;
  onRemoveLook: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONNECTOR_SIZE = 40;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CONNECTOR_SIZE - GAP * 2) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function UploadCard({
  image,
  icon,
  label,
  onSelect,
  onRemove,
}: {
  image: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const imageScale = useSharedValue(1.1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  useEffect(() => {
    if (image) {
      imageScale.value = withSpring(1, springs.bouncy);
    } else {
      imageScale.value = 1.1;
    }
  }, [image]);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: CARD_WIDTH,
          alignItems: 'center',
        },
        card: {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
        },
        cardEmpty: {
          backgroundColor: colors.glassBg,
          borderWidth: 2,
          borderColor: colors.border,
          borderStyle: 'dashed',
        },
        cardFilled: {
          backgroundColor: colors.bgCard,
        },
        placeholder: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        },
        iconContainer: {
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderLabel: {
          ...typography.labelSmall,
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
          top: 8,
          right: 8,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
        },
        checkBadge: {
          position: 'absolute',
          bottom: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colors.success,
          alignItems: 'center',
          justifyContent: 'center',
        },
        label: {
          ...typography.labelSmall,
          color: colors.textPrimary,
          marginTop: 10,
        },
      }),
    [colors]
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, cardAnimatedStyle]}
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
              <Ionicons name="close" size={12} color="#FFFFFF" />
            </Pressable>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          </Animated.View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon} size={24} color={colors.accent} />
            </View>
            <Text style={styles.placeholderLabel}>{label}</Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

export function TransformationVisualizer({
  selfieImage,
  lookImage,
  onSelectSelfie,
  onSelectLook,
  onRemoveSelfie,
  onRemoveLook,
}: TransformationVisualizerProps) {
  const { colors } = useTheme();
  const pulseScale = useSharedValue(1);

  const bothFilled = selfieImage && lookImage;

  useEffect(() => {
    if (!bothFilled) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withSequence(
        withSpring(1.2, springs.celebration),
        withSpring(0.95, springs.snappy),
        withSpring(1, springs.snappy)
      );
    }
  }, [bothFilled]);

  const connectorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: GAP,
        },
        connector: {
          width: CONNECTOR_SIZE,
          height: CONNECTOR_SIZE,
          borderRadius: CONNECTOR_SIZE / 2,
          backgroundColor: colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <UploadCard
        image={selfieImage}
        icon="camera-outline"
        label="You"
        onSelect={onSelectSelfie}
        onRemove={onRemoveSelfie}
      />
      <Animated.View style={[styles.connector, connectorStyle]}>
        <Ionicons name="sparkles" size={18} color={colors.accent} />
      </Animated.View>
      <UploadCard
        image={lookImage}
        icon="search-outline"
        label="Ambassador"
        onSelect={onSelectLook}
        onRemove={onRemoveLook}
      />
    </View>
  );
}

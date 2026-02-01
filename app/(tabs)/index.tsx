import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ImageUploadCard, GradientButton, GlassCard } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { presets } from '@/utils/presets';
import { trackEvent } from '@/utils/analytics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [lookImage, setLookImage] = useState<string | null>(null);

  const pickImage = async (type: 'selfie' | 'look') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (type === 'selfie') {
        setSelfieImage(uri);
      } else {
        setLookImage(uri);
      }
      trackEvent('photo_uploaded', { type });
    }
  };

  const selectPreset = async (presetImage: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLookImage(presetImage);
    trackEvent('preset_selected');
  };

  const handleGenerate = () => {
    if (selfieImage && lookImage) {
      router.push({
        pathname: '/create/select-elements',
        params: { selfie: selfieImage, look: lookImage },
      });
    }
  };

  const canGenerate = selfieImage && lookImage;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.06)', 'rgba(0, 0, 0, 0)', 'rgba(0, 191, 165, 0.04)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <View style={styles.proBadge}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.proBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.proText}>PRO ✦</Text>
          </LinearGradient>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={styles.title}>Try a Look</Text>
          <Text style={styles.subtitle}>See it on you first</Text>
        </Animated.View>

        {/* Upload Cards */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.uploadSection}>
          <ImageUploadCard
            label="Your Photo"
            image={selfieImage}
            onSelect={() => pickImage('selfie')}
            onRemove={() => setSelfieImage(null)}
          />
          <ImageUploadCard
            label="The Look"
            image={lookImage}
            onSelect={() => pickImage('look')}
            onRemove={() => setLookImage(null)}
          />
        </Animated.View>

        {/* Generate Button */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.generateSection}>
          <GradientButton
            label="Generate Look"
            onPress={handleGenerate}
            disabled={!canGenerate}
            size="large"
            haptic="medium"
            style={styles.generateButton}
          />
        </Animated.View>

        {/* Preset Strip */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.presetSection}>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or try a preset</Text>
            <View style={styles.divider} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetStrip}
          >
            {presets.slice(0, 8).map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => selectPreset(preset.image)}
                style={styles.presetItem}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.presetBorder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.presetImageContainer}>
                    <Image
                      source={{ uri: preset.image }}
                      style={styles.presetImage}
                    />
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  proBadge: {
    overflow: 'hidden',
    borderRadius: borderRadius.full,
  },
  proBadgeGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  proText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.tabBarHeight + 20,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  uploadSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  generateSection: {
    marginBottom: 40,
  },
  generateButton: {
    width: '100%',
  },
  presetSection: {
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  dividerText: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginHorizontal: 16,
  },
  presetStrip: {
    paddingVertical: 4,
  },
  presetItem: {
    marginRight: 16,
  },
  presetBorder: {
    padding: 2,
    borderRadius: borderRadius.full,
  },
  presetImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

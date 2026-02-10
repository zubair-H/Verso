import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { PrimaryButton } from '@/components/ui';
import { TransformationVisualizer, InspirationSections, HowItWorks } from '@/components/home';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { getHomeSections } from '@/utils/presets';
import { trackEvent } from '@/utils/analytics';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ presetImage?: string }>();
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [lookImage, setLookImage] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(getGreeting());

  // Handle preset image from Presets tab navigation
  useEffect(() => {
    if (params.presetImage) {
      setLookImage(params.presetImage);
    }
  }, [params.presetImage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const pickImage = async (type: 'selfie' | 'look') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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

  const getButtonState = () => {
    if (!selfieImage && !lookImage) return { label: 'Add your photos to start', disabled: true };
    if (selfieImage && !lookImage) return { label: 'Now pick a style', disabled: true };
    if (!selfieImage && lookImage) return { label: 'Now add your photo', disabled: true };
    return { label: 'See Your Look', disabled: false, icon: 'sparkles' as const };
  };

  const buttonState = getButtonState();

  const handleSeeAllPresets = () => {
    router.push('/(tabs)/presets');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      height: layout.headerHeight,
    },
    brandText: {
      fontFamily: 'Phosphate-Solid',
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    proBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: borderRadius.full,
    },
    proText: {
      ...typography.proBadge,
      color: colors.textOnAccent,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: layout.tabBarHeight + 32,
    },
    heroSection: {
      paddingHorizontal: layout.screenPadding,
      marginTop: 8,
    },
    greeting: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    headline: {
      ...typography.displayLarge,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.bodyLarge,
      color: colors.textTertiary,
      marginTop: 4,
    },
    visualizerSection: {
      marginTop: 32,
      paddingHorizontal: layout.screenPadding,
    },
    ctaSection: {
      marginTop: 24,
      paddingHorizontal: layout.screenPadding,
    },
    ctaButton: {
      width: '100%',
    },
    inspirationSection: {
      marginTop: 40,
    },
    howItWorksSection: {
      marginTop: 40,
    },
  }), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <MaskedView
          maskElement={<Text style={styles.brandText}>VERSO</Text>}
        >
          <LinearGradient
            colors={isDark ? [colors.accentLight, colors.accent] : ['#1A1F2E', '#0D1017']}
            locations={[0.68, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <Text style={[styles.brandText, { opacity: 0 }]}>VERSO</Text>
          </LinearGradient>
        </MaskedView>
        <View style={styles.proBadge}>
          <Ionicons name="sparkles" size={12} color={colors.textOnAccent} style={{ marginRight: 4 }} />
          <Text style={styles.proText}>PRO</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Headline */}
        <View style={styles.heroSection}>
          <Animated.View entering={FadeIn.delay(100)}>
            <Text style={styles.greeting}>{greeting}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).springify().damping(38).stiffness(200)}>
            <Text style={styles.headline}>Try Their Look</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(350)}>
            <Text style={styles.subtitle}>
              Upload your photo, pick a style, see yourself transformed.
            </Text>
          </Animated.View>
        </View>

        {/* Transformation Visualizer */}
        <Animated.View entering={FadeInDown.delay(400).springify().damping(38).stiffness(200)} style={styles.visualizerSection}>
          <TransformationVisualizer
            selfieImage={selfieImage}
            lookImage={lookImage}
            onSelectSelfie={() => pickImage('selfie')}
            onSelectLook={() => pickImage('look')}
            onRemoveSelfie={() => setSelfieImage(null)}
            onRemoveLook={() => setLookImage(null)}
          />
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.ctaSection}>
          <PrimaryButton
            label={buttonState.label}
            onPress={handleGenerate}
            disabled={buttonState.disabled}
            icon={buttonState.icon}
            style={styles.ctaButton}
          />
        </Animated.View>

        {/* Inspiration Sections */}
        <View style={styles.inspirationSection}>
          <InspirationSections
            sections={getHomeSections()}
            selectedPresetImage={lookImage}
            onSelectPreset={selectPreset}
            onSeeAll={handleSeeAllPresets}
          />
        </View>

        {/* How It Works */}
        <Animated.View entering={FadeInDown.delay(1400)} style={styles.howItWorksSection}>
          <HowItWorks />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

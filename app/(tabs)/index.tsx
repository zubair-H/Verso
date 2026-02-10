import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { PrimaryButton } from '@/components/ui';
import { TransformationVisualizer, InspirationSections, HeroBanner, UpgradeBanner } from '@/components/home';
import { PaywallModal } from '@/components/features/PaywallModal';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { getHomeGroupedSections } from '@/utils/presets';
import { trackEvent } from '@/utils/analytics';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ presetImage?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [lookImage, setLookImage] = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Handle preset image from Presets tab navigation
  useEffect(() => {
    if (params.presetImage) {
      setLookImage(params.presetImage);
    }
  }, [params.presetImage]);

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
    heroBannerSection: {
      paddingHorizontal: layout.screenPadding,
      marginTop: 8,
    },
    visualizerSection: {
      marginTop: 28,
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
    upgradeBannerSection: {
      marginTop: 40,
      paddingHorizontal: layout.screenPadding,
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
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <Animated.View entering={FadeInDown.delay(100).springify().damping(38).stiffness(200)} style={styles.heroBannerSection}>
          <HeroBanner onStartNow={() => {
            scrollViewRef.current?.scrollTo({ y: 240, animated: true });
          }} />
        </Animated.View>

        {/* Transformation Visualizer */}
        <Animated.View entering={FadeInDown.delay(300).springify().damping(38).stiffness(200)} style={styles.visualizerSection}>
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
        <Animated.View entering={FadeInDown.delay(500)} style={styles.ctaSection}>
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
            sections={getHomeGroupedSections()}
            selectedPresetImage={lookImage}
            onSelectPreset={selectPreset}
            onSeeAll={handleSeeAllPresets}
          />
        </View>

        {/* Upgrade Banner */}
        <Animated.View entering={FadeInDown.delay(1200)} style={styles.upgradeBannerSection}>
          <UpgradeBanner onChoosePlan={() => setPaywallVisible(true)} />
        </Animated.View>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

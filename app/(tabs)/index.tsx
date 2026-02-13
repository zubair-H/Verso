import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { HeroBanner, StyleAmbassadorStrip } from '@/components/home';
import { PaywallModal } from '@/components/features/PaywallModal';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { stylePersonas } from '@/utils/personas';
import type { StylePersona } from '@/utils/personas';
import type { AnalysisGridTile } from '@/components/home/StyleAmbassadorStrip';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const bannerHorizontalGap = 6;

  const handleSelectPersona = (persona: StylePersona) => {
    router.push({
      pathname: '/(tabs)/create',
      params: { presetImage: persona.image, personaId: persona.id },
    });
  };

  const analysisTiles = useMemo<AnalysisGridTile[]>(
    () => [
      {
        id: 'face-shape',
        title: 'Face Shape Analysis',
        subtitle: 'Discover your face shape and get style recommendations.',
        badge: 'New',
        icon: 'scan',
        gradientColors: [
          colors.faceShapeBannerEnd,
          colors.faceShapeBannerMid,
          colors.faceShapeBannerStart,
        ],
        onPress: () =>
          router.push({ pathname: '/(tabs)/create', params: { mode: 'face', category: 'face-structure' } }),
      },
      {
        id: 'hair-texture',
        title: 'Hair Texture Analysis',
        subtitle: 'Generate more natural hair transfers from your texture profile.',
        badge: 'AI',
        icon: 'cut',
        gradientColors: [
          colors.faceShapeBannerStart,
          colors.heroBannerMid,
          colors.colorAnalysisBannerEnd,
        ],
        onPress: () =>
          router.push({ pathname: '/(tabs)/create', params: { mode: 'hair', category: 'hair-texture' } }),
      },
      {
        id: 'color-analysis',
        title: 'Color Analysis',
        subtitle: 'Find tones and palettes that complement your features.',
        badge: 'Popular',
        icon: 'color-palette',
        gradientColors: [
          colors.colorAnalysisBannerEnd,
          colors.colorAnalysisBannerMid,
          colors.colorAnalysisBannerStart,
        ],
        onPress: () =>
          router.push({ pathname: '/(tabs)/create', params: { mode: 'color', category: 'color-undertone' } }),
      },
      {
        id: 'skin-tone',
        title: 'Skin Tone Analysis',
        subtitle: 'Get undertone-aware suggestions for makeup and styling.',
        badge: 'Recommended',
        icon: 'color-palette',
        gradientColors: [
          colors.heroBannerEnd,
          colors.faceShapeBannerMid,
          colors.colorAnalysisBannerStart,
        ],
        onPress: () =>
          router.push({ pathname: '/(tabs)/create', params: { mode: 'skin', category: 'skin-tone' } }),
      },
      {
        id: 'style-dna',
        title: 'Style DNA Analysis',
        subtitle: 'Decode your core aesthetic and best attribute combinations.',
        badge: 'New',
        icon: 'sparkles',
        gradientColors: [
          colors.colorAnalysisBannerMid,
          colors.heroBannerStart,
          colors.faceShapeBannerEnd,
        ],
        onPress: () =>
          router.push({ pathname: '/(tabs)/create', params: { mode: 'style', category: 'style-vibe' } }),
      },
    ],
    [colors]
  );

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
      paddingHorizontal: bannerHorizontalGap,
      marginTop: 8,
    },
    sectionSpacing: {
      marginTop: 18,
    },
  }), [colors, bannerHorizontalGap]);

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
        <Pressable
          style={styles.proBadge}
          onPress={() => setPaywallVisible(true)}
        >
          <Ionicons name="sparkles" size={12} color={colors.textOnAccent} style={{ marginRight: 4 }} />
          <Text style={styles.proText}>PRO</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner — Create Your Look */}
        <Animated.View entering={FadeInDown.delay(100).springify().damping(38).stiffness(200)} style={styles.heroBannerSection}>
          <HeroBanner
            title="Try Any Look"
            subtitle="Upload your photo, pick a celeb-inspired persona, and remix any attribute instantly"
            badge="Style Ambassadors"
            badgeIcon="sparkles"
            ctaLabel="Create Your Look"
            onPress={() => router.push('/(tabs)/create')}
            tilt={0}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.sectionSpacing}>
          <StyleAmbassadorStrip
            personas={stylePersonas}
            selectedPersonaId={null}
            onSelectPersona={handleSelectPersona}
            analysisTiles={analysisTiles}
          />
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

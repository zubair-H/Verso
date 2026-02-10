import React, { useState, useMemo, useCallback } from 'react';
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

import { HeroBanner, UpgradeBanner, PresetGrid } from '@/components/home';
import { PaywallModal } from '@/components/features/PaywallModal';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { getHomeGroupedSections, getPresetsForCategory } from '@/utils/presets';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const sections = useMemo(() => getHomeGroupedSections(), []);

  // When a filter is active, show only that category's full preset list
  const filteredSection = useMemo(() => {
    if (!activeFilter) return null;
    // Check if it's a grouped section id (hair, face, style)
    const group = sections.find((s) => s.id === activeFilter);
    if (group) {
      // Expand all sub-category presets into a flat 2-column grid
      const allPresets = group.subCategories.flatMap((cat) => {
        const full = getPresetsForCategory(cat.id);
        return full ? full.presets : [];
      });
      return {
        id: group.id,
        title: group.title,
        icon: group.icon,
        presets: allPresets,
        subCategories: [],
      };
    }
    // Otherwise it's a sub-category id — get full presets for it
    const category = getPresetsForCategory(activeFilter);
    if (category) {
      return {
        id: category.id,
        title: category.title,
        icon: category.icon,
        presets: category.presets,
        subCategories: [],
      };
    }
    return null;
  }, [activeFilter, sections]);

  const handleSelectPreset = (presetImage: string) => {
    router.push({
      pathname: '/create',
      params: { presetImage },
    });
  };

  const handleSeeAll = useCallback((sectionId: string) => {
    setActiveFilter(sectionId);
  }, []);

  const handleClearFilter = useCallback(() => {
    setActiveFilter(null);
  }, []);

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
    sectionSpacing: {
      marginTop: 36,
    },
    upgradeBannerSection: {
      marginTop: 36,
      paddingHorizontal: layout.screenPadding,
    },
    filterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      marginTop: 16,
      marginBottom: 8,
      gap: 12,
    },
    backButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterTitle: {
      ...typography.headlineMedium,
      color: colors.textPrimary,
    },
  }), [colors]);

  // Filtered view — show only the selected category
  if (activeFilter && filteredSection) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
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

        <View style={styles.filterHeader}>
          <Pressable onPress={handleClearFilter} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.filterTitle}>{filteredSection.title}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PresetGrid
            section={filteredSection}
            onSelectPreset={handleSelectPreset}
            onSeeAll={() => handleClearFilter()}
            animationDelay={0}
          />
        </ScrollView>

        <PaywallModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
        />
      </View>
    );
  }

  // Default home — full discovery feed
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
            subtitle="Upload your photo, pick a style, and see it on you instantly"
            badge="AI-Powered"
            badgeIcon="sparkles"
            ctaLabel="Create Your Look"
            onPress={() => router.push('/create')}
            tilt={-1.2}
          />
        </Animated.View>

        {/* Transform Your Hair */}
        <View style={styles.sectionSpacing}>
          <PresetGrid
            section={sections[0]}
            onSelectPreset={handleSelectPreset}
            onSeeAll={handleSeeAll}
            animationDelay={300}
          />
        </View>

        {/* Face Shape Analysis Banner */}
        <Animated.View entering={FadeInDown.delay(500)} style={[styles.heroBannerSection, styles.sectionSpacing]}>
          <HeroBanner
            title="Face Shape Analysis"
            subtitle="Discover your face shape and get personalized style recommendations"
            badge="New"
            badgeIcon="scan"
            ctaLabel="Analyze My Face"
            onPress={() => router.push('/create')}
            variant="vertical"
            tilt={1.8}
            gradientColors={[
              colors.faceShapeBannerEnd,
              colors.faceShapeBannerMid,
              colors.faceShapeBannerStart,
            ]}
          />
        </Animated.View>

        {/* Enhance Your Face */}
        <View style={styles.sectionSpacing}>
          <PresetGrid
            section={sections[1]}
            onSelectPreset={handleSelectPreset}
            onSeeAll={handleSeeAll}
            animationDelay={700}
          />
        </View>

        {/* Upgrade Banner */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.upgradeBannerSection}>
          <UpgradeBanner onChoosePlan={() => setPaywallVisible(true)} />
        </Animated.View>

        {/* Color Analysis Banner */}
        <Animated.View entering={FadeInDown.delay(1100)} style={[styles.heroBannerSection, styles.sectionSpacing]}>
          <HeroBanner
            title="Color Analysis"
            subtitle="Find your season and the colors that complement you best"
            badge="Popular"
            badgeIcon="color-palette"
            ctaLabel="Find My Colors"
            onPress={() => router.push('/create')}
            variant="vertical"
            tilt={-1.5}
            gradientColors={[
              colors.colorAnalysisBannerEnd,
              colors.colorAnalysisBannerMid,
              colors.colorAnalysisBannerStart,
            ]}
          />
        </Animated.View>

        {/* Style Your Look */}
        <View style={styles.sectionSpacing}>
          <PresetGrid
            section={sections[2]}
            onSelectPreset={handleSelectPreset}
            onSeeAll={handleSeeAll}
            animationDelay={1300}
          />
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

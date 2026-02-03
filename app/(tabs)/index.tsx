import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { ImageUploadCard, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { presets } from '@/utils/presets';
import { trackEvent } from '@/utils/analytics';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [lookImage, setLookImage] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
      paddingVertical: 16,
    },
    menuButton: {
      padding: 8,
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    menuContainer: {
      backgroundColor: colors.bgSecondary,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    menuItemText: {
      ...typography.bodyLarge,
      color: colors.textPrimary,
      marginLeft: 16,
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
      paddingHorizontal: layout.screenPadding,
      paddingBottom: layout.tabBarHeight + 20,
    },
    greeting: {
      ...typography.bodyLarge,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    title: {
      ...typography.displayMedium,
      color: colors.textPrimary,
      marginBottom: 20,
    },
    progressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      borderRadius: borderRadius.lg,
      padding: 16,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accentSecondaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    progressContent: {
      flex: 1,
    },
    progressTitle: {
      ...typography.labelMedium,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    progressSubtitle: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    streakBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accentSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    streakText: {
      ...typography.labelMedium,
      color: colors.textOnAccent,
    },
    uploadSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 28,
      position: 'relative',
    },
    arrowOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -40 }, { translateY: -30 }],
      zIndex: 10,
    },
    generateSection: {
      marginBottom: 36,
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
      backgroundColor: colors.border,
    },
    dividerText: {
      ...typography.caption,
      color: colors.textTertiary,
      marginHorizontal: 16,
    },
    presetStrip: {
      paddingVertical: 4,
    },
    presetItem: {
      marginRight: 16,
      position: 'relative',
    },
    presetBorder: {
      padding: 2,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: colors.border,
    },
    presetBorderActive: {
      borderColor: colors.accent,
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
    newBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    newBadgeText: {
      ...typography.proBadge,
      fontSize: 8,
      color: colors.textOnAccent,
    },
  }), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { paddingTop: insets.top + 16 }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuVisible(false);
              }}
            >
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Settings</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuVisible(false);
              }}
            >
              <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuVisible(false);
              }}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>About</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.menuButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMenuVisible(true);
          }}
        >
          <Ionicons name="menu" size={24} color={colors.textSecondary} />
        </Pressable>
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
        {/* Personalized Greeting */}
        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.title}>Explore a Look</Text>
        </Animated.View>

        {/* Upload Cards */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.uploadSection}>
          <ImageUploadCard
            label="Your Photo"
            sublabel="Selfie or portrait"
            image={selfieImage}
            onSelect={() => pickImage('selfie')}
            onRemove={() => setSelfieImage(null)}
          />
          <ImageUploadCard
            label="The Look"
            sublabel="Style inspiration"
            image={lookImage}
            onSelect={() => pickImage('look')}
            onRemove={() => setLookImage(null)}
          />
         <View style={styles.arrowOverlay} pointerEvents="none">
  <Svg viewBox="0 0 80 60" width={80} height={60}>
    <Path
      d="M 10 48 C 5 25, 25 5, 45 15 C 58 22, 50 35, 40 32 C 32 30, 38 20, 50 22 C 60 24, 68 28, 70 35"
      stroke="#BEBEBE"
      strokeWidth={1.75}
      strokeLinecap="round"
      fill="none"
    />
    <Path
  d="M 67 24 L 72 35 L 63 36"
  stroke="#BEBEBE"
  strokeWidth={1.75}
  strokeLinecap="round"
  strokeLinejoin="round"
  fill="none"
/>
  </Svg>
</View>
        </Animated.View>

        {/* Generate Button */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.generateSection}>
          <PrimaryButton
            label="See Your Look"
            onPress={handleGenerate}
            disabled={!canGenerate}
            icon={canGenerate ? 'sparkles' : undefined}
            style={styles.generateButton}
          />
        </Animated.View>

        {/* Preset Strip */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.presetSection}>
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
            {presets.slice(0, 8).map((preset, index) => (
              <Pressable
                key={preset.id}
                onPress={() => selectPreset(preset.image)}
                style={styles.presetItem}
              >
                <View style={[
                  styles.presetBorder,
                  lookImage === preset.image && styles.presetBorderActive
                ]}>
                  <View style={styles.presetImageContainer}>
                    <Image
                      source={{ uri: preset.image }}
                      style={styles.presetImage}
                    />
                  </View>
                </View>
                {index === 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

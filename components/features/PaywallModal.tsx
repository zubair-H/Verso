import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { GradientButton, GlassCard } from '@/components/ui';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { borderRadius, layout } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';

const { width, height } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Feature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
}

const features: Feature[] = [
  { label: 'Try looks', free: '5 tries', pro: 'Unlimited' },
  { label: 'Save looks', free: '3 max', pro: 'Unlimited' },
  { label: 'Compare side-by-side', free: false, pro: true },
  { label: 'HD results', free: false, pro: true },
  { label: 'Priority processing', free: false, pro: true },
  { label: 'New features first', free: false, pro: true },
];

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  React.useEffect(() => {
    if (visible) {
      trackEvent('paywall_shown');
    }
  }, [visible]);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mock subscription - in production, integrate with RevenueCat or similar
    trackEvent('paywall_converted', { plan });
    onClose();
  };

  const handleRestore = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mock restore - in production, integrate with store API
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View entering={SlideInUp.springify()} style={styles.content}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textTertiary} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="sparkles" size={48} color={colors.accentPrimary} style={styles.headerIcon} />
            <Text style={styles.title}>Unlock LOOKR Pro</Text>
            <Text style={styles.subtitle}>
              You've used all your free tries. Upgrade to keep exploring!
            </Text>
          </View>

          {/* Feature comparison */}
          <GlassCard style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <View style={styles.comparisonColumn}>
                <Text style={styles.planLabel}>FREE</Text>
              </View>
              <View style={styles.comparisonColumn}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.proBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.proLabel}>PRO</Text>
                </LinearGradient>
              </View>
            </View>

            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureName}>{feature.label}</Text>
                <View style={styles.featureValues}>
                  <View style={styles.comparisonColumn}>
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Ionicons name="checkmark" size={16} color={colors.textTertiary} />
                      ) : (
                        <Ionicons name="remove" size={16} color={colors.textTertiary} />
                      )
                    ) : (
                      <Text style={styles.featureValue}>{feature.free}</Text>
                    )}
                  </View>
                  <View style={styles.comparisonColumn}>
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Ionicons name="checkmark" size={16} color={colors.accentPrimary} />
                      ) : (
                        <Ionicons name="remove" size={16} color={colors.accentPrimary} />
                      )
                    ) : (
                      <Text style={[styles.featureValue, styles.featureValuePro]}>{feature.pro}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </GlassCard>

          {/* Pricing options */}
          <View style={styles.pricingContainer}>
            <Pressable
              onPress={() => handleSubscribe('yearly')}
              style={styles.pricingOption}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.pricingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>SAVE 50%</Text>
                </View>
                <Text style={styles.pricingTitle}>Yearly</Text>
                <Text style={styles.pricingPrice}>$49.99/year</Text>
                <Text style={styles.pricingSubtext}>$4.17/month</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => handleSubscribe('monthly')}
              style={[styles.pricingOption, styles.pricingOptionSecondary]}
            >
              <Text style={styles.pricingTitleSecondary}>Monthly</Text>
              <Text style={styles.pricingPriceSecondary}>$7.99/month</Text>
            </Pressable>
          </View>

          {/* Restore */}
          <Pressable onPress={handleRestore} style={styles.restoreButton}>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </Pressable>

          {/* Terms */}
          <Text style={styles.terms}>
            Cancel anytime. Terms & conditions apply.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: height * 0.85,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  comparisonCard: {
    marginBottom: 24,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  comparisonColumn: {
    width: 80,
    alignItems: 'center',
  },
  planLabel: {
    ...typography.labelSmall,
    color: colors.textTertiary,
  },
  proBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  proLabel: {
    ...typography.labelSmall,
    color: colors.textPrimary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureName: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  featureValues: {
    flexDirection: 'row',
  },
  featureValue: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  featureValuePro: {
    color: colors.accentPrimary,
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pricingOption: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  pricingGradient: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  saveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  saveText: {
    ...typography.labelSmall,
    color: colors.textPrimary,
    fontSize: 8,
  },
  pricingTitle: {
    ...typography.labelLarge,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pricingPrice: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  pricingSubtext: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  pricingOptionSecondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingTitleSecondary: {
    ...typography.labelLarge,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pricingPriceSecondary: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    ...typography.labelMedium,
    color: colors.accentPrimary,
  },
  terms: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

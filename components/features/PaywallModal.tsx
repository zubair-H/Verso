import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { borderRadius, layout } from '@/constants/spacing';
import { trackEvent } from '@/utils/analytics';

const { height } = Dimensions.get('window');

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
  const { colors } = useTheme();

  React.useEffect(() => {
    if (visible) {
      trackEvent('paywall_shown');
    }
  }, [visible]);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('paywall_converted', { plan });
    onClose();
  };

  const handleRestore = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const dynamicStyles = useMemo(() => ({
    content: {
      backgroundColor: colors.bgSecondary,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      paddingHorizontal: layout.screenPadding,
      paddingTop: 24,
      paddingBottom: 40,
      maxHeight: height * 0.85,
    },
    title: {
      ...typography.headlineLarge,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    comparisonCard: {
      backgroundColor: colors.bgTertiary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 24,
    },
    comparisonHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    planLabel: {
      ...typography.labelSmall,
      color: colors.textTertiary,
    },
    proBadge: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.accent,
    },
    proLabel: {
      ...typography.proBadge,
      color: colors.textOnAccent,
    },
    featureName: {
      flex: 1,
      ...typography.bodyMedium,
      color: colors.textSecondary,
    },
    featureValue: {
      ...typography.bodyMedium,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
    featureValuePro: {
      color: colors.accent,
    },
    pricingOptionPrimary: {
      backgroundColor: colors.accent,
      padding: 16,
      alignItems: 'center' as const,
      position: 'relative' as const,
      flex: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden' as const,
    },
    saveText: {
      ...typography.proBadge,
      color: colors.textOnAccent,
      fontSize: 8,
    },
    pricingTitle: {
      ...typography.labelLarge,
      color: colors.textOnAccent,
      marginBottom: 4,
    },
    pricingPrice: {
      ...typography.headlineMedium,
      color: colors.textOnAccent,
    },
    pricingSubtext: {
      ...typography.bodySmall,
      color: 'rgba(0,0,0,0.6)',
      marginTop: 2,
    },
    pricingOptionSecondary: {
      backgroundColor: colors.bgTertiary,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flex: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden' as const,
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
    restoreText: {
      ...typography.labelMedium,
      color: colors.accent,
    },
    terms: {
      ...typography.bodySmall,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
  }), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View entering={SlideInUp.springify()} style={dynamicStyles.content}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textTertiary} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="sparkles" size={48} color={colors.accent} style={styles.headerIcon} />
            <Text style={dynamicStyles.title}>You're on a roll!</Text>
            <Text style={dynamicStyles.subtitle}>
              Keep discovering your best looks with unlimited transformations
            </Text>
          </View>

          {/* Feature comparison - solid card */}
          <View style={dynamicStyles.comparisonCard}>
            <View style={dynamicStyles.comparisonHeader}>
              <View style={styles.comparisonColumn}>
                <Text style={dynamicStyles.planLabel}>Free</Text>
              </View>
              <View style={styles.comparisonColumn}>
                <View style={dynamicStyles.proBadge}>
                  <Text style={dynamicStyles.proLabel}>PRO</Text>
                </View>
              </View>
            </View>

            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={dynamicStyles.featureName}>{feature.label}</Text>
                <View style={styles.featureValues}>
                  <View style={styles.comparisonColumn}>
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Ionicons name="checkmark" size={16} color={colors.textTertiary} />
                      ) : (
                        <Ionicons name="remove" size={16} color={colors.textTertiary} />
                      )
                    ) : (
                      <Text style={dynamicStyles.featureValue}>{feature.free}</Text>
                    )}
                  </View>
                  <View style={styles.comparisonColumn}>
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Ionicons name="checkmark" size={16} color={colors.accent} />
                      ) : (
                        <Ionicons name="remove" size={16} color={colors.accent} />
                      )
                    ) : (
                      <Text style={[dynamicStyles.featureValue, dynamicStyles.featureValuePro]}>{feature.pro}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing options */}
          <View style={styles.pricingContainer}>
            {/* Yearly - solid mint background */}
            <Pressable
              onPress={() => handleSubscribe('yearly')}
              style={dynamicStyles.pricingOptionPrimary}
            >
              <View style={styles.saveBadge}>
                <Text style={dynamicStyles.saveText}>SAVE 50%</Text>
              </View>
              <Text style={dynamicStyles.pricingTitle}>Yearly</Text>
              <Text style={dynamicStyles.pricingPrice}>$49.99/year</Text>
              <Text style={dynamicStyles.pricingSubtext}>$4.17/month</Text>
            </Pressable>

            {/* Monthly - outlined */}
            <Pressable
              onPress={() => handleSubscribe('monthly')}
              style={dynamicStyles.pricingOptionSecondary}
            >
              <Text style={dynamicStyles.pricingTitleSecondary}>Monthly</Text>
              <Text style={dynamicStyles.pricingPriceSecondary}>$7.99/month</Text>
            </Pressable>
          </View>

          {/* Restore */}
          <Pressable onPress={handleRestore} style={styles.restoreButton}>
            <Text style={dynamicStyles.restoreText}>Restore Purchase</Text>
          </Pressable>

          {/* Terms */}
          <Text style={dynamicStyles.terms}>
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
  comparisonColumn: {
    width: 80,
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureValues: {
    flexDirection: 'row',
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  saveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});

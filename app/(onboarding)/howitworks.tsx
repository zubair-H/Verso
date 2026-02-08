import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { ViewfinderHero, InspoHero, AttributesHero, MagicHero } from '@/components/onboarding/heroes';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOGO_SIZE_SMALL = 220;

// Card data with detail content
const CARD_DATA = [
  {
    icon: 'camera' as const,
    title: 'Selfie',
    desc: 'Snap a quick photo of yourself',
    headline: 'Start with you.',
    headlineDim: 'Your best angle.',
    description: 'Snap a photo or pick one from your gallery — any clear shot of your face works.',
    Hero: ViewfinderHero,
  },
  {
    icon: 'users' as const,
    title: 'Inspo',
    desc: 'Browse celebrity looks you love',
    headline: 'Find your look.',
    headlineDim: 'Any style, any celeb.',
    description: 'Browse our collection of looks or upload a celeb photo you want to draw from.',
    Hero: InspoHero,
  },
  {
    icon: 'scissors' as const,
    title: 'Attributes',
    desc: 'Fine-tune the details',
    headline: 'Fine-tune it.',
    headlineDim: 'Every detail matters.',
    description: 'Choose exactly what you want — hair, style, features — and fine-tune every detail.',
    Hero: AttributesHero,
  },
  {
    icon: 'zap' as const,
    title: 'Magic',
    desc: 'See the transformation',
    headline: 'See the magic.',
    headlineDim: 'AI brings it to life.',
    description: 'AI applies the look to your photo — see yourself transformed in seconds.',
    Hero: MagicHero,
  },
];

// Overview card layout
const OVERVIEW_CARD_HEIGHT = 80;
const OVERVIEW_CARD_GAP = 12;
const OVERVIEW_CARD_RADIUS = 16;
const TOTAL_CARDS_HEIGHT = OVERVIEW_CARD_HEIGHT * 4 + OVERVIEW_CARD_GAP * 3;

// Animation easings
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);
const STANDARD_EASE = Easing.bezier(0.4, 0, 0.2, 1);
const ZOOM_DURATION = 500;

type FlowPhase = 'overview' | 'zooming_in' | 'detail' | 'zooming_out';

export default function HowItWorksScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State machine
  const [phase, setPhase] = useState<FlowPhase>('overview');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [completedCards, setCompletedCards] = useState<boolean[]>([false, false, false, false]);
  const [showHero, setShowHero] = useState(false);
  const isAnimating = useRef(false);

  // Animation shared values
  const zoomProgress = useSharedValue(0); // 0 = overview, 1 = expanded
  const activeIdx = useSharedValue(0);
  const detailOpacity = useSharedValue(0);
  const detailTranslateY = useSharedValue(16);
  const buttonScale = useSharedValue(1);

  // Entry animations
  const headlineEntry = useSharedValue(0);
  const headlineTranslateY = useSharedValue(20);
  const subtitleEntry = useSharedValue(0);
  const cardEntries = useRef([
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ]).current;
  const buttonEntry = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);

  // Active card pulse
  const activePulse = useSharedValue(0);

  // Computed layout values
  const OVERVIEW_CARD_WIDTH = SCREEN_WIDTH - layout.screenPadding * 2;
  const logoSpacerHeight = LOGO_SIZE_SMALL;
  const topArea = insets.top - 40 + logoSpacerHeight;
  const headlineAreaHeight = 72;
  const bottomArea = Math.max(insets.bottom, 16) + 24 + 56;
  const availableForCards = SCREEN_HEIGHT - topArea - headlineAreaHeight - bottomArea - 24;
  const cardsContainerTop = (availableForCards - TOTAL_CARDS_HEIGHT) / 2;

  // Expanded card fills below status bar to above button
  const expandedTop = insets.top + 10;
  const expandedHeight = SCREEN_HEIGHT - expandedTop - bottomArea - 16;

  // Calculate overview card Y positions relative to the cards container
  const getCardOverviewY = useCallback(
    (index: number) => index * (OVERVIEW_CARD_HEIGHT + OVERVIEW_CARD_GAP),
    []
  );

  // Entry animation
  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    headlineEntry.value = withDelay(300, withTiming(1, { duration: 700, easing: EASE }));
    headlineTranslateY.value = withDelay(300, withSpring(0, { damping: 22, stiffness: 85 }));

    subtitleEntry.value = withDelay(450, withTiming(1, { duration: 500, easing: EASE }));

    cardEntries.forEach((entry, i) => {
      entry.value = withDelay(
        500 + i * 100,
        withSpring(1, { damping: 18, stiffness: 90 })
      );
    });

    buttonEntry.value = withDelay(1000, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
    buttonTranslateY.value = withDelay(1000, withSpring(0, { damping: 20, stiffness: 90 }));

    // Start active card pulse
    activePulse.value = withDelay(
      1200,
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      )
    );
    startPulse();
  }, []);

  const startPulse = useCallback(() => {
    activePulse.value = withDelay(
      200,
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }, () => {
        activePulse.value = withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) });
      })
    );
  }, []);

  // --- Handlers ---

  const handleZoomIn = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start zoom
    setPhase('zooming_in');
    zoomProgress.value = withTiming(1, {
      duration: ZOOM_DURATION,
      easing: STANDARD_EASE,
    });

    // After zoom completes, show detail content
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowHero(true);
      setPhase('detail');

      detailOpacity.value = withDelay(50, withTiming(1, { duration: 400, easing: SMOOTH_EASE }));
      detailTranslateY.value = withDelay(50, withSpring(0, { damping: 22, stiffness: 85 }));

      isAnimating.current = false;
    }, ZOOM_DURATION + 50);
  }, [activeCardIndex]);

  const handleZoomOut = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start zoom out immediately — detail content stays in the card and collapses with it
    setPhase('zooming_out');
    zoomProgress.value = withTiming(0, {
      duration: ZOOM_DURATION,
      easing: STANDARD_EASE,
    });

    // After zoom out completes, update state
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reset detail content for next card
      setShowHero(false);
      detailOpacity.value = 0;
      detailTranslateY.value = 16;

      setCompletedCards(prev => {
        const next = [...prev];
        next[activeCardIndex] = true;
        return next;
      });

      const nextIdx = activeCardIndex + 1;
      setActiveCardIndex(nextIdx);
      activeIdx.value = nextIdx;
      setPhase('overview');
      isAnimating.current = false;
    }, ZOOM_DURATION + 50);
  }, [activeCardIndex]);

  const handleExitToPermissions = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Fade everything
    detailOpacity.value = withTiming(0, { duration: 300, easing: SMOOTH_EASE });
    zoomProgress.value = withTiming(0.85, { duration: 400, easing: SMOOTH_EASE });

    setTimeout(() => {
      router.push('/(onboarding)/permissions' as any);
    }, 450);
  }, []);

  const handleContinue = useCallback(() => {
    if (phase === 'overview') {
      handleZoomIn();
    } else if (phase === 'detail') {
      if (activeCardIndex === 3) {
        handleExitToPermissions();
      } else {
        handleZoomOut();
      }
    }
  }, [phase, activeCardIndex, handleZoomIn, handleZoomOut, handleExitToPermissions]);

  // --- Button label ---
  const buttonText = useMemo(() => {
    if (phase === 'detail' && activeCardIndex === 3) return "Let's go";
    if (phase === 'detail') return 'Got it';
    return 'Continue';
  }, [phase, activeCardIndex]);

  // --- Animated styles ---

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineEntry.value * interpolate(zoomProgress.value, [0, 0.3], [1, 0], 'clamp'),
    transform: [{ translateY: headlineTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleEntry.value * interpolate(zoomProgress.value, [0, 0.3], [1, 0], 'clamp'),
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonEntry.value,
    transform: [
      {
        translateY: interpolate(
          zoomProgress.value,
          [0, 0.3, 0.7, 1],
          [buttonTranslateY.value, buttonTranslateY.value + 8, buttonTranslateY.value + 8, buttonTranslateY.value]
        ),
      },
      { scale: buttonScale.value },
    ],
  }));

  // Detail content style (inside expanded card)
  // Fades in via detailOpacity on entry, and flows down with the card via zoomProgress on exit
  const detailContentStyle = useAnimatedStyle(() => {
    // zoomProgress drives the collapse — content fades and shifts down as card shrinks
    const zoomFade = interpolate(zoomProgress.value, [0.4, 1], [0, 1], 'clamp');
    const zoomShift = interpolate(zoomProgress.value, [0.3, 1], [30, 0], 'clamp');

    return {
      opacity: detailOpacity.value * zoomFade,
      transform: [{ translateY: detailTranslateY.value + zoomShift }],
    };
  });

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? [colors.bgSecondary, colors.bgTertiary, colors.bgPrimary] : ['#F3F4F6', '#F5F6F8', '#F8F9FB']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Logo spacer */}
        <View style={styles.logoSpacer} />

        {/* Headline */}
        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>Here's how it works</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>4 simple steps to your new look</Text>
        </Animated.View>

        {/* Cards container */}
        <View style={[styles.cardsContainer, { marginTop: cardsContainerTop }]}>
          {CARD_DATA.map((card, i) => (
            <OverviewCard
              key={i}
              card={card}
              index={i}
              isActive={i === activeCardIndex && phase === 'overview'}
              isCompleted={completedCards[i]}
              isFuture={i > activeCardIndex}
              entryProgress={cardEntries[i]}
              zoomProgress={zoomProgress}
              activeIdx={activeIdx}
              activePulse={activePulse}
              colors={colors}
              isDark={isDark}
              cardWidth={OVERVIEW_CARD_WIDTH}
              getCardOverviewY={getCardOverviewY}
              topArea={topArea}
              headlineAreaHeight={headlineAreaHeight}
              cardsContainerTop={cardsContainerTop}
              expandedTop={expandedTop}
              expandedHeight={expandedHeight}
            />
          ))}
        </View>
      </View>

      {/* Zoom overlay — the expanded card with detail content */}
      {(phase === 'zooming_in' || phase === 'detail' || phase === 'zooming_out') && (
        <ZoomOverlay
          card={CARD_DATA[activeCardIndex]}
          cardIndex={activeCardIndex}
          zoomProgress={zoomProgress}
          detailContentStyle={detailContentStyle}
          showHero={showHero}
          colors={colors}
          isDark={isDark}
          insets={insets}
          expandedTop={expandedTop}
          expandedHeight={expandedHeight}
          cardWidth={OVERVIEW_CARD_WIDTH}
          getCardOverviewY={getCardOverviewY}
          headlineAreaHeight={headlineAreaHeight}
          cardsContainerTop={cardsContainerTop}
        />
      )}

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={() => {
            buttonScale.value = withTiming(0.97, { duration: 100 });
          }}
          onPressOut={() => {
            buttonScale.value = withTiming(1, { duration: 100 });
          }}
        >
          <LinearGradient
            colors={isDark ? [colors.accentLight, colors.accent] : ['#1A1F2E', '#0D1017']}
            locations={[0.68, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

// --- Overview Card Component ---

interface OverviewCardProps {
  card: (typeof CARD_DATA)[number];
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  entryProgress: SharedValue<number>;
  zoomProgress: SharedValue<number>;
  activeIdx: SharedValue<number>;
  activePulse: SharedValue<number>;
  colors: any;
  isDark: boolean;
  cardWidth: number;
  getCardOverviewY: (i: number) => number;
  topArea: number;
  headlineAreaHeight: number;
  cardsContainerTop: number;
  expandedTop: number;
  expandedHeight: number;
}

function OverviewCard({
  card,
  index,
  isActive,
  isCompleted,
  isFuture,
  entryProgress,
  zoomProgress,
  activeIdx,
  activePulse,
  colors,
  isDark,
  cardWidth,
}: OverviewCardProps) {
  // Completion animation
  const completionProgress = useSharedValue(isCompleted ? 1 : 0);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    if (isCompleted) {
      completionProgress.value = withTiming(1, { duration: 500, easing: STANDARD_EASE });
      checkScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 200, mass: 0.6 }));
    }
  }, [isCompleted]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Entry animation
    const translateY = interpolate(entryProgress.value, [0, 1], [40, 0]);
    const scale = interpolate(entryProgress.value, [0, 1], [0.92, 1]);
    const entryOpacity = interpolate(entryProgress.value, [0, 0.3], [0, 1], 'clamp');

    // During zoom: non-active cards fade out, active card becomes invisible (overlay takes over)
    const isActiveCard = index === activeIdx.value;
    let zoomOpacity: number;
    if (isActiveCard) {
      // Active card: hide it when overlay is showing (immediately)
      zoomOpacity = interpolate(zoomProgress.value, [0, 0.05], [1, 0], 'clamp');
    } else {
      // Other cards: graceful fade out
      zoomOpacity = interpolate(zoomProgress.value, [0, 0.35], [1, 0], 'clamp');
    }

    const zoomTranslateY = isActiveCard
      ? 0
      : interpolate(zoomProgress.value, [0, 0.5], [0, index < activeIdx.value ? -15 : 15], 'clamp');

    const zoomScale = isActiveCard ? 1 : interpolate(zoomProgress.value, [0, 0.5], [1, 0.97], 'clamp');

    return {
      opacity: entryOpacity * zoomOpacity,
      transform: [
        { translateY: translateY + zoomTranslateY },
        { scale: scale * zoomScale },
      ],
    };
  });

  // Active card border pulse
  const activeBorderStyle = useAnimatedStyle(() => {
    if (index !== activeIdx.value) return { opacity: 0 };
    const opacity = interpolate(activePulse.value, [0, 1], [0.15, 0.45]);
    return { opacity };
  });

  // Completion bar animation
  const completionBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: completionProgress.value }],
    opacity: completionProgress.value,
  }));

  // Check badge animation
  const checkBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const iconBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)';
  const iconColor = isDark ? colors.textPrimary : '#1a1d2b';
  const accentColor = isDark ? colors.accent : '#1A1F2E';

  return (
    <Animated.View
      style={[
        overviewStyles.card,
        {
          width: cardWidth,
          backgroundColor: isDark ? colors.bgSecondary : '#fff',
          shadowOpacity: isDark ? 0.2 : 0.06,
        },
        cardAnimatedStyle,
      ]}
    >
      {/* Active border highlight */}
      <Animated.View
        style={[
          overviewStyles.activeBorder,
          {
            borderColor: accentColor,
            borderRadius: OVERVIEW_CARD_RADIUS,
          },
          activeBorderStyle,
        ]}
      />

      {/* Completion accent bar */}
      {isCompleted && (
        <Animated.View
          style={[
            overviewStyles.completionBar,
            { backgroundColor: accentColor },
            completionBarStyle,
          ]}
        />
      )}

      {/* Icon */}
      <View style={[overviewStyles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Feather
          name={card.icon}
          size={20}
          color={iconColor}
          style={{ opacity: isCompleted ? 0.5 : isFuture ? 0.4 : 1 }}
        />
        {/* Check badge */}
        {isCompleted && (
          <Animated.View
            style={[
              overviewStyles.checkBadge,
              { backgroundColor: accentColor },
              checkBadgeStyle,
            ]}
          >
            <Feather name="check" size={8} color={isDark ? colors.textOnAccent : '#fff'} />
          </Animated.View>
        )}
      </View>

      {/* Text */}
      <View style={overviewStyles.textContainer}>
        <Text
          style={[
            overviewStyles.title,
            {
              color: isDark ? colors.textPrimary : '#1a1d2b',
              opacity: isCompleted ? 0.5 : isFuture ? 0.5 : 1,
            },
          ]}
        >
          {card.title}
        </Text>
        <Text
          style={[
            overviewStyles.desc,
            {
              color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)',
              opacity: isCompleted ? 0.5 : isFuture ? 0.4 : 1,
            },
          ]}
        >
          {card.desc}
        </Text>
      </View>

      {/* Step badge / chevron */}
      <View
        style={[
          overviewStyles.stepBadge,
          {
            backgroundColor: isActive
              ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,29,43,0.08)')
              : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,29,43,0.03)'),
          },
        ]}
      >
        {isCompleted ? (
          <Feather name="check" size={12} color={accentColor} />
        ) : isActive ? (
          <Feather name="chevron-right" size={14} color={accentColor} />
        ) : (
          <Text
            style={[
              overviewStyles.stepBadgeText,
              { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.3)' },
            ]}
          >
            {index + 1}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// --- Zoom Overlay Component ---

interface ZoomOverlayProps {
  card: (typeof CARD_DATA)[number];
  cardIndex: number;
  zoomProgress: SharedValue<number>;
  detailContentStyle: any;
  showHero: boolean;
  colors: any;
  isDark: boolean;
  insets: any;
  expandedTop: number;
  expandedHeight: number;
  cardWidth: number;
  getCardOverviewY: (i: number) => number;
  headlineAreaHeight: number;
  cardsContainerTop: number;
}

function ZoomOverlay({
  card,
  cardIndex,
  zoomProgress,
  detailContentStyle,
  showHero,
  colors,
  isDark,
  insets,
  expandedTop,
  expandedHeight,
  cardWidth,
  getCardOverviewY,
  headlineAreaHeight,
  cardsContainerTop,
}: ZoomOverlayProps) {
  const HeroComponent = card.Hero;

  // Calculate the card's overview position (absolute on screen)
  const overviewCardScreenY =
    insets.top - 40 + // logoSpacer marginTop
    LOGO_SIZE_SMALL + // logoSpacer height
    headlineAreaHeight +
    cardsContainerTop +
    getCardOverviewY(cardIndex);

  const overviewCardScreenX = layout.screenPadding;

  const overlayStyle = useAnimatedStyle(() => {
    const top = interpolate(
      zoomProgress.value,
      [0, 1],
      [overviewCardScreenY, expandedTop]
    );
    const left = interpolate(
      zoomProgress.value,
      [0, 1],
      [overviewCardScreenX, 0]
    );
    const width = interpolate(
      zoomProgress.value,
      [0, 1],
      [cardWidth, SCREEN_WIDTH]
    );
    const height = interpolate(
      zoomProgress.value,
      [0, 1],
      [OVERVIEW_CARD_HEIGHT, expandedHeight]
    );
    const bRadius = interpolate(
      zoomProgress.value,
      [0, 1],
      [OVERVIEW_CARD_RADIUS, 24]
    );
    const shadowOpacity = interpolate(
      zoomProgress.value,
      [0, 0.5, 1],
      [isDark ? 0.2 : 0.06, 0.25, isDark ? 0.35 : 0.15]
    );

    return {
      position: 'absolute' as const,
      top,
      left,
      width,
      height,
      borderRadius: bRadius,
      shadowOpacity,
      zIndex: 200,
    };
  });

  // Overview content (icon + text) fades out during zoom
  const overviewContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(zoomProgress.value, [0, 0.25], [1, 0], 'clamp'),
  }));

  return (
    <Animated.View
      style={[
        overlayStyles.overlay,
        {
          backgroundColor: isDark ? colors.bgSecondary : '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 30,
          elevation: 20,
        },
        overlayStyle,
      ]}
    >
      {/* Overview content (visible during zoom start) */}
      <Animated.View style={[overlayStyles.overviewContent, overviewContentStyle]}>
        <View
          style={[
            overviewStyles.iconContainer,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)' },
          ]}
        >
          <Feather
            name={card.icon}
            size={20}
            color={isDark ? colors.textPrimary : '#1a1d2b'}
          />
        </View>
        <View style={overviewStyles.textContainer}>
          <Text
            style={[
              overviewStyles.title,
              { color: isDark ? colors.textPrimary : '#1a1d2b' },
            ]}
          >
            {card.title}
          </Text>
          <Text
            style={[
              overviewStyles.desc,
              { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)' },
            ]}
          >
            {card.desc}
          </Text>
        </View>
      </Animated.View>

      {/* Detail content (visible when fully expanded) */}
      <Animated.View style={[overlayStyles.detailContent, detailContentStyle]}>
        {/* Hero */}
        <View style={overlayStyles.heroContainer}>
          {showHero && <HeroComponent />}
        </View>

        {/* Headline */}
        <View style={overlayStyles.headlineContainer}>
          <Text
            style={[
              overlayStyles.headline,
              { color: isDark ? colors.textPrimary : '#1a1d2b' },
            ]}
          >
            {card.headline}
          </Text>
          <Text
            style={[
              overlayStyles.headline,
              overlayStyles.headlineDim,
              {
                color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,29,43,0.2)',
              },
            ]}
          >
            {card.headlineDim}
          </Text>
        </View>

        {/* Description */}
        <Text
          style={[
            overlayStyles.description,
            { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)' },
          ]}
        >
          {card.description}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// --- Styles ---

const overviewStyles = StyleSheet.create({
  card: {
    height: OVERVIEW_CARD_HEIGHT,
    borderRadius: OVERVIEW_CARD_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: OVERVIEW_CARD_GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    overflow: 'visible',
  },
  activeBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: 1.5,
  },
  completionBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const overlayStyles = StyleSheet.create({
  overlay: {
    overflow: 'hidden',
  },
  overviewContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: OVERVIEW_CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detailContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    marginBottom: 28,
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headline: {
    ...typography.displayLarge,
    fontSize: 38,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  headlineDim: {},
  description: {
    ...typography.bodyLarge,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});

const createStyles = (colors: any, insets: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgTertiary,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    logoSpacer: {
      marginTop: insets.top - 40,
      height: LOGO_SIZE_SMALL,
    },
    headlineContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    headline: {
      ...typography.displayLarge,
      fontSize: 34,
      fontWeight: '400',
      color: isDark ? colors.textPrimary : '#1a1d2b',
      textAlign: 'center',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...typography.bodyLarge,
      fontSize: 14,
      color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)',
      textAlign: 'center',
      marginBottom: 0,
      fontWeight: '500',
    },
    cardsContainer: {
      width: '100%',
      alignItems: 'center',
    },
    bottomSection: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Math.max(insets.bottom, 16) + 24,
    },
    button: {
      width: '100%',
      height: 56,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    buttonText: {
      ...typography.labelLarge,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textOnAccent,
    },
  });

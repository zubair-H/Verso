import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, borderRadius } from '@/constants/spacing';
import { ViewfinderHero, InspoHero, AttributesHero, MagicHero } from '@/components/onboarding/heroes';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOGO_SIZE_SMALL = 220;

// Card data with detail content
const CARD_DATA = [
  {
    icon: 'camera' as const,
    title: 'Selfie',
    desc: 'Snap a quick photo',
    headline: 'Start with you.',
    headlineDim: 'Your best angle.',
    description: 'Snap a photo or pick one from your gallery — any clear shot of your face works.',
    Hero: ViewfinderHero,
  },
  {
    icon: 'users' as const,
    title: 'Inspo',
    desc: 'Browse celeb looks',
    headline: 'Find your look.',
    headlineDim: 'Any style, any celeb.',
    description: 'Browse our collection of looks or upload a celeb photo you want to draw from.',
    Hero: InspoHero,
  },
  {
    icon: 'scissors' as const,
    title: 'Attributes',
    desc: 'Fine-tune details',
    headline: 'Fine-tune it.',
    headlineDim: 'Every detail matters.',
    description: 'Choose exactly what you want — hair, style, features — and fine-tune every detail.',
    Hero: AttributesHero,
  },
  {
    icon: 'zap' as const,
    title: 'Magic',
    desc: 'See the result',
    headline: 'See the magic.',
    headlineDim: 'AI brings it to life.',
    description: 'AI applies the look to your photo — see yourself transformed in seconds.',
    Hero: MagicHero,
  },
];

// Card tile dimensions — wide horizontal cards
// Width is ~75% of container so zigzag offset is visible
const CARD_WIDTH = Math.round((SCREEN_WIDTH - layout.screenPadding * 2) * 0.75);
const CARD_HEIGHT = 72;
const CARD_RADIUS = 18;

// Border SVG dimensions (slightly larger than card for the border inset)
const BORDER_INSET = 1.5;
const BORDER_W = CARD_WIDTH + BORDER_INSET * 2;
const BORDER_H = CARD_HEIGHT + BORDER_INSET * 2;
const BORDER_R = CARD_RADIUS + BORDER_INSET;

// Two half-perimeter paths: both start at top-center, one goes right, one goes left.
// They meet at bottom-center. This gives the split-draw-from-top effect.
const BORDER_MX = BORDER_W / 2; // top-center x
const BORDER_MY = 1;            // top y (1px inset for stroke)
const BW = BORDER_W - 2;       // inner width
const BH = BORDER_H - 2;       // inner height
const BR = BORDER_R;

// Right half: top-center → top-right → bottom-right → bottom-center
const BORDER_PATH_RIGHT = [
  `M ${BORDER_MX} ${BORDER_MY}`,
  `L ${1 + BW - BR} ${BORDER_MY}`,
  `A ${BR} ${BR} 0 0 1 ${1 + BW} ${BORDER_MY + BR}`,
  `L ${1 + BW} ${BORDER_MY + BH - BR}`,
  `A ${BR} ${BR} 0 0 1 ${1 + BW - BR} ${BORDER_MY + BH}`,
  `L ${BORDER_MX} ${BORDER_MY + BH}`,
].join(' ');

// Left half: top-center → top-left → bottom-left → bottom-center
const BORDER_PATH_LEFT = [
  `M ${BORDER_MX} ${BORDER_MY}`,
  `L ${1 + BR} ${BORDER_MY}`,
  `A ${BR} ${BR} 0 0 0 ${1} ${BORDER_MY + BR}`,
  `L ${1} ${BORDER_MY + BH - BR}`,
  `A ${BR} ${BR} 0 0 0 ${1 + BR} ${BORDER_MY + BH}`,
  `L ${BORDER_MX} ${BORDER_MY + BH}`,
].join(' ');

// Half perimeter length (each path)
const BORDER_HALF_PERIM = (BW / 2 - BR) + (Math.PI * BR / 2) + (BH - 2 * BR) + (Math.PI * BR / 2) + (BW / 2 - BR);

// Animation easings
const SMOOTH_EASE = Easing.bezier(0.33, 1, 0.68, 1);
const STANDARD_EASE = Easing.bezier(0.4, 0, 0.2, 1);
const ZOOM_DURATION = 500;

type FlowPhase = 'overview' | 'zooming_in' | 'detail' | 'zooming_out';

// Zigzag card positions relative to cards container
// Staggered: left→right→left→right
function getCardPositions(containerWidth: number, rowGap: number) {
  const leftX = 0;
  const rightX = containerWidth - CARD_WIDTH;
  const rowHeight = CARD_HEIGHT + rowGap;

  return [
    { x: leftX, y: 0 },                    // Card 0: left
    { x: rightX, y: rowHeight },            // Card 1: right
    { x: leftX, y: rowHeight * 2 },         // Card 2: left
    { x: rightX, y: rowHeight * 3 },        // Card 3: right
  ];
}

// SVG arrow path between two cards
function getArrowPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const fromCx = from.x + CARD_WIDTH / 2;
  const fromCy = from.y + CARD_HEIGHT;
  const toCx = to.x + CARD_WIDTH / 2;
  const toCy = to.y;

  // Bezier control points for a nice S-curve
  const midY = (fromCy + toCy) / 2;
  const cp1x = fromCx;
  const cp1y = midY;
  const cp2x = toCx;
  const cp2y = midY;

  return `M ${fromCx} ${fromCy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toCx} ${toCy}`;
}

// Measure the arrow path length for dash animation
function approxPathLength(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  const dx = (to.x + CARD_WIDTH / 2) - (from.x + CARD_WIDTH / 2);
  const dy = (to.y) - (from.y + CARD_HEIGHT);
  return Math.sqrt(dx * dx + dy * dy) * 1.3; // rough bezier length
}

export default function HowItWorksScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State machine
  const [phase, setPhase] = useState<FlowPhase>('overview');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [completedCards, setCompletedCards] = useState<boolean[]>([false, false, false, false]);
  const [allComplete, setAllComplete] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const isAnimating = useRef(false);

  // Animation shared values
  const zoomProgress = useSharedValue(0);
  const activeIdx = useSharedValue(0);
  const detailOpacity = useSharedValue(0);
  const detailTranslateY = useSharedValue(16);
  const buttonScale = useSharedValue(1);
  const exitProgress = useSharedValue(0); // 0 = visible, 1 = exited

  // Entry animations
  const headlineEntry = useSharedValue(0);
  const headlineTranslateY = useSharedValue(20);
  const subtitleEntry = useSharedValue(0);
  const cardEntries = useRef([
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ]).current;
  const arrowEntries = useRef([
    useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ]).current;
  const buttonEntry = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const activePulse = useSharedValue(0);
  // Per-card and per-arrow fill: once filled, they stay filled (progressive trail)
  const cardFills = useRef([
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ]).current;
  const arrowFills = useRef([
    useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ]).current;

  // Layout
  const containerWidth = SCREEN_WIDTH - layout.screenPadding * 2;
  const ROW_GAP = 24;
  const cardPositions = useMemo(() => getCardPositions(containerWidth, ROW_GAP), [containerWidth]);
  const totalGridHeight = CARD_HEIGHT * 4 + ROW_GAP * 3;

  const bottomArea = Math.max(insets.bottom, 16) + 24 + 56;
  // Cards area positioning
  const topArea = insets.top - 40 + LOGO_SIZE_SMALL;
  const headlineAreaHeight = 72;
  const availableForGrid = SCREEN_HEIGHT - topArea - headlineAreaHeight - bottomArea - 24;
  const gridMarginTop = Math.max((availableForGrid - totalGridHeight) / 2, 8);

  // Entry animations
  useEffect(() => {
    const EASE = Easing.bezier(0.22, 1, 0.36, 1);

    headlineEntry.value = withDelay(300, withTiming(1, { duration: 700, easing: EASE }));
    headlineTranslateY.value = withDelay(300, withSpring(0, { damping: 22, stiffness: 85 }));
    subtitleEntry.value = withDelay(450, withTiming(1, { duration: 500, easing: EASE }));

    // Sequential: card0 → arrow0 → card1 → arrow1 → card2 → arrow2 → card3
    const CARD_APPEAR = 350;   // time for a card to spring in
    const ARROW_DRAW = 450;    // time for an arrow to draw
    const BASE = 500;          // initial delay

    cardEntries.forEach((entry, i) => {
      const delay = BASE + i * (CARD_APPEAR + ARROW_DRAW);
      entry.value = withDelay(delay, withSpring(1, { damping: 22, stiffness: 90 }));
    });

    arrowEntries.forEach((entry, i) => {
      // Arrow i draws after card i has appeared
      const delay = BASE + i * (CARD_APPEAR + ARROW_DRAW) + CARD_APPEAR;
      entry.value = withDelay(delay, withTiming(1, { duration: ARROW_DRAW, easing: STANDARD_EASE }));
    });

    const totalSequence = BASE + 3 * (CARD_APPEAR + ARROW_DRAW) + CARD_APPEAR;
    buttonEntry.value = withDelay(totalSequence + 200, withTiming(1, { duration: 500, easing: SMOOTH_EASE }));
    buttonTranslateY.value = withDelay(totalSequence + 200, withSpring(0, { damping: 20, stiffness: 90 }));

    // Fill first card border after entry sequence
    const FILL_DURATION = 500;
    cardFills[0].value = withDelay(totalSequence + 300, withTiming(1, { duration: FILL_DURATION, easing: SMOOTH_EASE }));

    // Pulse loop for active card (starts after fill)
    startPulse(totalSequence + 300 + FILL_DURATION + 300);
  }, []);

  const startPulse = useCallback((delay: number = 3500) => {
    activePulse.value = withDelay(
      delay,
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

    setPhase('zooming_in');
    zoomProgress.value = withTiming(1, { duration: ZOOM_DURATION, easing: STANDARD_EASE });

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

    setPhase('zooming_out');
    zoomProgress.value = withTiming(0, { duration: ZOOM_DURATION, easing: STANDARD_EASE });

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowHero(false);
      detailOpacity.value = 0;
      detailTranslateY.value = 16;

      setCompletedCards(prev => {
        const next = [...prev];
        next[activeCardIndex] = true;
        return next;
      });

      if (activeCardIndex === 3) {
        // Last card — return to overview with all cards complete
        setAllComplete(true);
        setPhase('overview');
        isAnimating.current = false;
      } else {
        const nextIdx = activeCardIndex + 1;
        const CARD_DRAIN = 300;
        const ARROW_FILL = 500;
        const ARROW_DRAIN = 300;
        const CARD_FILL = 400;

        // Phase 1: Current card border drains out top→bottom (1→2)
        cardFills[activeCardIndex].value = withTiming(2, { duration: CARD_DRAIN, easing: STANDARD_EASE });

        // Phase 2: Arrow fills (0→1) then drains (1→2) — energy travels through then leaves
        const arrowIdx = activeCardIndex;
        setTimeout(() => {
          arrowFills[arrowIdx].value = withTiming(1, { duration: ARROW_FILL, easing: STANDARD_EASE });
          // Phase 3: After fill completes, drain the arrow
          setTimeout(() => {
            arrowFills[arrowIdx].value = withTiming(2, { duration: ARROW_DRAIN, easing: STANDARD_EASE });
          }, ARROW_FILL - 50);
        }, CARD_DRAIN - 50);

        // Phase 4: New card border fills (energy arrives)
        cardFills[nextIdx].value = withDelay(
          CARD_DRAIN + ARROW_FILL - 150,
          withTiming(1, { duration: CARD_FILL, easing: SMOOTH_EASE })
        );

        const totalDuration = CARD_DRAIN + ARROW_FILL + ARROW_DRAIN;
        setTimeout(() => {
          setActiveCardIndex(nextIdx);
          activeIdx.value = nextIdx;
          startPulse(300);
          setPhase('overview');
          isAnimating.current = false;
        }, totalDuration - 100);
      }
    }, ZOOM_DURATION + 50);
  }, [activeCardIndex]);

  const handleExit = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const EXIT_EASE = Easing.bezier(0.4, 0, 0.2, 1);

    // Fade out button with slight downward slide
    buttonEntry.value = withTiming(0, { duration: 250, easing: EXIT_EASE });
    buttonTranslateY.value = withTiming(20, { duration: 300, easing: EXIT_EASE });

    // Fade out headline + subtitle with slight upward drift
    headlineEntry.value = withTiming(0, { duration: 300, easing: EXIT_EASE });
    headlineTranslateY.value = withTiming(-12, { duration: 350, easing: EXIT_EASE });
    subtitleEntry.value = withTiming(0, { duration: 250, easing: EXIT_EASE });

    // Stagger cards out (reverse order: card3 first, card0 last)
    cardEntries.forEach((entry, i) => {
      const reverseDelay = (3 - i) * 80;
      entry.value = withDelay(reverseDelay, withTiming(0, { duration: 300, easing: EXIT_EASE }));
    });

    // Arrows fade out together
    arrowEntries.forEach((entry) => {
      entry.value = withTiming(0, { duration: 250, easing: EXIT_EASE });
    });

    // Drain active card border, hide already-drained ones
    cardFills.forEach((fill) => {
      if (fill.value > 0 && fill.value <= 1) {
        // Active/filled card: drain it out (1→2)
        fill.value = withTiming(2, { duration: 300, easing: EXIT_EASE });
      }
      // Already drained (value >= 2) or unfilled (0): leave as-is
    });
    arrowFills.forEach((fill) => {
      if (fill.value > 0 && fill.value <= 1) {
        fill.value = withTiming(2, { duration: 300, easing: EXIT_EASE });
      }
    });

    // Drive exitProgress for any global effects
    exitProgress.value = withTiming(1, { duration: 500, easing: EXIT_EASE });

    // Navigate after animation completes
    setTimeout(() => {
      router.push('/(onboarding)/permissions' as any);
    }, 550);
  }, []);

  const handleContinue = useCallback(() => {
    if (phase === 'overview' && allComplete) {
      handleExit();
    } else if (phase === 'overview') {
      handleZoomIn();
    } else if (phase === 'detail') {
      handleZoomOut();
    }
  }, [phase, allComplete, activeCardIndex, handleZoomIn, handleZoomOut, handleExit]);

  const buttonText = useMemo(() => {
    if (phase === 'overview' && allComplete) return "Let's go";
    if (phase === 'detail') return 'Got it';
    return 'Continue';
  }, [phase, allComplete]);

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
      { translateY: interpolate(zoomProgress.value, [0, 0.3, 0.7, 1], [buttonTranslateY.value, buttonTranslateY.value + 8, buttonTranslateY.value + 8, buttonTranslateY.value]) },
      { scale: buttonScale.value },
    ],
  }));

  const detailContentStyle = useAnimatedStyle(() => {
    const zoomFade = interpolate(zoomProgress.value, [0.4, 1], [0, 1], 'clamp');
    const zoomShift = interpolate(zoomProgress.value, [0.3, 1], [30, 0], 'clamp');
    return {
      opacity: detailOpacity.value * zoomFade,
      transform: [{ translateY: detailTranslateY.value + zoomShift }],
    };
  });

  const arrowColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,29,43,0.1)';

  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? [colors.bgSecondary, colors.bgTertiary, colors.bgPrimary] : ['#F3F4F6', '#F5F6F8', '#F8F9FB']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.logoSpacer} />

        <Animated.View style={[styles.headlineContainer, headlineStyle]}>
          <Text style={styles.headline}>Here's how it works</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>4 simple steps to your new look</Text>
        </Animated.View>

        {/* Cards grid with arrows */}
        <View style={[styles.gridContainer, { marginTop: gridMarginTop, height: totalGridHeight }]}>
          {/* SVG arrows between cards */}
          <Svg
            width={containerWidth}
            height={totalGridHeight}
            style={StyleSheet.absoluteFill}
          >
            {[0, 1, 2].map((i) => {
              const from = cardPositions[i];
              const to = cardPositions[i + 1];
              const path = getArrowPath(from, to);
              const pathLen = approxPathLength(from, to);

              return (
                <CurvedArrow
                  key={i}
                  d={path}
                  pathLength={pathLen}
                  entry={arrowEntries[i]}
                  zoomProgress={zoomProgress}
                  color={arrowColor}
                  activeColor={isDark ? colors.accent : '#1A1F2E'}
                  arrowFill={arrowFills[i]}
                />
              );
            })}
          </Svg>

          {/* Cards */}
          {CARD_DATA.map((card, i) => (
            <OverviewTile
              key={i}
              card={card}
              index={i}
              position={cardPositions[i]}
              isCompleted={completedCards[i]}
              isFuture={i > activeCardIndex}
              entryProgress={cardEntries[i]}
              zoomProgress={zoomProgress}
              activeIdx={activeIdx}
              activePulse={activePulse}
              cardFill={cardFills[i]}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      </View>

      {/* Zoom overlay */}
      {(phase === 'zooming_in' || phase === 'detail' || phase === 'zooming_out') && (
        <ZoomOverlay
          card={CARD_DATA[activeCardIndex]}
          zoomProgress={zoomProgress}
          detailContentStyle={detailContentStyle}
          showHero={showHero}
          colors={colors}
          isDark={isDark}
          insets={insets}
          cardPosition={cardPositions[activeCardIndex]}
          gridMarginTop={gridMarginTop}
          headlineAreaHeight={headlineAreaHeight}
        />
      )}

      {/* Bottom button */}
      <Animated.View style={[styles.bottomSection, buttonStyle, { zIndex: 300 }]}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={() => { buttonScale.value = withTiming(0.97, { duration: 100 }); }}
          onPressOut={() => { buttonScale.value = withTiming(1, { duration: 100 }); }}
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

// --- Curved Arrow (SVG path that draws in) ---

function CurvedArrow({
  d,
  pathLength,
  entry,
  zoomProgress,
  color,
  activeColor,
  arrowFill,
}: {
  d: string;
  pathLength: number;
  entry: SharedValue<number>;
  zoomProgress: SharedValue<number>;
  color: string;
  activeColor: string;
  arrowFill: SharedValue<number>;
}) {
  // Base arrow
  const animatedProps = useAnimatedProps(() => {
    const drawn = interpolate(entry.value, [0, 1], [pathLength, 0]);
    const zoomOpacity = interpolate(zoomProgress.value, [0, 0.3], [1, 0], 'clamp');
    return {
      strokeDashoffset: drawn,
      opacity: zoomOpacity,
    };
  });

  // Traveling segment: arrowFill 0→1 fills from start, 1→2 drains from start
  // Head draws the front edge, tail erases from behind
  const headProps = useAnimatedProps(() => {
    const zoomOpacity = interpolate(zoomProgress.value, [0, 0.3], [1, 0], 'clamp');
    const entryOpacity = interpolate(entry.value, [0, 0.3], [0, 1], 'clamp');
    // Head advances during 0→1, stays at end during 1→2
    const headProgress = Math.min(arrowFill.value, 1);
    const offset = interpolate(headProgress, [0, 1], [pathLength, 0]);
    return {
      strokeDashoffset: offset,
      opacity: (arrowFill.value > 0 && arrowFill.value < 2) ? 0.5 * zoomOpacity * entryOpacity : 0,
    };
  });

  // Tail eraser: draws over the accent with the base color, catching up during 1→2
  const tailProps = useAnimatedProps(() => {
    const zoomOpacity = interpolate(zoomProgress.value, [0, 0.3], [1, 0], 'clamp');
    const entryOpacity = interpolate(entry.value, [0, 0.3], [0, 1], 'clamp');
    // Tail only moves during 1→2 phase
    const tailProgress = Math.max(arrowFill.value - 1, 0);
    const offset = interpolate(tailProgress, [0, 1], [pathLength, 0]);
    return {
      strokeDashoffset: offset,
      opacity: tailProgress > 0 ? zoomOpacity * entryOpacity : 0,
    };
  });

  return (
    <>
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={[pathLength, pathLength]}
        animatedProps={animatedProps}
      />
      {/* Accent fill — head draws forward */}
      <AnimatedPath
        d={d}
        stroke={activeColor}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={[pathLength, pathLength]}
        animatedProps={headProps}
      />
      {/* Tail eraser — draws over accent with base color during drain phase */}
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={[pathLength, pathLength]}
        animatedProps={tailProps}
      />
    </>
  );
}

// --- Overview Tile (compact square card) ---

interface OverviewTileProps {
  card: (typeof CARD_DATA)[number];
  index: number;
  position: { x: number; y: number };
  isCompleted: boolean;
  isFuture: boolean;
  entryProgress: SharedValue<number>;
  zoomProgress: SharedValue<number>;
  activeIdx: SharedValue<number>;
  activePulse: SharedValue<number>;
  cardFill: SharedValue<number>;
  colors: any;
  isDark: boolean;
}

function OverviewTile({
  card,
  index,
  position,
  isCompleted,
  isFuture,
  entryProgress,
  zoomProgress,
  activeIdx,
  activePulse,
  cardFill,
  colors,
  isDark,
}: OverviewTileProps) {
  const completionProgress = useSharedValue(isCompleted ? 1 : 0);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    if (isCompleted) {
      completionProgress.value = withTiming(1, { duration: 500, easing: STANDARD_EASE });
      checkScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 200, mass: 0.6 }));
    }
  }, [isCompleted]);

  const tileStyle = useAnimatedStyle(() => {
    // Entry: scale + fade from below
    const entryScale = interpolate(entryProgress.value, [0, 1], [0.7, 1]);
    const entryOpacity = interpolate(entryProgress.value, [0, 0.3], [0, 1], 'clamp');
    const entryTY = interpolate(entryProgress.value, [0, 1], [30, 0]);

    // Zoom: active card hides instantly (overlay takes over), others fade
    const isActiveCard = index === activeIdx.value;
    const zoomOpacity = isActiveCard
      ? interpolate(zoomProgress.value, [0, 0.05], [1, 0], 'clamp')
      : interpolate(zoomProgress.value, [0, 0.35], [1, 0], 'clamp');

    return {
      opacity: entryOpacity * zoomOpacity,
      transform: [
        { translateY: entryTY },
        { scale: entryScale },
      ],
    };
  });

  const isActive = !isCompleted && !isFuture;

  // Animated opacity for icon, title, and desc — fades gracefully on completion
  const iconOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(completionProgress.value, [0, 1], [isFuture ? 0.35 : 1, 0.5]),
  }));
  const titleOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(completionProgress.value, [0, 1], [isFuture ? 0.55 : 1, 0.5]),
  }));
  const descOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(completionProgress.value, [0, 1], [isFuture ? 0.55 : 0.85, 0.5]),
  }));

  // Border: cardFill 0→1 fills top-to-bottom, 1→2 drains top-to-bottom.
  // Path goes top→bottom.
  // Fill (0→1): strokeDashoffset shrinks, revealing stroke from path start (top).
  // Drain (1→2): visible segment shrinks from top, anchored at bottom.
  const borderFillProps = useAnimatedProps(() => {
    const pulse = interpolate(activePulse.value, [0, 1], [0.5, 0.9]);
    if (cardFill.value <= 1) {
      // Fill: simple dashoffset draw from top→bottom
      const offset = interpolate(cardFill.value, [0, 1], [BORDER_HALF_PERIM, 0]);
      return {
        strokeDasharray: [BORDER_HALF_PERIM, BORDER_HALF_PERIM],
        strokeDashoffset: offset,
        opacity: cardFill.value > 0 ? pulse : 0,
      };
    }
    // Drain (1→2): shrink visible segment from top, keep bottom visible last
    const drainProgress = cardFill.value - 1; // 0→1
    const visibleLen = (1 - drainProgress) * BORDER_HALF_PERIM;
    const offset = -(BORDER_HALF_PERIM - visibleLen);
    return {
      strokeDasharray: [visibleLen, BORDER_HALF_PERIM * 2],
      strokeDashoffset: offset,
      opacity: visibleLen > 0.1 ? pulse : 0,
    };
  });

  const checkBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const iconBgColor = isActive
    ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(26,29,43,0.1)')
    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)');
  const iconColor = isDark ? colors.textPrimary : '#1a1d2b';
  const accentColor = isDark ? colors.accent : '#1A1F2E';

  return (
    <Animated.View
      style={[
        tileStyles.tile,
        {
          left: position.x,
          top: position.y,
          backgroundColor: isDark
            ? (isActive ? colors.bgTertiary : colors.bgSecondary)
            : (isActive ? '#fff' : '#fff'),
          shadowOpacity: isActive
            ? (isDark ? 0.4 : 0.14)
            : (isDark ? 0.25 : 0.08),
        },
        tileStyle,
      ]}
    >
      {/* Active border — two SVG paths split from top-center, travel to bottom-center */}
      <Svg
        width={BORDER_W}
        height={BORDER_H}
        style={{ position: 'absolute', top: -BORDER_INSET, left: -BORDER_INSET }}
      >
        <AnimatedPath
          d={BORDER_PATH_RIGHT}
          stroke={accentColor}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          animatedProps={borderFillProps}
        />
        <AnimatedPath
          d={BORDER_PATH_LEFT}
          stroke={accentColor}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          animatedProps={borderFillProps}
        />
      </Svg>

      {/* Icon */}
      <View style={[tileStyles.iconWrap, { backgroundColor: iconBgColor }]}>
        <Animated.View style={iconOpacityStyle}>
          <Feather
            name={card.icon}
            size={22}
            color={iconColor}
          />
        </Animated.View>
        {isCompleted && (
          <Animated.View
            style={[tileStyles.checkBadge, { backgroundColor: accentColor }, checkBadgeStyle]}
          >
            <Feather name="check" size={8} color={isDark ? colors.textOnAccent : '#fff'} />
          </Animated.View>
        )}
      </View>

      {/* Text */}
      <View style={tileStyles.textWrap}>
        <Animated.Text
          style={[
            tileStyles.title,
            {
              color: isDark ? colors.textPrimary : '#1a1d2b',
            },
            titleOpacityStyle,
          ]}
          numberOfLines={1}
        >
          {card.title}
        </Animated.Text>
        <Animated.Text
          style={[
            tileStyles.desc,
            {
              color: isDark ? colors.textSecondary : 'rgba(26,29,43,0.45)',
            },
            descOpacityStyle,
          ]}
          numberOfLines={1}
        >
          {card.desc}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// --- Zoom Overlay ---

interface ZoomOverlayProps {
  card: (typeof CARD_DATA)[number];
  zoomProgress: SharedValue<number>;
  detailContentStyle: any;
  showHero: boolean;
  colors: any;
  isDark: boolean;
  insets: any;
  cardPosition: { x: number; y: number };
  gridMarginTop: number;
  headlineAreaHeight: number;
}

function ZoomOverlay({
  card,
  zoomProgress,
  detailContentStyle,
  showHero,
  colors,
  isDark,
  insets,
  cardPosition,
  gridMarginTop,
  headlineAreaHeight,
}: ZoomOverlayProps) {
  const HeroComponent = card.Hero;

  // Card's absolute screen position
  const cardScreenX = layout.screenPadding + cardPosition.x;
  const cardScreenY =
    insets.top - 40 +        // logoSpacer marginTop
    LOGO_SIZE_SMALL +        // logoSpacer height
    headlineAreaHeight +     // headline + subtitle
    gridMarginTop +          // grid top margin
    cardPosition.y;          // position within grid

  const overlayStyle = useAnimatedStyle(() => {
    const top = interpolate(zoomProgress.value, [0, 1], [cardScreenY, 0]);
    const left = interpolate(zoomProgress.value, [0, 1], [cardScreenX, 0]);
    const width = interpolate(zoomProgress.value, [0, 1], [CARD_WIDTH, SCREEN_WIDTH]);
    const height = interpolate(zoomProgress.value, [0, 1], [CARD_HEIGHT, SCREEN_HEIGHT]);
    const bRadius = interpolate(zoomProgress.value, [0, 1], [CARD_RADIUS, 0]);
    const shadowOpacity = interpolate(zoomProgress.value, [0, 0.5, 1], [isDark ? 0.25 : 0.08, 0.3, isDark ? 0.35 : 0.15]);

    return {
      position: 'absolute' as const,
      top, left, width, height,
      borderRadius: bRadius,
      shadowOpacity,
      zIndex: 200,
    };
  });

  // Tile content (icon + title) fades during zoom
  const tileContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(zoomProgress.value, [0, 0.3], [1, 0], 'clamp'),
  }));

  const iconBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,29,43,0.06)';

  return (
    <Animated.View
      style={[
        overlayZoomStyles.overlay,
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
      {/* Tile content (visible at start of zoom / end of zoom-out) */}
      <Animated.View style={[overlayZoomStyles.tileContent, tileContentStyle]}>
        <View style={[tileStyles.iconWrap, { backgroundColor: iconBgColor }]}>
          <Feather name={card.icon} size={22} color={isDark ? colors.textPrimary : '#1a1d2b'} />
        </View>
        <View style={tileStyles.textWrap}>
          <Text style={[tileStyles.title, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>
            {card.title}
          </Text>
          <Text style={[tileStyles.desc, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)' }]}>
            {card.desc}
          </Text>
        </View>
      </Animated.View>

      {/* Detail content — headline first, then hero */}
      <Animated.View style={[overlayZoomStyles.detailContent, detailContentStyle]}>
        <View style={overlayZoomStyles.headlineContainer}>
          <Text style={[overlayZoomStyles.headline, { color: isDark ? colors.textPrimary : '#1a1d2b' }]}>
            {card.headline}
          </Text>
          <Text style={[overlayZoomStyles.headline, { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,29,43,0.2)' }]}>
            {card.headlineDim}
          </Text>
        </View>
        <Text style={[overlayZoomStyles.description, { color: isDark ? colors.textTertiary : 'rgba(26,29,43,0.45)' }]}>
          {card.description}
        </Text>
        <View style={overlayZoomStyles.heroContainer}>
          {showHero && <HeroComponent />}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// --- Styles ---

const tileStyles = StyleSheet.create({
  tile: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
});

const overlayZoomStyles = StyleSheet.create({
  overlay: {
    overflow: 'hidden',
  },
  tileContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
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
    marginTop: 28,
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
    gridContainer: {
      width: '100%',
      position: 'relative',
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

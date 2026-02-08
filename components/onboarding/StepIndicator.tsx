import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

export interface StepInfo {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: StepInfo[];
  visibleCount?: number; // How many dots to show progressively (default: all)
}

const CIRCLE_SIZE = 28;
const ICON_SIZE = 14;
const LINE_WIDTH = 24;
const LINE_HEIGHT = 2;

// SVG ring dimensions
const RING_STROKE = 1.5;
const RING_R = (CIRCLE_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

export default function StepIndicator({ currentStep, steps, visibleCount }: StepIndicatorProps) {
  const { colors, isDark } = useTheme();

  const accentColor = colors.accent;
  const dimColor = colors.accentMuted;
  const completedColor = isDark ? 'rgba(255,255,255,0.12)' : colors.accentMuted;
  const lineTrackColor = colors.progressTrack;

  const maxVisible = visibleCount ?? steps.length;

  return (
    <View style={styles.container}>
      {steps.map((step, i) => {
        const isVisible = i < maxVisible;
        const nextVisible = i + 1 < maxVisible;

        return (
          <React.Fragment key={i}>
            <StepDot
              icon={step.icon}
              label={step.label}
              state={i < currentStep ? 'completed' : i === currentStep ? 'current' : 'upcoming'}
              visible={isVisible}
              accentColor={accentColor}
              dimColor={dimColor}
              completedColor={completedColor}
              isDark={isDark}
              textColor={colors.textPrimary}
              dimTextColor={colors.textTertiary}
            />
            {i < steps.length - 1 && (
              <StepLine
                filled={i < currentStep}
                visible={isVisible && nextVisible}
                trackColor={lineTrackColor}
                fillColor={accentColor}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function StepLine({
  filled,
  visible,
  trackColor,
  fillColor,
}: {
  filled: boolean;
  visible: boolean;
  trackColor: string;
  fillColor: string;
}) {
  const fillProgress = useSharedValue(filled ? 1 : 0);
  const visProgress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    fillProgress.value = withTiming(filled ? 1 : 0, {
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [filled]);

  useEffect(() => {
    visProgress.value = withTiming(visible ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [visible]);

  const fillStyle = useAnimatedStyle(() => ({
    width: interpolate(fillProgress.value, [0, 1], [0, LINE_WIDTH]),
  }));

  const visStyle = useAnimatedStyle(() => ({
    opacity: visProgress.value,
    transform: [{ scaleX: visProgress.value }],
  }));

  return (
    <Animated.View style={visStyle}>
      <View style={[styles.lineTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.lineFill, { backgroundColor: fillColor }, fillStyle]} />
      </View>
    </Animated.View>
  );
}

function StepDot({
  icon,
  label,
  state,
  visible,
  accentColor,
  dimColor,
  completedColor,
  isDark,
  textColor,
  dimTextColor,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  state: 'completed' | 'current' | 'upcoming';
  visible: boolean;
  accentColor: string;
  dimColor: string;
  completedColor: string;
  isDark: boolean;
  textColor: string;
  dimTextColor: string;
}) {
  // Ring progress: 0 = no ring, 1 = full ring drawn
  const ringProgress = useSharedValue(state === 'current' || state === 'completed' ? 1 : 0);
  // Visibility — spring in when becoming visible
  const visProgress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      visProgress.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 100 }));
    } else {
      visProgress.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  useEffect(() => {
    const DRAW_EASE = Easing.bezier(0.4, 0, 0.2, 1);

    if (state === 'current') {
      // Line fills first (500ms), then ring draws — delay ring by 400ms
      ringProgress.value = withDelay(400, withTiming(1, { duration: 600, easing: DRAW_EASE }));
    } else if (state === 'completed') {
      // Keep ring full
      ringProgress.value = withTiming(1, { duration: 300, easing: DRAW_EASE });
    } else {
      // Upcoming — no ring
      ringProgress.value = withTiming(0, { duration: 300 });
    }
  }, [state]);

  // SVG ring animated props — strokeDashoffset controls how much is drawn
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - ringProgress.value),
  }));

  const ringOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(ringProgress.value, [0, 0.02], [0, 1], 'clamp'),
  }));

  const visStyle = useAnimatedStyle(() => ({
    opacity: visProgress.value,
    transform: [{ scale: visProgress.value }],
  }));

  const bgColor = state === 'current' ? 'transparent' : state === 'completed' ? completedColor : dimColor;
  const iconColor = state === 'current' ? accentColor : state === 'completed' ? accentColor : dimTextColor;
  const iconOpacity = state === 'upcoming' ? 0.25 : 1;
  const labelColor = state === 'current' ? textColor : state === 'completed' ? textColor : dimTextColor;

  return (
    <Animated.View style={[styles.stepContainer, visStyle]}>
      <View style={[styles.circle, { backgroundColor: bgColor }]}>
        <Feather name={icon} size={ICON_SIZE} color={iconColor} style={{ opacity: iconOpacity }} />

        {/* SVG ring — draws around the circle for current/completed steps */}
        <Animated.View style={[styles.ringContainer, ringOpacity]}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <AnimatedSvgCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RING_R}
              stroke={accentColor}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              animatedProps={ringProps}
              rotation={-90}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>
        </Animated.View>
      </View>

      <Text
        style={[styles.label, { color: labelColor }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: 56,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 5,
    letterSpacing: -0.2,
  },
  lineTrack: {
    width: LINE_WIDTH,
    height: LINE_HEIGHT,
    borderRadius: LINE_HEIGHT / 2,
    marginTop: CIRCLE_SIZE / 2 - LINE_HEIGHT / 2,
    overflow: 'hidden',
  },
  lineFill: {
    height: LINE_HEIGHT,
    borderRadius: LINE_HEIGHT / 2,
  },
});

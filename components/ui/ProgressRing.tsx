import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { springs } from '@/constants/spacing';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showPercentage?: boolean;
  showLabel?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color,
  trackColor,
  showPercentage = false,
  showLabel,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const animatedProgress = useSharedValue(0);

  const progressColor = color ?? colors.accent;
  const progressTrackColor = trackColor ?? colors.progressTrack;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    animatedProgress.value = withSpring(Math.min(Math.max(progress, 0), 1), springs.progress);
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const displayProgress = useDerivedValue(() => {
    return Math.round(animatedProgress.value * 100);
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    svg: {
      position: 'absolute',
    },
    labelContainer: {
      alignItems: 'center',
    },
    percentage: {
      ...typography.labelLarge,
    },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
  }), [colors]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressTrackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {(showPercentage || showLabel) && (
        <View style={styles.labelContainer}>
          {showPercentage && (
            <Text style={[styles.percentage, { color: progressColor }]}>
              {Math.round(progress * 100)}%
            </Text>
          )}
          {showLabel && (
            <Text style={styles.label}>{showLabel}</Text>
          )}
        </View>
      )}
    </View>
  );
}

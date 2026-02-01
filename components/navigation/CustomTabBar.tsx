import React from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { layout } from '@/constants/spacing';

interface TabItem {
  name: string;
  label: string;
  icon: string;
  iconFilled: string;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const tabs: TabItem[] = [
  { name: 'index', label: 'Home', icon: '○', iconFilled: '●' },
  { name: 'presets', label: 'Presets', icon: '◇', iconFilled: '◆' },
  { name: 'saved', label: 'Saved', icon: '♡', iconFilled: '♥' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />
      <View style={styles.topBorder} />

      <View style={styles.tabsContainer}>
        {state.routes.map((route: any, index: number) => {
          const tab = tabs.find((t) => t.name === route.name) || tabs[0];
          const isFocused = state.index === index;

          const onPress = async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  tab,
  isFocused,
  onPress,
}: {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, animatedStyle]}
    >
      {isFocused ? (
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activeTab}
        >
          <Text style={styles.iconActive}>{tab.iconFilled}</Text>
          <Text style={styles.labelActive}>{tab.label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveTab}>
          <Text style={styles.iconInactive}>{tab.icon}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: layout.tabBarHeight,
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  inactiveTab: {
    padding: 10,
  },
  iconActive: {
    fontSize: 16,
    color: colors.textPrimary,
    marginRight: 6,
  },
  iconInactive: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  labelActive: {
    ...typography.labelMedium,
    color: colors.textPrimary,
  },
});

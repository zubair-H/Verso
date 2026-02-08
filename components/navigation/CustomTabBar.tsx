import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/typography';
import { layout, springs } from '@/constants/spacing';

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const tabs: TabItem[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { name: 'presets', label: 'Presets', icon: 'grid-outline', iconFilled: 'grid' },
  { name: 'saved', label: 'Saved', icon: 'heart-outline', iconFilled: 'heart' },
  { name: 'settings', label: 'More', icon: 'menu', iconFilled: 'menu' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: layout.tabBarHeight,
      backgroundColor: colors.bgSecondary,
    },
    topBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.borderLight,
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
      minWidth: 64,
    },
    activeTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    inactiveTab: {
      padding: 10,
    },
    labelActive: {
      ...typography.labelSmall,
      color: colors.accent,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
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
              colors={colors}
              styles={styles}
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
  colors,
  styles,
}: {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
  colors: any;
  styles: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, animatedStyle]}
    >
      {isFocused ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={styles.activeTab}
        >
          <Ionicons name={tab.iconFilled} size={20} color={colors.accent} />
          <Text style={styles.labelActive}>{tab.label}</Text>
        </Animated.View>
      ) : (
        <View style={styles.inactiveTab}>
          <Ionicons name={tab.icon} size={22} color={colors.textTertiary} />
        </View>
      )}
    </AnimatedPressable>
  );
}

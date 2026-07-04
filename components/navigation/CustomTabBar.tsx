import React, { useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { layout, springs } from '@/constants/spacing';

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const tabs: TabItem[] = [
  { name: 'index', label: 'Home', icon: 'home-outline' },
  { name: 'saved', label: 'Saved', icon: 'heart-outline' },
  { name: 'live', label: 'Live', icon: 'sparkles-outline' },
  { name: 'body-reshape', label: 'Reshape', icon: 'body-outline' },
  { name: 'settings', label: 'More', icon: 'menu-outline' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { colors, isDark } = useTheme();
  const currentRouteName = state.routes[state.index]?.name;

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
      paddingHorizontal: 14,
      paddingBottom: 20,
    },
    tabButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 56,
    },
    activeTabButton: {
      marginTop: -28,
      zIndex: 3,
    },
    activeTab: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    inactiveTab: {
      padding: 10,
    },
    createButton: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -28,
    },
    createGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: isDark ? colors.accentLight : colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
  }), [colors, isDark]);

  const createGradientColors: [string, string] = isDark
    ? [colors.heroBannerStart, colors.heroBannerEnd]
    : [colors.accent, '#2A2040'];

  const handleCreatePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('create');
  };
  const isCreateActive =
    currentRouteName === 'create' ||
    currentRouteName === 'outfit-analysis' ||
    currentRouteName === 'health-analysis';

  // Order: Home, Saved, [Create], Live, More
  const leftTabs = tabs.slice(0, 2);   // Home, Saved
  const rightTabs = tabs.slice(2);      // Live, More

  return (
    <View style={styles.container}>
      <View style={styles.topBorder} />
      <View style={styles.tabsContainer}>
        {/* Left tabs — Home, Saved */}
        {state.routes.map((route: any, index: number) => {
          const tab = leftTabs.find((t) => t.name === route.name);
          if (!tab) return null;
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
              gradientColors={createGradientColors}
            />
          );
        })}

        {/* Create button */}
        <CreateButton
          onPress={handleCreatePress}
          gradientColors={createGradientColors}
          styles={styles}
          isActive={isCreateActive}
          colors={colors}
        />

        {/* Right tab — More */}
        {state.routes.map((route: any, index: number) => {
          const tab = rightTabs.find((t) => t.name === route.name);
          if (!tab) return null;
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
              gradientColors={createGradientColors}
            />
          );
        })}
      </View>
    </View>
  );
}

function CreateButton({
  onPress,
  gradientColors,
  styles,
  isActive,
  colors,
}: {
  onPress: () => void;
  gradientColors: [string, string];
  styles: any;
  isActive: boolean;
  colors: any;
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
      style={[
        styles.createButton,
        !isActive && { marginTop: 0 },
        animatedStyle,
      ]}
    >
      {isActive ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createGradient}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveTab}>
          <Ionicons name="add-outline" size={22} color={colors.textTertiary} />
        </View>
      )}
    </AnimatedPressable>
  );
}

function TabButton({
  tab,
  isFocused,
  onPress,
  colors,
  styles,
  gradientColors,
}: {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
  colors: any;
  styles: any;
  gradientColors: [string, string];
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
      style={[styles.tabButton, isFocused && styles.activeTabButton, animatedStyle]}
    >
      {isFocused ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={styles.activeTab}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createGradient}
          >
            <Ionicons name={tab.icon} size={26} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      ) : (
        <View style={styles.inactiveTab}>
          <Ionicons name={tab.icon} size={22} color={colors.textTertiary} />
        </View>
      )}
    </AnimatedPressable>
  );
}

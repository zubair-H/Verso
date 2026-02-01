import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import { colors } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="presets" options={{ title: 'Presets' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
    </Tabs>
  );
}

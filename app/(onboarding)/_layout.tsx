import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
        animation: 'fade',
        animationDuration: 350,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* No animation between page 1 and 2 for seamless logo */}
      <Stack.Screen name="possibilities" options={{ animation: 'none' }} />
    </Stack>
  );
}

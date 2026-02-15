import React from 'react';
import { Stack } from 'expo-router';

export default function CreateLayout() {
  const analysisTransition = { animation: 'fade' as const, animationDuration: 170 };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={analysisTransition} />
      <Stack.Screen name="facial-analysis" options={analysisTransition} />
      <Stack.Screen name="outfit-analysis" options={analysisTransition} />
      <Stack.Screen name="health-analysis" options={analysisTransition} />
      <Stack.Screen name="loading" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="result" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

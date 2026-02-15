import React from 'react';
import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="facial-analysis" options={{ animation: 'none' }} />
      <Stack.Screen name="outfit-analysis" options={{ animation: 'none' }} />
      <Stack.Screen name="health-analysis" options={{ animation: 'none' }} />
      <Stack.Screen name="loading" options={{ animation: 'none' }} />
      <Stack.Screen name="result" options={{ animation: 'none' }} />
    </Stack>
  );
}

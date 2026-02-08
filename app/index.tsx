import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@lookr/onboarding_complete').then((value) => {
      setOnboardingDone(value === 'true');
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return null;

  if (onboardingDone) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)" />;
}

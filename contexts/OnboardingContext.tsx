import React, { createContext, useContext, useCallback, useState } from 'react';
import { useSharedValue, SharedValue, withTiming, Easing } from 'react-native-reanimated';

interface OnboardingContextType {
  logoExitProgress: SharedValue<number>;
  triggerLogoExit: () => void;
  carouselExitProgress: SharedValue<number>;
  triggerCarouselExit: () => void;
  indicatorCount: number;
  setIndicatorCount: (count: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const logoExitProgress = useSharedValue(0);
  const carouselExitProgress = useSharedValue(0);
  const [indicatorCount, setIndicatorCount] = useState(0);

  const triggerLogoExit = useCallback(() => {
    // This will be animated by the layout
    logoExitProgress.value = 1;
  }, []);

  const triggerCarouselExit = useCallback(() => {
    // Animate carousel exit smoothly
    carouselExitProgress.value = withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, []);

  return (
    <OnboardingContext.Provider value={{ logoExitProgress, triggerLogoExit, carouselExitProgress, triggerCarouselExit, indicatorCount, setIndicatorCount }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

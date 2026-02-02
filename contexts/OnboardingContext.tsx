import React, { createContext, useContext, useCallback } from 'react';
import { useSharedValue, SharedValue } from 'react-native-reanimated';

interface OnboardingContextType {
  logoExitProgress: SharedValue<number>;
  triggerLogoExit: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const logoExitProgress = useSharedValue(0);

  const triggerLogoExit = useCallback(() => {
    // This will be animated by the layout
    logoExitProgress.value = 1;
  }, []);

  return (
    <OnboardingContext.Provider value={{ logoExitProgress, triggerLogoExit }}>
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

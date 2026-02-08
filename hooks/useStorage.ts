import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SAVED_LOOKS: '@lookr/saved_looks',
  ONBOARDING_COMPLETE: '@lookr/onboarding_complete',
  FREE_TRIES: '@lookr/free_tries',
  SETTINGS: '@lookr/settings',
} as const;

export interface SavedLook {
  id: string;
  selfie: string;
  reference: string;
  result: string;
  elements: string[];
  createdAt: number;
  isFavorite: boolean;
}

export interface Settings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

const DEFAULT_FREE_TRIES = 5;
const DEFAULT_SETTINGS: Settings = {
  hapticsEnabled: true,
  soundEnabled: false,
};

export function useStorage() {
  const [isLoading, setIsLoading] = useState(true);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [freeTries, setFreeTries] = useState(DEFAULT_FREE_TRIES);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [looks, onboarding, tries, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOOKS),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.FREE_TRIES),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (looks) setSavedLooks(JSON.parse(looks));
      if (onboarding) setOnboardingComplete(JSON.parse(onboarding));
      if (tries) setFreeTries(JSON.parse(tries));
      if (settingsData) setSettings(JSON.parse(settingsData));
    } catch (error) {
      console.error('Error loading storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save a new look
  const saveLook = useCallback(async (look: Omit<SavedLook, 'id' | 'createdAt' | 'isFavorite'>) => {
    const newLook: SavedLook = {
      ...look,
      id: Date.now().toString(),
      createdAt: Date.now(),
      isFavorite: false,
    };

    const updated = [newLook, ...savedLooks];
    setSavedLooks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(updated));
    return newLook;
  }, [savedLooks]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    const updated = savedLooks.map((look) =>
      look.id === id ? { ...look, isFavorite: !look.isFavorite } : look
    );
    setSavedLooks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(updated));
  }, [savedLooks]);

  // Delete a look
  const deleteLook = useCallback(async (id: string) => {
    const updated = savedLooks.filter((look) => look.id !== id);
    setSavedLooks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(updated));
  }, [savedLooks]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    setOnboardingComplete(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, JSON.stringify(true));
  }, []);

  // Reset onboarding
  const resetOnboarding = useCallback(async () => {
    setOnboardingComplete(false);
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  }, []);

  // Use a free try
  const useFreeTry = useCallback(async () => {
    if (freeTries > 0) {
      const updated = freeTries - 1;
      setFreeTries(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.FREE_TRIES, JSON.stringify(updated));
      return true;
    }
    return false;
  }, [freeTries]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  }, [settings]);

  return {
    isLoading,
    savedLooks,
    onboardingComplete,
    freeTries,
    settings,
    saveLook,
    toggleFavorite,
    deleteLook,
    completeOnboarding,
    resetOnboarding,
    useFreeTry,
    updateSettings,
  };
}

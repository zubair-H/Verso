import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchLooks,
  createLook as apiCreateLook,
  patchLookFavorite,
  removeLook as apiRemoveLook,
} from '@/utils/api';

const STORAGE_KEYS = {
  SAVED_LOOKS: '@lookr/saved_looks',
  ONBOARDING_COMPLETE: '@lookr/onboarding_complete',
  FREE_TRIES: '@lookr/free_tries',
  SETTINGS: '@lookr/settings',
  DEVICE_ID: '@lookr/device_id',
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

function safeParseLooks(raw: string | null): SavedLook[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (existing) return existing;

  const generated = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, generated);
  return generated;
}

export function useStorage() {
  const [isLoading, setIsLoading] = useState(true);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [freeTries, setFreeTries] = useState(DEFAULT_FREE_TRIES);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [looksCache, onboarding, tries, settingsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOOKS),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.FREE_TRIES),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      const resolvedDeviceId = await getOrCreateDeviceId();
      setDeviceId(resolvedDeviceId);

      try {
        const remoteLooks = await fetchLooks(resolvedDeviceId);
        setSavedLooks(remoteLooks);
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(remoteLooks));
      } catch {
        setSavedLooks(safeParseLooks(looksCache));
      }

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
    const resolvedDeviceId = deviceId || (await getOrCreateDeviceId());
    if (!deviceId) setDeviceId(resolvedDeviceId);

    const localLook: SavedLook = {
      ...look,
      id: Date.now().toString(),
      createdAt: Date.now(),
      isFavorite: false,
    };

    let finalLook = localLook;

    try {
      const remoteLook = await apiCreateLook({
        ...look,
        deviceId: resolvedDeviceId,
      });
      finalLook = remoteLook;
    } catch {
      // Fall back to local persistence while offline/unreachable.
    }

    const updated = [finalLook, ...savedLooks.filter((item) => item.id !== finalLook.id)];
    setSavedLooks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(updated));
    return finalLook;
  }, [savedLooks, deviceId]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    const target = savedLooks.find((look) => look.id === id);
    if (!target) return;

    const nextFavorite = !target.isFavorite;
    const updated = savedLooks.map((look) => (
      look.id === id ? { ...look, isFavorite: nextFavorite } : look
    ));

    setSavedLooks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(updated));

    try {
      const remoteLook = await patchLookFavorite(id, nextFavorite);
      const merged = updated.map((look) => (look.id === id ? remoteLook : look));
      setSavedLooks(merged);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(merged));
    } catch {
      // Keep optimistic local state when API is unavailable.
    }
  }, [savedLooks]);

  // Delete a look
  const deleteLook = useCallback(async (id: string) => {
    const updated = savedLooks.filter((look) => look.id !== id);
    setSavedLooks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOOKS, JSON.stringify(updated));

    try {
      await apiRemoveLook(id);
    } catch {
      // Keep local deletion if API fails.
    }
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

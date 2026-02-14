import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface ApiLook {
  id: string;
  selfie: string;
  reference: string;
  result: string;
  elements: string[];
  createdAt: number;
  isFavorite: boolean;
  deviceId: string;
}

export interface GenerateJob {
  id: string;
  status: 'completed' | 'processing' | 'failed';
  selfie: string;
  look: string;
  elements: string[];
  resultUrl: string;
  createdAt: number;
  completedAt?: number;
}

export interface HairColorPreset {
  id: string;
  name: string;
  hex: string;
  strength: number;
}

export interface HairStylePreset {
  id: string;
  name: string;
}

export interface EyeColorPreset {
  id: string;
  name: string;
}

export interface RecolorHairResponse {
  success: boolean;
  editedImageDataUri: string;
  maskUrl: string;
  debug?: {
    traceId?: string;
    startedAt?: string;
    finishedAt?: string;
    elapsedMs?: number;
    steps?: Array<{ atMs?: number; message?: string }>;
  };
  chosenColor: {
    id: string;
    name: string;
    hex: string;
    strength: number;
    isCustomHex: boolean;
  };
}

export interface RecolorHairFastResponse {
  success: boolean;
  mode: 'fast';
  editedImageUrl: string;
  chosenStyle: {
    id: string;
    name: string;
  };
  debug?: {
    traceId?: string;
    startedAt?: string;
    finishedAt?: string;
    elapsedMs?: number;
    steps?: Array<{ atMs?: number; message?: string }>;
  };
  chosenColor: {
    id: string;
    name: string;
    hex: string;
    strength: number;
    isCustomHex: boolean;
  };
}

export interface RecolorEyesFastResponse {
  success: boolean;
  mode: 'eyes-fast';
  editedImageUrl: string;
  chosenEyeColor: {
    id: string;
    name: string;
  };
  debug?: {
    traceId?: string;
    startedAt?: string;
    finishedAt?: string;
    elapsedMs?: number;
    steps?: Array<{ atMs?: number; message?: string }>;
  };
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function inferApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
}

export const API_BASE_URL = inferApiBaseUrl();

async function apiRequest<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = (data && data.error) || `Request failed (${response.status})`;
      const error = new Error(message) as Error & { details?: unknown; status?: number };
      error.details = data;
      error.status = response.status;
      throw error;
    }

    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLooks(deviceId: string): Promise<ApiLook[]> {
  const data = await apiRequest<{ looks: ApiLook[] }>(`/v1/looks?deviceId=${encodeURIComponent(deviceId)}`);
  return data.looks || [];
}

export async function createLook(payload: {
  selfie: string;
  reference: string;
  result: string;
  elements: string[];
  deviceId: string;
}): Promise<ApiLook> {
  const data = await apiRequest<{ look: ApiLook }>('/v1/looks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.look;
}

export async function patchLookFavorite(id: string, isFavorite: boolean): Promise<ApiLook> {
  const data = await apiRequest<{ look: ApiLook }>(`/v1/looks/${encodeURIComponent(id)}/favorite`, {
    method: 'PATCH',
    body: JSON.stringify({ isFavorite }),
  });
  return data.look;
}

export async function removeLook(id: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/v1/looks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function generateLook(payload: {
  selfie: string;
  look: string;
  elements: string[];
}): Promise<GenerateJob> {
  const data = await apiRequest<{ job: GenerateJob }>('/v1/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.job;
}

export async function fetchJob(id: string): Promise<GenerateJob> {
  const data = await apiRequest<{ job: GenerateJob }>(`/v1/jobs/${encodeURIComponent(id)}`);
  return data.job;
}

export async function fetchHairColors(): Promise<HairColorPreset[]> {
  const data = await apiRequest<{ success: boolean; colors: HairColorPreset[] }>('/api/hair-colors');
  return data.colors || [];
}

export async function fetchHairStyles(): Promise<HairStylePreset[]> {
  const data = await apiRequest<{ success: boolean; styles: HairStylePreset[] }>('/api/hair-styles');
  return data.styles || [];
}

export async function fetchEyeColors(): Promise<EyeColorPreset[]> {
  const data = await apiRequest<{ success: boolean; colors: EyeColorPreset[] }>('/api/eye-colors');
  return data.colors || [];
}

export async function recolorHair(payload: {
  userImageUrl: string;
  colorId?: string;
  hex?: string;
  strength?: number;
}): Promise<RecolorHairResponse> {
  return apiRequest<RecolorHairResponse>(
    '/api/recolor-hair',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    270000
  );
}

export async function recolorHairFast(payload: {
  userImageUrl: string;
  colorId: string;
  hairStyleId?: string;
}): Promise<RecolorHairFastResponse> {
  return apiRequest<RecolorHairFastResponse>(
    '/api/recolor-hair-fast',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    270000
  );
}

export async function recolorEyesFast(payload: {
  userImageUrl: string;
  eyeColorId: string;
}): Promise<RecolorEyesFastResponse> {
  return apiRequest<RecolorEyesFastResponse>(
    '/api/recolor-eyes-fast',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    270000
  );
}

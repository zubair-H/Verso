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

export interface LipColorPreset {
  id: string;
  name: string;
  hex: string;
}

export interface NailColorPreset {
  id: string;
  name: string;
  hex: string;
}

export interface ShapePreset {
  id: string;
  name: string;
  prompt: string;
}

export interface AnalyzeSessionResponse {
  success: boolean;
  sessionId: string;
  analysisStatus: 'pending' | 'complete' | 'failed';
  estimatedMs: number;
  debug?: {
    traceId?: string;
    steps?: Array<{ atMs?: number; message?: string }>;
  };
}

export interface AnalyzeStatusResponse {
  success: boolean;
  sessionId: string;
  analysisStatus: 'pending' | 'complete' | 'failed';
  availableMasks: string[];
  landmarks: Record<string, unknown> | null;
  analysisError?: string | null;
  analysisDebug?: Array<{ at?: string; message?: string }>;
}

export interface EditResponseTier1 {
  success: boolean;
  tier: 1;
  feature: string;
  action: string;
  editedImageDataUri: string;
  elapsedMs: number;
}

export interface EditResponseTier2 {
  success: boolean;
  tier: 2;
  feature: string;
  action: string;
  editedImageUrl: string;
  elapsedMs: number;
}

export type EditResponse = EditResponseTier1 | EditResponseTier2;

export interface SessionInspectResponse {
  success: boolean;
  session: {
    id: string;
    createdAt: number;
    lastAccessedAt: number;
    width: number;
    height: number;
    masks: Record<string, string | null>;
    landmarks: Record<string, unknown> | null;
    analysisStatus: 'pending' | 'complete' | 'failed';
    analysisError: string | null;
  };
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

export interface RecolorFaceFeaturesFastResponse {
  success: boolean;
  mode: 'face-features-fast';
  editedImageUrl: string;
  chosenFeatures: {
    noseId: string;
    lipsId: string;
    eyebrowsId: string;
    eyebrowColorId: string;
  };
}

export interface RecolorOutfitFastResponse {
  success: boolean;
  mode: 'outfit-fast';
  editedImageUrl: string;
  chosenOutfit: {
    topColorId: string;
    bottomColorId: string;
    topColorHex?: string | null;
    bottomColorHex?: string | null;
  };
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function isLikelyValidBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.host);
  } catch {
    return false;
  }
}

function inferApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && isLikelyValidBaseUrl(envUrl)) {
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
  const externalSignal = init?.signal;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }

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
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort);
    }
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

export async function fetchLipColors(): Promise<LipColorPreset[]> {
  const data = await apiRequest<{ success: boolean; colors: LipColorPreset[] }>('/api/lip-colors');
  return data.colors || [];
}

export async function fetchNailColors(): Promise<NailColorPreset[]> {
  const data = await apiRequest<{ success: boolean; colors: NailColorPreset[] }>('/api/nail-colors');
  return data.colors || [];
}

export async function fetchEyebrowShapes(): Promise<ShapePreset[]> {
  const data = await apiRequest<{ success: boolean; shapes: ShapePreset[] }>('/api/eyebrow-shapes');
  return data.shapes || [];
}

export async function fetchLipShapes(): Promise<ShapePreset[]> {
  const data = await apiRequest<{ success: boolean; shapes: ShapePreset[] }>('/api/lip-shapes');
  return data.shapes || [];
}

export async function fetchJawlinePresets(): Promise<ShapePreset[]> {
  const data = await apiRequest<{ success: boolean; presets: ShapePreset[] }>('/api/jawline-presets');
  return data.presets || [];
}

export async function analyzeImageSession(userImageUrl: string): Promise<AnalyzeSessionResponse> {
  return apiRequest<AnalyzeSessionResponse>(
    '/api/analyze',
    {
      method: 'POST',
      body: JSON.stringify({ userImageUrl }),
    },
    30000
  );
}

export async function fetchAnalyzeStatus(sessionId: string): Promise<AnalyzeStatusResponse> {
  return apiRequest<AnalyzeStatusResponse>(`/api/analyze/${encodeURIComponent(sessionId)}`);
}

export async function editSession(payload: {
  sessionId: string;
  baseImageUrl?: string;
  feature: string;
  action: string;
  value?: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<EditResponse> {
  const { signal, ...bodyPayload } = payload;
  return apiRequest<EditResponse>(
    '/api/edit',
    {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
      signal,
    },
    270000
  );
}

export async function inspectSession(sessionId: string): Promise<SessionInspectResponse> {
  return apiRequest<SessionInspectResponse>(`/api/sessions/${encodeURIComponent(sessionId)}`);
}

export async function clearSession(sessionId: string): Promise<{ success: boolean; sessionId: string; deleted: boolean }> {
  return apiRequest<{ success: boolean; sessionId: string; deleted: boolean }>(
    `/api/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: 'DELETE',
    }
  );
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
  sessionId?: string;
  signal?: AbortSignal;
}): Promise<RecolorHairFastResponse> {
  const { signal, ...bodyPayload } = payload;
  return apiRequest<RecolorHairFastResponse>(
    '/api/recolor-hair-fast',
    {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
      signal,
    },
    270000
  );
}

export async function recolorEyesFast(payload: {
  userImageUrl: string;
  eyeColorId: string;
  sessionId?: string;
  signal?: AbortSignal;
}): Promise<RecolorEyesFastResponse> {
  const { signal, ...bodyPayload } = payload;
  return apiRequest<RecolorEyesFastResponse>(
    '/api/recolor-eyes-fast',
    {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
      signal,
    },
    270000
  );
}

export async function recolorFaceFeaturesFast(payload: {
  userImageUrl: string;
  noseId?: string;
  lipsId?: string;
  eyebrowsId?: string;
  eyebrowColorId?: string;
  sessionId?: string;
  signal?: AbortSignal;
}): Promise<RecolorFaceFeaturesFastResponse> {
  const { signal, ...bodyPayload } = payload;
  return apiRequest<RecolorFaceFeaturesFastResponse>(
    '/api/recolor-face-features-fast',
    {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
      signal,
    },
    270000
  );
}

export async function cancelSession(sessionId: string): Promise<{ success: boolean; sessionId: string; cancelled: boolean; activeRequests: number }> {
  return apiRequest<{ success: boolean; sessionId: string; cancelled: boolean; activeRequests: number }>(
    '/api/cancel-session',
    {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    },
    5000
  );
}

export async function recolorOutfitFast(payload: {
  userImageUrl: string;
  topColorId: string;
  bottomColorId: string;
}): Promise<RecolorOutfitFastResponse> {
  return apiRequest<RecolorOutfitFastResponse>(
    '/api/recolor-outfit-fast',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    270000
  );
}

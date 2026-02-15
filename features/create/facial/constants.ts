import type { HairColorPreset } from '@/utils/api';
import type { ColorPreset, FeaturePreset } from './types';

export const DEFAULT_HAIR_COLOR_PRESETS: HairColorPreset[] = [
  { id: 'current', name: 'Current', hex: '#9b9b9b', strength: 0 },
  { id: 'jet_black', name: 'Jet Black', hex: '#111111', strength: 0.75 },
  { id: 'dark_brown', name: 'Dark Brown', hex: '#2a1b12', strength: 0.7 },
  { id: 'light_brown', name: 'Light Brown', hex: '#6b4a2f', strength: 0.65 },
  { id: 'blonde', name: 'Blonde', hex: '#d8c07a', strength: 0.6 },
  { id: 'platinum', name: 'Platinum', hex: '#e8e4da', strength: 0.55 },
  { id: 'auburn', name: 'Auburn', hex: '#8b3a2b', strength: 0.65 },
  { id: 'silver', name: 'Silver', hex: '#c8c8c8', strength: 0.55 },
];

export const LIP_PRESETS: FeaturePreset[] = [
  { id: 'rose_nude', name: 'Rose Nude' },
  { id: 'warm_nude', name: 'Warm Nude' },
  { id: 'mauve', name: 'Mauve' },
  { id: 'berry', name: 'Berry' },
  { id: 'classic_red', name: 'Classic Red' },
  { id: 'deep_plum', name: 'Deep Plum' },
];

export const EYEBROW_PRESETS: FeaturePreset[] = [
  { id: 'natural', name: 'Natural' },
  { id: 'arched', name: 'Arched' },
  { id: 'straight', name: 'Straight' },
  { id: 'feathered', name: 'Feather' },
];

export const EYEBROW_COLOR_PRESETS: ColorPreset[] = [
  { id: 'soft_black', name: 'Soft Black', hex: '#1C1E24' },
  { id: 'espresso', name: 'Espresso', hex: '#2F241E' },
  { id: 'cool_brown', name: 'Cool Brown', hex: '#4A3D37' },
  { id: 'warm_brown', name: 'Warm Brown', hex: '#654637' },
  { id: 'taupe', name: 'Taupe', hex: '#7D716A' },
  { id: 'auburn', name: 'Auburn', hex: '#7B4638' },
];

export const OUTFIT_COLORS: ColorPreset[] = [
  { id: 'ivory', name: 'Ivory', hex: '#ECE8DF' },
  { id: 'camel', name: 'Camel', hex: '#B38C5E' },
  { id: 'charcoal', name: 'Charcoal', hex: '#384152' },
  { id: 'sage', name: 'Sage', hex: '#8CA58A' },
  { id: 'teal', name: 'Teal', hex: '#2B7280' },
  { id: 'rust', name: 'Rust', hex: '#A85A3A' },
  { id: 'navy', name: 'Navy', hex: '#2A3E70' },
  { id: 'berry', name: 'Berry', hex: '#7F4063' },
  { id: 'black', name: 'Black', hex: '#191C22' },
];

const EYE_COLOR_HEX: Record<string, string> = {
  current: '#9FA6B8',
  brown: '#6C4B32',
  hazel: '#9A7A44',
  green: '#4E7F52',
  blue: '#456FA0',
  gray: '#828A96',
};

export function mergePresets(apiPresets: HairColorPreset[]): HairColorPreset[] {
  const byId = new Map<string, HairColorPreset>();
  for (const preset of DEFAULT_HAIR_COLOR_PRESETS) byId.set(preset.id, preset);
  for (const preset of apiPresets) byId.set(preset.id, preset);
  return Array.from(byId.values());
}

export function getEyeColorHex(id: string) {
  return EYE_COLOR_HEX[id] || '#7082A0';
}

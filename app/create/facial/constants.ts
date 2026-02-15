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

export const HAIR_STYLE_PREVIEW_IMAGES: Record<string, string> = {
  no_change: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=520&fit=crop',
  buzz: 'https://images.unsplash.com/photo-1542204625-de293a4f7a17?w=400&h=520&fit=crop',
  'taper-fade': 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=520&fit=crop',
  straight: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=520&fit=crop',
  wavy: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
  curly: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=520&fit=crop',
  bob: 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=400&h=520&fit=crop',
  pixie_cut: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=520&fit=crop',
  layered: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=520&fit=crop',
  soft_waves: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=520&fit=crop',
  side_parted: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=520&fit=crop',
  center_parted: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=520&fit=crop',
  blunt_bangs: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=520&fit=crop',
  side_swept_bangs: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=520&fit=crop',
  slicked_back: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  shag: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=520&fit=crop',
  lob: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  angled_bob: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  a_line_bob: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop',
  faux_hawk: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=520&fit=crop',
  high_ponytail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=520&fit=crop',
  low_ponytail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=520&fit=crop',
  messy_bun: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=520&fit=crop',
  top_knot: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=520&fit=crop',
  french_braid: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
  dutch_braid: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
  fishtail_braid: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=520&fit=crop',
};

export const LIP_PRESETS: FeaturePreset[] = [
  { id: 'full', name: 'Full' },
  { id: 'defined_cupid', name: 'Cupid' },
  { id: 'soft_matte', name: 'Soft' },
  { id: 'glossy', name: 'Glossy' },
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

export function getHairPreviewImage(styleId: string) {
  return HAIR_STYLE_PREVIEW_IMAGES[styleId] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=520&fit=crop';
}

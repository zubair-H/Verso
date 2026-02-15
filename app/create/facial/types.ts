export type ExpandableSectionKey =
  | 'hairColor'
  | 'hairStyle'
  | 'eyeColor'
  | 'lips'
  | 'eyebrows'
  | 'eyebrowColor'
  | 'outfitColors';

export type FeaturePreset = {
  id: string;
  name: string;
};

export type ColorPreset = {
  id: string;
  name: string;
  hex: string;
};

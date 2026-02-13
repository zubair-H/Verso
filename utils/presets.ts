import { stylePersonas } from './personas';

export interface Preset {
  id: string;
  name: string;
  image: string;
  personaId: string;
  personaName: string;
}

export interface PresetSection {
  id: string;
  title: string;
  icon: string;
  presets: Preset[];
}

function buildPersonaLooks(personaId: string, personaName: string): Preset[] {
  return [
    {
      id: `${personaId}-core`,
      name: `${personaName} Core`,
      image: `https://api.dicebear.com/9.x/personas/png?seed=${personaName}&backgroundType=gradientLinear&size=512`,
      personaId,
      personaName,
    },
    {
      id: `${personaId}-alt`,
      name: `${personaName} Alt`,
      image: `https://api.dicebear.com/9.x/personas/png?seed=${personaName}-alt&backgroundType=gradientLinear&size=512`,
      personaId,
      personaName,
    },
  ];
}

export const presetSections: PresetSection[] = stylePersonas.map((persona) => ({
  id: persona.id,
  title: persona.name,
  icon: 'sparkles',
  presets: buildPersonaLooks(persona.id, persona.name),
}));

export const allPresets: Preset[] = presetSections.flatMap((section) => section.presets);

export function searchPresets(query: string): Preset[] {
  const q = query.toLowerCase().trim();
  if (!q) return allPresets;
  return allPresets.filter(
    (preset) =>
      preset.name.toLowerCase().includes(q) ||
      preset.personaName.toLowerCase().includes(q)
  );
}

export function getHomeSections(): PresetSection[] {
  return presetSections;
}

export interface GroupedSection {
  id: string;
  title: string;
  icon: string;
  presets: Preset[];
  subCategories: { id: string; title: string }[];
}

export function getHomeGroupedSections(): GroupedSection[] {
  return [
    {
      id: 'style-ambassadors',
      title: 'Style Ambassadors',
      icon: 'sparkles',
      presets: allPresets,
      subCategories: presetSections.map((section) => ({
        id: section.id,
        title: section.title,
      })),
    },
  ];
}

export function getPresetsForCategory(categoryId: string): PresetSection | undefined {
  return presetSections.find((section) => section.id === categoryId);
}

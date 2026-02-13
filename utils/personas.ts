export interface StylePersona {
  id: string;
  name: string;
  title: string;
  lore: string;
  image: string;
}

// Fictional AI style ambassadors (not real people).
export const stylePersonas: StylePersona[] = [
  {
    id: 'aria',
    name: 'Aria',
    title: 'Editorial Architect',
    lore: 'Sharp cuts, sculpted volume, and high-contrast runway energy.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Aria&backgroundType=gradientLinear&size=512',
  },
  {
    id: 'luna',
    name: 'Luna',
    title: 'Glow Curator',
    lore: 'Soft lighting, balanced tones, and clean beauty-first styling.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Luna&backgroundType=gradientLinear&size=512',
  },
  {
    id: 'max',
    name: 'Max',
    title: 'Street Tailor',
    lore: 'Utility layers, refined streetwear, and confident silhouette play.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Max&backgroundType=gradientLinear&size=512',
  },
];

export function getStylePersonaById(id: string): StylePersona | undefined {
  return stylePersonas.find((persona) => persona.id === id);
}

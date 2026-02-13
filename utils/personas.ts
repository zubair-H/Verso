export interface StylePersona {
  id: string;
  name: string;
  title: string;
  lore: string;
  /** Primary attribute this persona is best for in the home feed */
  attribute: PersonaAttribute;
  /** Default image used when a headshot reference is needed */
  image: string;
  /** Explicit headshot source for the persona */
  headshotImage: string;
  /** Optional full-body outfit source for outfit-driven personas */
  outfitImage?: string;
}

export type PersonaAttribute = 'hair' | 'face' | 'color' | 'style';

// Fictional AI style ambassadors (not real people).
export const stylePersonas: StylePersona[] = [
  {
    id: 'nova',
    name: 'Lyra',
    title: 'Face Sculpt Studio',
    lore: 'Try extracting: brow lift map, cheek contour placement, and eye-shape framing.',
    attribute: 'face',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=1500&fit=crop',
  },
  {
    id: 'zen',
    name: 'Aria',
    title: 'Volume Hair Blueprint',
    lore: 'Try extracting: curtain bang structure, root volume zones, and gloss direction.',
    attribute: 'hair',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1465406325903-9d93ee82f613?w=900&h=1500&fit=crop',
  },
  {
    id: 'rhea',
    name: 'Soleil',
    title: 'Color Harmony Muse',
    lore: 'Try extracting: undertone palette, contrast level, and accent-color strategy.',
    attribute: 'color',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&h=1500&fit=crop',
  },
  {
    id: 'jett',
    name: 'Atlas',
    title: 'Silhouette Architect',
    lore: 'Try extracting: shoulder shape, fit proportions, and outfit layering rhythm.',
    attribute: 'style',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=1500&fit=crop',
  },
  {
    id: 'sora',
    name: 'Kael',
    title: 'Texture Fade Lab',
    lore: 'Try extracting: hairline geometry, texture density, and matte-to-shine balance.',
    attribute: 'hair',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=900&h=1500&fit=crop',
  },
  {
    id: 'mira',
    name: 'Celine',
    title: 'Skin Finish Director',
    lore: 'Try extracting: skin texture finish, highlight placement, and lip-tone blending.',
    attribute: 'face',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1500&fit=crop',
  },
];

export function getStylePersonaById(id: string): StylePersona | undefined {
  return stylePersonas.find((persona) => persona.id === id);
}

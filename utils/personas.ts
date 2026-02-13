export interface StylePersona {
  id: string;
  name: string;
  title: string;
  lore: string;
  /** Default image used when a headshot reference is needed */
  image: string;
  /** Explicit headshot source for the persona */
  headshotImage: string;
  /** Optional full-body outfit source for outfit-driven personas */
  outfitImage?: string;
}

// Fictional AI style ambassadors (not real people).
export const stylePersonas: StylePersona[] = [
  {
    id: 'nova',
    name: 'Nova',
    title: 'Red Carpet Glam',
    lore: 'Celebrity premiere styling with polished waves, lifted glow, and statement makeup.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=1500&fit=crop',
  },
  {
    id: 'zen',
    name: 'Zen',
    title: 'K-Style Idol',
    lore: 'Glass-skin finish, airy fringe, and camera-ready soft color styling.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=1100&fit=crop',
  },
  {
    id: 'rhea',
    name: 'Rhea',
    title: 'Supermodel Off-Duty',
    lore: 'Clean skin, sleek texture, and effortless luxury-casual proportions.',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&h=1500&fit=crop',
  },
  {
    id: 'jett',
    name: 'Jett',
    title: 'Leading Star',
    lore: 'Modern blockbuster grooming with tailored edges and strong profile styling.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=1500&fit=crop',
  },
  {
    id: 'sora',
    name: 'Sora',
    title: 'Pop Tour Icon',
    lore: 'High-energy performance looks with bold color accents and trend-led texture.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=900&h=1500&fit=crop',
  },
  {
    id: 'mira',
    name: 'Mira',
    title: 'Old Hollywood Muse',
    lore: 'Classic screen-era elegance with sculpted curls and timeless face framing.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1500&fit=crop',
  },
];

export function getStylePersonaById(id: string): StylePersona | undefined {
  return stylePersonas.find((persona) => persona.id === id);
}

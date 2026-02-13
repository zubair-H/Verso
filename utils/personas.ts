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
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Nova-redcarpet&backgroundType=gradientLinear&size=512',
    headshotImage: 'https://api.dicebear.com/9.x/personas/png?seed=Nova-redcarpet&backgroundType=gradientLinear&size=512',
    outfitImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=1400&fit=crop',
  },
  {
    id: 'zen',
    name: 'Zen',
    title: 'K-Style Idol',
    lore: 'Glass-skin finish, airy fringe, and camera-ready soft color styling.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Zen-kstyle&backgroundType=gradientLinear&size=512',
    headshotImage: 'https://api.dicebear.com/9.x/personas/png?seed=Zen-kstyle&backgroundType=gradientLinear&size=512',
  },
  {
    id: 'rhea',
    name: 'Rhea',
    title: 'Supermodel Off-Duty',
    lore: 'Clean skin, sleek texture, and effortless luxury-casual proportions.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Rhea-model&backgroundType=gradientLinear&size=512',
    headshotImage: 'https://api.dicebear.com/9.x/personas/png?seed=Rhea-model&backgroundType=gradientLinear&size=512',
    outfitImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&h=1400&fit=crop',
  },
  {
    id: 'jett',
    name: 'Jett',
    title: 'Leading Star',
    lore: 'Modern blockbuster grooming with tailored edges and strong profile styling.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Jett-leadingstar&backgroundType=gradientLinear&size=512',
    headshotImage: 'https://api.dicebear.com/9.x/personas/png?seed=Jett-leadingstar&backgroundType=gradientLinear&size=512',
    outfitImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=1400&fit=crop',
  },
  {
    id: 'sora',
    name: 'Sora',
    title: 'Pop Tour Icon',
    lore: 'High-energy performance looks with bold color accents and trend-led texture.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Sora-popicon&backgroundType=gradientLinear&size=512',
    headshotImage: 'https://api.dicebear.com/9.x/personas/png?seed=Sora-popicon&backgroundType=gradientLinear&size=512',
    outfitImage: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=900&h=1400&fit=crop',
  },
  {
    id: 'mira',
    name: 'Mira',
    title: 'Old Hollywood Muse',
    lore: 'Classic screen-era elegance with sculpted curls and timeless face framing.',
    image: 'https://api.dicebear.com/9.x/personas/png?seed=Mira-oldhollywood&backgroundType=gradientLinear&size=512',
    headshotImage: 'https://api.dicebear.com/9.x/personas/png?seed=Mira-oldhollywood&backgroundType=gradientLinear&size=512',
    outfitImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1400&fit=crop',
  },
];

export function getStylePersonaById(id: string): StylePersona | undefined {
  return stylePersonas.find((persona) => persona.id === id);
}

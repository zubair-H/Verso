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
  /** Optional secondary close-up source used for additional headshot tiles */
  detailImage?: string;
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
    detailImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=1500&fit=crop',
  },
  {
    id: 'zen',
    name: 'Aria',
    title: 'Volume Hair Blueprint',
    lore: 'Try extracting: curtain bang structure, root volume zones, and gloss direction.',
    attribute: 'hair',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=900&h=1500&fit=crop',
  },
  {
    id: 'rhea',
    name: 'Soleil',
    title: 'Color Harmony Muse',
    lore: 'Try extracting: undertone palette, contrast level, and accent-color strategy.',
    attribute: 'color',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&h=1100&fit=crop',
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
    detailImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=1500&fit=crop',
  },
  {
    id: 'sora',
    name: 'Kael',
    title: 'Texture Fade Lab',
    lore: 'Try extracting: hairline geometry, texture density, and matte-to-shine balance.',
    attribute: 'hair',
    image: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=900&h=1500&fit=crop',
  },
  {
    id: 'mira',
    name: 'Celine',
    title: 'Skin Finish Director',
    lore: 'Try extracting: skin texture finish, highlight placement, and lip-tone blending.',
    attribute: 'face',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1500&fit=crop',
  },
  {
    id: 'orion',
    name: 'Orion',
    title: 'Sharp Fade Studio',
    lore: 'Try extracting: temple fade depth, crown texture flow, and edge-line precision.',
    attribute: 'hair',
    image: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1542204625-de293a4f7a17?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&h=1500&fit=crop',
  },
  {
    id: 'nia',
    name: 'Nia',
    title: 'Editorial Bone Structure',
    lore: 'Try extracting: cheekbone emphasis, under-eye shape, and contour transition.',
    attribute: 'face',
    image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=900&h=1500&fit=crop',
  },
  {
    id: 'luca',
    name: 'Luca',
    title: 'Tailored Street Silhouette',
    lore: 'Try extracting: jacket proportion, drape line, and layered fit rhythm.',
    attribute: 'style',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1542327897-d73f4005b533?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=900&h=1500&fit=crop',
  },
  {
    id: 'iris',
    name: 'Iris',
    title: 'Soft Contrast Palette',
    lore: 'Try extracting: neutral temperature, saturation level, and accent-tone pairing.',
    attribute: 'color',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900&h=1100&fit=crop',
    headshotImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900&h=1100&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900&h=1100&fit=crop',
    outfitImage: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=900&h=1500&fit=crop',
  },
];

export function getStylePersonaById(id: string): StylePersona | undefined {
  return stylePersonas.find((persona) => persona.id === id);
}

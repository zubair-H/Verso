// Preset data organized by specific style categories
// In production, replace placeholder images with actual celebrity/reference images

export interface Preset {
  id: string;
  name: string;
  image: string;
}

export interface PresetSection {
  id: string;
  title: string;
  icon: string;
  presets: Preset[];
}

// Each section represents a specific attribute category with trending looks
export const presetSections: PresetSection[] = [
  {
    id: 'haircuts',
    title: 'Haircuts',
    icon: 'cut',
    presets: [
      { id: 'hc1', name: 'Buzz Cut', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop' },
      { id: 'hc2', name: 'Curtain Bangs', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop' },
      { id: 'hc3', name: 'Wolf Cut', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
      { id: 'hc4', name: 'Pixie', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop' },
      { id: 'hc5', name: 'Shag', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop' },
      { id: 'hc6', name: 'Textured Crop', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop' },
    ],
  },
  {
    id: 'hair-color',
    title: 'Hair Color',
    icon: 'color-palette',
    presets: [
      { id: 'clr1', name: 'Platinum Blonde', image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=500&fit=crop' },
      { id: 'clr2', name: 'Copper Red', image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop' },
      { id: 'clr3', name: 'Jet Black', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop' },
      { id: 'clr4', name: 'Ash Brown', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop' },
      { id: 'clr5', name: 'Honey Blonde', image: 'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=400&h=500&fit=crop' },
      { id: 'clr6', name: 'Silver', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop' },
    ],
  },
  {
    id: 'hairstyles',
    title: 'Hairstyles',
    icon: 'brush',
    presets: [
      { id: 'hs1', name: 'Slicked Back', image: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=400&h=500&fit=crop' },
      { id: 'hs2', name: 'Beach Waves', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop' },
      { id: 'hs3', name: 'Braids', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop' },
      { id: 'hs4', name: 'Messy Bun', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop' },
      { id: 'hs5', name: 'Pompadour', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop' },
      { id: 'hs6', name: 'Straight & Sleek', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop' },
    ],
  },
  {
    id: 'streetwear',
    title: 'Streetwear',
    icon: 'shirt',
    presets: [
      { id: 'sw1', name: 'Oversized Hoodie', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop' },
      { id: 'sw2', name: 'Graphic Tee', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop' },
      { id: 'sw3', name: 'Cargo Pants', image: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=400&h=500&fit=crop' },
      { id: 'sw4', name: 'Bomber Jacket', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
      { id: 'sw5', name: 'Track Suit', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop' },
      { id: 'sw6', name: 'Denim Jacket', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop' },
    ],
  },
  {
    id: 'formal',
    title: 'Formal Wear',
    icon: 'business',
    presets: [
      { id: 'fw1', name: 'Classic Suit', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop' },
      { id: 'fw2', name: 'Evening Gown', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop' },
      { id: 'fw3', name: 'Blazer Look', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
      { id: 'fw4', name: 'Cocktail Dress', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop' },
      { id: 'fw5', name: 'Tuxedo', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop' },
      { id: 'fw6', name: 'Power Suit', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop' },
    ],
  },
  {
    id: 'sunglasses',
    title: 'Sunglasses',
    icon: 'sunny',
    presets: [
      { id: 'sg1', name: 'Aviators', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=500&fit=crop' },
      { id: 'sg2', name: 'Round Frames', image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=500&fit=crop' },
      { id: 'sg3', name: 'Cat Eye', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop' },
      { id: 'sg4', name: 'Wayfarers', image: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=400&h=500&fit=crop' },
      { id: 'sg5', name: 'Sport Shield', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop' },
      { id: 'sg6', name: 'Oversized', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop' },
    ],
  },
  {
    id: 'glasses',
    title: 'Glasses',
    icon: 'glasses',
    presets: [
      { id: 'gl1', name: 'Wire Frames', image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=500&fit=crop' },
      { id: 'gl2', name: 'Thick Rimmed', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop' },
      { id: 'gl3', name: 'Browline', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
      { id: 'gl4', name: 'Transparent', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop' },
      { id: 'gl5', name: 'Retro Round', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=500&fit=crop' },
      { id: 'gl6', name: 'Square Frames', image: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=400&h=500&fit=crop' },
    ],
  },
  {
    id: 'makeup',
    title: 'Makeup Looks',
    icon: 'sparkles',
    presets: [
      { id: 'mk1', name: 'Clean Girl', image: 'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=400&h=500&fit=crop' },
      { id: 'mk2', name: 'Smokey Eye', image: 'https://images.unsplash.com/photo-1526510747491-27f3bddc0a02?w=400&h=500&fit=crop' },
      { id: 'mk3', name: 'Natural Glow', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop' },
      { id: 'mk4', name: 'Bold Lip', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop' },
      { id: 'mk5', name: 'Dewy Skin', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop' },
      { id: 'mk6', name: 'Glass Skin', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop' },
    ],
  },
];

// Flat list of all presets (for search)
export const allPresets: Preset[] = presetSections.flatMap((s) => s.presets);

// Search across all presets
export function searchPresets(query: string): Preset[] {
  const q = query.toLowerCase();
  return allPresets.filter((p) => p.name.toLowerCase().includes(q));
}

// Get sections for the home page (show first 3-4 sections)
export function getHomeSections(): PresetSection[] {
  return presetSections.slice(0, 4);
}

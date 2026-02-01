// Mock preset data for the app
// In production, these would be actual images stored in assets/presets/

export interface Preset {
  id: string;
  name: string;
  category: 'hair' | 'makeup' | 'outfit' | 'glasses' | 'full';
  image: string;
}

// Using placeholder images for now
// Replace with actual preset images in assets/presets/
export const presets: Preset[] = [
  {
    id: '1',
    name: 'Classic Bob',
    category: 'hair',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop',
  },
  {
    id: '2',
    name: 'Beachy Waves',
    category: 'hair',
    image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=500&fit=crop',
  },
  {
    id: '3',
    name: 'Sleek Straight',
    category: 'hair',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop',
  },
  {
    id: '4',
    name: 'Natural Glam',
    category: 'makeup',
    image: 'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=400&h=500&fit=crop',
  },
  {
    id: '5',
    name: 'Bold & Beautiful',
    category: 'makeup',
    image: 'https://images.unsplash.com/photo-1526510747491-27f3bddc0a02?w=400&h=500&fit=crop',
  },
  {
    id: '6',
    name: 'Street Style',
    category: 'outfit',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop',
  },
  {
    id: '7',
    name: 'Minimalist Chic',
    category: 'outfit',
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=500&fit=crop',
  },
  {
    id: '8',
    name: 'Retro Shades',
    category: 'glasses',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=500&fit=crop',
  },
  {
    id: '9',
    name: 'Modern Frames',
    category: 'glasses',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=500&fit=crop',
  },
  {
    id: '10',
    name: 'Complete Makeover',
    category: 'full',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop',
  },
];

export const categories = [
  { id: 'all', label: 'All', icon: 'sparkles' },
  { id: 'hair', label: 'Hair', icon: 'cut' },
  { id: 'makeup', label: 'Makeup', icon: 'color-palette' },
  { id: 'outfit', label: 'Outfit', icon: 'shirt' },
  { id: 'glasses', label: 'Glasses', icon: 'glasses' },
  { id: 'full', label: 'Full Looks', icon: 'star' },
] as const;

export function getPresetsByCategory(category: string): Preset[] {
  if (category === 'all') return presets;
  return presets.filter((p) => p.category === category);
}

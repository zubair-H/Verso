import { Image } from 'react-native';

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

function assetUri(asset: number): string {
  return Image.resolveAssetSource(asset).uri;
}

const IMG_1521572267360 = assetUri(require('../assets/personas/1521572267360-ee0c2909d518.jpg'));
const IMG_1524504388940 = assetUri(require('../assets/personas/1524504388940-b1c1722653e1.jpg'));
const IMG_1483985988355 = assetUri(require('../assets/personas/1483985988355-763728e1935b.jpg'));
const IMG_1506794778202 = assetUri(require('../assets/personas/1506794778202-cad84cf45f1d.jpg'));
const IMG_1463453091185 = assetUri(require('../assets/personas/1463453091185-61582044d556.jpg'));
const IMG_1490578474895 = assetUri(require('../assets/personas/1490578474895-699cd4e2cf59.jpg'));
const IMG_1487412720507 = assetUri(require('../assets/personas/1487412720507-e7ab37603c6f.jpg'));
const IMG_1529626455594 = assetUri(require('../assets/personas/1529626455594-4ff0802cfb7e.jpg'));
const IMG_1529139574466 = assetUri(require('../assets/personas/1529139574466-a303027c1d8b.jpg'));
const IMG_1500648767791 = assetUri(require('../assets/personas/1500648767791-00dcc994a43e.jpg'));
const IMG_1507003211169 = assetUri(require('../assets/personas/1507003211169-0a1dd7228f2d.jpg'));
const IMG_1515886657613 = assetUri(require('../assets/personas/1515886657613-9f3515b0c78f.jpg'));
const IMG_1504257432389 = assetUri(require('../assets/personas/1504257432389-52343af06ae3.jpg'));
const IMG_1519345182560 = assetUri(require('../assets/personas/1519345182560-3f2917c472ef.jpg'));
const IMG_1483721310020 = assetUri(require('../assets/personas/1483721310020-03333e577078.jpg'));
const IMG_1534528741775 = assetUri(require('../assets/personas/1534528741775-53994a69daeb.jpg'));
const IMG_1517841905240 = assetUri(require('../assets/personas/1517841905240-472988babdf9.jpg'));
const IMG_1506277886164 = assetUri(require('../assets/personas/1506277886164-e25aa3f4ef7f.jpg'));
const IMG_1523398002811 = assetUri(require('../assets/personas/1523398002811-999ca8dec234.jpg'));
const IMG_1521119989659 = assetUri(require('../assets/personas/1521119989659-a83eee488004.jpg'));
const IMG_1521572163474 = assetUri(require('../assets/personas/1521572163474-6864f9cf17ab.jpg'));
const IMG_1485230895905 = assetUri(require('../assets/personas/1485230895905-ec40ba36b9bc.jpg'));
const IMG_1492562080023 = assetUri(require('../assets/personas/1492562080023-ab3db95bfbce.jpg'));
const IMG_1542327897 = assetUri(require('../assets/personas/1542327897-d73f4005b533.jpg'));
const IMG_1516826957135 = assetUri(require('../assets/personas/1516826957135-700dedea698c.jpg'));
const IMG_1515372039744 = assetUri(require('../assets/personas/1515372039744-b8f02a3ae446.jpg'));
const IMG_1488426862026 = assetUri(require('../assets/personas/1488426862026-3ee34a7d66df.jpg'));
const IMG_1485968579580 = assetUri(require('../assets/personas/1485968579580-b6d095142e6e.jpg'));

// Fictional AI style ambassadors (not real people).
export const stylePersonas: StylePersona[] = [
  {
    id: 'nova',
    name: 'Lyra',
    title: 'Face Sculpt Studio',
    lore: 'Try extracting: brow lift map, cheek contour placement, and eye-shape framing.',
    attribute: 'face',
    image: IMG_1521572267360,
    headshotImage: IMG_1521572267360,
    detailImage: IMG_1524504388940,
    outfitImage: IMG_1483985988355,
  },
  {
    id: 'zen',
    name: 'Aria',
    title: 'Volume Hair Blueprint',
    lore: 'Try extracting: curtain bang structure, root volume zones, and gloss direction.',
    attribute: 'hair',
    image: IMG_1506794778202,
    headshotImage: IMG_1506794778202,
    detailImage: IMG_1463453091185,
    outfitImage: IMG_1490578474895,
  },
  {
    id: 'rhea',
    name: 'Soleil',
    title: 'Color Harmony Muse',
    lore: 'Try extracting: undertone palette, contrast level, and accent-color strategy.',
    attribute: 'color',
    image: IMG_1487412720507,
    headshotImage: IMG_1487412720507,
    detailImage: IMG_1529626455594,
    outfitImage: IMG_1529139574466,
  },
  {
    id: 'jett',
    name: 'Atlas',
    title: 'Silhouette Architect',
    lore: 'Try extracting: shoulder shape, fit proportions, and outfit layering rhythm.',
    attribute: 'style',
    image: IMG_1500648767791,
    headshotImage: IMG_1500648767791,
    detailImage: IMG_1507003211169,
    outfitImage: IMG_1515886657613,
  },
  {
    id: 'sora',
    name: 'Kael',
    title: 'Texture Fade Lab',
    lore: 'Try extracting: hairline geometry, texture density, and matte-to-shine balance.',
    attribute: 'hair',
    image: IMG_1504257432389,
    headshotImage: IMG_1504257432389,
    detailImage: IMG_1519345182560,
    outfitImage: IMG_1483721310020,
  },
  {
    id: 'mira',
    name: 'Celine',
    title: 'Skin Finish Director',
    lore: 'Try extracting: skin texture finish, highlight placement, and lip-tone blending.',
    attribute: 'face',
    image: IMG_1534528741775,
    headshotImage: IMG_1534528741775,
    detailImage: IMG_1517841905240,
    outfitImage: IMG_1524504388940,
  },
  {
    id: 'orion',
    name: 'Orion',
    title: 'Sharp Fade Studio',
    lore: 'Try extracting: temple fade depth, crown texture flow, and edge-line precision.',
    attribute: 'hair',
    image: IMG_1506277886164,
    headshotImage: IMG_1506277886164,
    detailImage: IMG_1507003211169,
    outfitImage: IMG_1523398002811,
  },
  {
    id: 'nia',
    name: 'Nia',
    title: 'Editorial Bone Structure',
    lore: 'Try extracting: cheekbone emphasis, under-eye shape, and contour transition.',
    attribute: 'face',
    image: IMG_1521119989659,
    headshotImage: IMG_1521119989659,
    detailImage: IMG_1521572163474,
    outfitImage: IMG_1485230895905,
  },
  {
    id: 'luca',
    name: 'Luca',
    title: 'Tailored Street Silhouette',
    lore: 'Try extracting: jacket proportion, drape line, and layered fit rhythm.',
    attribute: 'style',
    image: IMG_1492562080023,
    headshotImage: IMG_1492562080023,
    detailImage: IMG_1542327897,
    outfitImage: IMG_1516826957135,
  },
  {
    id: 'iris',
    name: 'Iris',
    title: 'Soft Contrast Palette',
    lore: 'Try extracting: neutral temperature, saturation level, and accent-tone pairing.',
    attribute: 'color',
    image: IMG_1515372039744,
    headshotImage: IMG_1515372039744,
    detailImage: IMG_1488426862026,
    outfitImage: IMG_1485968579580,
  },
];

export function getStylePersonaById(id: string): StylePersona | undefined {
  return stylePersonas.find((persona) => persona.id === id);
}

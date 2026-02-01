// Mock product data for the result screen
// In production, these would come from affiliate APIs

export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  link: string;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Hair Styling Pomade',
    price: '$24',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=100&h=100&fit=crop',
    link: 'https://example.com/product/1',
  },
  {
    id: '2',
    name: 'Designer Sunglasses',
    price: '$89',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop',
    link: 'https://example.com/product/2',
  },
  {
    id: '3',
    name: 'Luxury Face Cream',
    price: '$45',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&h=100&fit=crop',
    link: 'https://example.com/product/3',
  },
];

export function getProductsForElements(elements: string[]): Product[] {
  // In production, this would fetch relevant products based on selected elements
  // For now, return mock products
  return mockProducts.slice(0, 2);
}

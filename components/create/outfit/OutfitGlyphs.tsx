import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type OutfitGlyphId =
  | 'tee'
  | 'shirt'
  | 'blouse'
  | 'hoodie'
  | 'blazer'
  | 'knitwear'
  | 'jeans'
  | 'trousers'
  | 'cargo'
  | 'skirt'
  | 'shorts'
  | 'leggings';

function GlyphBase({
  children,
  color,
  size,
}: {
  children: React.ReactNode;
  color: string;
  size: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

export function OutfitTypeGlyph({
  id,
  color,
  size = 18,
}: {
  id: OutfitGlyphId;
  color: string;
  size?: number;
}) {
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (id === 'tee') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M7 7.5L10 5h4l3 2.5-1.8 2.2-1.7-1.3V19H10.5V8.4L8.8 9.7 7 7.5z" />
      </GlyphBase>
    );
  }

  if (id === 'shirt') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M9 5h6l1.5 2.2-2.2 1.5-1.3-1.6-1 1.6-1-1.6-1.3 1.6-2.2-1.5L9 5z" />
        <Path {...stroke} d="M8.5 8.8V19h7V8.8" />
        <Path {...stroke} d="M12 9.5v8.5" />
      </GlyphBase>
    );
  }

  if (id === 'blouse') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M8.2 7.2L10.2 5h3.6l2 2.2-1.5 2-1.6-1.2V19H11.3V8l-1.6 1.2-1.5-2z" />
        <Path {...stroke} d="M11.2 10.5c.5.5 1.1.5 1.6 0" />
      </GlyphBase>
    );
  }

  if (id === 'hoodie') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M9 8c0-2 1.3-3 3-3s3 1 3 3" />
        <Path {...stroke} d="M7 9.5L9.2 7.8h5.6L17 9.5V19h-3.2v-3h-3.6v3H7V9.5z" />
      </GlyphBase>
    );
  }

  if (id === 'blazer') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M9.2 5h5.6l1.8 2.4-2.1 1.4-1.5-2.1-1 2.4-1-2.4-1.5 2.1-2.1-1.4L9.2 5z" />
        <Path {...stroke} d="M8.8 8.8V19h6.4V8.8" />
        <Path {...stroke} d="M12 9.5v4" />
      </GlyphBase>
    );
  }

  if (id === 'knitwear') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M7.6 7.8L10 5.8h4l2.4 2-1.6 2.2-1.7-1.2V19h-2.2V8.8L9.2 10 7.6 7.8z" />
        <Path {...stroke} d="M10 12h4M10 14.5h4M10 17h4" />
      </GlyphBase>
    );
  }

  if (id === 'jeans') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M8.5 5h7l-.8 6.2-1.2-.8-1.5 8.6h-1l-1.5-8.6-1.2.8L8.5 5z" />
      </GlyphBase>
    );
  }

  if (id === 'trousers') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M8.8 5h6.4l-.6 5.5-1.4 8.5h-1l-.8-6-.8 6h-1l-1.4-8.5L8.8 5z" />
      </GlyphBase>
    );
  }

  if (id === 'cargo') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M8.8 5h6.4l-.7 5.2-1.4 8.8h-1l-.9-6.2-.9 6.2h-1l-1.4-8.8L8.8 5z" />
        <Path {...stroke} d="M8.9 11.2h1.4v1.4H8.9zM13.7 11.2h1.4v1.4h-1.4z" />
      </GlyphBase>
    );
  }

  if (id === 'skirt') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M9.5 6h5l1.5 13h-8L9.5 6z" />
        <Path {...stroke} d="M9.3 8h5.4" />
      </GlyphBase>
    );
  }

  if (id === 'shorts') {
    return (
      <GlyphBase color={color} size={size}>
        <Path {...stroke} d="M8.8 6h6.4l-.9 5h-2l-.3 2.8-.3-2.8h-2l-.9-5z" />
        <Path {...stroke} d="M9.4 11l.7 8h2.1l.7-8" />
      </GlyphBase>
    );
  }

  return (
    <GlyphBase color={color} size={size}>
      <Path {...stroke} d="M10 5h4l.8 5.2-1 8.8h-1l-.8-6-.8 6h-1l-1-8.8L10 5z" />
    </GlyphBase>
  );
}

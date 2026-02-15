import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function LipsShapeGlyph({ color }: { id: string; color: string }) {
  return (
    <Svg width={34} height={20} viewBox="0 0 64 40">
      <Path
        d="M6 22 C12 11 20 10 28 17 C30 19 34 19 36 17 C44 10 52 11 58 22"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 22 C13 30 21 33 32 33 C43 33 51 30 58 22"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M30 19 L32 22 L34 19" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BrowShapeGlyph({ id, color }: { id: string; color: string }) {
  const browPathById: Record<string, string> = {
    natural: 'M6 20 C12 15 20 14 27 17',
    arched: 'M5 21 C12 12 20 11 28 16',
    straight: 'M6 18 C13 17 20 17 27 18',
    feathered: 'M6 20 C12 14 20 13 27 17',
  };
  const path = browPathById[id] || browPathById.natural;

  return (
    <Svg width={32} height={22} viewBox="0 0 34 24">
      <Path d={path} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

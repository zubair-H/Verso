import React from 'react';
import { View } from 'react-native';

export function LipsShapeGlyph({ id, color }: { id: string; color: string }) {
  if (id === 'full') return <View style={{ width: 26, height: 14, borderRadius: 7, backgroundColor: color }} />;
  if (id === 'defined_cupid') return <View style={{ width: 24, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color }} />;
  if (id === 'soft_matte') return <View style={{ width: 22, height: 10, borderRadius: 5, backgroundColor: color, opacity: 0.8 }} />;
  if (id === 'glossy') return <View style={{ width: 22, height: 12, borderRadius: 6, backgroundColor: color, opacity: 0.95 }} />;
  return <View style={{ width: 20, height: 8, borderRadius: 4, borderWidth: 2, borderColor: color }} />;
}

export function BrowShapeGlyph({ id, color }: { id: string; color: string }) {
  if (id === 'arched') return <View style={{ width: 24, height: 8, borderRadius: 8, borderWidth: 2, borderColor: color }} />;
  if (id === 'straight') return <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: color }} />;
  if (id === 'feathered') return <View style={{ width: 24, height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.72 }} />;
  if (id === 'natural') return <View style={{ width: 20, height: 6, borderRadius: 3, backgroundColor: color }} />;
  return <View style={{ width: 18, height: 6, borderRadius: 3, borderWidth: 2, borderColor: color }} />;
}

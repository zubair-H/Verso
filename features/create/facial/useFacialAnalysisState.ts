import { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import {
  EyeColorPreset,
  fetchEyeColors,
  fetchHairColors,
  fetchHairStyles,
  HairColorPreset,
  HairStylePreset,
} from '@/utils/api';
import { trackEvent } from '@/utils/analytics';
import { createHairSwapSession } from '@/utils/hairSwapSession';
import { DEFAULT_HAIR_COLOR_PRESETS, mergePresets } from './constants';
import type { ExpandableSectionKey } from './types';

export function useFacialAnalysisState() {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [hairColorPresets, setHairColorPresets] = useState<HairColorPreset[]>(DEFAULT_HAIR_COLOR_PRESETS);
  const [hairStylePresets, setHairStylePresets] = useState<HairStylePreset[]>([]);
  const [eyeColorPresets, setEyeColorPresets] = useState<EyeColorPreset[]>([]);

  const [selectedHairColorId, setSelectedHairColorId] = useState<string | null>(null);
  const [selectedHairStyleId, setSelectedHairStyleId] = useState<string | null>(null);
  const [selectedEyeColorId, setSelectedEyeColorId] = useState<string | null>(null);
  const [selectedLipsId, setSelectedLipsId] = useState<string | null>(null);
  const [selectedEyebrowsId, setSelectedEyebrowsId] = useState<string | null>(null);
  const [selectedEyebrowColorId, setSelectedEyebrowColorId] = useState<string | null>(null);
  const [selectedTopColorId, setSelectedTopColorId] = useState<string | null>(null);
  const [selectedBottomColorId, setSelectedBottomColorId] = useState<string | null>(null);

  const [loadingColors, setLoadingColors] = useState(true);
  const [focusedCategory, setFocusedCategory] = useState<ExpandableSectionKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingColors(true);
      try {
        const [colorsRes, stylesRes, eyesRes] = await Promise.all([fetchHairColors(), fetchHairStyles(), fetchEyeColors()]);
        if (cancelled) return;
        setHairColorPresets(mergePresets(colorsRes));
        if (stylesRes.length > 0) setHairStylePresets(stylesRes);
        if (eyesRes.length > 0) setEyeColorPresets(eyesRes);
      } catch {
        if (!cancelled) setHairColorPresets(DEFAULT_HAIR_COLOR_PRESETS);
      } finally {
        if (!cancelled) setLoadingColors(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const dataUri = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
      setSelfieImage(dataUri);
      trackEvent('photo_uploaded', { source: 'library', flow: 'hair_color' });
    }
  };

  const pickImageFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const dataUri = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
      setSelfieImage(dataUri);
      trackEvent('photo_uploaded', { source: 'camera', flow: 'hair_color' });
    }
  };

  const pickImage = () => {
    Alert.alert('Upload photo', 'Choose how you want to upload.', [
      { text: 'Camera', onPress: () => void pickImageFromCamera() },
      { text: 'Photo Library', onPress: () => void pickImageFromLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const visibleHairColorPresets = useMemo(() => hairColorPresets.filter((p) => p.id !== 'current'), [hairColorPresets]);
  const visibleHairStylePresets = useMemo(() => hairStylePresets.filter((p) => p.id !== 'no_change'), [hairStylePresets]);
  const visibleEyeColorPresets = useMemo(() => eyeColorPresets.filter((p) => p.id !== 'current'), [eyeColorPresets]);

  const clearCategory = (key: ExpandableSectionKey) => {
    if (key === 'hairColor') setSelectedHairColorId(null);
    if (key === 'hairStyle') setSelectedHairStyleId(null);
    if (key === 'eyeColor') setSelectedEyeColorId(null);
    if (key === 'lips') setSelectedLipsId(null);
    if (key === 'eyebrows') setSelectedEyebrowsId(null);
    if (key === 'eyebrowColor') setSelectedEyebrowColorId(null);
    if (key === 'outfitColors') {
      setSelectedTopColorId(null);
      setSelectedBottomColorId(null);
    }
  };

  const selectedAttributeCount = useMemo(() => {
    let count = 0;
    if (selectedHairColorId) count += 1;
    if (selectedHairStyleId) count += 1;
    if (selectedEyeColorId) count += 1;
    if (selectedLipsId) count += 1;
    if (selectedEyebrowsId) count += 1;
    if (selectedEyebrowColorId) count += 1;
    if (selectedTopColorId) count += 1;
    if (selectedBottomColorId) count += 1;
    return count;
  }, [
    selectedBottomColorId,
    selectedEyeColorId,
    selectedEyebrowColorId,
    selectedEyebrowsId,
    selectedHairColorId,
    selectedHairStyleId,
    selectedLipsId,
    selectedTopColorId,
  ]);

  const ctaLabel = useMemo(() => {
    if (!selfieImage) return 'Upload your photo';
    if (selectedAttributeCount === 0) return 'Select at least one attribute';
    if (selectedAttributeCount === 1) return 'Apply this attribute';
    return 'Apply selected attributes';
  }, [selectedAttributeCount, selfieImage]);

  const canGenerate = Boolean(selfieImage && selectedAttributeCount > 0);

  const selectedElements = useMemo(() => {
    const labels: string[] = [];
    if (selectedHairColorId) labels.push('Hair Color');
    if (selectedHairStyleId) labels.push('Hair Style');
    if (selectedEyeColorId) labels.push('Eye Color');
    if (selectedLipsId) labels.push('Lips');
    if (selectedEyebrowsId) labels.push('Eyebrows');
    if (selectedEyebrowColorId) labels.push('Eyebrow Color');
    if (selectedTopColorId) labels.push('Top Color');
    if (selectedBottomColorId) labels.push('Bottom Color');
    return labels;
  }, [
    selectedBottomColorId,
    selectedEyeColorId,
    selectedEyebrowColorId,
    selectedEyebrowsId,
    selectedHairColorId,
    selectedHairStyleId,
    selectedLipsId,
    selectedTopColorId,
  ]);

  const handleGenerate = async () => {
    if (!canGenerate || !selfieImage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const session = createHairSwapSession({
      selfie: selfieImage,
      look: selfieImage,
      elements: selectedElements.join(', ') || 'Hair Color',
      swapMode: 'fast',
      hairColorId: selectedHairColorId || undefined,
      hairStyleId: selectedHairStyleId || undefined,
      eyeColorId: selectedEyeColorId || undefined,
      lipsId: selectedLipsId || undefined,
      eyebrowsId: selectedEyebrowsId || undefined,
      eyebrowColorId: selectedEyebrowColorId || undefined,
      topColorId: selectedTopColorId || undefined,
      bottomColorId: selectedBottomColorId || undefined,
    });

    router.push({ pathname: '/create/loading', params: { sessionId: session.id } });
  };

  return {
    selfieImage,
    setSelfieImage,
    selectedHairColorId,
    setSelectedHairColorId,
    selectedHairStyleId,
    setSelectedHairStyleId,
    selectedEyeColorId,
    setSelectedEyeColorId,
    selectedLipsId,
    setSelectedLipsId,
    selectedEyebrowsId,
    setSelectedEyebrowsId,
    selectedEyebrowColorId,
    setSelectedEyebrowColorId,
    selectedTopColorId,
    setSelectedTopColorId,
    selectedBottomColorId,
    setSelectedBottomColorId,
    focusedCategory,
    setFocusedCategory,
    loadingColors,
    visibleHairColorPresets,
    visibleHairStylePresets,
    visibleEyeColorPresets,
    clearCategory,
    ctaLabel,
    canGenerate,
    pickImage,
    handleGenerate,
  };
}

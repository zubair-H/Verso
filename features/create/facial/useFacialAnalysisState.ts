import { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import {
  EyeColorPreset,
  analyzeImageSession,
  editSession,
  fetchAnalyzeStatus,
  fetchEyeColors,
  fetchHairColors,
  fetchHairStyles,
  HairColorPreset,
  HairStylePreset,
} from '@/utils/api';
import { trackEvent } from '@/utils/analytics';
import { DEFAULT_HAIR_COLOR_PRESETS, EYEBROW_COLOR_PRESETS, OUTFIT_COLORS, mergePresets } from './constants';
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
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'pending' | 'complete' | 'failed'>('idle');
  const [analysisSessionId, setAnalysisSessionId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string>('');
  const [analysisDebugLog, setAnalysisDebugLog] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState('');
  const [focusedCategory, setFocusedCategory] = useState<ExpandableSectionKey | null>(null);
  const analysisRunRef = useRef(0);
  const seenDebugRef = useRef<Set<string>>(new Set());

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

  const beginAnalysis = async (imageDataUri: string) => {
    const runId = Date.now();
    analysisRunRef.current = runId;
    const pushDebug = (message: string) => {
      setAnalysisDebugLog((prev) => [...prev.slice(-11), `${new Date().toISOString()}  ${message}`]);
    };
    setAnalysisStatus('pending');
    setAnalysisError('');
    setAnalysisSessionId(null);
    setAnalysisDebugLog([]);
    seenDebugRef.current = new Set();
    pushDebug('Starting analyze request');

    try {
      const started = await analyzeImageSession(imageDataUri);
      if (analysisRunRef.current !== runId) return;
      setAnalysisSessionId(started.sessionId);
      pushDebug(`Analyze accepted. sessionId=${started.sessionId}`);
      if (started.debug?.traceId) pushDebug(`Trace: ${started.debug.traceId}`);
      for (const step of started.debug?.steps || []) {
        if (step.message) pushDebug(`API: ${step.message}`);
      }

      for (let attempt = 0; attempt < 80; attempt += 1) {
        const status = await fetchAnalyzeStatus(started.sessionId);
        if (analysisRunRef.current !== runId) return;
        pushDebug(`Poll #${attempt + 1}: ${status.analysisStatus}`);
        for (const row of status.analysisDebug || []) {
          if (!row.message) continue;
          const key = `${row.at || ''}|${row.message}`;
          if (seenDebugRef.current.has(key)) continue;
          seenDebugRef.current.add(key);
          pushDebug(`Server: ${row.message}`);
        }

        if (status.analysisStatus === 'complete') {
          setAnalysisStatus('complete');
          setAnalysisError('');
          pushDebug('Analysis complete');
          return;
        }
        if (status.analysisStatus === 'failed') {
          setAnalysisStatus('failed');
          setAnalysisError(status.analysisError || 'Photo analysis failed');
          pushDebug(`Analysis failed: ${status.analysisError || 'unknown error'}`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      if (analysisRunRef.current === runId) {
        setAnalysisStatus('failed');
        setAnalysisError('Photo analysis timed out. Please re-upload and try again.');
        pushDebug('Analysis timed out after polling window');
      }
    } catch (error) {
      if (analysisRunRef.current !== runId) return;
      setAnalysisStatus('failed');
      setAnalysisError(error instanceof Error ? error.message : 'Photo analysis failed');
      pushDebug(`Analyze request failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  };

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
      void beginAnalysis(dataUri);
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
      void beginAnalysis(dataUri);
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

  const clearAnalysisState = () => {
    analysisRunRef.current = Date.now();
    setAnalysisStatus('idle');
    setAnalysisSessionId(null);
    setAnalysisError('');
    setAnalysisDebugLog([]);
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
    if (isApplying) return applyStatus || 'Applying changes...';
    if (analysisStatus === 'pending') return 'Analyzing your photo...';
    if (analysisStatus === 'failed') return 'Re-upload your photo to continue';
    if (selectedAttributeCount === 0) return 'Select at least one attribute';
    if (selectedAttributeCount === 1) return 'Apply this attribute';
    return 'Apply selected attributes';
  }, [analysisStatus, applyStatus, isApplying, selectedAttributeCount, selfieImage]);

  const canGenerate = Boolean(
    selfieImage &&
      selectedAttributeCount > 0 &&
      analysisStatus === 'complete' &&
      !isApplying &&
      analysisSessionId
  );

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
      if (analysisStatus === 'pending') {
        Alert.alert('Analyzing photo', 'Please wait for image mapping to finish before applying changes.');
        return;
      }
      if (analysisStatus === 'failed') {
        Alert.alert('Analysis failed', analysisError || 'Please re-upload your photo.');
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    const facialTransformCount = [
      selectedHairColorId,
      selectedHairStyleId,
      selectedEyeColorId,
      selectedLipsId,
      selectedEyebrowsId,
      selectedEyebrowColorId,
    ].filter(Boolean).length;
    if (facialTransformCount === 0) {
      Alert.alert(
        'No facial transform selected',
        'Select Hair, Eye, Lips, or Eyebrow options here. Use Outfit Analysis for outfit color changes.'
      );
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const sessionId = analysisSessionId as string;
    let outputImage = selfieImage;
    const pushStatus = (message: string) => setApplyStatus(message);

    const runEdit = async (payload: { feature: string; action: string; value?: Record<string, unknown> }) => {
      const response = await editSession({
        sessionId,
        feature: payload.feature,
        action: payload.action,
        value: payload.value,
      });
      outputImage = response.tier === 1 ? response.editedImageDataUri : response.editedImageUrl;
    };

    try {
      setIsApplying(true);
      setApplyStatus('Applying selected attributes...');

      if (selectedHairStyleId) {
        pushStatus('Applying hair style...');
        await runEdit({
          feature: 'hair',
          action: 'style',
          value: {
            styleId: selectedHairStyleId,
            colorId: selectedHairColorId || 'current',
          },
        });
      } else if (selectedHairColorId) {
        pushStatus('Applying hair color...');
        await runEdit({
          feature: 'hair',
          action: 'color',
          value: { colorId: selectedHairColorId },
        });
      }

      if (selectedEyeColorId) {
        pushStatus('Applying eye color...');
        await runEdit({
          feature: 'eyes',
          action: 'color',
          value: { eyeColorId: selectedEyeColorId },
        });
      }

      if (selectedLipsId) {
        const lipHexMap = {
          rose_nude: '#c9687a',
          warm_nude: '#c8956c',
          mauve: '#9e6b7a',
          berry: '#7b2d5e',
          classic_red: '#c0392b',
          deep_plum: '#5c2d4e',
        };
        pushStatus('Applying lip color...');
        await runEdit({
          feature: 'lips',
          action: 'color',
          value: { hex: lipHexMap[selectedLipsId as keyof typeof lipHexMap] || '#c9687a' },
        });
      }

      if (selectedEyebrowsId) {
        pushStatus('Applying eyebrow shape...');
        await runEdit({
          feature: 'eyebrows',
          action: 'shape',
          value: { styleId: selectedEyebrowsId },
        });
      }

      if (selectedEyebrowColorId) {
        const browColor = EYEBROW_COLOR_PRESETS.find((item) => item.id === selectedEyebrowColorId);
        if (browColor?.hex) {
          pushStatus('Applying eyebrow color...');
          await runEdit({
            feature: 'eyebrows',
            action: 'color',
            value: { hex: browColor.hex },
          });
        }
      }

      if (selectedTopColorId) {
        const outfitColor = OUTFIT_COLORS.find((item) => item.id === selectedTopColorId);
        if (outfitColor?.hex) {
          pushStatus('Applying outfit color...');
          await runEdit({
            feature: 'outfit',
            action: 'color',
            value: { hex: outfitColor.hex },
          });
        }
      }

      setSelfieImage(outputImage);
      setApplyStatus('Applied');
      trackEvent('look_generated', {
        elements: selectedElements.join(', ') || 'none',
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply changes';
      Alert.alert('Apply failed', message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsApplying(false);
      setTimeout(() => setApplyStatus(''), 400);
    }
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
    analysisStatus,
    analysisError,
    analysisDebugLog,
    clearAnalysisState,
    isApplying,
  };
}

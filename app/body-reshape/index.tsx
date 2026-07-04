import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { bodyTransform } from '@/utils/api';
import { spacing, layout } from '@/constants/spacing';

export default function BodyTransformScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'slim' | 'muscular' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Photo library access required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${asset.base64}`;
        setSourceImage(dataUri);
        setResultImage(null);
        setSelectedMode(null);
        setError(null);
      }
    } catch (err) {
      setError('Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera access required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${asset.base64}`;
        setSourceImage(dataUri);
        setResultImage(null);
        setSelectedMode(null);
        setError(null);
      }
    } catch (err) {
      setError('Failed to take photo');
    }
  };

  const handleTransform = async (mode: 'slim' | 'muscular') => {
    if (!sourceImage) {
      setError('Please select or take a photo');
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedMode(mode);
    try {
      const response = await bodyTransform({
        userImageUrl: sourceImage,
        transformMode: mode,
      });
      setResultImage(response.editedImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transform body');
      setSelectedMode(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
    >
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: layout.tabBarHeight }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md }}>
          Body Transform
        </Text>

        {!sourceImage ? (
          // Image picker state
          <View style={{ gap: spacing.md }}>
            <Pressable
              onPress={pickImage}
              style={{
                padding: spacing.xl,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: colors.accent,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bgSecondary,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>📸 Upload Photo</Text>
            </Pressable>

            <Pressable
              onPress={takePhoto}
              style={{
                padding: spacing.xl,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: colors.accent,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bgSecondary,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>📷 Take Photo</Text>
            </Pressable>
          </View>
        ) : (
          // Image editor state
          <>
            {/* Original Image */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm }}>
                Original
              </Text>
              <Image
                source={{ uri: sourceImage }}
                style={{
                  width: '100%',
                  height: 400,
                  borderRadius: 12,
                  backgroundColor: colors.bgSecondary,
                }}
              />
            </View>

            {/* Result Image */}
            {resultImage && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm }}>
                  {selectedMode === 'slim' ? '✨ Slimmer You' : '💪 Muscular You'}
                </Text>
                <Image
                  source={{ uri: resultImage }}
                  style={{
                    width: '100%',
                    height: 400,
                    borderRadius: 12,
                    backgroundColor: colors.bgSecondary,
                  }}
                />
              </View>
            )}

            {/* Transform Buttons */}
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              <Pressable
                onPress={() => handleTransform('slim')}
                disabled={loading}
                style={{
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.md,
                  borderRadius: 12,
                  backgroundColor:
                    selectedMode === 'slim' && !resultImage
                      ? colors.accent
                      : colors.bgSecondary,
                  borderWidth: selectedMode === 'slim' ? 0 : 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 56,
                  opacity: loading && selectedMode !== 'slim' ? 0.5 : 1,
                }}
              >
                {loading && selectedMode === 'slim' ? (
                  <ActivityIndicator color={colors.accent} size="large" />
                ) : (
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color:
                        selectedMode === 'slim' && !resultImage
                          ? '#FFF'
                          : colors.textPrimary,
                    }}
                  >
                    ✨ Lose Weight
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => handleTransform('muscular')}
                disabled={loading}
                style={{
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.md,
                  borderRadius: 12,
                  backgroundColor:
                    selectedMode === 'muscular' && !resultImage
                      ? colors.accent
                      : colors.bgSecondary,
                  borderWidth: selectedMode === 'muscular' ? 0 : 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 56,
                  opacity: loading && selectedMode !== 'muscular' ? 0.5 : 1,
                }}
              >
                {loading && selectedMode === 'muscular' ? (
                  <ActivityIndicator color={colors.accent} size="large" />
                ) : (
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color:
                        selectedMode === 'muscular' && !resultImage
                          ? '#FFF'
                          : colors.textPrimary,
                    }}
                  >
                    💪 Become Muscular
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Change Photo Button */}
            <Pressable
              onPress={pickImage}
              disabled={loading}
              style={{
                paddingVertical: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                Change Photo
              </Text>
            </Pressable>
          </>
        )}

        {/* Error Message */}
        {error && (
          <View style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: '#ffebee', borderRadius: 8 }}>
            <Text style={{ color: '#c62828', fontSize: 14 }}>⚠️ {error}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

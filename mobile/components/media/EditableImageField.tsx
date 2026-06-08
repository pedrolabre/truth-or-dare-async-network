import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ImagePickerActions, {
  type ImagePickerActionsColors,
} from './ImagePickerActions';

type Props = {
  colors: ImagePickerActionsColors & {
    surface: string;
    outline: string;
  };
  title: string;
  helperText: string;
  imageUri?: string | null;
  fallbackIconName?: keyof typeof MaterialIcons.glyphMap;
  variant?: 'avatar' | 'cover';
  isUploading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onRemove?: () => void;
};

export default function EditableImageField({
  colors,
  title,
  helperText,
  imageUri,
  fallbackIconName = 'image',
  variant = 'cover',
  isUploading = false,
  loadingLabel = 'Enviando...',
  disabled = false,
  onCamera,
  onGallery,
  onRemove,
}: Props) {
  const isAvatar = variant === 'avatar';
  const canRemove = Boolean(imageUri && onRemove);

  return (
    <View style={styles.field}>
      <View style={styles.textStack}>
        <Text style={[styles.title, { color: colors.green }]}>{title}</Text>
        <Text style={[styles.helperText, { color: colors.muted }]}>
          {helperText}
        </Text>
      </View>

      <View
        style={[
          styles.preview,
          isAvatar ? styles.avatarPreview : styles.coverPreview,
          {
            backgroundColor: colors.surfaceSoft,
            borderColor: colors.border,
          },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.image} />
        ) : (
          <View style={styles.emptyPreview}>
            <MaterialIcons
              name={fallbackIconName}
              size={isAvatar ? 28 : 34}
              color={colors.muted}
            />
          </View>
        )}

        {isUploading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={[styles.loadingText, { color: colors.white }]}>
              {loadingLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <ImagePickerActions
        colors={colors}
        canRemove={canRemove}
        disabled={disabled || isUploading}
        onCamera={onCamera}
        onGallery={onGallery}
        onRemove={onRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 10,
  },
  textStack: {
    gap: 4,
  },
  title: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  preview: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarPreview: {
    width: 112,
    height: 112,
    borderRadius: 24,
  },
  coverPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 128,
    borderRadius: 18,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  loadingText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
});

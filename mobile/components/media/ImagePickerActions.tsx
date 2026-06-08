import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ImagePickerActionsColors = {
  surfaceSoft: string;
  border: string;
  text: string;
  muted: string;
  green: string;
  red: string;
  white: string;
};

type Props = {
  colors: ImagePickerActionsColors;
  disabled?: boolean;
  canRemove?: boolean;
  cameraLabel?: string;
  galleryLabel?: string;
  removeLabel?: string;
  onCamera: () => void;
  onGallery: () => void;
  onRemove?: () => void;
};

export default function ImagePickerActions({
  colors,
  disabled = false,
  canRemove = false,
  cameraLabel = 'Camera',
  galleryLabel = 'Galeria',
  removeLabel = 'Remover',
  onCamera,
  onGallery,
  onRemove,
}: Props) {
  return (
    <View style={styles.actions}>
      <ActionButton
        colors={colors}
        disabled={disabled}
        iconName="photo-camera"
        label={cameraLabel}
        onPress={onCamera}
      />
      <ActionButton
        colors={colors}
        disabled={disabled}
        iconName="photo-library"
        label={galleryLabel}
        onPress={onGallery}
      />
      {canRemove && onRemove ? (
        <ActionButton
          colors={colors}
          danger
          disabled={disabled}
          iconName="delete-outline"
          label={removeLabel}
          onPress={onRemove}
        />
      ) : null}
    </View>
  );
}

type ActionButtonProps = {
  colors: ImagePickerActionsColors;
  disabled: boolean;
  danger?: boolean;
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
};

function ActionButton({
  colors,
  disabled,
  danger = false,
  iconName,
  label,
  onPress,
}: ActionButtonProps) {
  const foregroundColor = danger ? colors.red : colors.green;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.border,
          opacity: disabled ? 0.55 : 1,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <MaterialIcons name={iconName} size={17} color={foregroundColor} />
      <Text
        numberOfLines={1}
        style={[styles.actionText, { color: danger ? colors.red : colors.text }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    maxWidth: 88,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});

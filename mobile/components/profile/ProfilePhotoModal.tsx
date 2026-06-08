import React from 'react';
import {
  ActivityIndicator,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
  isUploading?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
};

export default function ProfilePhotoModal({
  visible,
  onClose,
  onCamera,
  onGallery,
  onRemove,
  isUploading = false,
  errorMessage,
  successMessage,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Foto de Perfil</Text>

          {isUploading ? (
            <View
              accessibilityRole="text"
              accessibilityLabel="Enviando foto de perfil"
              style={styles.statusBox}
            >
              <ActivityIndicator color="#5A8363" />
              <Text style={styles.statusText}>Enviando foto...</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {errorMessage}
            </Text>
          ) : null}

          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          <Action label="Tirar foto" disabled={isUploading} onPress={onCamera} />
          <Action
            label="Escolher da galeria"
            disabled={isUploading}
            onPress={onGallery}
          />
          <Action
            label="Remover foto"
            danger
            disabled={isUploading}
            onPress={onRemove}
          />

          <TouchableOpacity disabled={isUploading} onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Action({
  label,
  onPress,
  danger,
  disabled,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.action,
        danger && styles.dangerBackground,
        disabled && styles.disabledAction,
      ]}
    >
      <Text
        style={[
          styles.text,
          danger && styles.dangerText,
          disabled && styles.disabledText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },

  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    gap: 10,
  },

  title: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 8,
  },

  statusBox: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#f0f4f1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3d4944',
  },

  errorText: {
    borderRadius: 16,
    backgroundColor: '#fde8e8',
    color: '#9f1239',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  successText: {
    borderRadius: 16,
    backgroundColor: '#e8f5ed',
    color: '#24633a',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  action: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#f0f4f1',
  },

  text: {
    fontWeight: '700',
    fontSize: 13,
  },

  dangerBackground: {
    backgroundColor: '#fde8e8',
  },

  disabledAction: {
    opacity: 0.55,
  },

  dangerText: {
    color: '#D70015',
  },

  disabledText: {
    color: '#6b7280',
  },

  cancel: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '700',
    color: '#6b7280',
  },
});

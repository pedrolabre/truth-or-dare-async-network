import React from 'react';
import {
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
};

export default function ProfilePhotoModal({
  visible,
  onClose,
  onCamera,
  onGallery,
  onRemove,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Foto de Perfil</Text>

          <Action label="Tirar foto" onPress={onCamera} />
          <Action label="Escolher da galeria" onPress={onGallery} />
          <Action label="Remover foto" danger onPress={onRemove} />

          <TouchableOpacity onPress={onClose}>
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
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.action,
        danger && styles.dangerBackground,
      ]}
    >
      <Text
        style={[
          styles.text,
          danger && styles.dangerText,
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

  dangerText: {
    color: '#D70015',
  },

  cancel: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '700',
    color: '#6b7280',
  },
});
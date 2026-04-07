import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  name: string;
  username: string;
  setName: (v: string) => void;
  setUsername: (v: string) => void;
};

export default function ProfileEditModal({
  visible,
  onClose,
  onSave,
  name,
  username,
  setName,
  setUsername,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Editar Perfil</Text>

          <Field
            label="Nome"
            value={name}
            onChange={setName}
          />

          <Field
            label="Usuário"
            value={username}
            onChange={setUsername}
          />

          <TouchableOpacity style={styles.save} onPress={onSave}>
            <Text style={styles.saveText}>Salvar alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.input}
        placeholder={`Digite seu ${label.toLowerCase()}`}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modal: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    gap: 12,
  },

  title: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 8,
  },

  field: {
    gap: 4,
  },

  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5A8363',
    textTransform: 'uppercase',
  },

  input: {
    backgroundColor: '#f0f4f1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: '600',
  },

  save: {
    backgroundColor: '#5A8363',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  saveText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  cancel: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '700',
    color: '#6b7280',
  },
});
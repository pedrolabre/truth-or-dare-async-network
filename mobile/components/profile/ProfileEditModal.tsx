import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  name: string;
  username: string;
  bio: string;
  setName: (v: string) => void;
  setUsername: (v: string) => void;
  setBio: (v: string) => void;
};

export default function ProfileEditModal({
  visible,
  onClose,
  onSave,
  name,
  username,
  bio,
  setName,
  setUsername,
  setBio,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableWithoutFeedback>
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

                  <Field
                    label="Bio"
                    value={bio}
                    onChange={setBio}
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.save}
                    onPress={() => {
                      Keyboard.dismiss();
                      onSave();
                    }}
                  >
                    <Text style={styles.saveText}>Salvar alterações</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      onClose();
                    }}
                  >
                    <Text style={styles.cancel}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        placeholder={`Digite seu ${label.toLowerCase()}`}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        returnKeyType={multiline ? 'default' : 'done'}
        blurOnSubmit={!multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },

   modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    gap: 12,
    alignSelf: 'center',
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

  inputMultiline: {
    minHeight: 96,
    paddingTop: 12,
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
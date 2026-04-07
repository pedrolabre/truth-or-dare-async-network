import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  currentPassword: string;
  newPassword: string;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function SettingsChangePasswordModal({
  visible,
  currentPassword,
  newPassword,
  onChangeCurrentPassword,
  onChangeNewPassword,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <SettingsModalShell visible={visible} onClose={onCancel}>
      <View>
        <Text style={styles.title}>NOVA SENHA</Text>

        <View style={styles.fields}>
          <TextInput
            value={currentPassword}
            onChangeText={onChangeCurrentPassword}
            placeholder="Senha Atual"
            style={styles.input}
            placeholderTextColor="#6d7a74"
            secureTextEntry
          />
          <TextInput
            value={newPassword}
            onChangeText={onChangeNewPassword}
            placeholder="Nova Senha"
            style={styles.input}
            placeholderTextColor="#6d7a74"
            secureTextEntry
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={onSubmit}>
          <Text style={styles.primaryText}>ATUALIZAR SENHA</Text>
        </Pressable>

        <Pressable onPress={onCancel} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>CANCELAR</Text>
        </Pressable>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
  },
  fields: {
    gap: 12,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#eaefea',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#171d1a',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#5A8363',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6d7a74',
    letterSpacing: 0.5,
  },
});
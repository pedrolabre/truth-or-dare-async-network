import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  email: string;
  password: string;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export default function SettingsChangeEmailModal({
  visible,
  email,
  password,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onBack,
}: Props) {
  return (
    <SettingsModalShell visible={visible} onClose={onBack}>
      <View>
        <Text style={styles.title}>NOVO E-MAIL</Text>

        <View style={styles.fields}>
          <TextInput
            value={email}
            onChangeText={onChangeEmail}
            placeholder="Novo e-mail"
            style={styles.input}
            placeholderTextColor="#6d7a74"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            value={password}
            onChangeText={onChangePassword}
            placeholder="Confirme sua senha"
            style={styles.input}
            placeholderTextColor="#6d7a74"
            secureTextEntry
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={onSubmit}>
          <Text style={styles.primaryText}>CONFIRMAR MUDANÇA</Text>
        </Pressable>

        <Pressable onPress={onBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>VOLTAR</Text>
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
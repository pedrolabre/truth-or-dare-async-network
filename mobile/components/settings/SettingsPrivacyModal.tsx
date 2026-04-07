import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  currentEmail: string;
  onClose: () => void;
  onPressChangeEmail: () => void;
};

export default function SettingsPrivacyModal({
  visible,
  currentEmail,
  onClose,
  onPressChangeEmail,
}: Props) {
  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View>
        <Text style={styles.title}>PRIVACIDADE</Text>

        <View style={styles.card}>
          <Text style={styles.label}>E-MAIL ATUAL</Text>
          <Text style={styles.email}>{currentEmail}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={onPressChangeEmail}>
          <Text style={styles.primaryText}>ALTERAR E-MAIL</Text>
        </Pressable>

        <Pressable onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>FECHAR</Text>
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
  card: {
    borderRadius: 14,
    backgroundColor: '#eaefea',
    padding: 14,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: '#5A8363',
    letterSpacing: 1,
  },
  email: {
    fontSize: 15,
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
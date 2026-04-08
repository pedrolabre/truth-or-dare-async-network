import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          PRIVACIDADE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#232323' : '#eaefea',
            },
          ]}
        >
          <Text style={styles.label}>E-MAIL ATUAL</Text>
          <Text style={[styles.email, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
            {currentEmail || 'Nenhum e-mail carregado'}
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={onPressChangeEmail}>
          <Text style={styles.primaryText}>ALTERAR E-MAIL</Text>
        </Pressable>

        <Pressable onPress={onClose} style={styles.secondaryButton}>
          <Text
            style={[
              styles.secondaryText,
              { color: isDark ? '#bccac2' : '#6d7a74' },
            ]}
          >
            FECHAR
          </Text>
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
    letterSpacing: 0.5,
  },
});
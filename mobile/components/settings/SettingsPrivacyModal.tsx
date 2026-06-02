import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
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
  const { isDark } = useTheme();

  return (
    <SettingsModalShell visible={visible} onClose={onClose} title="Privacidade">
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

        <Pressable
          accessibilityLabel="Alterar e-mail"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={onPressChangeEmail}
        >
          <Text style={styles.primaryText}>ALTERAR E-MAIL</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Fechar privacidade"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.secondaryText,
              { color: isDark ? '#bccac2' : '#56645e' },
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
    color: '#426A4B',
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
    backgroundColor: '#426A4B',
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
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },
});

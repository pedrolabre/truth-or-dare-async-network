import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPressReportAbuse: () => void;
  onPressContactDevs: () => void;
  contactMessage?: string | null;
};

export default function SettingsHelpModal({
  visible,
  onClose,
  onPressReportAbuse,
  onPressContactDevs,
  contactMessage = null,
}: Props) {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8ABF96' : '#426A4B';

  return (
    <SettingsModalShell visible={visible} onClose={onClose} title="Suporte">
      <View>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          SUPORTE
        </Text>

        <View style={styles.content}>
          <Text
            style={[
              styles.description,
              { color: isDark ? '#bccac2' : '#56645e' },
            ]}
          >
            Esta área será usada para suporte ao usuário, dúvidas e comunicação com a equipe.
          </Text>

          <View
            style={[
              styles.separator,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          />

          <Pressable
            accessibilityLabel="Denunciar abuso"
            accessibilityRole="button"
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={onPressReportAbuse}
          >
            <Text style={[styles.linkText, { color: accentColor }]}>
              Denunciar Abuso
            </Text>
            <MaterialIcons name="flag" size={20} color={accentColor} />
          </Pressable>

          <Pressable
            accessibilityLabel="Falar com desenvolvedores"
            accessibilityRole="button"
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={onPressContactDevs}
          >
            <Text style={[styles.linkText, { color: accentColor }]}>
              Falar com Devs
            </Text>
            <MaterialIcons name="mail" size={20} color={accentColor} />
          </Pressable>

          {contactMessage ? (
            <Text testID="settings-help-contact-message" style={styles.contactMessage}>
              {contactMessage}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="Fechar suporte"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.confirmButton,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.05)',
            },
            pressed && styles.pressed,
          ]}
          onPress={onClose}
        >
          <Text style={[styles.confirmText, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
            ENTENDI
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
    marginBottom: 16,
  },
  content: {
    gap: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  separator: {
    height: 1,
  },
  linkRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '800',
  },
  contactMessage: {
    color: '#D97706',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  confirmButton: {
    marginTop: 24,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SettingsEmailSuccessModal({
  visible,
  onClose,
}: Props) {
  const { isDark } = useTheme();

  return (
    <SettingsModalShell visible={visible} onClose={onClose} title="E-mail atualizado">
      <View style={styles.center}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? '#1f3d2b' : '#d1fae5',
            },
          ]}
        >
          <MaterialIcons name="check-circle" size={44} color="#059669" />
        </View>

        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          E-MAIL ATUALIZADO!
        </Text>

        <Text
          style={[
            styles.text,
            { color: isDark ? '#bccac2' : '#56645e' },
          ]}
        >
          Seu novo e-mail foi recebido. Enviaremos um link de confirmacao para
          concluir a mudanca.
        </Text>

        <Pressable
          accessibilityLabel="Fechar confirmacao de e-mail atualizado"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={onClose}
        >
          <Text style={styles.primaryText}>EXCELENTE</Text>
        </Pressable>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 8,
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#527B5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});

import React from 'react';
import { ActivityIndicator, Text, View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export default function SettingsLogoutModal({
  visible,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: Props) {
  const { isDark } = useTheme();

  return (
    <SettingsModalShell visible={visible} onClose={onCancel} title="Sair">
      <View style={styles.center}>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          Deseja sair?
        </Text>

        <Text
          style={[
            styles.text,
            { color: isDark ? '#bccac2' : '#56645e' },
          ]}
        >
          Sua sessão será encerrada com segurança.
        </Text>

        <Pressable
          accessibilityLabel="Confirmar logout"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.danger,
            pressed && styles.pressed,
            isSubmitting && styles.disabled,
          ]}
          onPress={onConfirm}
        >
          {isSubmitting ? (
            <ActivityIndicator testID="settings-logout-loading" color="#ffffff" />
          ) : (
            <Text style={styles.dangerText}>SIM, DESLOGAR</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Cancelar logout"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={onCancel}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text
            style={[
              styles.cancel,
              { color: isDark ? '#bccac2' : '#56645e' },
            ]}
          >
            CANCELAR
          </Text>
        </Pressable>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 16 },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  text: {
    textAlign: 'center',
  },
  danger: {
    width: '100%',
    backgroundColor: '#D70015',
    padding: 16,
    borderRadius: 16,
  },
  dangerText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
  },
  cancel: {
    marginTop: 10,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.58,
  },
});

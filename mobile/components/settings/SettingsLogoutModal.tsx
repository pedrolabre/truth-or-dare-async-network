import React from 'react';
import { Text, View, Pressable, StyleSheet, useColorScheme } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SettingsLogoutModal({
  visible,
  onConfirm,
  onCancel,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <SettingsModalShell visible={visible} onClose={onCancel}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          Deseja sair?
        </Text>

        <Text
          style={[
            styles.text,
            { color: isDark ? '#bccac2' : '#6d7a74' },
          ]}
        >
          Sua sessão será encerrada com segurança.
        </Text>

        <Pressable style={styles.danger} onPress={onConfirm}>
          <Text style={styles.dangerText}>SIM, DESLOGAR</Text>
        </Pressable>

        <Pressable onPress={onCancel}>
          <Text
            style={[
              styles.cancel,
              { color: isDark ? '#bccac2' : '#6d7a74' },
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
});
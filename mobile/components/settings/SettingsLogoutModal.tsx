import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
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
  return (
    <SettingsModalShell visible={visible} onClose={onCancel}>
      <View style={styles.center}>
        <Text style={styles.title}>Deseja sair?</Text>

        <Text style={styles.text}>
          Sua sessão será encerrada com segurança.
        </Text>

        <Pressable style={styles.danger} onPress={onConfirm}>
          <Text style={styles.dangerText}>SIM, DESLOGAR</Text>
        </Pressable>

        <Pressable onPress={onCancel}>
          <Text style={styles.cancel}>CANCELAR</Text>
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
    color: '#6d7a74',
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
    color: '#6d7a74',
  },
});
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SettingsPrivateAccountModal({
  visible,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <SettingsModalShell visible={visible} onClose={onCancel}>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="lock" size={36} color="#5A8363" />
        </View>

        <Text style={styles.title}>TORNAR CONTA PRIVADA?</Text>

        <Text style={styles.text}>
          Somente seguidores aprovados por você poderão ver seu perfil e atividade.
        </Text>

        <Pressable style={styles.primary} onPress={onConfirm}>
          <Text style={styles.primaryText}>CONFIRMAR</Text>
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: '#e6efe8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
    color: '#6d7a74',
  },
  primary: {
    width: '100%',
    backgroundColor: '#5A8363',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  primaryText: {
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
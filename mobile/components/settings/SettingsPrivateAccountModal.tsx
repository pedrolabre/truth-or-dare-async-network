import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View, Pressable, StyleSheet, useColorScheme } from 'react-native';
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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <SettingsModalShell visible={visible} onClose={onCancel}>
      <View style={styles.center}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? '#1f3d2b' : '#e6efe8',
            },
          ]}
        >
          <MaterialIcons name="lock" size={36} color="#5A8363" />
        </View>

        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          TORNAR CONTA PRIVADA?
        </Text>

        <Text
          style={[
            styles.text,
            { color: isDark ? '#bccac2' : '#6d7a74' },
          ]}
        >
          Somente seguidores aprovados por você poderão ver seu perfil e atividade.
        </Text>

        <Pressable style={styles.primary} onPress={onConfirm}>
          <Text style={styles.primaryText}>CONFIRMAR</Text>
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 999,
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
  },
});
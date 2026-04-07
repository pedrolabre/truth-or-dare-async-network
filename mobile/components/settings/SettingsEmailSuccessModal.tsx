import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SettingsEmailSuccessModal({
  visible,
  onClose,
}: Props) {
  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check-circle" size={44} color="#059669" />
        </View>

        <Text style={styles.title}>E-MAIL ATUALIZADO!</Text>
        <Text style={styles.text}>
          Seu novo endereço de e-mail foi salvo com sucesso.
        </Text>

        <Pressable style={styles.primaryButton} onPress={onClose}>
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
    backgroundColor: '#d1fae5',
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
    color: '#6d7a74',
  },
  primaryButton: {
    marginTop: 8,
    width: '100%',
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
});
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPressReportAbuse: () => void;
  onPressContactDevs: () => void;
};

export default function SettingsHelpModal({
  visible,
  onClose,
  onPressReportAbuse,
  onPressContactDevs,
}: Props) {
  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View>
        <Text style={styles.title}>SUPORTE</Text>

        <View style={styles.content}>
          <Text style={styles.description}>
            Como jogar: Selecione entre Verdade ou Desafio e siga as instruções na tela!
          </Text>

          <View style={styles.separator} />

          <Pressable style={styles.linkRow} onPress={onPressReportAbuse}>
            <Text style={styles.linkText}>Denunciar Abuso</Text>
            <MaterialIcons name="flag" size={20} color="#5A8363" />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={onPressContactDevs}>
            <Text style={styles.linkText}>Falar com Devs</Text>
            <MaterialIcons name="mail" size={20} color="#5A8363" />
          </Pressable>
        </View>

        <Pressable style={styles.confirmButton} onPress={onClose}>
          <Text style={styles.confirmText}>ENTENDI</Text>
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
    color: '#6d7a74',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
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
    color: '#5A8363',
  },
  confirmButton: {
    marginTop: 24,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171d1a',
  },
});
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SettingsAboutModal({
  visible,
  onClose,
}: Props) {
  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View style={styles.center}>
        <View style={styles.iconBox}>
          <MaterialIcons name="style" size={34} color="#ffffff" />
        </View>

        <Text style={styles.title}>TRUTH OR DARE</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoItem}>• Termos de Uso atualizados</Text>
          <Text style={styles.infoItem}>• Motor de renderização Lite v2</Text>
          <Text style={styles.infoItem}>• Suporte a múltiplos idiomas</Text>
        </View>

        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>FECHAR</Text>
        </Pressable>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#5A8363',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  infoBox: {
    width: '100%',
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 14,
    gap: 8,
  },
  infoItem: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#171d1a',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#5A8363',
    letterSpacing: 0.5,
  },
});
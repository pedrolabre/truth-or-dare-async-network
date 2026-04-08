import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SettingsAboutModal({
  visible,
  onClose,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View style={styles.center}>
        <View style={styles.iconBox}>
          <MaterialIcons name="style" size={34} color="#ffffff" />
        </View>

        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          TRUTH OR DARE
        </Text>

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <Text
            style={[
              styles.infoItem,
              { color: isDark ? '#bccac2' : '#171d1a' },
            ]}
          >
            Este aplicativo está em desenvolvimento.
          </Text>
          <Text
            style={[
              styles.infoItem,
              { color: isDark ? '#bccac2' : '#171d1a' },
            ]}
          >
            Algumas funcionalidades ainda não estão conectadas ao backend.
          </Text>
          <Text
            style={[
              styles.infoItem,
              { color: isDark ? '#bccac2' : '#171d1a' },
            ]}
          >
            As configurações e recursos serão atualizados conforme a evolução do sistema.
          </Text>
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
    padding: 14,
    gap: 8,
  },
  infoItem: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
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
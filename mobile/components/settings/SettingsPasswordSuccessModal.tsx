import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SettingsPasswordSuccessModal({
  visible,
  onClose,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <SettingsModalShell visible={visible} onClose={onClose}>
      <View style={styles.center}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? '#1f3d2b' : '#d1fae5',
            },
          ]}
        >
          <MaterialIcons name="vpn-key" size={40} color="#059669" />
        </View>

        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          SENHA ALTERADA!
        </Text>

        <Text
          style={[
            styles.text,
            { color: isDark ? '#bccac2' : '#6d7a74' },
          ]}
        >
          Sua conta está protegida com a nova credencial.
        </Text>

        <Pressable style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryText}>OK</Text>
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
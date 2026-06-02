import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
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
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8ABF96' : '#426A4B';

  return (
    <SettingsModalShell visible={visible} onClose={onCancel} title="Tornar conta privada">
      <View style={styles.center}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? '#1f3d2b' : '#e6efe8',
            },
          ]}
        >
          <MaterialIcons name="lock" size={36} color={accentColor} />
        </View>

        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          TORNAR CONTA PRIVADA?
        </Text>

        <Text
          style={[
            styles.text,
            { color: isDark ? '#bccac2' : '#56645e' },
          ]}
        >
          Somente seguidores aprovados por você poderão ver seu perfil e atividade.
        </Text>

        <Pressable
          accessibilityLabel="Confirmar conta privada"
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={onConfirm}
        >
          <Text style={styles.primaryText}>CONFIRMAR</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Cancelar conta privada"
          accessibilityRole="button"
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
    backgroundColor: '#426A4B',
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
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});

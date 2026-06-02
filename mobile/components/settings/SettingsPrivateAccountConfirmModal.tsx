import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  willBePrivate: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export default function SettingsPrivateAccountConfirmModal({
  visible,
  willBePrivate,
  onConfirm,
  onCancel,
  isSubmitting = false,
  errorMessage = null,
}: Props) {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8ABF96' : '#426A4B';
  const title = willBePrivate
    ? 'TORNAR CONTA PRIVADA?'
    : 'TORNAR CONTA PÚBLICA?';

  const body = willBePrivate
    ? 'Somente seguidores aprovados por você poderão ver seu perfil e atividade.'
    : 'Qualquer pessoa poderá ver seu perfil e te seguir sem aprovação.';

  return (
    <SettingsModalShell visible={visible} onClose={onCancel} title={title}>
      <View style={styles.center}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? '#1f3d2b' : '#e6efe8',
            },
          ]}
        >
          <MaterialIcons
            name={willBePrivate ? 'lock' : 'lock-open'}
            size={36}
            color={accentColor}
          />
        </View>

        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          {title}
        </Text>
        <Text style={[styles.text, { color: isDark ? '#bccac2' : '#56645e' }]}>
          {body}
        </Text>

        {errorMessage ? (
          <Text testID="settings-private-account-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Confirmar privacidade da conta"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.primary,
            pressed && styles.pressed,
            isSubmitting && styles.disabled,
          ]}
          onPress={onConfirm}
        >
          {isSubmitting ? (
            <ActivityIndicator
              testID="settings-private-account-loading"
              color="#ffffff"
            />
          ) : (
            <Text style={styles.primaryText}>CONFIRMAR</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Cancelar alteracao de privacidade"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
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
    lineHeight: 20,
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
  errorText: {
    color: '#B00020',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.58,
  },
});

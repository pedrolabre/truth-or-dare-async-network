import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { DeleteAccountFieldErrors } from '../../types/settings';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  step: 1 | 2;
  currentPassword: string;
  onChangeCurrentPassword: (value: string) => void;
  onContinue: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  fieldErrors?: DeleteAccountFieldErrors;
};

export default function SettingsDeleteAccountModal({
  visible,
  step,
  currentPassword,
  onChangeCurrentPassword,
  onContinue,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage = null,
  fieldErrors = {},
}: Props) {
  const { isDark } = useTheme();
  const textColor = isDark ? '#f5fbf6' : '#171d1a';
  const subTextColor = isDark ? '#bccac2' : '#56645e';
  const inputBackground = isDark ? '#232323' : '#eaefea';

  return (
    <SettingsModalShell visible={visible} onClose={onCancel} title="Excluir conta">
      <View>
        <Text style={[styles.title, { color: textColor }]}>
          EXCLUIR CONTA
        </Text>

        {step === 1 ? (
          <>
            <Text style={[styles.body, { color: subTextColor }]}>
              Sua conta sera desativada e voce sera desconectado. Seus conteudos
              existentes permanecem preservados para manter conversas e grupos
              consistentes.
            </Text>

            <Pressable
              accessibilityLabel="Continuar exclusao de conta"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.dangerButtonPressed,
              ]}
              onPress={onContinue}
            >
              <Text style={styles.dangerText}>CONTINUAR</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.body, { color: subTextColor }]}>
              Confirme sua senha atual para finalizar a exclusao.
            </Text>

            <Text style={[styles.label, { color: subTextColor }]}>
              SENHA ATUAL
            </Text>
            <TextInput
              testID="settings-delete-account-password-input"
              accessibilityLabel="Senha atual para excluir conta"
              value={currentPassword}
              onChangeText={onChangeCurrentPassword}
              placeholder="Digite sua senha atual"
              secureTextEntry
              editable={!isSubmitting}
              style={[
                styles.input,
                {
                  backgroundColor: inputBackground,
                  color: textColor,
                },
              ]}
              placeholderTextColor={isDark ? '#aabbb3' : '#56645e'}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {fieldErrors.currentPassword ? (
              <Text
                testID="settings-delete-account-password-error"
                style={styles.fieldErrorText}
              >
                {fieldErrors.currentPassword}
              </Text>
            ) : null}

            {errorMessage ? (
              <Text testID="settings-delete-account-error" style={styles.errorText}>
                {errorMessage}
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Excluir conta definitivamente"
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.dangerButtonPressed,
                isSubmitting && styles.dangerButtonDisabled,
              ]}
              onPress={onSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  testID="settings-delete-account-loading"
                  color="#ffffff"
                />
              ) : (
                <Text style={styles.dangerText}>EXCLUIR DEFINITIVAMENTE</Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable
          accessibilityLabel="Cancelar exclusao de conta"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
            isSubmitting && styles.secondaryButtonDisabled,
          ]}
        >
          <Text style={[styles.secondaryText, { color: subTextColor }]}>
            CANCELAR
          </Text>
        </Pressable>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldErrorText: {
    marginTop: 7,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 12,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  dangerButton: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#D70015',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonDisabled: {
    opacity: 0.68,
  },
  dangerButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  dangerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
});

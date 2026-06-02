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
import type { ChangeEmailFieldErrors } from '../../types/settings';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  email: string;
  confirmEmail: string;
  password: string;
  onChangeEmail: (value: string) => void;
  onChangeConfirmEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  fieldErrors?: ChangeEmailFieldErrors;
};

export default function SettingsChangeEmailModal({
  visible,
  email,
  confirmEmail,
  password,
  onChangeEmail,
  onChangeConfirmEmail,
  onChangePassword,
  onSubmit,
  onBack,
  isSubmitting = false,
  errorMessage = null,
  fieldErrors = {},
}: Props) {
  const { isDark } = useTheme();

  return (
    <SettingsModalShell visible={visible} onClose={onBack}>
      <View>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          NOVO E-MAIL
        </Text>

        <View style={styles.fields}>
          <TextInput
            testID="settings-change-email-new-email-input"
            value={email}
            onChangeText={onChangeEmail}
            placeholder="Novo e-mail"
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#232323' : '#eaefea',
                color: isDark ? '#f5fbf6' : '#171d1a',
              },
            ]}
            placeholderTextColor={isDark ? '#8fa39a' : '#6d7a74'}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isSubmitting}
          />
          {fieldErrors.newEmail ? (
            <Text
              testID="settings-change-email-new-email-error"
              style={styles.fieldErrorText}
            >
              {fieldErrors.newEmail}
            </Text>
          ) : null}

          <TextInput
            testID="settings-change-email-confirm-email-input"
            value={confirmEmail}
            onChangeText={onChangeConfirmEmail}
            placeholder="Confirme o novo e-mail"
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#232323' : '#eaefea',
                color: isDark ? '#f5fbf6' : '#171d1a',
              },
            ]}
            placeholderTextColor={isDark ? '#8fa39a' : '#6d7a74'}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isSubmitting}
          />
          {fieldErrors.confirmEmail ? (
            <Text
              testID="settings-change-email-confirm-email-error"
              style={styles.fieldErrorText}
            >
              {fieldErrors.confirmEmail}
            </Text>
          ) : null}

          <TextInput
            testID="settings-change-email-password-input"
            value={password}
            onChangeText={onChangePassword}
            placeholder="Confirme sua senha"
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#232323' : '#eaefea',
                color: isDark ? '#f5fbf6' : '#171d1a',
              },
            ]}
            placeholderTextColor={isDark ? '#8fa39a' : '#6d7a74'}
            secureTextEntry
            editable={!isSubmitting}
          />
          {fieldErrors.currentPassword ? (
            <Text
              testID="settings-change-email-password-error"
              style={styles.fieldErrorText}
            >
              {fieldErrors.currentPassword}
            </Text>
          ) : null}
        </View>

        <Text
          testID="settings-change-email-confirmation-info"
          style={[styles.infoText, { color: isDark ? '#bccac2' : '#6d7a74' }]}
        >
          Enviaremos um link para confirmar a mudanca antes de ativar o novo
          e-mail.
        </Text>

        {errorMessage ? (
          <Text testID="settings-change-email-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          style={[
            styles.primaryButton,
            isSubmitting && styles.primaryButtonDisabled,
          ]}
          onPress={onSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator
              testID="settings-change-email-loading"
              color="#ffffff"
            />
          ) : (
            <Text style={styles.primaryText}>CONFIRMAR MUDANCA</Text>
          )}
        </Pressable>

        <Pressable
          disabled={isSubmitting}
          onPress={onBack}
          style={styles.secondaryButton}
        >
          <Text
            style={[
              styles.secondaryText,
              { color: isDark ? '#bccac2' : '#6d7a74' },
            ]}
          >
            VOLTAR
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
    marginBottom: 18,
  },
  fields: {
    gap: 12,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldErrorText: {
    marginTop: -6,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  infoText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#5A8363',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.68,
  },
  primaryText: {
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
  errorText: {
    marginTop: 12,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
});

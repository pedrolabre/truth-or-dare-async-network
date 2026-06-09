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
  const confirmEmailRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);

  return (
    <SettingsModalShell visible={visible} onClose={onBack} title="Novo e-mail">
      <View>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          NOVO E-MAIL
        </Text>

        <View style={styles.fields}>
          <TextInput
            testID="settings-change-email-new-email-input"
            accessibilityLabel="Novo e-mail"
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
            placeholderTextColor={isDark ? '#aabbb3' : '#56645e'}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isSubmitting}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmEmailRef.current?.focus()}
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
            ref={confirmEmailRef}
            accessibilityLabel="Confirmar novo e-mail"
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
            placeholderTextColor={isDark ? '#aabbb3' : '#56645e'}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isSubmitting}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
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
            ref={passwordRef}
            accessibilityLabel="Senha atual"
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
            placeholderTextColor={isDark ? '#aabbb3' : '#56645e'}
            secureTextEntry
            editable={!isSubmitting}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
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
          style={[styles.infoText, { color: isDark ? '#bccac2' : '#56645e' }]}
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
          accessibilityLabel="Confirmar mudanca de e-mail"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
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
          accessibilityLabel="Voltar para privacidade"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={onBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
            isSubmitting && styles.secondaryButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.secondaryText,
              { color: isDark ? '#bccac2' : '#56645e' },
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
    backgroundColor: '#527B5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.68,
  },
  primaryButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
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
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    marginTop: 12,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
});

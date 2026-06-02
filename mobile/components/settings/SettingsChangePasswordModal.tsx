import { MaterialIcons } from '@expo/vector-icons';
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
import type { ChangePasswordFieldErrors } from '../../types/settings';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeConfirmNewPassword: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  fieldErrors?: ChangePasswordFieldErrors;
};

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  const hasNumberOrSymbol = /[\d\W_]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  if (
    password.length >= 12 &&
    hasNumberOrSymbol &&
    hasLowercase &&
    hasUppercase
  ) {
    return 'strong';
  }

  if (password.length >= 8 && hasNumberOrSymbol) {
    return 'medium';
  }

  return 'weak';
}

function getPasswordStrengthLabel(strength: PasswordStrength): string {
  if (strength === 'strong') {
    return 'FORTE';
  }

  if (strength === 'medium') {
    return 'MEDIA';
  }

  return 'FRACA';
}

export default function SettingsChangePasswordModal({
  visible,
  currentPassword,
  newPassword,
  confirmNewPassword,
  onChangeCurrentPassword,
  onChangeNewPassword,
  onChangeConfirmNewPassword,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage = null,
  fieldErrors = {},
}: Props) {
  const { isDark } = useTheme();
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] =
    React.useState(false);
  const newPasswordRef = React.useRef<TextInput>(null);
  const confirmNewPasswordRef = React.useRef<TextInput>(null);
  const passwordStrength = getPasswordStrength(newPassword);
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordStrength);
  const inputColors = {
    backgroundColor: isDark ? '#232323' : '#eaefea',
    color: isDark ? '#f5fbf6' : '#171d1a',
  };
  const iconColor = isDark ? '#bccac2' : '#56645e';

  function renderPasswordField({
    testID,
    value,
    onChangeText,
    placeholder,
    visiblePassword,
    onToggleVisibility,
    inputRef,
    returnKeyType,
    onSubmitEditing,
  }: {
    testID: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    visiblePassword: boolean;
    onToggleVisibility: () => void;
    inputRef?: React.RefObject<TextInput | null>;
    returnKeyType: 'next' | 'done';
    onSubmitEditing: () => void;
  }) {
    return (
      <View style={[styles.inputRow, { backgroundColor: inputColors.backgroundColor }]}>
        <TextInput
          testID={testID}
          ref={inputRef}
          accessibilityLabel={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={[styles.input, { color: inputColors.color }]}
          placeholderTextColor={isDark ? '#aabbb3' : '#56645e'}
          secureTextEntry={!visiblePassword}
          editable={!isSubmitting}
          returnKeyType={returnKeyType}
          blurOnSubmit={returnKeyType === 'done'}
          onSubmitEditing={onSubmitEditing}
        />

        <Pressable
          testID={`${testID}-visibility-toggle`}
          accessibilityLabel={
            `${visiblePassword ? 'Esconder' : 'Mostrar'} ${placeholder.toLowerCase()}`
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={onToggleVisibility}
          style={styles.visibilityButton}
        >
          <MaterialIcons
            name={visiblePassword ? 'visibility-off' : 'visibility'}
            size={20}
            color={iconColor}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <SettingsModalShell visible={visible} onClose={onCancel} title="Nova senha">
      <View>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          NOVA SENHA
        </Text>

        <View style={styles.fields}>
          {renderPasswordField({
            testID: 'settings-change-password-current-input',
            value: currentPassword,
            onChangeText: onChangeCurrentPassword,
            placeholder: 'Senha Atual',
            visiblePassword: showCurrentPassword,
            onToggleVisibility: () =>
              setShowCurrentPassword((current) => !current),
            returnKeyType: 'next',
            onSubmitEditing: () => newPasswordRef.current?.focus(),
          })}
          {fieldErrors.currentPassword ? (
            <Text
              testID="settings-change-password-current-error"
              style={styles.fieldErrorText}
            >
              {fieldErrors.currentPassword}
            </Text>
          ) : null}

          {renderPasswordField({
            testID: 'settings-change-password-new-input',
            value: newPassword,
            onChangeText: onChangeNewPassword,
            placeholder: 'Nova Senha',
            visiblePassword: showNewPassword,
            onToggleVisibility: () => setShowNewPassword((current) => !current),
            inputRef: newPasswordRef,
            returnKeyType: 'next',
            onSubmitEditing: () => confirmNewPasswordRef.current?.focus(),
          })}
          {fieldErrors.newPassword ? (
            <Text
              testID="settings-change-password-new-error"
              style={styles.fieldErrorText}
            >
              {fieldErrors.newPassword}
            </Text>
          ) : null}

          {newPassword ? (
            <View
              testID="settings-change-password-strength"
              style={styles.strengthWrap}
            >
              <View style={styles.strengthHeader}>
                <Text
                  style={[
                    styles.strengthText,
                    { color: isDark ? '#bccac2' : '#56645e' },
                  ]}
                >
                  FORCA DA SENHA
                </Text>
                <Text
                  testID="settings-change-password-strength-label"
                  style={[
                    styles.strengthValue,
                    passwordStrength === 'weak' && styles.strengthWeak,
                    passwordStrength === 'medium' && styles.strengthMedium,
                    passwordStrength === 'strong' && styles.strengthStrong,
                  ]}
                >
                  {passwordStrengthLabel}
                </Text>
              </View>

              <View style={styles.strengthBars}>
                {[0, 1, 2].map((index) => {
                  const activeBars =
                    passwordStrength === 'strong'
                      ? 3
                      : passwordStrength === 'medium'
                        ? 2
                        : 1;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor: isDark ? '#333735' : '#d7ddd9',
                        },
                        index < activeBars &&
                          passwordStrength === 'weak' &&
                          styles.strengthBarWeak,
                        index < activeBars &&
                          passwordStrength === 'medium' &&
                          styles.strengthBarMedium,
                        index < activeBars &&
                          passwordStrength === 'strong' &&
                          styles.strengthBarStrong,
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}

          {renderPasswordField({
            testID: 'settings-change-password-confirm-input',
            value: confirmNewPassword,
            onChangeText: onChangeConfirmNewPassword,
            placeholder: 'Confirme a nova senha',
            visiblePassword: showConfirmNewPassword,
            onToggleVisibility: () =>
              setShowConfirmNewPassword((current) => !current),
            inputRef: confirmNewPasswordRef,
            returnKeyType: 'done',
            onSubmitEditing: onSubmit,
          })}
          {fieldErrors.confirmNewPassword ? (
            <Text
              testID="settings-change-password-confirm-error"
              style={styles.fieldErrorText}
            >
              {fieldErrors.confirmNewPassword}
            </Text>
          ) : null}
        </View>

        {errorMessage ? (
          <Text testID="settings-change-password-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Atualizar senha"
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
              testID="settings-change-password-loading"
              color="#ffffff"
            />
          ) : (
            <Text style={styles.primaryText}>ATUALIZAR SENHA</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Cancelar alteracao de senha"
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
          <Text
            style={[
              styles.secondaryText,
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
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
  },
  fields: {
    gap: 12,
  },
  inputRow: {
    minHeight: 52,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: '700',
  },
  visibilityButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldErrorText: {
    marginTop: -6,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  strengthWrap: {
    gap: 7,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '900',
  },
  strengthValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  strengthWeak: {
    color: '#D70015',
  },
  strengthMedium: {
    color: '#D97706',
  },
  strengthStrong: {
    color: '#059669',
  },
  strengthBarWeak: {
    backgroundColor: '#D70015',
  },
  strengthBarMedium: {
    backgroundColor: '#D97706',
  },
  strengthBarStrong: {
    backgroundColor: '#059669',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#426A4B',
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

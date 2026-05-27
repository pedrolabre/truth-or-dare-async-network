import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { useRecoveryFlowContext } from '../context/RecoveryFlowContext';
import { getAuthRecoveryColors } from '../constants/authRecoveryTheme';
import RecoveryScreenContainer from '../components/auth-recovery/RecoveryScreenContainer';
import RecoveryIllustrationCard from '../components/auth-recovery/RecoveryIllustrationCard';
import RecoveryTextField from '../components/auth-recovery/RecoveryTextField';
import RecoveryPrimaryButton from '../components/auth-recovery/RecoveryPrimaryButton';
import RecoverySecondaryLink from '../components/auth-recovery/RecoverySecondaryLink';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const recoveryFlow = useRecoveryFlowContext();
  const didRedirectRef = useRef(false);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const colors = getAuthRecoveryColors(isDark);

  useEffect(() => {
    if (recoveryFlow.canAccessNewPasswordStep || didRedirectRef.current) {
      return;
    }

    didRedirectRef.current = true;
    recoveryFlow.handleRecoverySessionExpired();
    router.replace('/forgot-password');
  }, [recoveryFlow, router]);

  const validations = useMemo(() => {
    const trimmed = recoveryFlow.newPassword.trim();

    return {
      minLength: trimmed.length >= 8,
      hasUppercase: /[A-Z]/.test(trimmed),
      hasNumber: /\d/.test(trimmed),
      passwordsMatch:
        trimmed.length > 0 &&
        recoveryFlow.confirmPassword.trim().length > 0 &&
        trimmed === recoveryFlow.confirmPassword.trim(),
    };
  }, [recoveryFlow.confirmPassword, recoveryFlow.newPassword]);

  const canSubmit = recoveryFlow.canResetPassword;
  const formErrorMessage =
    recoveryFlow.errorCode === 'PASSWORD_TOO_WEAK' ||
    recoveryFlow.errorCode === 'VALIDATION_ERROR'
      ? null
      : recoveryFlow.errorMessage;

  async function handleResetPassword() {
    if (!canSubmit) {
      return;
    }

    const reset = await recoveryFlow.handleResetPassword();

    if (reset) {
      router.replace('/password-success');
    }
  }

  function handlePasswordChange(value: string) {
    recoveryFlow.setNewPassword(value);

    if (recoveryFlow.errorMessage) {
      recoveryFlow.clearError();
    }
  }

  function handleConfirmPasswordChange(value: string) {
    recoveryFlow.setConfirmPassword(value);

    if (recoveryFlow.errorMessage) {
      recoveryFlow.clearError();
    }
  }

  return (
    <RecoveryScreenContainer backgroundColor={colors.background}>
      <View style={styles.topSection}>
        <RecoveryIllustrationCard
          icon="vpn-key"
          title="NOVA SENHA"
          subtitle="Crie uma senha forte e segura para proteger sua conta no Truth or Dare."
          colors={colors}
        />

        <View style={styles.formSection}>
          <RecoveryTextField
            label="Nova senha"
            value={recoveryFlow.newPassword}
            onChangeText={handlePasswordChange}
            colors={colors}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!recoveryFlow.isResettingPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            showPasswordToggle
            passwordToggleTestID="new-password-visibility-toggle"
            errorMessage={
              recoveryFlow.passwordErrorMessage ??
              (recoveryFlow.errorCode === 'PASSWORD_TOO_WEAK'
                ? recoveryFlow.errorMessage
                : null)
            }
          />

          <RecoveryTextField
            label="Confirmar senha"
            value={recoveryFlow.confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            colors={colors}
            ref={confirmPasswordInputRef}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!recoveryFlow.isResettingPassword}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
            showPasswordToggle
            passwordToggleTestID="confirm-password-visibility-toggle"
            errorMessage={
              recoveryFlow.confirmPasswordErrorMessage ??
              (recoveryFlow.errorCode === 'VALIDATION_ERROR'
                ? recoveryFlow.errorMessage
                : null)
            }
          />

          <View
            style={[
              styles.requirementsCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <RequirementRow
              label="Mínimo 8 caracteres"
              active={validations.minLength}
              colors={colors}
            />
            <RequirementRow
              label="Uma letra maiúscula"
              active={validations.hasUppercase}
              colors={colors}
            />
            <RequirementRow
              label="Um número"
              active={validations.hasNumber}
              colors={colors}
            />
            <RequirementRow
              label="As senhas coincidem"
              active={validations.passwordsMatch}
              colors={colors}
            />
          </View>

          {formErrorMessage ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {formErrorMessage}
            </Text>
          ) : null}

          <RecoveryPrimaryButton
            label="REDEFINIR SENHA"
            onPress={handleResetPassword}
            disabled={!canSubmit}
            loading={recoveryFlow.isResettingPassword}
            backgroundColor={colors.primary}
            textColor={colors.white}
            testID="reset-password-submit-button"
          />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <RecoverySecondaryLink
          label="Cancelar"
          onPress={() => {
            recoveryFlow.resetFlow();
            router.replace('/forgot-password');
          }}
          color={colors.textSoft}
        />
      </View>
    </RecoveryScreenContainer>
  );
}

type RequirementRowProps = {
  label: string;
  active: boolean;
  colors: ReturnType<typeof getAuthRecoveryColors>;
};

function RequirementRow({ label, active, colors }: RequirementRowProps) {
  return (
    <View style={styles.requirementRow}>
      <View
        style={[
          styles.requirementDot,
          {
            backgroundColor: active ? colors.primary : 'transparent',
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      />
      <Text
        style={[
          styles.requirementText,
          { color: active ? colors.text : colors.textSoft },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  formSection: {
    gap: 18,
  },
  requirementsCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    marginTop: 2,
    marginBottom: 2,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementDot: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 999,
  },
  requirementText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: 6,
    alignItems: 'center',
  },
});

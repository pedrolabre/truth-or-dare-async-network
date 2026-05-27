import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { useRecoveryFlowContext } from '../context/RecoveryFlowContext';
import { getAuthRecoveryColors } from '../constants/authRecoveryTheme';
import RecoveryScreenContainer from '../components/auth-recovery/RecoveryScreenContainer';
import RecoveryIllustrationCard from '../components/auth-recovery/RecoveryIllustrationCard';
import VerificationCodeBoxes from '../components/auth-recovery/VerificationCodeBoxes';
import RecoveryPrimaryButton from '../components/auth-recovery/RecoveryPrimaryButton';
import RecoverySecondaryLink from '../components/auth-recovery/RecoverySecondaryLink';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const recoveryFlow = useRecoveryFlowContext();
  const didRedirectRef = useRef(false);
  const colors = getAuthRecoveryColors(isDark);

  useEffect(() => {
    if (recoveryFlow.canAccessCodeStep || didRedirectRef.current) {
      return;
    }

    didRedirectRef.current = true;
    recoveryFlow.resetFlow();
    router.replace('/forgot-password');
  }, [recoveryFlow, router]);

  const maskedEmail = useMemo(() => {
    const rawEmail = recoveryFlow.email.trim();

    if (!rawEmail.includes('@')) {
      return 'seu e-mail';
    }

    const [name, domain] = rawEmail.split('@');
    const visibleStart = name.slice(0, 2);
    const hidden = '*'.repeat(Math.max(name.length - 2, 0));

    return `${visibleStart}${hidden}@${domain}`;
  }, [recoveryFlow.email]);

  const canSubmit = recoveryFlow.canVerifyCode;
  const canResend = recoveryFlow.canResendCode;

  async function handleVerifyCode() {
    if (!canSubmit) {
      return;
    }

    const verified = await recoveryFlow.handleVerifyCode();

    if (verified) {
      router.push('/reset-password');
    }
  }

  async function handleResendNow() {
    if (!canResend) {
      return;
    }

    await recoveryFlow.handleResendCode();
  }

  function handleCodeChange(value: string) {
    recoveryFlow.setCode(value);

    if (recoveryFlow.errorMessage) {
      recoveryFlow.clearError();
    }
  }

  function handleCodeSubmitEditing() {
    void handleVerifyCode();
  }

  const codeHasError = Boolean(
    recoveryFlow.codeErrorMessage || recoveryFlow.errorMessage,
  );

  return (
    <RecoveryScreenContainer backgroundColor={colors.background}>
      <View style={styles.topSection}>
        <RecoveryIllustrationCard
          icon="mail"
          title="CONFIRME SEU ACESSO"
          subtitle={`Enviamos um código de 6 dígitos para ${maskedEmail}. Insira-o abaixo para continuar.`}
          colors={colors}
        />

        <View style={styles.formSection}>
          <VerificationCodeBoxes
            value={recoveryFlow.code}
            onChange={handleCodeChange}
            colors={colors}
            hasError={codeHasError}
            disabled={recoveryFlow.isLoading}
            autoFocus
            onSubmitEditing={handleCodeSubmitEditing}
          />

          {recoveryFlow.codeErrorMessage || recoveryFlow.errorMessage ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {recoveryFlow.codeErrorMessage ?? recoveryFlow.errorMessage}
            </Text>
          ) : null}

          <RecoveryPrimaryButton
            label="VERIFICAR"
            onPress={handleVerifyCode}
            disabled={!canSubmit}
            loading={recoveryFlow.isVerifyingCode}
            backgroundColor={colors.primary}
            textColor={colors.white}
            testID="verify-code-submit-button"
          />

          <View
            style={[
              styles.timerPill,
              {
                backgroundColor: colors.timerBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.timerText, { color: colors.textSoft }]}>
              {canResend
                ? 'VOCÊ JÁ PODE REENVIAR'
                : `REENVIAR EM 00:${String(
                    recoveryFlow.resendSecondsLeft,
                  ).padStart(2, '0')}`}
            </Text>
          </View>

          <RecoverySecondaryLink
            label="Reenviar agora"
            onPress={handleResendNow}
            color={canResend ? colors.primary : colors.textSoft}
          />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <RecoverySecondaryLink
          label="Voltar para o login"
          onPress={() => {
            recoveryFlow.resetFlow();
            router.replace('/login');
          }}
          color={colors.text}
        />
      </View>
    </RecoveryScreenContainer>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  formSection: {
    gap: 18,
    alignItems: 'center',
  },
  timerPill: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  errorText: {
    alignSelf: 'stretch',
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

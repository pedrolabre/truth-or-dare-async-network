import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { useRecoveryFlowContext } from '../context/RecoveryFlowContext';
import { getAuthRecoveryColors } from '../constants/authRecoveryTheme';
import RecoveryScreenContainer from '../components/auth-recovery/RecoveryScreenContainer';
import RecoveryIllustrationCard from '../components/auth-recovery/RecoveryIllustrationCard';
import RecoveryTextField from '../components/auth-recovery/RecoveryTextField';
import RecoveryPrimaryButton from '../components/auth-recovery/RecoveryPrimaryButton';
import RecoverySecondaryLink from '../components/auth-recovery/RecoverySecondaryLink';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const recoveryFlow = useRecoveryFlowContext();
  const colors = getAuthRecoveryColors(isDark);

  async function handleSendCode() {
    if (!recoveryFlow.canSendCode) {
      return;
    }

    const sent = await recoveryFlow.handleSendCode();

    if (sent) {
      router.push('/verify-code');
    }
  }

  function handleEmailChange(value: string) {
    recoveryFlow.setEmail(value);

    if (recoveryFlow.errorMessage) {
      recoveryFlow.clearError();
    }
  }

  return (
    <RecoveryScreenContainer backgroundColor={colors.background}>
      <View style={styles.topSection}>
        <RecoveryIllustrationCard
          icon="lock-reset"
          title="RECUPERAR ACESSO"
          subtitle="Digite seu e-mail cadastrado para receber o código de verificação."
          colors={colors}
        />

        <View style={styles.formSection}>
          <RecoveryTextField
            label="Endereço de e-mail"
            value={recoveryFlow.email}
            onChangeText={handleEmailChange}
            colors={colors}
            placeholder="Seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            editable={!recoveryFlow.isSendingCode}
            returnKeyType="send"
            onSubmitEditing={handleSendCode}
            errorMessage={
              recoveryFlow.emailErrorMessage ?? recoveryFlow.errorMessage
            }
          />

          <RecoveryPrimaryButton
            label="ENVIAR CÓDIGO"
            onPress={handleSendCode}
            disabled={!recoveryFlow.canSendCode}
            loading={recoveryFlow.isSendingCode}
            backgroundColor={colors.primary}
            textColor={colors.white}
            testID="forgot-password-send-code-button"
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
  },
  bottomSection: {
    paddingBottom: 6,
    alignItems: 'center',
  },
});

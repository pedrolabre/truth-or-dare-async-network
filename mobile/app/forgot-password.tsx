import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { getAuthRecoveryColors } from '../constants/authRecoveryTheme';
import RecoveryScreenContainer from '../components/auth-recovery/RecoveryScreenContainer';
import RecoveryIllustrationCard from '../components/auth-recovery/RecoveryIllustrationCard';
import RecoveryTextField from '../components/auth-recovery/RecoveryTextField';
import RecoveryPrimaryButton from '../components/auth-recovery/RecoveryPrimaryButton';
import RecoverySecondaryLink from '../components/auth-recovery/RecoverySecondaryLink';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getAuthRecoveryColors(isDark);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0;
  }, [email]);

  async function handleSendCode() {
    if (!canSubmit || loading) {
      return;
    }

    try {
      setLoading(true);

      // Backend futuro:
      // await requestPasswordResetCode({ email });

      router.push({
        pathname: '/verify-code',
        params: { email: email.trim() },
      });
    } finally {
      setLoading(false);
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
            value={email}
            onChangeText={setEmail}
            colors={colors}
            placeholder="Seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <RecoveryPrimaryButton
            label="ENVIAR CÓDIGO"
            onPress={handleSendCode}
            disabled={!canSubmit}
            loading={loading}
            backgroundColor={colors.primary}
            textColor={colors.white}
          />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <RecoverySecondaryLink
          label="Voltar para o login"
          onPress={() => router.replace('/login')}
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
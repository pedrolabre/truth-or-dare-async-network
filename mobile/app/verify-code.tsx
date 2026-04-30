import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { getAuthRecoveryColors } from '../constants/authRecoveryTheme';
import RecoveryScreenContainer from '../components/auth-recovery/RecoveryScreenContainer';
import RecoveryIllustrationCard from '../components/auth-recovery/RecoveryIllustrationCard';
import VerificationCodeBoxes from '../components/auth-recovery/VerificationCodeBoxes';
import RecoveryPrimaryButton from '../components/auth-recovery/RecoveryPrimaryButton';
import RecoverySecondaryLink from '../components/auth-recovery/RecoverySecondaryLink';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { isDark } = useTheme();
  const colors = getAuthRecoveryColors(isDark);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(59);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const maskedEmail = useMemo(() => {
    const rawEmail = String(params.email || '').trim();

    if (!rawEmail.includes('@')) {
      return 'seu e-mail';
    }

    const [name, domain] = rawEmail.split('@');
    const visibleStart = name.slice(0, 2);
    const hidden = '*'.repeat(Math.max(name.length - 2, 0));

    return `${visibleStart}${hidden}@${domain}`;
  }, [params.email]);

  const canSubmit = code.length === 6;
  const canResend = secondsLeft === 0;

  async function handleVerifyCode() {
    if (!canSubmit || loading) {
      return;
    }

    try {
      setLoading(true);

      // Backend futuro:
      // await verifyPasswordResetCode({ email: params.email, code });

      router.push({
        pathname: '/reset-password',
        params: {
          email: String(params.email || ''),
          code,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  function handleResendNow() {
    if (!canResend) {
      return;
    }

    // Backend futuro:
    // await resendPasswordResetCode({ email: params.email });

    setSecondsLeft(59);
    setCode('');
  }

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
            value={code}
            onChange={setCode}
            colors={colors}
          />

          <RecoveryPrimaryButton
            label="VERIFICAR"
            onPress={handleVerifyCode}
            disabled={!canSubmit}
            loading={loading}
            backgroundColor={colors.primary}
            textColor={colors.white}
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
                : `REENVIAR EM 00:${String(secondsLeft).padStart(2, '0')}`}
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
  bottomSection: {
    paddingBottom: 6,
    alignItems: 'center',
  },
});
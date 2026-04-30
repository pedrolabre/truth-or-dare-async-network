import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { getAuthRecoveryColors } from '../constants/authRecoveryTheme';
import RecoveryScreenContainer from '../components/auth-recovery/RecoveryScreenContainer';
import RecoveryIllustrationCard from '../components/auth-recovery/RecoveryIllustrationCard';
import RecoveryTextField from '../components/auth-recovery/RecoveryTextField';
import RecoveryPrimaryButton from '../components/auth-recovery/RecoveryPrimaryButton';
import RecoverySecondaryLink from '../components/auth-recovery/RecoverySecondaryLink';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const { isDark } = useTheme();
  const colors = getAuthRecoveryColors(isDark);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validations = useMemo(() => {
    const trimmed = password.trim();

    return {
      minLength: trimmed.length >= 8,
      hasUppercase: /[A-ZÀ-Ú]/.test(trimmed),
      hasNumber: /\d/.test(trimmed),
      passwordsMatch:
        trimmed.length > 0 &&
        confirmPassword.trim().length > 0 &&
        trimmed === confirmPassword.trim(),
    };
  }, [password, confirmPassword]);

  const canSubmit =
    validations.minLength &&
    validations.hasUppercase &&
    validations.hasNumber &&
    validations.passwordsMatch;

  async function handleResetPassword() {
    if (!canSubmit || loading) {
      return;
    }

    try {
      setLoading(true);

      // Backend futuro:
      // await resetPassword({
      //   email: String(params.email || ''),
      //   code: String(params.code || ''),
      //   newPassword: password.trim(),
      // });

      router.replace('/password-success');
    } finally {
      setLoading(false);
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
            value={password}
            onChangeText={setPassword}
            colors={colors}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <RecoveryTextField
            label="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            colors={colors}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
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

          <RecoveryPrimaryButton
            label="REDEFINIR SENHA"
            onPress={handleResetPassword}
            disabled={!canSubmit}
            loading={loading}
            backgroundColor={colors.primary}
            textColor={colors.white}
          />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <RecoverySecondaryLink
          label="Cancelar"
          onPress={() =>
            router.replace({
              pathname: '/verify-code',
              params: {
                email: String(params.email || ''),
              },
            })
          }
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
  bottomSection: {
    paddingBottom: 6,
    alignItems: 'center',
  },
});
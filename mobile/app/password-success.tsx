import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { getAuthRecoveryColors } from '../constants/authRecoveryTheme';
import RecoveryScreenContainer from '../components/auth-recovery/RecoveryScreenContainer';
import RecoveryIllustrationCard from '../components/auth-recovery/RecoveryIllustrationCard';
import RecoveryPrimaryButton from '../components/auth-recovery/RecoveryPrimaryButton';

export default function PasswordSuccessScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getAuthRecoveryColors(isDark);

  return (
    <RecoveryScreenContainer backgroundColor={colors.background}>
      <View style={styles.content}>
        <RecoveryIllustrationCard
          icon="lock-reset"
          title="SENHA ALTERADA!"
          subtitle="Sua senha foi redefinida com sucesso. Agora você já pode acessar sua conta novamente."
          colors={colors}
        />

        <RecoveryPrimaryButton
          label="IR PARA O LOGIN"
          onPress={() => router.replace('/login')}
          backgroundColor={colors.successAccent}
          textColor={colors.white}
        />

        <View style={styles.decorativeRow}>
          <View
            style={[
              styles.decorativeBar,
              { backgroundColor: colors.textSoft },
            ]}
          />
          <View
            style={[
              styles.decorativeBar,
              { backgroundColor: colors.successAccent },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSoft }]}>
          Truth or Dare
        </Text>
      </View>
    </RecoveryScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  decorativeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  decorativeBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  footer: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
});
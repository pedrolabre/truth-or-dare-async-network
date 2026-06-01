import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  email: string;
  password: string;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export default function SettingsChangeEmailModal({
  visible,
  email,
  password,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onBack,
  isSubmitting = false,
  errorMessage = null,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <SettingsModalShell visible={visible} onClose={onBack}>
      <View>
        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          NOVO E-MAIL
        </Text>

        <View style={styles.fields}>
          <TextInput
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

          <TextInput
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
        </View>

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

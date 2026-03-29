import { signup } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginLogo from '../components/LoginLogo';

const LIGHT_COLORS = {
  surfaceBright: '#f5fbf6',
  onSurface: '#171d1a',
  onSurfaceVariant: '#3d4944',
  surfaceContainerHigh: '#e4eae5',
  surfaceContainer: '#eaefea',
  outline: '#6d7a74',
  outlineVariant: '#bccac2',
  primary: '#006950',
  secondary: '#3e6657',
  tertiary: '#D70015',
  onTertiary: '#ffffff',
  primaryContainer: '#008466',
  secondaryContainer: '#c0ecd9',
  tertiaryFixed: '#ffdad6',
};

const DARK_COLORS = {
  surfaceBright: '#121212',
  onSurface: '#f5fbf6',
  onSurfaceVariant: '#bccac2',
  surfaceContainerHigh: '#232926',
  surfaceContainer: '#1c211f',
  outline: '#8f9993',
  outlineVariant: '#3d4944',
  primary: '#7fd6b4',
  secondary: '#9dcfb9',
  tertiary: '#E11D2E',
  onTertiary: '#ffffff',
  primaryContainer: '#1e5c4a',
  secondaryContainer: '#29463b',
  tertiaryFixed: '#4a1218',
};

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      acceptedTerms
    );
  }, [fullName, email, password, acceptedTerms]);

  async function handleSignup() {
    try {
      setLoading(true);

      const data = await signup({
        name: fullName,
        email,
        password,
      });

      console.log('Usuário criado:', data);

    } catch (error: any) {
      const message = error?.message || 'Não foi possível criar a conta.';
      console.error(message);
      Alert.alert('Erro no cadastro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.surfaceBright }]}>
      <View pointerEvents="none" style={[styles.bg, { opacity: isDark ? 0.12 : 0.2 }]}>
        <View
          style={[
            styles.blurBlob,
            styles.blurTopLeft,
            { backgroundColor: COLORS.primaryContainer },
          ]}
        />
        <View
          style={[
            styles.blurBlob,
            styles.blurRight,
            { backgroundColor: COLORS.secondaryContainer },
          ]}
        />
        <View
          style={[
            styles.blurBlob,
            styles.blurBottom,
            { backgroundColor: COLORS.tertiaryFixed },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.brandSection}>
              <LoginLogo size={76} dark={isDark} />

              <Text style={[styles.title, { color: COLORS.onSurface }]}>
                CRIAR CONTA
              </Text>
              <Text style={[styles.subtitle, { color: COLORS.secondary }]}>
                ENTRE NA ARENA ASSÍNCRONA
              </Text>
            </View>

            <View style={styles.form}>
              <View
                style={[
                  styles.inputGroup,
                  { backgroundColor: COLORS.surfaceContainerHigh },
                ]}
              >
                <View style={styles.leadingIcon}>
                  <MaterialIcons name="person" size={22} color={COLORS.outline} />
                </View>

                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nome completo"
                  placeholderTextColor={
                    isDark ? 'rgba(143,153,147,0.7)' : 'rgba(109,122,116,0.6)'
                  }
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[styles.input, { color: COLORS.onSurface }]}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  { backgroundColor: COLORS.surfaceContainerHigh },
                ]}
              >
                <View style={styles.leadingIcon}>
                  <MaterialIcons name="mail" size={22} color={COLORS.outline} />
                </View>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nome@exemplo.com"
                  placeholderTextColor={
                    isDark ? 'rgba(143,153,147,0.7)' : 'rgba(109,122,116,0.6)'
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: COLORS.onSurface }]}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  { backgroundColor: COLORS.surfaceContainerHigh },
                ]}
              >
                <View style={styles.leadingIcon}>
                  <MaterialIcons name="lock" size={22} color={COLORS.outline} />
                </View>

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Senha"
                  placeholderTextColor={
                    isDark ? 'rgba(143,153,147,0.7)' : 'rgba(109,122,116,0.6)'
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput, { color: COLORS.onSurface }]}
                />

                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={10}
                  style={styles.trailingIcon}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color={COLORS.outline}
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={() => setAcceptedTerms((prev) => !prev)}
                style={styles.termsRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: acceptedTerms ? COLORS.primary : COLORS.outlineVariant,
                      backgroundColor: acceptedTerms
                        ? COLORS.primary
                        : COLORS.surfaceContainer,
                    },
                  ]}
                >
                  {acceptedTerms ? (
                    <MaterialIcons name="check" size={16} color="#ffffff" />
                  ) : null}
                </View>

                <Text style={[styles.termsText, { color: COLORS.onSurfaceVariant }]}>
                  Eu concordo com os{' '}
                  <Text style={[styles.termsLink, { color: COLORS.primary }]}>
                    Termos & Condições
                  </Text>{' '}
                  e a{' '}
                  <Text style={[styles.termsLink, { color: COLORS.primary }]}>
                    Política de Privacidade
                  </Text>
                  .
                </Text>
              </Pressable>

              <Pressable
                testID="signup-button"
                disabled={!canSubmit || loading}
                onPress={handleSignup}
                style={({ pressed }) => [
                  styles.signupButton,
                  { backgroundColor: COLORS.tertiary },
                  (!canSubmit || loading) && styles.signupButtonDisabled,
                  pressed && canSubmit && !loading && styles.signupButtonPressed,
                ]}
              >
                <Text style={[styles.signupButtonText, { color: COLORS.onTertiary }]}>
                  {loading ? 'CRIANDO...' : 'COMEÇAR A JOGAR'}
                </Text>
                <MaterialIcons
                  name="play-arrow"
                  size={24}
                  color={COLORS.onTertiary}
                />
              </Pressable>
            </View>

            <View style={styles.dividerWrap}>
              <View
                style={[styles.dividerLine, { backgroundColor: COLORS.outlineVariant }]}
              />
              <View
                style={[styles.dividerLine, { backgroundColor: COLORS.outlineVariant }]}
              />
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: COLORS.onSurfaceVariant }]}>
                Já tem uma conta?
              </Text>

              <Link href="/login" asChild>
                <Pressable hitSlop={8}>
                  <Text style={[styles.footerLink, { color: COLORS.primary }]}>
                    Entrar
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blurTopLeft: {
    top: -90,
    left: -90,
    width: 320,
    height: 320,
  },
  blurRight: {
    top: '42%',
    right: -90,
    width: 250,
    height: 250,
  },
  blurBottom: {
    bottom: -110,
    left: '18%',
    width: 380,
    height: 380,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 2.8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputGroup: {
    minHeight: 56,
    borderRadius: 12,
    justifyContent: 'center',
  },
  leadingIcon: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  trailingIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  input: {
    height: 56,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 48,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  termsLink: {
    fontWeight: '700',
  },
  signupButton: {
    marginTop: 8,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D70015',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  signupButtonDisabled: {
    opacity: 0.55,
  },
  signupButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  signupButtonText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 36,
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '800',
  },
});
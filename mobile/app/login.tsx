import { login, saveToken } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Pressable,
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

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0;
  }, [email, password]);

  async function handleLogin() {
    try {
      setLoading(true);

      const data = await login({
  email,
  password,
});

console.log('Usuário autenticado:', data);

await saveToken(data.token);

console.log('Vai navegar para /feed');
router.replace('/feed');
      
    } catch (error: any) {
      const message = error?.message || 'Não foi possível fazer login.';
      console.error(message);
      Alert.alert('Erro no login', message);
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

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
       <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.brandSection}>
            <LoginLogo size={80} dark={isDark} />

            <Text style={[styles.title, { color: COLORS.onSurface }]}>
              TRUTH OR DARE
            </Text>
            <Text style={[styles.subtitle, { color: COLORS.secondary }]}>
              ARENA ASSÍNCRONA
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
                <MaterialIcons name="mail" size={22} color={COLORS.outline} />
              </View>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                placeholderTextColor={isDark ? 'rgba(143,153,147,0.7)' : 'rgba(109,122,116,0.6)'}
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
                placeholderTextColor={isDark ? 'rgba(143,153,147,0.7)' : 'rgba(109,122,116,0.6)'}
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

            <View style={styles.forgotRow}>
              <Pressable>
                <Text style={[styles.forgotText, { color: COLORS.secondary }]}>
                  Esqueceu a senha?
                </Text>
              </Pressable>
            </View>

            <Pressable
              disabled={!canSubmit || loading}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                { backgroundColor: COLORS.tertiary },
                (!canSubmit || loading) && styles.loginButtonDisabled,
                pressed && canSubmit && !loading && styles.loginButtonPressed,
              ]}
            >
              <Text style={[styles.loginButtonText, { color: COLORS.onTertiary }]}>
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </Text>
              <MaterialIcons
                name="arrow-forward"
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
              Não tem uma conta?
            </Text>

            <Link href="/signup-screen" asChild>
              <Pressable hitSlop={8}>
                <Text style={[styles.footerLink, { color: COLORS.primary }]}>
                  Criar conta
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
     </TouchableWithoutFeedback>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    top: '46%',
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
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 3,
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
  forgotRow: {
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
    marginBottom: 44,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footerLink: {
    fontWeight: '700',
  },
});
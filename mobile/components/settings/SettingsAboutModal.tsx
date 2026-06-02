import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { AppInfo } from '../../types/settings';
import SettingsModalShell from './SettingsModalShell';

const TERMS_OF_USE_URL = 'https://truthordare.app/termos-de-uso';
const PRIVACY_POLICY_URL = 'https://truthordare.app/politica-de-privacidade';

type Props = {
  visible: boolean;
  onClose: () => void;
  appInfo?: AppInfo | null;
  isLoadingAppInfo?: boolean;
  appInfoError?: string | null;
};

export default function SettingsAboutModal({
  visible,
  onClose,
  appInfo,
  isLoadingAppInfo = false,
  appInfoError = null,
}: Props) {
  const { isDark } = useTheme();
  const manifestVersion =
    (Constants.manifest as { version?: string } | null)?.version ?? null;
  const appVersion =
    Constants.expoConfig?.version ?? manifestVersion ?? 'indisponivel';
  const infoTextColor = isDark ? '#bccac2' : '#171d1a';
  const accentColor = isDark ? '#8ABF96' : '#426A4B';

  function openUrl(url: string) {
    void Linking.openURL(url);
  }

  return (
    <SettingsModalShell visible={visible} onClose={onClose} title="Sobre o App">
      <View style={styles.center}>
        <View style={[styles.iconBox, { backgroundColor: '#426A4B' }]}>
          <MaterialIcons name="style" size={34} color="#ffffff" />
        </View>

        <Text style={[styles.title, { color: isDark ? '#f5fbf6' : '#171d1a' }]}>
          TRUTH OR DARE
        </Text>

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <Text style={[styles.infoItem, { color: infoTextColor }]}>
            Versao do app: {appVersion}
          </Text>
          <Text style={[styles.infoItem, { color: infoTextColor }]}>
            Versao da API: {appInfo?.apiVersion ?? 'indisponivel'}
          </Text>
          <Text style={[styles.infoItem, { color: infoTextColor }]}>
            Status da API:{' '}
            {isLoadingAppInfo ? 'carregando' : appInfo?.status ?? 'indisponivel'}
          </Text>
          <Text style={[styles.infoItem, { color: infoTextColor }]}>
            Ambiente da API: {appInfo?.environment ?? 'indisponivel'}
          </Text>

          {appInfoError ? (
            <Text
              style={[styles.infoItem, styles.errorText]}
              testID="settings-about-api-error"
            >
              {appInfoError}
            </Text>
          ) : null}

          <View style={styles.linksRow}>
            <Pressable
              accessibilityLabel="Abrir Termos de Uso"
              onPress={() => openUrl(TERMS_OF_USE_URL)}
              accessibilityRole="link"
            >
              <Text style={[styles.linkText, { color: accentColor }]}>Termos de Uso</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Abrir Politica de Privacidade"
              onPress={() => openUrl(PRIVACY_POLICY_URL)}
              accessibilityRole="link"
            >
              <Text style={[styles.linkText, { color: accentColor }]}>
                Politica de Privacidade
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Fechar Sobre o App"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Text style={[styles.closeText, { color: accentColor }]}>FECHAR</Text>
        </Pressable>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  infoBox: {
    width: '100%',
    marginTop: 20,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  infoItem: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorText: {
    color: '#D70015',
  },
  linksRow: {
    marginTop: 4,
    gap: 8,
  },
  linkText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.72,
  },
});

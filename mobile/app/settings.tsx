import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import AccountScreenHeader from '../components/account/AccountScreenHeader';
import AccountSection from '../components/account/AccountSection';
import AccountMenuRow from '../components/account/AccountMenuRow';
import SettingsSwitchRow from '../components/settings/SettingsSwitchRow';
import SettingsDangerButton from '../components/settings/SettingsDangerButton';
import SettingsIntro from '../components/settings/SettingsIntro';
import SettingsFooterNote from '../components/settings/SettingsFooterNote';
import SettingsAboutModal from '../components/settings/SettingsAboutModal';
import SettingsHelpModal from '../components/settings/SettingsHelpModal';
import SettingsLogoutModal from '../components/settings/SettingsLogoutModal';
import SettingsPrivacyModal from '../components/settings/SettingsPrivacyModal';
import SettingsChangeEmailModal from '../components/settings/SettingsChangeEmailModal';
import SettingsEmailSuccessModal from '../components/settings/SettingsEmailSuccessModal';
import SettingsChangePasswordModal from '../components/settings/SettingsChangePasswordModal';
import SettingsPasswordSuccessModal from '../components/settings/SettingsPasswordSuccessModal';
import SettingsPrivateAccountConfirmModal from '../components/settings/SettingsPrivateAccountConfirmModal';

const LIGHT = {
  bg: '#f5fbf6',
  surface: '#eaefea',
  text: '#171d1a',
  sub: '#6d7a74',
  outline: '#d7ddd9',
  green: '#5A8363',
  red: '#D70015',
  white: '#ffffff',
  switchOffTrack: '#c4cbc6',
  switchOnTrack: '#5A8363',
  switchThumb: '#ffffff',
};

const DARK = {
  bg: '#121212',
  surface: '#232323',
  text: '#f5fbf6',
  sub: '#aab5af',
  outline: '#333735',
  green: '#5A8363',
  red: '#E11D2E',
  white: '#f9f9f9',
  switchOffTrack: '#5b605d',
  switchOnTrack: '#5A8363',
  switchThumb: '#ffffff',
};

type SettingsState = {
  privateAccountEnabled: boolean;
};

type ActiveModal =
  | 'about'
  | 'help'
  | 'logout'
  | 'privacy'
  | 'change-email'
  | 'email-success'
  | 'change-password'
  | 'password-success'
  | 'private-account'
  | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, useSystemTheme, setUseSystemTheme, toggleManualTheme } = useTheme();

  const colors = useMemo(
    () => (isDark ? DARK : LIGHT),
    [isDark],
  );

  const [settings, setSettings] = useState<SettingsState>({
    privateAccountEnabled: false,
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [pendingPrivateValue, setPendingPrivateValue] = useState<boolean | null>(null);

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });

  function updateSetting<Key extends keyof SettingsState>(
    key: Key,
    value: SettingsState[Key],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    // backend futuro:
    // updateUserSettings({ [key]: value })
  }

  function openModal(modal: ActiveModal) {
    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
  }

  function switchModal(modal: ActiveModal) {
    setActiveModal(modal);
  }

  function handleTogglePrivateAccount() {
    setPendingPrivateValue(!settings.privateAccountEnabled);
    openModal('private-account');
  }

  function handleConfirmPrivateAccount() {
    if (pendingPrivateValue !== null) {
      updateSetting('privateAccountEnabled', pendingPrivateValue);
    }

    setPendingPrivateValue(null);
    closeModal();
  }

  function handleCancelPrivateAccount() {
    setPendingPrivateValue(null);
    closeModal();
  }

  function handleSubmitChangeEmail() {
    setEmailForm({
      newEmail: '',
      password: '',
    });
    switchModal('email-success');
  }

  function handleSubmitChangePassword() {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
    });
    switchModal('password-success');
  }

  function handleConfirmLogout() {
    closeModal();
    // TODO: integrar logout com backend (remover token + redirect)
  }

  const privateAccountDescription = settings.privateAccountEnabled
    ? 'Só seguidores aprovados veem seu perfil'
    : 'Qualquer pessoa pode te seguir';

  return (
    <View style={[styles.root, { backgroundColor: colors.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.green}
      />

      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <AccountScreenHeader
          title="Truth or Dare"
          headerGreen={colors.green}
          titleColor={colors.white}
          borderBottomColor="rgba(207,247,238,0.20)"
          leftIcon="arrow-back"
          onPressLeft={() => router.back()}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SettingsIntro
            titleColor={colors.text}
            subtitleColor={colors.sub}
          />

          <AccountSection title="Visual e App" titleColor={colors.sub}>
            <SettingsSwitchRow
              icon="settings-suggest"
              title="Usar tema do sistema"
              description="Segue automaticamente a aparência do dispositivo"
              value={useSystemTheme}
              onValueChange={setUseSystemTheme}
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.green}
              borderColor={colors.outline}
              trackColor={{
                false: colors.switchOffTrack,
                true: colors.switchOnTrack,
              }}
              thumbColor={colors.switchThumb}
            />

            <SettingsSwitchRow
              icon={isDark ? 'light-mode' : 'dark-mode'}
              title={isDark ? 'Modo Claro' : 'Modo Escuro'}
              description={
                useSystemTheme
                  ? 'Desative o tema do sistema para escolher manualmente'
                  : 'Alterne manualmente a aparência do app'
              }
              value={isDark}
              onValueChange={() => {
                if (useSystemTheme) {
                  return;
                }
                toggleManualTheme();
              }}
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.green}
              borderColor={colors.outline}
              trackColor={{
                false: colors.switchOffTrack,
                true: colors.switchOnTrack,
              }}
              thumbColor={colors.switchThumb}
            />

            <AccountMenuRow
              icon="info-outline"
              label="Sobre o App"
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.green}
              borderColor={colors.outline}
              onPress={() => openModal('about')}
            />
          </AccountSection>

          <AccountSection title="Conta" titleColor={colors.sub}>
            <SettingsSwitchRow
              icon="lock-outline"
              title="Conta Privada"
              description={privateAccountDescription}
              value={settings.privateAccountEnabled}
              onValueChange={handleTogglePrivateAccount}
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.green}
              borderColor={colors.outline}
              trackColor={{
                false: colors.switchOffTrack,
                true: colors.switchOnTrack,
              }}
              thumbColor={colors.switchThumb}
            />

            <AccountMenuRow
              icon="manage-accounts"
              label="Dados e Privacidade"
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.green}
              borderColor={colors.outline}
              onPress={() => openModal('privacy')}
            />

            <AccountMenuRow
              icon="lock-reset"
              label="Alterar Senha"
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.green}
              borderColor={colors.outline}
              onPress={() => openModal('change-password')}
            />
          </AccountSection>

          <AccountSection title="Suporte" titleColor={colors.sub}>
            <AccountMenuRow
              icon="help-outline"
              label="Central de Ajuda"
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.green}
              borderColor={colors.outline}
              onPress={() => openModal('help')}
            />
          </AccountSection>

          <View style={styles.logoutWrap}>
            <SettingsDangerButton
              label="Sair"
              backgroundColor={colors.red}
              textColor={colors.white}
              onPress={() => openModal('logout')}
            />
          </View>

          <SettingsFooterNote color={colors.sub} />
        </ScrollView>
      </View>

      <SettingsAboutModal
        visible={activeModal === 'about'}
        onClose={closeModal}
      />

      <SettingsHelpModal
        visible={activeModal === 'help'}
        onClose={closeModal}
        onPressReportAbuse={() => {
          // TODO: integrar fluxo de suporte com backend
        }}
        onPressContactDevs={() => {
          // TODO: integrar fluxo de suporte com backend
        }}
      />

      <SettingsLogoutModal
        visible={activeModal === 'logout'}
        onConfirm={handleConfirmLogout}
        onCancel={closeModal}
      />

      <SettingsPrivacyModal
        visible={activeModal === 'privacy'}
        currentEmail=""
        onClose={closeModal}
        onPressChangeEmail={() => switchModal('change-email')}
      />

      <SettingsChangeEmailModal
        visible={activeModal === 'change-email'}
        email={emailForm.newEmail}
        password={emailForm.password}
        onChangeEmail={(value) =>
          setEmailForm((current) => ({ ...current, newEmail: value }))
        }
        onChangePassword={(value) =>
          setEmailForm((current) => ({ ...current, password: value }))
        }
        onSubmit={handleSubmitChangeEmail}
        onBack={() => switchModal('privacy')}
      />

      <SettingsEmailSuccessModal
        visible={activeModal === 'email-success'}
        onClose={closeModal}
      />

      <SettingsChangePasswordModal
        visible={activeModal === 'change-password'}
        currentPassword={passwordForm.currentPassword}
        newPassword={passwordForm.newPassword}
        onChangeCurrentPassword={(value) =>
          setPasswordForm((current) => ({ ...current, currentPassword: value }))
        }
        onChangeNewPassword={(value) =>
          setPasswordForm((current) => ({ ...current, newPassword: value }))
        }
        onSubmit={handleSubmitChangePassword}
        onCancel={closeModal}
      />

      <SettingsPasswordSuccessModal
        visible={activeModal === 'password-success'}
        onClose={closeModal}
      />

      <SettingsPrivateAccountConfirmModal
        visible={activeModal === 'private-account'}
        willBePrivate={pendingPrivateValue ?? !settings.privateAccountEnabled}
        onConfirm={handleConfirmPrivateAccount}
        onCancel={handleCancelPrivateAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 26,
  },
  logoutWrap: {
    paddingTop: 8,
  },
});
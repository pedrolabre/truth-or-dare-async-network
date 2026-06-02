import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../context/ThemeContext';
import { useSettingsScreen } from '../hooks/useSettingsScreen';
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
import SettingsReportAbuseModal from '../components/settings/SettingsReportAbuseModal';
import SettingsDeleteAccountModal from '../components/settings/SettingsDeleteAccountModal';

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

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, useSystemTheme, setUseSystemTheme, toggleManualTheme } = useTheme();
  const {
    user,
    isLoadingUser,
    userError,
    retryLoadUser,
    settings,
    activeModal,
    openModal,
    closeModal,
    switchModal,
    openReportAbuseModal,
    emailForm,
    setEmailForm,
    handleCancelChangeEmail,
    emailFieldErrors,
    isSubmittingEmail,
    emailError,
    handleChangeEmail,
    passwordForm,
    setPasswordForm,
    handleCancelChangePassword,
    passwordFieldErrors,
    isSubmittingPassword,
    passwordError,
    handleChangePassword,
    reportAbuseForm,
    setReportAbuseForm,
    resetReportAbuseForm,
    reportAbuseFieldErrors,
    isSubmittingReportAbuse,
    reportAbuseError,
    reportAbuseSuccessMessage,
    supportContactMessage,
    deleteAccountForm,
    setDeleteAccountForm,
    deleteAccountStep,
    handleContinueDeleteAccount,
    handleCancelDeleteAccount,
    deleteAccountFieldErrors,
    isSubmittingDeleteAccount,
    deleteAccountError,
    handleReportAbuse,
    handleContactDevs,
    handleDeleteAccount,
    openDeleteAccountModal,
    handleTogglePrivateAccount,
    handleLogout,
  } = useSettingsScreen();

  const colors = useMemo(
    () => (isDark ? DARK : LIGHT),
    [isDark],
  );

  const [pendingPrivateValue, setPendingPrivateValue] = useState<boolean | null>(null);

  function handleRequestTogglePrivateAccount(newValue: boolean) {
    setPendingPrivateValue(newValue);
    openModal('private-account');
  }

  async function handleConfirmPrivateAccount() {
    if (pendingPrivateValue !== null) {
      await handleTogglePrivateAccount(pendingPrivateValue);
    }

    setPendingPrivateValue(null);
    closeModal();
  }

  function handleCancelPrivateAccount() {
    setPendingPrivateValue(null);
    closeModal();
  }

  async function handleSubmitChangeEmail() {
    const success = await handleChangeEmail(emailForm);

    if (success) {
      switchModal('email-success');
    }
  }

  async function handleSubmitChangePassword() {
    const success = await handleChangePassword(passwordForm);

    if (success) {
      switchModal('password-success');
    }
  }

  async function handleSubmitReportAbuse() {
    await handleReportAbuse(reportAbuseForm);
  }

  async function handleSubmitDeleteAccount() {
    await handleDeleteAccount(deleteAccountForm);
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

          {isLoadingUser ? (
            <View
              testID="settings-user-loading"
              style={[
                styles.userStatus,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                },
              ]}
            >
              <ActivityIndicator color={colors.green} />
              <Text style={[styles.userStatusText, { color: colors.sub }]}>
                Carregando sua conta...
              </Text>
            </View>
          ) : null}

          {userError ? (
            <View
              testID="settings-user-error"
              style={[
                styles.userStatus,
                styles.userErrorStatus,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                },
              ]}
            >
              <View style={styles.userErrorTextWrap}>
                <Text style={[styles.userErrorTitle, { color: colors.text }]}>
                  Nao foi possivel carregar sua conta
                </Text>
                <Text style={[styles.userStatusText, { color: colors.sub }]}>
                  {userError}
                </Text>
              </View>

              <Pressable
                onPress={retryLoadUser}
                style={[styles.retryButton, { backgroundColor: colors.green }]}
              >
                <Text style={[styles.retryText, { color: colors.white }]}>
                  TENTAR NOVAMENTE
                </Text>
              </Pressable>
            </View>
          ) : null}

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
              onValueChange={handleRequestTogglePrivateAccount}
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

          <AccountSection title="Zona de Perigo" titleColor={colors.red}>
            <AccountMenuRow
              icon="delete-outline"
              label="Excluir Conta"
              backgroundColor={colors.surface}
              textColor={colors.text}
              subTextColor={colors.sub}
              iconColor={colors.red}
              borderColor={colors.outline}
              onPress={openDeleteAccountModal}
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
        onPressReportAbuse={openReportAbuseModal}
        onPressContactDevs={handleContactDevs}
        contactMessage={supportContactMessage}
      />

      <SettingsReportAbuseModal
        visible={activeModal === 'report-abuse'}
        category={reportAbuseForm.category}
        description={reportAbuseForm.description}
        onChangeCategory={(value) =>
          setReportAbuseForm((current) => ({ ...current, category: value }))
        }
        onChangeDescription={(value) =>
          setReportAbuseForm((current) => ({ ...current, description: value }))
        }
        onSubmit={handleSubmitReportAbuse}
        onCancel={() => {
          resetReportAbuseForm();
          switchModal('help');
        }}
        isSubmitting={isSubmittingReportAbuse}
        errorMessage={reportAbuseError}
        successMessage={reportAbuseSuccessMessage}
        fieldErrors={reportAbuseFieldErrors}
      />

      <SettingsDeleteAccountModal
        visible={activeModal === 'delete-account'}
        step={deleteAccountStep}
        currentPassword={deleteAccountForm.currentPassword}
        onChangeCurrentPassword={(value) =>
          setDeleteAccountForm((current) => ({
            ...current,
            currentPassword: value,
          }))
        }
        onContinue={handleContinueDeleteAccount}
        onSubmit={handleSubmitDeleteAccount}
        onCancel={handleCancelDeleteAccount}
        isSubmitting={isSubmittingDeleteAccount}
        errorMessage={deleteAccountError}
        fieldErrors={deleteAccountFieldErrors}
      />

      <SettingsLogoutModal
        visible={activeModal === 'logout'}
        onConfirm={handleLogout}
        onCancel={closeModal}
      />

      <SettingsPrivacyModal
        visible={activeModal === 'privacy'}
        currentEmail={user?.email ?? ''}
        onClose={closeModal}
        onPressChangeEmail={() => switchModal('change-email')}
      />

      <SettingsChangeEmailModal
        visible={activeModal === 'change-email'}
        email={emailForm.newEmail}
        confirmEmail={emailForm.confirmEmail}
        password={emailForm.currentPassword}
        onChangeEmail={(value) =>
          setEmailForm((current) => ({ ...current, newEmail: value }))
        }
        onChangeConfirmEmail={(value) =>
          setEmailForm((current) => ({ ...current, confirmEmail: value }))
        }
        onChangePassword={(value) =>
          setEmailForm((current) => ({ ...current, currentPassword: value }))
        }
        onSubmit={handleSubmitChangeEmail}
        onBack={() => handleCancelChangeEmail('privacy')}
        isSubmitting={isSubmittingEmail}
        errorMessage={emailError}
        fieldErrors={emailFieldErrors}
      />

      <SettingsEmailSuccessModal
        visible={activeModal === 'email-success'}
        onClose={closeModal}
      />

      <SettingsChangePasswordModal
        visible={activeModal === 'change-password'}
        currentPassword={passwordForm.currentPassword}
        newPassword={passwordForm.newPassword}
        confirmNewPassword={passwordForm.confirmNewPassword}
        onChangeCurrentPassword={(value) =>
          setPasswordForm((current) => ({ ...current, currentPassword: value }))
        }
        onChangeNewPassword={(value) =>
          setPasswordForm((current) => ({ ...current, newPassword: value }))
        }
        onChangeConfirmNewPassword={(value) =>
          setPasswordForm((current) => ({
            ...current,
            confirmNewPassword: value,
          }))
        }
        onSubmit={handleSubmitChangePassword}
        onCancel={() => handleCancelChangePassword(null)}
        isSubmitting={isSubmittingPassword}
        errorMessage={passwordError}
        fieldErrors={passwordFieldErrors}
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
  userStatus: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userErrorStatus: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userErrorTextWrap: {
    flex: 1,
    gap: 4,
  },
  userErrorTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  userStatusText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  retryButton: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});

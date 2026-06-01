import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  changeEmail,
  changePassword,
  getMe,
  removeToken,
  updateMe,
} from '../services/api';
import { clearLocalSettings } from '../services/settingsStorage';
import type {
  ChangeEmailPayload,
  ChangePasswordPayload,
  SettingsState,
  UserAccountData,
} from '../types/settings';

export type SettingsScreenModal =
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

export type SettingsEmailForm = ChangeEmailPayload;

export type SettingsPasswordForm = ChangePasswordPayload;

const EMPTY_EMAIL_FORM: SettingsEmailForm = {
  newEmail: '',
  currentPassword: '',
};

const EMPTY_PASSWORD_FORM: SettingsPasswordForm = {
  currentPassword: '',
  newPassword: '',
};

function getErrorMessage(
  error: unknown,
  fallbackMessage = 'Nao foi possivel concluir a acao.',
): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function useSettingsScreen() {
  const router = useRouter();

  const [user, setUser] = useState<UserAccountData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsState>({
    privateAccountEnabled: false,
  });

  const [activeModal, setActiveModal] =
    useState<SettingsScreenModal>(null);
  const [emailForm, setEmailForm] =
    useState<SettingsEmailForm>(EMPTY_EMAIL_FORM);
  const [passwordForm, setPasswordForm] =
    useState<SettingsPasswordForm>(EMPTY_PASSWORD_FORM);

  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      setUserError(null);

      const loadedUser = await getMe();

      setUser(loadedUser);
      setSettings((current) => ({
        ...current,
        privateAccountEnabled: loadedUser.isPrivate,
      }));
    } catch (error) {
      setUser(null);
      setUserError(
        getErrorMessage(error, 'Nao foi possivel carregar sua conta.'),
      );
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const retryLoadUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const openModal = useCallback((modal: SettingsScreenModal) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const switchModal = useCallback((modal: SettingsScreenModal) => {
    setActiveModal(modal);
  }, []);

  const handleTogglePrivateAccount = useCallback(
    async (newValue: boolean) => {
      const updatedUser = await updateMe({ isPrivate: newValue });
      const nextValue = updatedUser.isPrivate ?? newValue;

      setUser(updatedUser);
      setSettings((current) => ({
        ...current,
        privateAccountEnabled: nextValue,
      }));

      return updatedUser;
    },
    [],
  );

  const handleChangeEmail = useCallback(
    async (payload: ChangeEmailPayload) => {
      try {
        setIsSubmittingEmail(true);
        setEmailError(null);

        await changeEmail(payload);
        setEmailForm(EMPTY_EMAIL_FORM);

        return true;
      } catch (error) {
        setEmailError(
          getErrorMessage(error, 'Nao foi possivel alterar o e-mail.'),
        );

        return false;
      } finally {
        setIsSubmittingEmail(false);
      }
    },
    [],
  );

  const handleChangePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      try {
        setIsSubmittingPassword(true);
        setPasswordError(null);

        await changePassword(payload);
        setPasswordForm(EMPTY_PASSWORD_FORM);

        return true;
      } catch (error) {
        setPasswordError(
          getErrorMessage(error, 'Nao foi possivel alterar a senha.'),
        );

        return false;
      } finally {
        setIsSubmittingPassword(false);
      }
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    await clearLocalSettings();
    await removeToken();
    setUser(null);
    setSettings((current) => ({
      ...current,
      privateAccountEnabled: false,
    }));
    setEmailForm(EMPTY_EMAIL_FORM);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setActiveModal(null);
    router.replace('/login');
  }, [router]);

  const handleDeleteAccount = useCallback(async () => ({
    implemented: false,
    reason: 'DELETE_ACCOUNT_NOT_IMPLEMENTED',
  }), []);

  return {
    user,
    isLoadingUser,
    userError,
    retryLoadUser,
    settings,
    activeModal,
    openModal,
    closeModal,
    switchModal,
    emailForm,
    setEmailForm,
    passwordForm,
    setPasswordForm,
    isSubmittingEmail,
    emailError,
    handleChangeEmail,
    isSubmittingPassword,
    passwordError,
    handleChangePassword,
    handleTogglePrivateAccount,
    handleLogout,
    handleDeleteAccount,
  };
}

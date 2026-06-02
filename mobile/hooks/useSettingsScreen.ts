import { useCallback, useEffect, useRef, useState } from 'react';
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
  ChangeEmailFieldErrors,
  ChangeEmailForm,
  ChangeEmailPayload,
  ChangePasswordFieldErrors,
  ChangePasswordForm,
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

export type SettingsEmailForm = ChangeEmailForm;

export type SettingsPasswordForm = ChangePasswordForm;

const EMPTY_EMAIL_FORM: SettingsEmailForm = {
  newEmail: '',
  confirmEmail: '',
  currentPassword: '',
};

const EMPTY_PASSWORD_FORM: SettingsPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

function getErrorMessage(
  error: unknown,
  fallbackMessage = 'Nao foi possivel concluir a acao.',
): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateEmailForm(
  form: SettingsEmailForm,
  currentEmail: string | null | undefined,
  validateEmptyFields: boolean,
): ChangeEmailFieldErrors {
  const errors: ChangeEmailFieldErrors = {};
  const newEmail = form.newEmail.trim();
  const confirmEmail = form.confirmEmail.trim();
  const currentUserEmail = normalizeEmail(currentEmail ?? '');

  if (validateEmptyFields || newEmail) {
    if (!newEmail) {
      errors.newEmail = 'Informe o novo e-mail.';
    } else if (!isValidEmail(newEmail)) {
      errors.newEmail = 'Informe um e-mail valido.';
    } else if (
      currentUserEmail &&
      normalizeEmail(newEmail) === currentUserEmail
    ) {
      errors.newEmail = 'O novo e-mail precisa ser diferente do atual.';
    }
  }

  if (validateEmptyFields || confirmEmail) {
    if (!confirmEmail) {
      errors.confirmEmail = 'Confirme o novo e-mail.';
    } else if (
      newEmail &&
      normalizeEmail(confirmEmail) !== normalizeEmail(newEmail)
    ) {
      errors.confirmEmail = 'Os e-mails precisam ser iguais.';
    }
  }

  if (validateEmptyFields || form.currentPassword) {
    if (!form.currentPassword.trim()) {
      errors.currentPassword = 'Informe sua senha atual.';
    }
  }

  return errors;
}

function hasNumberOrSymbol(password: string): boolean {
  return /[\d\W_]/.test(password);
}

function validatePasswordForm(
  form: SettingsPasswordForm,
  validateEmptyFields: boolean,
): ChangePasswordFieldErrors {
  const errors: ChangePasswordFieldErrors = {};
  const currentPassword = form.currentPassword.trim();
  const newPassword = form.newPassword;
  const confirmNewPassword = form.confirmNewPassword;

  if (validateEmptyFields || form.currentPassword) {
    if (!currentPassword) {
      errors.currentPassword = 'Informe sua senha atual.';
    }
  }

  if (validateEmptyFields || newPassword) {
    if (!newPassword) {
      errors.newPassword = 'Informe a nova senha.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'A nova senha precisa ter pelo menos 8 caracteres.';
    } else if (!hasNumberOrSymbol(newPassword)) {
      errors.newPassword =
        'A nova senha precisa ter ao menos 1 numero ou simbolo.';
    } else if (currentPassword && newPassword === form.currentPassword) {
      errors.newPassword = 'A nova senha precisa ser diferente da atual.';
    }
  }

  if (validateEmptyFields || confirmNewPassword) {
    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Confirme a nova senha.';
    } else if (
      newPassword &&
      confirmNewPassword !== newPassword
    ) {
      errors.confirmNewPassword = 'As senhas precisam ser iguais.';
    }
  }

  return errors;
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
  const isSubmittingEmailRef = useRef(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailFieldErrors, setEmailFieldErrors] =
    useState<ChangeEmailFieldErrors>({});
  const [shouldValidateEmptyEmailFields, setShouldValidateEmptyEmailFields] =
    useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const isSubmittingPasswordRef = useRef(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] =
    useState<ChangePasswordFieldErrors>({});
  const [
    shouldValidateEmptyPasswordFields,
    setShouldValidateEmptyPasswordFields,
  ] = useState(false);

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

  useEffect(() => {
    setEmailFieldErrors(
      validateEmailForm(emailForm, user?.email, shouldValidateEmptyEmailFields),
    );
  }, [emailForm, shouldValidateEmptyEmailFields, user?.email]);

  useEffect(() => {
    setPasswordFieldErrors(
      validatePasswordForm(passwordForm, shouldValidateEmptyPasswordFields),
    );
  }, [passwordForm, shouldValidateEmptyPasswordFields]);

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

  const resetEmailForm = useCallback(() => {
    setEmailForm(EMPTY_EMAIL_FORM);
    setEmailError(null);
    setEmailFieldErrors({});
    setShouldValidateEmptyEmailFields(false);
  }, []);

  const resetPasswordForm = useCallback(() => {
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordError(null);
    setPasswordFieldErrors({});
    setShouldValidateEmptyPasswordFields(false);
  }, []);

  const handleCancelChangeEmail = useCallback(
    (nextModal: SettingsScreenModal = 'privacy') => {
      resetEmailForm();
      setActiveModal(nextModal);
    },
    [resetEmailForm],
  );

  const handleCancelChangePassword = useCallback(
    (nextModal: SettingsScreenModal = null) => {
      resetPasswordForm();
      setActiveModal(nextModal);
    },
    [resetPasswordForm],
  );

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
    async (form: SettingsEmailForm) => {
      if (isSubmittingEmailRef.current) {
        return false;
      }

      const fieldErrors = validateEmailForm(form, user?.email, true);
      setShouldValidateEmptyEmailFields(true);
      setEmailFieldErrors(fieldErrors);
      setEmailError(null);

      if (Object.keys(fieldErrors).length > 0) {
        return false;
      }

      const payload: ChangeEmailPayload = {
        newEmail: form.newEmail.trim(),
        currentPassword: form.currentPassword,
      };

      try {
        isSubmittingEmailRef.current = true;
        setIsSubmittingEmail(true);

        await changeEmail(payload);
        setEmailForm(EMPTY_EMAIL_FORM);
        setEmailFieldErrors({});
        setShouldValidateEmptyEmailFields(false);
        setActiveModal('email-success');

        return true;
      } catch (error) {
        setEmailError(
          getErrorMessage(error, 'Nao foi possivel alterar o e-mail.'),
        );

        return false;
      } finally {
        isSubmittingEmailRef.current = false;
        setIsSubmittingEmail(false);
      }
    },
    [user?.email],
  );

  const handleChangePassword = useCallback(
    async (form: SettingsPasswordForm) => {
      if (isSubmittingPasswordRef.current) {
        return false;
      }

      const fieldErrors = validatePasswordForm(form, true);
      setShouldValidateEmptyPasswordFields(true);
      setPasswordFieldErrors(fieldErrors);
      setPasswordError(null);

      if (Object.keys(fieldErrors).length > 0) {
        return false;
      }

      const payload: ChangePasswordPayload = {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      };

      try {
        isSubmittingPasswordRef.current = true;
        setIsSubmittingPassword(true);

        await changePassword(payload);
        setPasswordForm(EMPTY_PASSWORD_FORM);
        setPasswordFieldErrors({});
        setShouldValidateEmptyPasswordFields(false);
        setActiveModal('password-success');

        return true;
      } catch (error) {
        setPasswordError(
          getErrorMessage(error, 'Nao foi possivel alterar a senha.'),
        );

        return false;
      } finally {
        isSubmittingPasswordRef.current = false;
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
    resetEmailForm,
    handleCancelChangeEmail,
    emailFieldErrors,
    passwordForm,
    setPasswordForm,
    resetPasswordForm,
    handleCancelChangePassword,
    passwordFieldErrors,
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

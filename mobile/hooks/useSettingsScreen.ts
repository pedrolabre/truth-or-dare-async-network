import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';

import {
  changeEmail,
  changePassword,
  deleteAccount,
  getAppInfo,
  getMe,
  removeToken,
  reportAbuse,
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
  DeleteAccountFieldErrors,
  DeleteAccountForm,
  DeleteAccountPayload,
  AppInfo,
  ReportAbuseFieldErrors,
  ReportAbuseForm,
  ReportAbusePayload,
  SettingsState,
  UserAccountData,
} from '../types/settings';
import { REPORT_ABUSE_CATEGORIES } from '../types/settings';

export type SettingsScreenModal =
  | 'about'
  | 'help'
  | 'logout'
  | 'privacy'
  | 'change-email'
  | 'email-success'
  | 'change-password'
  | 'password-success'
  | 'report-abuse'
  | 'delete-account'
  | 'private-account'
  | null;

export type SettingsEmailForm = ChangeEmailForm;

export type SettingsPasswordForm = ChangePasswordForm;
export type SettingsDeleteAccountForm = DeleteAccountForm;
export type SettingsReportAbuseForm = ReportAbuseForm;

export const SETTINGS_SUPPORT_EMAIL = 'suporte@truthordare.app';

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

const EMPTY_REPORT_ABUSE_FORM: SettingsReportAbuseForm = {
  category: 'spam',
  description: '',
};

const EMPTY_DELETE_ACCOUNT_FORM: SettingsDeleteAccountForm = {
  currentPassword: '',
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

function validateReportAbuseForm(
  form: SettingsReportAbuseForm,
  validateEmptyFields: boolean,
): ReportAbuseFieldErrors {
  const errors: ReportAbuseFieldErrors = {};
  const description = form.description.trim();

  if (!REPORT_ABUSE_CATEGORIES.includes(form.category)) {
    errors.category = 'Selecione uma categoria valida.';
  }

  if (validateEmptyFields || description) {
    if (!description) {
      errors.description = 'Descreva o que aconteceu.';
    } else if (description.length < 10) {
      errors.description = 'Descreva com pelo menos 10 caracteres.';
    }
  }

  return errors;
}

function validateDeleteAccountForm(
  form: SettingsDeleteAccountForm,
  validateEmptyFields: boolean,
): DeleteAccountFieldErrors {
  const errors: DeleteAccountFieldErrors = {};

  if (validateEmptyFields || form.currentPassword) {
    if (!form.currentPassword.trim()) {
      errors.currentPassword = 'Informe sua senha atual.';
    }
  }

  return errors;
}

export function useSettingsScreen() {
  const router = useRouter();

  const [user, setUser] = useState<UserAccountData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isLoadingAppInfo, setIsLoadingAppInfo] = useState(true);
  const [appInfoError, setAppInfoError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsState>({
    privateAccountEnabled: false,
  });

  const [activeModal, setActiveModal] =
    useState<SettingsScreenModal>(null);
  const [emailForm, setEmailForm] =
    useState<SettingsEmailForm>(EMPTY_EMAIL_FORM);
  const [passwordForm, setPasswordForm] =
    useState<SettingsPasswordForm>(EMPTY_PASSWORD_FORM);
  const [reportAbuseForm, setReportAbuseForm] =
    useState<SettingsReportAbuseForm>(EMPTY_REPORT_ABUSE_FORM);
  const [deleteAccountForm, setDeleteAccountForm] =
    useState<SettingsDeleteAccountForm>(EMPTY_DELETE_ACCOUNT_FORM);

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
  const [isSubmittingReportAbuse, setIsSubmittingReportAbuse] =
    useState(false);
  const isSubmittingReportAbuseRef = useRef(false);
  const [reportAbuseError, setReportAbuseError] = useState<string | null>(null);
  const [reportAbuseSuccessMessage, setReportAbuseSuccessMessage] =
    useState<string | null>(null);
  const [reportAbuseFieldErrors, setReportAbuseFieldErrors] =
    useState<ReportAbuseFieldErrors>({});
  const [
    shouldValidateEmptyReportAbuseFields,
    setShouldValidateEmptyReportAbuseFields,
  ] = useState(false);
  const [supportContactMessage, setSupportContactMessage] =
    useState<string | null>(null);
  const [deleteAccountStep, setDeleteAccountStep] = useState<1 | 2>(1);
  const [isSubmittingDeleteAccount, setIsSubmittingDeleteAccount] =
    useState(false);
  const isSubmittingDeleteAccountRef = useRef(false);
  const [deleteAccountError, setDeleteAccountError] =
    useState<string | null>(null);
  const [deleteAccountFieldErrors, setDeleteAccountFieldErrors] =
    useState<DeleteAccountFieldErrors>({});
  const [
    shouldValidateEmptyDeleteAccountFields,
    setShouldValidateEmptyDeleteAccountFields,
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

  const loadAppInfo = useCallback(async () => {
    try {
      setIsLoadingAppInfo(true);
      setAppInfoError(null);

      const loadedAppInfo = await getAppInfo();

      setAppInfo(loadedAppInfo);
    } catch (error) {
      setAppInfo(null);
      setAppInfoError(
        getErrorMessage(error, 'Nao foi possivel carregar informacoes da API.'),
      );
    } finally {
      setIsLoadingAppInfo(false);
    }
  }, []);

  useEffect(() => {
    void loadAppInfo();
  }, [loadAppInfo]);

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

  useEffect(() => {
    setReportAbuseFieldErrors(
      validateReportAbuseForm(
        reportAbuseForm,
        shouldValidateEmptyReportAbuseFields,
      ),
    );
  }, [reportAbuseForm, shouldValidateEmptyReportAbuseFields]);

  useEffect(() => {
    setDeleteAccountFieldErrors(
      validateDeleteAccountForm(
        deleteAccountForm,
        shouldValidateEmptyDeleteAccountFields,
      ),
    );
  }, [deleteAccountForm, shouldValidateEmptyDeleteAccountFields]);

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

  const openReportAbuseModal = useCallback(() => {
    setReportAbuseError(null);
    setReportAbuseSuccessMessage(null);
    setSupportContactMessage(null);
    setActiveModal('report-abuse');
  }, []);

  const openDeleteAccountModal = useCallback(() => {
    setDeleteAccountStep(1);
    setDeleteAccountError(null);
    setDeleteAccountFieldErrors({});
    setShouldValidateEmptyDeleteAccountFields(false);
    setActiveModal('delete-account');
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

  const resetReportAbuseForm = useCallback(() => {
    setReportAbuseForm(EMPTY_REPORT_ABUSE_FORM);
    setReportAbuseError(null);
    setReportAbuseSuccessMessage(null);
    setReportAbuseFieldErrors({});
    setShouldValidateEmptyReportAbuseFields(false);
  }, []);

  const resetDeleteAccountForm = useCallback(() => {
    setDeleteAccountForm(EMPTY_DELETE_ACCOUNT_FORM);
    setDeleteAccountStep(1);
    setDeleteAccountError(null);
    setDeleteAccountFieldErrors({});
    setShouldValidateEmptyDeleteAccountFields(false);
  }, []);

  const handleContinueDeleteAccount = useCallback(() => {
    setDeleteAccountStep(2);
    setDeleteAccountError(null);
  }, []);

  const handleCancelDeleteAccount = useCallback(() => {
    resetDeleteAccountForm();
    setActiveModal(null);
  }, [resetDeleteAccountForm]);

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

  const handleReportAbuse = useCallback(
    async (form: SettingsReportAbuseForm) => {
      if (isSubmittingReportAbuseRef.current) {
        return false;
      }

      const fieldErrors = validateReportAbuseForm(form, true);
      setShouldValidateEmptyReportAbuseFields(true);
      setReportAbuseFieldErrors(fieldErrors);
      setReportAbuseError(null);
      setReportAbuseSuccessMessage(null);

      if (Object.keys(fieldErrors).length > 0) {
        return false;
      }

      const payload: ReportAbusePayload = {
        category: form.category,
        description: form.description.trim(),
        ...(form.referenceId?.trim()
          ? { referenceId: form.referenceId.trim() }
          : {}),
        ...(form.referenceType?.trim()
          ? { referenceType: form.referenceType.trim() }
          : {}),
      };

      try {
        isSubmittingReportAbuseRef.current = true;
        setIsSubmittingReportAbuse(true);

        await reportAbuse(payload);
        setReportAbuseForm(EMPTY_REPORT_ABUSE_FORM);
        setReportAbuseFieldErrors({});
        setShouldValidateEmptyReportAbuseFields(false);
        setReportAbuseSuccessMessage(
          'Denuncia enviada. Obrigado por ajudar a manter a comunidade segura.',
        );

        return true;
      } catch (error) {
        setReportAbuseError(
          getErrorMessage(error, 'Nao foi possivel enviar a denuncia.'),
        );

        return false;
      } finally {
        isSubmittingReportAbuseRef.current = false;
        setIsSubmittingReportAbuse(false);
      }
    },
    [],
  );

  const handleContactDevs = useCallback(async () => {
    const subject = encodeURIComponent('Suporte Truth or Dare');
    const body = encodeURIComponent(
      'Ola, equipe. Preciso de ajuda com o aplicativo.',
    );
    const mailtoUrl = `mailto:${SETTINGS_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    setSupportContactMessage(null);

    try {
      await Linking.openURL(mailtoUrl);
      return true;
    } catch {
      setSupportContactMessage(
        `Nao foi possivel abrir o e-mail automaticamente. Escreva para ${SETTINGS_SUPPORT_EMAIL}.`,
      );
      return false;
    }
  }, []);

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
    setReportAbuseForm(EMPTY_REPORT_ABUSE_FORM);
    setDeleteAccountForm(EMPTY_DELETE_ACCOUNT_FORM);
    setActiveModal(null);
    router.replace('/login');
  }, [router]);

  const handleDeleteAccount = useCallback(
    async (form: SettingsDeleteAccountForm) => {
      if (isSubmittingDeleteAccountRef.current) {
        return false;
      }

      const fieldErrors = validateDeleteAccountForm(form, true);
      setShouldValidateEmptyDeleteAccountFields(true);
      setDeleteAccountFieldErrors(fieldErrors);
      setDeleteAccountError(null);

      if (Object.keys(fieldErrors).length > 0) {
        return false;
      }

      const payload: DeleteAccountPayload = {
        currentPassword: form.currentPassword,
      };

      try {
        isSubmittingDeleteAccountRef.current = true;
        setIsSubmittingDeleteAccount(true);

        await deleteAccount(payload);
        await clearLocalSettings();
        await removeToken();
        setUser(null);
        setSettings((current) => ({
          ...current,
          privateAccountEnabled: false,
        }));
        setEmailForm(EMPTY_EMAIL_FORM);
        setPasswordForm(EMPTY_PASSWORD_FORM);
        setReportAbuseForm(EMPTY_REPORT_ABUSE_FORM);
        setDeleteAccountForm(EMPTY_DELETE_ACCOUNT_FORM);
        setActiveModal(null);
        router.replace('/login?accountDeleted=1');

        return true;
      } catch (error) {
        setDeleteAccountError(
          getErrorMessage(error, 'Nao foi possivel excluir sua conta.'),
        );

        return false;
      } finally {
        isSubmittingDeleteAccountRef.current = false;
        setIsSubmittingDeleteAccount(false);
      }
    },
    [router],
  );

  return {
    user,
    isLoadingUser,
    userError,
    retryLoadUser,
    appInfo,
    isLoadingAppInfo,
    appInfoError,
    settings,
    activeModal,
    openModal,
    closeModal,
    switchModal,
    openReportAbuseModal,
    openDeleteAccountModal,
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
    reportAbuseForm,
    setReportAbuseForm,
    resetReportAbuseForm,
    reportAbuseFieldErrors,
    deleteAccountForm,
    setDeleteAccountForm,
    resetDeleteAccountForm,
    deleteAccountStep,
    handleContinueDeleteAccount,
    handleCancelDeleteAccount,
    deleteAccountFieldErrors,
    isSubmittingDeleteAccount,
    deleteAccountError,
    isSubmittingReportAbuse,
    reportAbuseError,
    reportAbuseSuccessMessage,
    supportContactMessage,
    isSubmittingEmail,
    emailError,
    handleChangeEmail,
    isSubmittingPassword,
    passwordError,
    handleChangePassword,
    handleReportAbuse,
    handleContactDevs,
    handleTogglePrivateAccount,
    handleLogout,
    handleDeleteAccount,
  };
}

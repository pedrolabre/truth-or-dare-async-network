import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../app/settings';
import { useSettingsScreen } from '../hooks/useSettingsScreen';
import type { UserAccountData } from '../types/settings';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    useSystemTheme: true,
    setUseSystemTheme: jest.fn(),
    toggleManualTheme: jest.fn(),
  }),
}));

jest.mock('../hooks/useSettingsScreen', () => ({
  useSettingsScreen: jest.fn(),
}));

const mockedUseSettingsScreen =
  useSettingsScreen as jest.MockedFunction<typeof useSettingsScreen>;

function makeUser(overrides: Partial<UserAccountData> = {}): UserAccountData {
  return {
    id: 'user-1',
    name: 'Marina Configuracoes',
    email: 'marina@test.com',
    username: 'marina_config',
    bio: 'Bio atual',
    avatarUrl: null,
    isPrivate: false,
    createdAt: '2026-06-01T12:00:00.000Z',
    ...overrides,
  };
}

function makeHookState(
  overrides: Partial<ReturnType<typeof useSettingsScreen>> = {},
): ReturnType<typeof useSettingsScreen> {
  return {
    user: makeUser(),
    isLoadingUser: false,
    userError: null,
    retryLoadUser: jest.fn().mockResolvedValue(undefined),
    appInfo: {
      apiVersion: '1.0.0',
      environment: 'test',
      status: 'ok',
    },
    isLoadingAppInfo: false,
    appInfoError: null,
    settings: {
      privateAccountEnabled: false,
    },
    sessions: [],
    isLoadingSessions: false,
    sessionsError: null,
    sessionsSuccessMessage: null,
    revokingSessionId: null,
    isRevokingOtherSessions: false,
    loadSessions: jest.fn().mockResolvedValue(undefined),
    activeModal: null,
    openModal: jest.fn(),
    closeModal: jest.fn(),
    switchModal: jest.fn(),
    openSessionsModal: jest.fn(),
    openReportAbuseModal: jest.fn(),
    emailForm: {
      newEmail: '',
      confirmEmail: '',
      currentPassword: '',
    },
    setEmailForm: jest.fn(),
    resetEmailForm: jest.fn(),
    handleCancelChangeEmail: jest.fn(),
    emailFieldErrors: {},
    passwordForm: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    setPasswordForm: jest.fn(),
    resetPasswordForm: jest.fn(),
    handleCancelChangePassword: jest.fn(),
    passwordFieldErrors: {},
    reportAbuseForm: {
      category: 'spam',
      description: '',
    },
    setReportAbuseForm: jest.fn(),
    resetReportAbuseForm: jest.fn(),
    reportAbuseFieldErrors: {},
    isSubmittingReportAbuse: false,
    reportAbuseError: null,
    reportAbuseSuccessMessage: null,
    supportContactMessage: null,
    deleteAccountForm: {
      currentPassword: '',
    },
    setDeleteAccountForm: jest.fn(),
    resetDeleteAccountForm: jest.fn(),
    deleteAccountStep: 1,
    handleContinueDeleteAccount: jest.fn(),
    handleCancelDeleteAccount: jest.fn(),
    deleteAccountFieldErrors: {},
    isSubmittingDeleteAccount: false,
    deleteAccountError: null,
    isSubmittingEmail: false,
    emailError: null,
    handleChangeEmail: jest.fn().mockResolvedValue(true),
    isSubmittingPassword: false,
    passwordError: null,
    handleChangePassword: jest.fn().mockResolvedValue(true),
    handleReportAbuse: jest.fn().mockResolvedValue(true),
    handleContactDevs: jest.fn().mockResolvedValue(true),
    openDeleteAccountModal: jest.fn(),
    handleTogglePrivateAccount: jest.fn().mockResolvedValue(makeUser()),
    handleRevokeSession: jest.fn().mockResolvedValue(true),
    handleRevokeOtherSessions: jest.fn().mockResolvedValue(true),
    handleLogout: jest.fn().mockResolvedValue(undefined),
    handleDeleteAccount: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('Settings submit modals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSettingsScreen.mockReturnValue(makeHookState());
  });

  it('envia alteracao de e-mail pela API real do hook e abre sucesso', async () => {
    const handleChangeEmail = jest.fn().mockResolvedValue(true);
    const switchModal = jest.fn();
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-email',
        emailForm: {
          newEmail: 'novo@test.com',
          confirmEmail: 'novo@test.com',
          currentPassword: 'senha-atual',
        },
        handleChangeEmail,
        switchModal,
      }),
    );

    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('CONFIRMAR MUDANCA'));

    await waitFor(() => {
      expect(handleChangeEmail).toHaveBeenCalledWith({
        newEmail: 'novo@test.com',
        confirmEmail: 'novo@test.com',
        currentPassword: 'senha-atual',
      });
      expect(switchModal).toHaveBeenCalledWith('email-success');
    });
  });

  it('mantem modal de e-mail aberto quando o hook retorna erro', async () => {
    const handleChangeEmail = jest.fn().mockResolvedValue(false);
    const switchModal = jest.fn();
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-email',
        emailError: 'E-mail ja esta em uso',
        handleChangeEmail,
        switchModal,
      }),
    );

    const { getByTestId, getByText } = render(<SettingsScreen />);

    expect(getByTestId('settings-change-email-error')).toBeTruthy();

    fireEvent.press(getByText('CONFIRMAR MUDANCA'));

    await waitFor(() => {
      expect(handleChangeEmail).toHaveBeenCalledTimes(1);
    });
    expect(switchModal).not.toHaveBeenCalledWith('email-success');
  });

  it('bloqueia duplo envio e mostra loading no modal de e-mail', () => {
    const handleChangeEmail = jest.fn().mockResolvedValue(true);
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-email',
        isSubmittingEmail: true,
        handleChangeEmail,
      }),
    );

    const { getByTestId } = render(<SettingsScreen />);

    expect(getByTestId('settings-change-email-loading')).toBeTruthy();
    expect(handleChangeEmail).not.toHaveBeenCalled();
  });

  it('limpa formulario de e-mail via hook ao voltar', () => {
    const handleCancelChangeEmail = jest.fn();
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-email',
        handleCancelChangeEmail,
      }),
    );

    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('VOLTAR'));

    expect(handleCancelChangeEmail).toHaveBeenCalledWith('privacy');
  });

  it('envia alteracao de senha pela API real do hook e abre sucesso', async () => {
    const handleChangePassword = jest.fn().mockResolvedValue(true);
    const switchModal = jest.fn();
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-password',
        passwordForm: {
          currentPassword: 'senha-atual',
          newPassword: 'senha-nova-segura1',
          confirmNewPassword: 'senha-nova-segura1',
        },
        handleChangePassword,
        switchModal,
      }),
    );

    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('ATUALIZAR SENHA'));

    await waitFor(() => {
      expect(handleChangePassword).toHaveBeenCalledWith({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova-segura1',
        confirmNewPassword: 'senha-nova-segura1',
      });
      expect(switchModal).toHaveBeenCalledWith('password-success');
    });
  });

  it('mantem modal de senha aberto quando o hook retorna erro', async () => {
    const handleChangePassword = jest.fn().mockResolvedValue(false);
    const switchModal = jest.fn();
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-password',
        passwordError: 'Senha atual incorreta',
        handleChangePassword,
        switchModal,
      }),
    );

    const { getByTestId, getByText } = render(<SettingsScreen />);

    expect(getByTestId('settings-change-password-error')).toBeTruthy();

    fireEvent.press(getByText('ATUALIZAR SENHA'));

    await waitFor(() => {
      expect(handleChangePassword).toHaveBeenCalledTimes(1);
    });
    expect(switchModal).not.toHaveBeenCalledWith('password-success');
  });

  it('bloqueia duplo envio e mostra loading no modal de senha', () => {
    const handleChangePassword = jest.fn().mockResolvedValue(true);
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-password',
        isSubmittingPassword: true,
        handleChangePassword,
      }),
    );

    const { getByTestId } = render(<SettingsScreen />);

    expect(getByTestId('settings-change-password-loading')).toBeTruthy();
    expect(handleChangePassword).not.toHaveBeenCalled();
  });

  it('limpa formulario de senha via hook ao cancelar', () => {
    const handleCancelChangePassword = jest.fn();
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'change-password',
        handleCancelChangePassword,
      }),
    );

    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('CANCELAR'));

    expect(handleCancelChangePassword).toHaveBeenCalledWith(null);
  });
});

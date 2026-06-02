import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../app/settings';
import { useSettingsScreen } from '../hooks/useSettingsScreen';
import type { UserAccountData } from '../types/settings';

const mockRouterBack = jest.fn();

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
    back: mockRouterBack,
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
    isPrivate: true,
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
    settings: {
      privateAccountEnabled: true,
    },
    activeModal: null,
    openModal: jest.fn(),
    closeModal: jest.fn(),
    switchModal: jest.fn(),
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
    },
    setPasswordForm: jest.fn(),
    resetPasswordForm: jest.fn(),
    handleCancelChangePassword: jest.fn(),
    isSubmittingEmail: false,
    emailError: null,
    handleChangeEmail: jest.fn().mockResolvedValue(true),
    isSubmittingPassword: false,
    passwordError: null,
    handleChangePassword: jest.fn().mockResolvedValue(true),
    handleTogglePrivateAccount: jest.fn().mockResolvedValue(makeUser()),
    handleLogout: jest.fn().mockResolvedValue(undefined),
    handleDeleteAccount: jest.fn().mockResolvedValue({
      implemented: false,
      reason: 'DELETE_ACCOUNT_NOT_IMPLEMENTED',
    }),
    ...overrides,
  };
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSettingsScreen.mockReturnValue(makeHookState());
  });

  it('exibe loading no topo enquanto carrega usuario', () => {
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        user: null,
        isLoadingUser: true,
      }),
    );

    const { getByTestId, getByText } = render(<SettingsScreen />);

    expect(getByTestId('settings-user-loading')).toBeTruthy();
    expect(getByText('Carregando sua conta...')).toBeTruthy();
  });

  it('exibe erro de usuario com retry acionavel', () => {
    const retryLoadUser = jest.fn().mockResolvedValue(undefined);
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        user: null,
        userError: 'Falha de rede',
        retryLoadUser,
      }),
    );

    const { getByTestId, getByText } = render(<SettingsScreen />);

    expect(getByTestId('settings-user-error')).toBeTruthy();
    expect(getByText('Falha de rede')).toBeTruthy();

    fireEvent.press(getByText('TENTAR NOVAMENTE'));

    expect(retryLoadUser).toHaveBeenCalledTimes(1);
  });

  it('exibe o e-mail real no modal de privacidade', () => {
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'privacy',
        user: makeUser({ email: 'real@test.com' }),
      }),
    );

    const { getByText } = render(<SettingsScreen />);

    expect(getByText('real@test.com')).toBeTruthy();
  });

  it('abre confirmacao e persiste conta privada pelo handler do hook', async () => {
    const openModal = jest.fn();
    const handleTogglePrivateAccount = jest.fn().mockResolvedValue(
      makeUser({
        isPrivate: false,
      }),
    );
    const initialState = makeHookState({
      settings: {
        privateAccountEnabled: true,
      },
      openModal,
      handleTogglePrivateAccount,
    });
    mockedUseSettingsScreen.mockReturnValue(initialState);

    const screen = render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Conta Privada'));

    expect(openModal).toHaveBeenCalledWith('private-account');

    mockedUseSettingsScreen.mockReturnValue({
      ...initialState,
      activeModal: 'private-account',
    });
    screen.rerender(<SettingsScreen />);

    fireEvent.press(screen.getByText('CONFIRMAR'));

    await waitFor(() => {
      expect(handleTogglePrivateAccount).toHaveBeenCalledWith(false);
    });
  });

  it('delega logout ao hook sem try/catch inline na tela', () => {
    const handleLogout = jest.fn().mockResolvedValue(undefined);
    mockedUseSettingsScreen.mockReturnValue(
      makeHookState({
        activeModal: 'logout',
        handleLogout,
      }),
    );

    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('SIM, DESLOGAR'));

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('troca o modal de alteracao de e-mail para sucesso apos envio', async () => {
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
});

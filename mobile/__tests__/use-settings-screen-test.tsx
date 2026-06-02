import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSettingsScreen } from '../hooks/useSettingsScreen';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  getMe,
  removeToken,
  updateMe,
} from '../services/api';
import { clearLocalSettings } from '../services/settingsStorage';
import type {
  ChangeEmailForm,
  ChangePasswordPayload,
  UserAccountData,
} from '../types/settings';

const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

jest.mock('../services/api', () => ({
  changeEmail: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
  getMe: jest.fn(),
  removeToken: jest.fn(),
  updateMe: jest.fn(),
}));

jest.mock('../services/settingsStorage', () => ({
  clearLocalSettings: jest.fn(),
}));

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedUpdateMe = updateMe as jest.MockedFunction<typeof updateMe>;
const mockedChangeEmail =
  changeEmail as jest.MockedFunction<typeof changeEmail>;
const mockedChangePassword =
  changePassword as jest.MockedFunction<typeof changePassword>;
const mockedRemoveToken =
  removeToken as jest.MockedFunction<typeof removeToken>;
const mockedDeleteAccount =
  deleteAccount as jest.MockedFunction<typeof deleteAccount>;
const mockedClearLocalSettings =
  clearLocalSettings as jest.MockedFunction<typeof clearLocalSettings>;

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

async function waitForLoadedUser(
  result: { current: ReturnType<typeof useSettingsScreen> },
) {
  await waitFor(() => {
    expect(result.current.isLoadingUser).toBe(false);
  });
}

describe('useSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMe.mockResolvedValue(makeUser());
    mockedUpdateMe.mockResolvedValue(makeUser());
    mockedChangeEmail.mockResolvedValue({ ok: true });
    mockedChangePassword.mockResolvedValue({ ok: true });
    mockedRemoveToken.mockResolvedValue(undefined);
    mockedClearLocalSettings.mockResolvedValue(undefined);
  });

  it('carrega usuario ao montar e inicializa conta privada pelo backend', async () => {
    let resolveUser: (user: UserAccountData) => void = () => undefined;
    mockedGetMe.mockReturnValue(
      new Promise((resolve) => {
        resolveUser = resolve;
      }),
    );

    const { result } = renderHook(() => useSettingsScreen());

    expect(result.current.isLoadingUser).toBe(true);
    expect(result.current.user).toBeNull();

    await act(async () => {
      resolveUser(makeUser({ isPrivate: true }));
    });

    await waitForLoadedUser(result);

    expect(mockedGetMe).toHaveBeenCalledTimes(1);
    expect(result.current.user?.email).toBe('marina@test.com');
    expect(result.current.settings.privateAccountEnabled).toBe(true);
    expect(result.current.userError).toBeNull();
  });

  it('exibe erro de carregamento e permite retry', async () => {
    mockedGetMe
      .mockRejectedValueOnce(new Error('Falha ao carregar conta'))
      .mockResolvedValueOnce(makeUser({ isPrivate: false }));

    const { result } = renderHook(() => useSettingsScreen());

    await waitFor(() => {
      expect(result.current.userError).toBe('Falha ao carregar conta');
    });

    expect(result.current.user).toBeNull();

    await act(async () => {
      await result.current.retryLoadUser();
    });

    expect(result.current.user?.id).toBe('user-1');
    expect(result.current.settings.privateAccountEnabled).toBe(false);
    expect(result.current.userError).toBeNull();
  });

  it('controla abertura, fechamento, troca de modais e formularios', async () => {
    const { result } = renderHook(() => useSettingsScreen());

    await waitForLoadedUser(result);

    act(() => {
      result.current.openModal('privacy');
    });
    expect(result.current.activeModal).toBe('privacy');

    act(() => {
      result.current.switchModal('change-email');
      result.current.setEmailForm({
        newEmail: 'novo@test.com',
        confirmEmail: 'novo@test.com',
        currentPassword: 'senha-atual',
      });
      result.current.setPasswordForm({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova',
      });
    });

    expect(result.current.activeModal).toBe('change-email');
    expect(result.current.emailForm.newEmail).toBe('novo@test.com');
    expect(result.current.passwordForm.newPassword).toBe('senha-nova');

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBeNull();
  });

  it('alterna conta privada com updateMe e atualiza estado local no sucesso', async () => {
    mockedUpdateMe.mockResolvedValue(makeUser({ isPrivate: false }));

    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    await act(async () => {
      await result.current.handleTogglePrivateAccount(false);
    });

    expect(mockedUpdateMe).toHaveBeenCalledWith({ isPrivate: false });
    expect(result.current.user?.isPrivate).toBe(false);
    expect(result.current.settings.privateAccountEnabled).toBe(false);
  });

  it('mantem estado anterior quando o toggle de conta privada falha', async () => {
    mockedUpdateMe.mockRejectedValue(new Error('Falha ao atualizar privacidade'));

    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    await expect(
      result.current.handleTogglePrivateAccount(false),
    ).rejects.toThrow('Falha ao atualizar privacidade');

    expect(result.current.user?.isPrivate).toBe(true);
    expect(result.current.settings.privateAccountEnabled).toBe(true);
  });

  it('altera e-mail com estado de envio, limpeza de erro e reset de formulario', async () => {
    let resolveChangeEmail: (value: { ok: true }) => void = () => undefined;
    mockedChangeEmail.mockReturnValue(
      new Promise((resolve) => {
        resolveChangeEmail = resolve;
      }),
    );
    const payload: ChangeEmailForm = {
      newEmail: 'novo@test.com',
      confirmEmail: 'novo@test.com',
      currentPassword: 'senha-atual',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setEmailForm(payload);
    });

    let request: Promise<boolean> = Promise.resolve(false);

    act(() => {
      request = result.current.handleChangeEmail(payload);
    });

    expect(result.current.isSubmittingEmail).toBe(true);
    expect(result.current.emailError).toBeNull();

    await act(async () => {
      resolveChangeEmail({ ok: true });
      await request;
    });

    expect(mockedChangeEmail).toHaveBeenCalledWith({
      newEmail: 'novo@test.com',
      currentPassword: 'senha-atual',
    });
    expect(result.current.isSubmittingEmail).toBe(false);
    expect(result.current.emailError).toBeNull();
    expect(result.current.emailForm).toEqual({
      newEmail: '',
      confirmEmail: '',
      currentPassword: '',
    });
  });

  it('valida alteracao de e-mail localmente antes de chamar a API', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);
    const invalidPayload: ChangeEmailForm = {
      newEmail: 'marina@test.com',
      confirmEmail: 'outro@test.com',
      currentPassword: '',
    };

    act(() => {
      result.current.setEmailForm(invalidPayload);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleChangeEmail(invalidPayload);
    });

    expect(success).toBe(false);
    expect(mockedChangeEmail).not.toHaveBeenCalled();
    expect(result.current.emailFieldErrors).toEqual({
      newEmail: 'O novo e-mail precisa ser diferente do atual.',
      confirmEmail: 'Os e-mails precisam ser iguais.',
      currentPassword: 'Informe sua senha atual.',
    });
    expect(result.current.emailError).toBeNull();
  });

  it('atualiza erros de e-mail em tempo real conforme o formulario muda', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setEmailForm({
        newEmail: 'email-invalido',
        confirmEmail: 'email-invalido',
        currentPassword: '',
      });
    });

    await waitFor(() => {
      expect(result.current.emailFieldErrors.newEmail).toBe(
        'Informe um e-mail valido.',
      );
    });

    act(() => {
      result.current.setEmailForm({
        newEmail: 'novo@test.com',
        confirmEmail: 'novo@test.com',
        currentPassword: 'senha-atual',
      });
    });

    await waitFor(() => {
      expect(result.current.emailFieldErrors).toEqual({});
    });
  });

  it('bloqueia duplo envio de alteracao de e-mail no hook', async () => {
    let resolveChangeEmail: (value: { ok: true }) => void = () => undefined;
    mockedChangeEmail.mockReturnValue(
      new Promise((resolve) => {
        resolveChangeEmail = resolve;
      }),
    );
    const payload: ChangeEmailForm = {
      newEmail: 'novo@test.com',
      confirmEmail: 'novo@test.com',
      currentPassword: 'senha-atual',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    let firstRequest: Promise<boolean> = Promise.resolve(false);
    let secondRequest: Promise<boolean> = Promise.resolve(false);

    act(() => {
      firstRequest = result.current.handleChangeEmail(payload);
      secondRequest = result.current.handleChangeEmail(payload);
    });

    await act(async () => {
      resolveChangeEmail({ ok: true });
      await firstRequest;
      await secondRequest;
    });

    await expect(secondRequest).resolves.toBe(false);
    expect(mockedChangeEmail).toHaveBeenCalledTimes(1);
  });

  it('exibe erro de e-mail em falha e preserva formulario', async () => {
    mockedChangeEmail.mockRejectedValue(new Error('E-mail ja esta em uso'));
    const payload: ChangeEmailForm = {
      newEmail: 'duplicado@test.com',
      confirmEmail: 'duplicado@test.com',
      currentPassword: 'senha-atual',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setEmailForm(payload);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleChangeEmail(payload);
    });

    expect(success).toBe(false);
    expect(result.current.emailError).toBe('E-mail ja esta em uso');
    expect(result.current.emailForm).toEqual(payload);
    expect(result.current.isSubmittingEmail).toBe(false);
  });

  it('altera senha com estado de envio, limpeza de erro e reset de formulario', async () => {
    let resolveChangePassword: (value: { ok: true }) => void = () => undefined;
    mockedChangePassword.mockReturnValue(
      new Promise((resolve) => {
        resolveChangePassword = resolve;
      }),
    );
    const payload: ChangePasswordPayload = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setPasswordForm(payload);
    });

    let request: Promise<boolean> = Promise.resolve(false);

    act(() => {
      request = result.current.handleChangePassword(payload);
    });

    expect(result.current.isSubmittingPassword).toBe(true);
    expect(result.current.passwordError).toBeNull();

    await act(async () => {
      resolveChangePassword({ ok: true });
      await request;
    });

    expect(mockedChangePassword).toHaveBeenCalledWith(payload);
    expect(result.current.isSubmittingPassword).toBe(false);
    expect(result.current.passwordError).toBeNull();
    expect(result.current.passwordForm).toEqual({
      currentPassword: '',
      newPassword: '',
    });
  });

  it('exibe erro de senha em falha e preserva formulario', async () => {
    mockedChangePassword.mockRejectedValue(new Error('Senha atual incorreta'));
    const payload: ChangePasswordPayload = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setPasswordForm(payload);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleChangePassword(payload);
    });

    expect(success).toBe(false);
    expect(result.current.passwordError).toBe('Senha atual incorreta');
    expect(result.current.passwordForm).toEqual(payload);
    expect(result.current.isSubmittingPassword).toBe(false);
  });

  it('faz logout removendo token, limpando dados locais e navegando para login', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.openModal('logout');
      result.current.setEmailForm({
        newEmail: 'novo@test.com',
        confirmEmail: 'novo@test.com',
        currentPassword: 'senha-atual',
      });
    });

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(mockedClearLocalSettings).toHaveBeenCalledTimes(1);
    expect(mockedRemoveToken).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith('/login');
    expect(result.current.user).toBeNull();
    expect(result.current.activeModal).toBeNull();
    expect(result.current.emailForm).toEqual({
      newEmail: '',
      confirmEmail: '',
      currentPassword: '',
    });
  });

  it('mantem exclusao de conta como stub sem chamar endpoint real', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    await expect(result.current.handleDeleteAccount()).resolves.toEqual({
      implemented: false,
      reason: 'DELETE_ACCOUNT_NOT_IMPLEMENTED',
    });
    expect(mockedDeleteAccount).not.toHaveBeenCalled();
  });
});

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSettingsScreen } from '../hooks/useSettingsScreen';
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
  ChangeEmailForm,
  DeleteAccountForm,
  ChangePasswordForm,
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
  getAppInfo: jest.fn(),
  getMe: jest.fn(),
  removeToken: jest.fn(),
  reportAbuse: jest.fn(),
  updateMe: jest.fn(),
}));

jest.mock('../services/settingsStorage', () => ({
  clearLocalSettings: jest.fn(),
}));

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedGetAppInfo =
  getAppInfo as jest.MockedFunction<typeof getAppInfo>;
const mockedUpdateMe = updateMe as jest.MockedFunction<typeof updateMe>;
const mockedChangeEmail =
  changeEmail as jest.MockedFunction<typeof changeEmail>;
const mockedChangePassword =
  changePassword as jest.MockedFunction<typeof changePassword>;
const mockedReportAbuse =
  reportAbuse as jest.MockedFunction<typeof reportAbuse>;
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
    mockedGetAppInfo.mockResolvedValue({
      apiVersion: '1.0.0',
      environment: 'test',
      status: 'ok',
    });
    mockedUpdateMe.mockResolvedValue(makeUser());
    mockedChangeEmail.mockResolvedValue({ ok: true });
    mockedChangePassword.mockResolvedValue({ ok: true });
    mockedDeleteAccount.mockResolvedValue({ ok: true });
    mockedReportAbuse.mockResolvedValue({
      ticket: {
        id: 'ticket-1',
        userId: 'user-1',
        category: 'spam',
        description: 'Descricao valida para denuncia.',
        referenceId: null,
        referenceType: null,
        status: 'open',
        createdAt: '2026-06-01T12:00:00.000Z',
        updatedAt: '2026-06-01T12:00:00.000Z',
      },
    });
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

  it('carrega informacoes do app ao montar', async () => {
    mockedGetAppInfo.mockResolvedValue({
      apiVersion: '2.1.0',
      environment: 'test',
      status: 'ok',
    });

    const { result } = renderHook(() => useSettingsScreen());

    await waitFor(() => {
      expect(result.current.isLoadingAppInfo).toBe(false);
    });

    expect(mockedGetAppInfo).toHaveBeenCalledTimes(1);
    expect(result.current.appInfo).toEqual({
      apiVersion: '2.1.0',
      environment: 'test',
      status: 'ok',
    });
    expect(result.current.appInfoError).toBeNull();
  });

  it('mantem o hook funcional quando informacoes da API falham', async () => {
    mockedGetAppInfo.mockRejectedValue(new Error('Falha no app-info'));

    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    await waitFor(() => {
      expect(result.current.isLoadingAppInfo).toBe(false);
    });

    expect(result.current.user?.id).toBe('user-1');
    expect(result.current.appInfo).toBeNull();
    expect(result.current.appInfoError).toBe('Falha no app-info');
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
        confirmNewPassword: 'senha-nova',
      });
      result.current.setReportAbuseForm({
        category: 'other',
        description: 'Descricao inicial da denuncia.',
      });
    });

    expect(result.current.activeModal).toBe('change-email');
    expect(result.current.emailForm.newEmail).toBe('novo@test.com');
    expect(result.current.passwordForm.newPassword).toBe('senha-nova');
    expect(result.current.reportAbuseForm.category).toBe('other');

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
    const form: ChangePasswordForm = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura1',
      confirmNewPassword: 'senha-nova-segura1',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setPasswordForm(form);
    });

    let request: Promise<boolean> = Promise.resolve(false);

    act(() => {
      request = result.current.handleChangePassword(form);
    });

    expect(result.current.isSubmittingPassword).toBe(true);
    expect(result.current.passwordError).toBeNull();

    await act(async () => {
      resolveChangePassword({ ok: true });
      await request;
    });

    expect(mockedChangePassword).toHaveBeenCalledWith({
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura1',
    });
    expect(result.current.isSubmittingPassword).toBe(false);
    expect(result.current.passwordError).toBeNull();
    expect(result.current.passwordForm).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    expect(result.current.activeModal).toBe('password-success');
  });

  it('valida alteracao de senha localmente antes de chamar a API', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);
    const invalidForm: ChangePasswordForm = {
      currentPassword: '',
      newPassword: 'curta',
      confirmNewPassword: 'diferente',
    };

    act(() => {
      result.current.setPasswordForm(invalidForm);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleChangePassword(invalidForm);
    });

    expect(success).toBe(false);
    expect(mockedChangePassword).not.toHaveBeenCalled();
    expect(result.current.passwordFieldErrors).toEqual({
      currentPassword: 'Informe sua senha atual.',
      newPassword: 'A nova senha precisa ter pelo menos 8 caracteres.',
      confirmNewPassword: 'As senhas precisam ser iguais.',
    });
    expect(result.current.passwordError).toBeNull();
  });

  it('atualiza erros de senha em tempo real conforme o formulario muda', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setPasswordForm({
        currentPassword: 'senha-atual',
        newPassword: 'senhasemnumero',
        confirmNewPassword: 'senhasemnumero',
      });
    });

    await waitFor(() => {
      expect(result.current.passwordFieldErrors.newPassword).toBe(
        'A nova senha precisa ter ao menos 1 numero ou simbolo.',
      );
    });

    act(() => {
      result.current.setPasswordForm({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova-segura1',
        confirmNewPassword: 'senha-nova-segura1',
      });
    });

    await waitFor(() => {
      expect(result.current.passwordFieldErrors).toEqual({});
    });
  });

  it('bloqueia nova senha igual a senha atual', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);
    const invalidForm: ChangePasswordForm = {
      currentPassword: 'SenhaAtual1',
      newPassword: 'SenhaAtual1',
      confirmNewPassword: 'SenhaAtual1',
    };

    act(() => {
      result.current.setPasswordForm(invalidForm);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleChangePassword(invalidForm);
    });

    expect(success).toBe(false);
    expect(mockedChangePassword).not.toHaveBeenCalled();
    expect(result.current.passwordFieldErrors.newPassword).toBe(
      'A nova senha precisa ser diferente da atual.',
    );
  });

  it('bloqueia duplo envio de alteracao de senha no hook', async () => {
    let resolveChangePassword: (value: { ok: true }) => void = () => undefined;
    mockedChangePassword.mockReturnValue(
      new Promise((resolve) => {
        resolveChangePassword = resolve;
      }),
    );
    const form: ChangePasswordForm = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura1',
      confirmNewPassword: 'senha-nova-segura1',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    let firstRequest: Promise<boolean> = Promise.resolve(false);
    let secondRequest: Promise<boolean> = Promise.resolve(false);

    act(() => {
      firstRequest = result.current.handleChangePassword(form);
      secondRequest = result.current.handleChangePassword(form);
    });

    await act(async () => {
      resolveChangePassword({ ok: true });
      await firstRequest;
      await secondRequest;
    });

    await expect(secondRequest).resolves.toBe(false);
    expect(mockedChangePassword).toHaveBeenCalledTimes(1);
  });

  it('exibe erro de senha em falha e preserva formulario', async () => {
    mockedChangePassword.mockRejectedValue(new Error('Senha atual incorreta'));
    const form: ChangePasswordForm = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura1',
      confirmNewPassword: 'senha-nova-segura1',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setPasswordForm(form);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleChangePassword(form);
    });

    expect(success).toBe(false);
    expect(result.current.passwordError).toBe('Senha atual incorreta');
    expect(result.current.passwordForm).toEqual(form);
    expect(result.current.isSubmittingPassword).toBe(false);
  });

  it('abre modal de denuncia limpando feedback anterior', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.openReportAbuseModal();
    });

    expect(result.current.activeModal).toBe('report-abuse');
    expect(result.current.reportAbuseError).toBeNull();
    expect(result.current.reportAbuseSuccessMessage).toBeNull();
    expect(result.current.supportContactMessage).toBeNull();
  });

  it('envia denuncia de abuso, limpa formulario e exibe confirmacao', async () => {
    let resolveReportAbuse: (
      value: Awaited<ReturnType<typeof reportAbuse>>,
    ) => void = () => undefined;
    mockedReportAbuse.mockReturnValue(
      new Promise((resolve) => {
        resolveReportAbuse = resolve;
      }),
    );
    const form = {
      category: 'violence' as const,
      description: 'Usuario relatou ameacas em uma conversa.',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setReportAbuseForm(form);
    });

    let request: Promise<boolean> = Promise.resolve(false);

    act(() => {
      request = result.current.handleReportAbuse(form);
    });

    expect(result.current.isSubmittingReportAbuse).toBe(true);

    await act(async () => {
      resolveReportAbuse({
        ticket: {
          id: 'ticket-2',
          userId: 'user-1',
          category: 'violence',
          description: form.description,
          referenceId: null,
          referenceType: null,
          status: 'open',
          createdAt: '2026-06-01T12:00:00.000Z',
          updatedAt: '2026-06-01T12:00:00.000Z',
        },
      });
      await request;
    });

    expect(mockedReportAbuse).toHaveBeenCalledWith(form);
    expect(result.current.reportAbuseForm).toEqual({
      category: 'spam',
      description: '',
    });
    expect(result.current.reportAbuseSuccessMessage).toContain(
      'Denuncia enviada',
    );
    expect(result.current.isSubmittingReportAbuse).toBe(false);
  });

  it('valida denuncia de abuso localmente antes de chamar a API', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);
    const invalidForm = {
      category: 'spam' as const,
      description: 'curta',
    };

    act(() => {
      result.current.setReportAbuseForm(invalidForm);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleReportAbuse(invalidForm);
    });

    expect(success).toBe(false);
    expect(mockedReportAbuse).not.toHaveBeenCalled();
    expect(result.current.reportAbuseFieldErrors).toEqual({
      description: 'Descreva com pelo menos 10 caracteres.',
    });
    expect(result.current.reportAbuseError).toBeNull();
  });

  it('exibe erro de denuncia em falha e preserva formulario', async () => {
    mockedReportAbuse.mockRejectedValue(new Error('Categoria invalida'));
    const form = {
      category: 'hate' as const,
      description: 'Mensagem ofensiva enviada em comentario publico.',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.setReportAbuseForm(form);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleReportAbuse(form);
    });

    expect(success).toBe(false);
    expect(result.current.reportAbuseError).toBe('Categoria invalida');
    expect(result.current.reportAbuseForm).toEqual(form);
  });

  it('bloqueia duplo envio de denuncia de abuso no hook', async () => {
    let resolveReportAbuse: (
      value: Awaited<ReturnType<typeof reportAbuse>>,
    ) => void = () => undefined;
    mockedReportAbuse.mockReturnValue(
      new Promise((resolve) => {
        resolveReportAbuse = resolve;
      }),
    );
    const form = {
      category: 'other' as const,
      description: 'Descricao valida para denuncia duplicada.',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    let firstRequest: Promise<boolean> = Promise.resolve(false);
    let secondRequest: Promise<boolean> = Promise.resolve(false);

    act(() => {
      firstRequest = result.current.handleReportAbuse(form);
      secondRequest = result.current.handleReportAbuse(form);
    });

    await act(async () => {
      resolveReportAbuse({
        ticket: {
          id: 'ticket-3',
          userId: 'user-1',
          category: 'other',
          description: form.description,
          referenceId: null,
          referenceType: null,
          status: 'open',
          createdAt: '2026-06-01T12:00:00.000Z',
          updatedAt: '2026-06-01T12:00:00.000Z',
        },
      });
      await firstRequest;
      await secondRequest;
    });

    await expect(secondRequest).resolves.toBe(false);
    expect(mockedReportAbuse).toHaveBeenCalledTimes(1);
  });

  it('abre mailto para contato com desenvolvedores', async () => {
    const openURLSpy = jest
      .spyOn(require('react-native').Linking, 'openURL')
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    await act(async () => {
      await result.current.handleContactDevs();
    });

    expect(openURLSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:suporte@truthordare.app'),
    );
    expect(result.current.supportContactMessage).toBeNull();

    openURLSpy.mockRestore();
  });

  it('exibe fallback quando mailto falha', async () => {
    const openURLSpy = jest
      .spyOn(require('react-native').Linking, 'openURL')
      .mockRejectedValue(new Error('sem app de e-mail'));
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    await act(async () => {
      await result.current.handleContactDevs();
    });

    expect(result.current.supportContactMessage).toContain(
      'suporte@truthordare.app',
    );

    openURLSpy.mockRestore();
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

  it('abre exclusao de conta no primeiro passo limpando feedback anterior', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.openDeleteAccountModal();
    });

    expect(result.current.activeModal).toBe('delete-account');
    expect(result.current.deleteAccountStep).toBe(1);
    expect(result.current.deleteAccountError).toBeNull();
  });

  it('valida senha antes de excluir conta', async () => {
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);
    const invalidForm: DeleteAccountForm = {
      currentPassword: '',
    };

    let success = true;
    await act(async () => {
      success = await result.current.handleDeleteAccount(invalidForm);
    });

    expect(success).toBe(false);
    expect(mockedDeleteAccount).not.toHaveBeenCalled();
    expect(result.current.deleteAccountFieldErrors).toEqual({
      currentPassword: 'Informe sua senha atual.',
    });
  });

  it('exclui conta removendo token, limpando dados locais e navegando com parametro', async () => {
    let resolveDeleteAccount: (value: { ok: true }) => void = () => undefined;
    mockedDeleteAccount.mockReturnValue(
      new Promise((resolve) => {
        resolveDeleteAccount = resolve;
      }),
    );
    const form: DeleteAccountForm = {
      currentPassword: 'senha-atual',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    let request: Promise<boolean> = Promise.resolve(false);
    act(() => {
      result.current.openDeleteAccountModal();
      result.current.handleContinueDeleteAccount();
      result.current.setDeleteAccountForm(form);
      request = result.current.handleDeleteAccount(form);
    });

    expect(result.current.isSubmittingDeleteAccount).toBe(true);

    await act(async () => {
      resolveDeleteAccount({ ok: true });
      await request;
    });

    expect(mockedDeleteAccount).toHaveBeenCalledWith({
      currentPassword: 'senha-atual',
    });
    expect(mockedClearLocalSettings).toHaveBeenCalledTimes(1);
    expect(mockedRemoveToken).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith('/login?accountDeleted=1');
    expect(result.current.user).toBeNull();
    expect(result.current.activeModal).toBeNull();
    expect(result.current.deleteAccountForm).toEqual({
      currentPassword: '',
    });
    expect(result.current.isSubmittingDeleteAccount).toBe(false);
  });

  it('exibe erro de exclusao e preserva senha para correcao', async () => {
    mockedDeleteAccount.mockRejectedValue(new Error('Senha atual incorreta'));
    const form: DeleteAccountForm = {
      currentPassword: 'senha-atual',
    };
    const { result } = renderHook(() => useSettingsScreen());
    await waitForLoadedUser(result);

    act(() => {
      result.current.openDeleteAccountModal();
      result.current.handleContinueDeleteAccount();
      result.current.setDeleteAccountForm(form);
    });

    let success = true;
    await act(async () => {
      success = await result.current.handleDeleteAccount(form);
    });

    expect(success).toBe(false);
    expect(result.current.activeModal).toBe('delete-account');
    expect(result.current.deleteAccountStep).toBe(2);
    expect(result.current.deleteAccountError).toBe('Senha atual incorreta');
    expect(result.current.deleteAccountForm).toEqual(form);
  });
});

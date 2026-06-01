import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  changeEmail,
  changePassword,
  deleteAccount,
  getMe,
  getMyProfile,
  updateMe,
  updateMyProfile,
} from '../services/api';

function makeJsonResponse(
  ok: boolean,
  status: number,
  body: Record<string, unknown>,
): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn(),
  } as unknown as Response;
}

function makeUserAccount() {
  return {
    id: 'user-1',
    name: 'Marina Configuracoes',
    email: 'marina@test.com',
    username: 'marina_config',
    bio: 'Bio atualizada',
    avatarUrl: null,
    isPrivate: true,
    createdAt: '2026-06-01T12:00:00.000Z',
  };
}

describe('settings API client', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
    global.fetch = fetchMock;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-123');
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('busca a conta autenticada com token salvo', async () => {
    const account = makeUserAccount();
    fetchMock.mockResolvedValue(makeJsonResponse(true, 200, account));

    await expect(getMe()).resolves.toEqual(account);

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-123',
      },
    });
  });

  it('atualiza parcialmente a conta autenticada sem completar o payload', async () => {
    const payload = {
      bio: null,
      isPrivate: false,
    };
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        ...makeUserAccount(),
        bio: null,
        isPrivate: false,
      }),
    );

    await updateMe(payload);

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-123',
      },
      body: JSON.stringify(payload),
    });
  });

  it('altera o e-mail enviando senha atual e token salvo', async () => {
    const payload = {
      newEmail: 'novo-email@test.com',
      currentPassword: 'senha-atual',
    };
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, {
        user: {
          id: 'user-1',
          email: payload.newEmail,
        },
      }),
    );

    await expect(changeEmail(payload)).resolves.toEqual({
      user: {
        id: 'user-1',
        email: payload.newEmail,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/auth/change-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify(payload),
      },
    );
  });

  it('altera a senha enviando credenciais e token salvo', async () => {
    const payload = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-segura',
    };
    fetchMock.mockResolvedValue(makeJsonResponse(true, 200, { ok: true }));

    await expect(changePassword(payload)).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/auth/change-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify(payload),
      },
    );
  });

  it('prepara exclusao de conta com DELETE autenticado', async () => {
    fetchMock.mockResolvedValue(makeJsonResponse(true, 200, { ok: true }));

    await expect(deleteAccount()).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/users/me', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token-123',
      },
    });
  });

  it.each([
    ['getMe', () => getMe()],
    ['updateMe', () => updateMe({ isPrivate: true })],
    [
      'changeEmail',
      () =>
        changeEmail({
          newEmail: 'novo-email@test.com',
          currentPassword: 'senha-atual',
        }),
    ],
    [
      'changePassword',
      () =>
        changePassword({
          currentPassword: 'senha-atual',
          newPassword: 'senha-nova-segura',
        }),
    ],
    ['deleteAccount', () => deleteAccount()],
  ])('bloqueia %s quando nao existe token salvo', async (_name, request) => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await expect(request()).rejects.toThrow('Token');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reaproveita parseResponse para propagar erro da API', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(false, 409, {
        error: 'E-mail ja esta em uso',
        code: 'EMAIL_ALREADY_IN_USE',
      }),
    );

    await expect(
      changeEmail({
        newEmail: 'duplicado@test.com',
        currentPassword: 'senha-atual',
      }),
    ).rejects.toThrow('E-mail ja esta em uso');
  });

  it('preserva getMyProfile e updateMyProfile para consumidores existentes', async () => {
    const profile = {
      id: 'user-1',
      name: 'Perfil Existente',
      email: 'perfil@test.com',
      username: null,
      bio: null,
      createdTruthsCount: 2,
      createdDaresCount: 3,
    };
    const updatePayload = {
      name: 'Perfil Atualizado',
    };
    fetchMock
      .mockResolvedValueOnce(makeJsonResponse(true, 200, profile))
      .mockResolvedValueOnce(
        makeJsonResponse(true, 200, {
          ...profile,
          ...updatePayload,
        }),
      );

    await expect(getMyProfile()).resolves.toEqual(profile);
    await expect(updateMyProfile(updatePayload)).resolves.toEqual({
      ...profile,
      ...updatePayload,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.test/users/me',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.test/users/me',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify(updatePayload),
      },
    );
  });
});

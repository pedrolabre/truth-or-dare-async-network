import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AuthRecoveryRequestError,
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
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

describe('auth recovery API', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
    global.fetch = fetchMock;
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('solicita recuperacao de senha sem token autenticado', async () => {
    fetchMock.mockResolvedValue(makeJsonResponse(true, 200, { ok: true }));

    await expect(
      requestPasswordReset('pessoa@email.com'),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/auth/forgot-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'pessoa@email.com' }),
      },
    );
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('verifica codigo e retorna resetToken sem persistir estado sensivel', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(true, 200, { resetToken: 'reset-token-123' }),
    );

    await expect(
      verifyResetCode('pessoa@email.com', '123456'),
    ).resolves.toEqual({ resetToken: 'reset-token-123' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/auth/verify-reset-code',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'pessoa@email.com',
          code: '123456',
        }),
      },
    );
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('redefine senha usando resetToken apenas como argumento', async () => {
    fetchMock.mockResolvedValue(makeJsonResponse(true, 200, { ok: true }));

    await expect(
      resetPassword('reset-token-123', 'NovaSenha123!'),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/auth/reset-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken: 'reset-token-123',
          newPassword: 'NovaSenha123!',
        }),
      },
    );
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('normaliza erros conhecidos retornados pelo backend', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(false, 400, {
        error: 'Invalid or expired code',
        code: 'INVALID_OR_EXPIRED_CODE',
      }),
    );

    await expect(
      verifyResetCode('pessoa@email.com', '000000'),
    ).rejects.toMatchObject({
      name: 'AuthRecoveryRequestError',
      code: 'INVALID_OR_EXPIRED_CODE',
      message: 'Invalid or expired code',
      status: 400,
    });
  });

  it('normaliza erros sem code conhecido como UNKNOWN_ERROR', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(false, 500, {
        error: 'Falha inesperada',
        code: 'SOMETHING_ELSE',
      }),
    );

    await expect(
      resetPassword('reset-token-123', 'NovaSenha123!'),
    ).rejects.toMatchObject({
      name: 'AuthRecoveryRequestError',
      code: 'UNKNOWN_ERROR',
      message: 'Falha inesperada',
      status: 500,
    });
  });

  it('expoe erro normalizado como instancia especifica da API de recuperacao', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse(false, 429, {
        error: 'Muitas tentativas. Tente novamente em alguns minutos.',
        code: 'RATE_LIMIT_EXCEEDED',
      }),
    );

    await expect(requestPasswordReset('pessoa@email.com')).rejects.toBeInstanceOf(
      AuthRecoveryRequestError,
    );
  });
});

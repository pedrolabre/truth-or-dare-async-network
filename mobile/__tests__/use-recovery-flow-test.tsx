import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { act, render, renderHook } from '@testing-library/react-native';

import ResetPasswordScreen from '../app/reset-password';
import {
  RecoveryFlowProvider,
  useRecoveryFlowContext,
} from '../context/RecoveryFlowContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useRecoveryFlow } from '../hooks/useRecoveryFlow';
import { AuthRecoveryRequestError } from '../services/api';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');

  return {
    MaterialIcons: (props: any) => React.createElement('MaterialIcons', props),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

describe('useRecoveryFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia codigo com sucesso e avanca para verificacao', async () => {
    const requestPasswordResetAction = jest
      .fn()
      .mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useRecoveryFlow({ requestPasswordResetAction }),
    );

    act(() => {
      result.current.setEmail(' Pessoa@Email.com ');
    });

    await act(async () => {
      await result.current.handleSendCode();
    });

    expect(requestPasswordResetAction).toHaveBeenCalledWith(
      'pessoa@email.com',
    );
    expect(result.current.email).toBe('pessoa@email.com');
    expect(result.current.step).toBe('code');
    expect(result.current.resendSecondsLeft).toBe(59);
    expect(result.current.errorCode).toBeNull();
  });

  it('bloqueia e-mail invalido sem chamar API', async () => {
    const requestPasswordResetAction = jest.fn();
    const { result } = renderHook(() =>
      useRecoveryFlow({ requestPasswordResetAction }),
    );

    act(() => {
      result.current.setEmail('email-invalido');
    });

    await act(async () => {
      await result.current.handleSendCode();
    });

    expect(requestPasswordResetAction).not.toHaveBeenCalled();
    expect(result.current.step).toBe('email');
    expect(result.current.errorCode).toBe('VALIDATION_ERROR');
  });

  it('bloqueia codigo invalido localmente sem chamar API', async () => {
    const verifyResetCodeAction = jest.fn();
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123');
    });

    await act(async () => {
      await result.current.handleVerifyCode();
    });

    expect(verifyResetCodeAction).not.toHaveBeenCalled();
    expect(result.current.errorCode).toBe('VALIDATION_ERROR');
    expect(result.current.hasResetToken).toBe(false);
  });

  it('normaliza erro de codigo invalido vindo da API', async () => {
    const verifyResetCodeAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'INVALID_OR_EXPIRED_CODE',
        message: 'Codigo invalido ou expirado.',
        status: 400,
      }),
    );
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123456');
    });

    await act(async () => {
      await result.current.handleVerifyCode();
    });

    expect(verifyResetCodeAction).toHaveBeenCalledWith(
      'pessoa@email.com',
      '123456',
    );
    expect(result.current.errorCode).toBe('INVALID_OR_EXPIRED_CODE');
    expect(result.current.code).toBe('');
    expect(result.current.hasResetToken).toBe(false);
  });

  it('bloqueia codigo por limite de tentativas e exige reinicio do fluxo', async () => {
    const verifyResetCodeAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'CODE_MAX_ATTEMPTS_REACHED',
        message: 'Limite de tentativas atingido.',
        status: 429,
      }),
    );
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123456');
    });

    await act(async () => {
      await result.current.handleVerifyCode();
    });

    expect(result.current.errorCode).toBe('CODE_MAX_ATTEMPTS_REACHED');
    expect(result.current.step).toBe('email');
    expect(result.current.code).toBe('');
    expect(result.current.hasResetToken).toBe(false);
    expect(result.current.canAccessNewPasswordStep).toBe(false);
  });

  it('reenvia codigo limpando codigo e erro', async () => {
    const requestPasswordResetAction = jest
      .fn()
      .mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useRecoveryFlow({
        requestPasswordResetAction,
        resendCooldownSeconds: 0,
      }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('654');
    });

    await act(async () => {
      await result.current.handleVerifyCode();
    });
    expect(result.current.errorCode).toBe('VALIDATION_ERROR');

    await act(async () => {
      await result.current.handleResendCode();
    });

    expect(requestPasswordResetAction).toHaveBeenCalledWith(
      'pessoa@email.com',
    );
    expect(result.current.step).toBe('code');
    expect(result.current.code).toBe('');
    expect(result.current.errorCode).toBeNull();
  });

  it('verifica codigo com sucesso e guarda resetToken apenas em memoria', async () => {
    const verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' });
    const resetPasswordAction = jest.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction, resetPasswordAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123456');
    });

    await act(async () => {
      await result.current.handleVerifyCode();
    });

    expect(result.current.step).toBe('new-password');
    expect(result.current.hasResetToken).toBe(true);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    act(() => {
      result.current.setNewPassword('NovaSenha123');
      result.current.setConfirmPassword('NovaSenha123');
    });

    await act(async () => {
      await result.current.handleResetPassword();
    });

    expect(resetPasswordAction).toHaveBeenCalledWith(
      'reset-token-123',
      'NovaSenha123',
    );
  });

  it('bloqueia reset com senha invalida e confirmacao divergente sem API', async () => {
    const verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' });
    const resetPasswordAction = jest.fn();
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction, resetPasswordAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123456');
    });
    await act(async () => {
      await result.current.handleVerifyCode();
    });

    act(() => {
      result.current.setNewPassword('fraca');
      result.current.setConfirmPassword('fraca');
    });
    await act(async () => {
      await result.current.handleResetPassword();
    });
    expect(result.current.errorCode).toBe('PASSWORD_TOO_WEAK');

    act(() => {
      result.current.clearError();
      result.current.setNewPassword('NovaSenha123');
      result.current.setConfirmPassword('OutraSenha123');
    });
    await act(async () => {
      await result.current.handleResetPassword();
    });

    expect(resetPasswordAction).not.toHaveBeenCalled();
    expect(result.current.errorCode).toBe('VALIDATION_ERROR');
  });

  it('trata resetToken expirado vindo da API', async () => {
    const verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' });
    const resetPasswordAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'RESET_TOKEN_INVALID',
        message: 'Token expirado.',
        status: 400,
      }),
    );
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction, resetPasswordAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123456');
    });
    await act(async () => {
      await result.current.handleVerifyCode();
    });
    act(() => {
      result.current.setNewPassword('NovaSenha123');
      result.current.setConfirmPassword('NovaSenha123');
    });

    await act(async () => {
      await result.current.handleResetPassword();
    });

    expect(result.current.errorCode).toBe('RESET_TOKEN_INVALID');
    expect(result.current.step).toBe('code');
    expect(result.current.hasResetToken).toBe(false);
    expect(result.current.newPassword).toBe('');
    expect(result.current.confirmPassword).toBe('');
  });

  it('limpa estado sensivel e avanca para sucesso apos reset', async () => {
    const verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' });
    const resetPasswordAction = jest.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction, resetPasswordAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123456');
    });
    await act(async () => {
      await result.current.handleVerifyCode();
    });
    act(() => {
      result.current.setNewPassword('NovaSenha123');
      result.current.setConfirmPassword('NovaSenha123');
    });

    await act(async () => {
      await result.current.handleResetPassword();
    });

    expect(result.current.step).toBe('success');
    expect(result.current.code).toBe('');
    expect(result.current.newPassword).toBe('');
    expect(result.current.confirmPassword).toBe('');
    expect(result.current.hasResetToken).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('cancela o fluxo limpando e-mail, codigo, senhas e resetToken', async () => {
    const verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' });
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
      result.current.setCode('123456');
    });
    await act(async () => {
      await result.current.handleVerifyCode();
    });
    act(() => {
      result.current.setNewPassword('NovaSenha123');
      result.current.setConfirmPassword('NovaSenha123');
      result.current.resetFlow();
    });

    expect(result.current.step).toBe('email');
    expect(result.current.email).toBe('');
    expect(result.current.code).toBe('');
    expect(result.current.newPassword).toBe('');
    expect(result.current.confirmPassword).toBe('');
    expect(result.current.hasResetToken).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('RecoveryFlowContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserva o mesmo fluxo em memoria entre renderizacoes', async () => {
    const requestPasswordResetAction = jest
      .fn()
      .mockResolvedValue({ ok: true });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RecoveryFlowProvider
        requestPasswordResetAction={requestPasswordResetAction}
      >
        {children}
      </RecoveryFlowProvider>
    );
    const { result, rerender } = renderHook(
      () => useRecoveryFlowContext(),
      { wrapper },
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
    });
    await act(async () => {
      await result.current.handleSendCode();
    });

    rerender(undefined);

    expect(result.current.email).toBe('pessoa@email.com');
    expect(result.current.step).toBe('code');
    expect(result.current.canAccessCodeStep).toBe(true);
    expect(result.current.hasResetToken).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('redireciona nova senha sem resetToken valido para o inicio do fluxo', () => {
    render(
      <ThemeProvider>
        <RecoveryFlowProvider>
          <ResetPasswordScreen />
        </RecoveryFlowProvider>
      </ThemeProvider>,
    );

    expect(mockRouterReplace).toHaveBeenCalledWith('/forgot-password');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

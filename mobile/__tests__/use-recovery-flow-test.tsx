import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { TextInput } from 'react-native';
import {
  act,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react-native';

import ForgotPasswordScreen from '../app/forgot-password';
import ResetPasswordScreen from '../app/reset-password';
import VerifyCodeScreen from '../app/verify-code';
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
        resendCooldownSeconds: 7,
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
    expect(result.current.resendSecondsLeft).toBe(7);
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

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderForgotPasswordScreen(
    requestPasswordResetAction = jest.fn().mockResolvedValue({ ok: true }),
  ) {
    return {
      requestPasswordResetAction,
      ...render(
        <ThemeProvider>
          <RecoveryFlowProvider
            requestPasswordResetAction={requestPasswordResetAction}
          >
            <ForgotPasswordScreen />
          </RecoveryFlowProvider>
        </ThemeProvider>,
      ),
    };
  }

  it('nao solicita codigo nem navega com e-mail invalido', () => {
    const {
      getByPlaceholderText,
      getByTestId,
      getByText,
      requestPasswordResetAction,
    } =
      renderForgotPasswordScreen();

    fireEvent.changeText(getByPlaceholderText('Seu e-mail'), 'email-invalido');
    fireEvent.press(getByTestId('forgot-password-send-code-button'));

    expect(getByText('Informe um e-mail valido.')).toBeTruthy();
    expect(requestPasswordResetAction).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('solicita codigo pelo fluxo real e navega para verificacao em sucesso', async () => {
    const { getByPlaceholderText, getByTestId, requestPasswordResetAction } =
      renderForgotPasswordScreen();

    fireEvent.changeText(
      getByPlaceholderText('Seu e-mail'),
      ' Pessoa@Email.com ',
    );
    fireEvent.press(getByTestId('forgot-password-send-code-button'));

    await waitFor(() => {
      expect(requestPasswordResetAction).toHaveBeenCalledWith(
        'pessoa@email.com',
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/verify-code');
    });
  });

  it('mantem a tela e exibe erro normalizado quando a API aplica rate limit', async () => {
    const requestPasswordResetAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas tentativas. Aguarde alguns minutos.',
        status: 429,
      }),
    );
    const { getByPlaceholderText, getByTestId, getByText } =
      renderForgotPasswordScreen(requestPasswordResetAction);

    fireEvent.changeText(
      getByPlaceholderText('Seu e-mail'),
      'pessoa@email.com',
    );
    fireEvent.press(getByTestId('forgot-password-send-code-button'));

    await waitFor(() => {
      expect(requestPasswordResetAction).toHaveBeenCalledWith(
        'pessoa@email.com',
      );
      expect(
        getByText('Muitas tentativas. Aguarde alguns minutos.'),
      ).toBeTruthy();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  it('desabilita o botao durante o envio real do codigo', async () => {
    let resolveRequest: (value: { ok: true }) => void = () => {};
    const requestPasswordResetAction = jest.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { getByPlaceholderText, getByTestId } =
      renderForgotPasswordScreen(requestPasswordResetAction);

    fireEvent.changeText(
      getByPlaceholderText('Seu e-mail'),
      'pessoa@email.com',
    );
    fireEvent.press(getByTestId('forgot-password-send-code-button'));

    await waitFor(() => {
      expect(
        getByTestId('forgot-password-send-code-button').props
          .accessibilityState.disabled,
      ).toBe(true);
    });

    await act(async () => {
      resolveRequest({ ok: true });
    });
  });

  it('voltar para login cancela e limpa o fluxo sensivel', async () => {
    const {
      getByPlaceholderText,
      getByTestId,
      getByText,
      requestPasswordResetAction,
    } =
      renderForgotPasswordScreen();

    fireEvent.changeText(
      getByPlaceholderText('Seu e-mail'),
      'pessoa@email.com',
    );
    fireEvent.press(getByTestId('forgot-password-send-code-button'));

    await waitFor(() => {
      expect(requestPasswordResetAction).toHaveBeenCalledWith(
        'pessoa@email.com',
      );
    });

    fireEvent.press(getByText('Voltar para o login'));

    expect(mockRouterReplace).toHaveBeenCalledWith('/login');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('VerifyCodeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  type RenderVerifyCodeOptions = {
    requestPasswordResetAction?: jest.Mock;
    verifyResetCodeAction?: jest.Mock;
    resendCooldownSeconds?: number;
  };

  function SeededVerifyCodeScreen({
    initialEmail,
  }: {
    initialEmail: string;
  }) {
    const flow = useRecoveryFlowContext();
    const [requested, setRequested] = React.useState(false);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
      if (!flow.email) {
        flow.setEmail(initialEmail);
      }
    }, [flow, initialEmail]);

    React.useEffect(() => {
      if (
        flow.email === initialEmail &&
        flow.step === 'email' &&
        !requested
      ) {
        setRequested(true);
        void flow.handleSendCode();
      }
    }, [flow, initialEmail, requested]);

    React.useEffect(() => {
      if (flow.step === 'code') {
        setReady(true);
      }
    }, [flow.step]);

    if (!ready) {
      return null;
    }

    return <VerifyCodeScreen />;
  }

  function renderVerifyCodeScreen({
    requestPasswordResetAction = jest.fn().mockResolvedValue({ ok: true }),
    verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' }),
    resendCooldownSeconds = 0,
  }: RenderVerifyCodeOptions = {}) {
    return {
      requestPasswordResetAction,
      verifyResetCodeAction,
      ...render(
        <ThemeProvider>
          <RecoveryFlowProvider
            requestPasswordResetAction={requestPasswordResetAction}
            verifyResetCodeAction={verifyResetCodeAction}
            resendCooldownSeconds={resendCooldownSeconds}
          >
            <SeededVerifyCodeScreen initialEmail="pessoa@email.com" />
          </RecoveryFlowProvider>
        </ThemeProvider>,
      ),
    };
  }

  async function fillVerificationCode(
    screen: ReturnType<typeof renderVerifyCodeScreen>,
    code: string,
  ) {
    await waitFor(() => {
      expect(screen.getByText('CONFIRME SEU ACESSO')).toBeTruthy();
    });

    fireEvent.changeText(screen.UNSAFE_getAllByType(TextInput)[0], code);
  }

  it('redireciona verificacao sem e-mail valido para solicitacao', () => {
    render(
      <ThemeProvider>
        <RecoveryFlowProvider>
          <VerifyCodeScreen />
        </RecoveryFlowProvider>
      </ThemeProvider>,
    );

    expect(mockRouterReplace).toHaveBeenCalledWith('/forgot-password');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('nao verifica codigo incompleto nem navega', async () => {
    const screen = renderVerifyCodeScreen();

    await fillVerificationCode(screen, '123');
    fireEvent.press(screen.getByTestId('verify-code-submit-button'));

    expect(screen.verifyResetCodeAction).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('verify-code-submit-button').props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it('verifica codigo pelo fluxo real, guarda resetToken em memoria e navega', async () => {
    const screen = renderVerifyCodeScreen();

    await fillVerificationCode(screen, '123456');
    fireEvent.press(screen.getByTestId('verify-code-submit-button'));

    await waitFor(() => {
      expect(screen.verifyResetCodeAction).toHaveBeenCalledWith(
        'pessoa@email.com',
        '123456',
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/reset-password');
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('exibe erro de codigo invalido sem navegar para nova senha', async () => {
    const verifyResetCodeAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'INVALID_OR_EXPIRED_CODE',
        message: 'Codigo invalido ou expirado.',
        status: 400,
      }),
    );
    const screen = renderVerifyCodeScreen({ verifyResetCodeAction });

    await fillVerificationCode(screen, '000000');
    fireEvent.press(screen.getByTestId('verify-code-submit-button'));

    await waitFor(() => {
      expect(verifyResetCodeAction).toHaveBeenCalledWith(
        'pessoa@email.com',
        '000000',
      );
      expect(screen.getByText('Codigo invalido ou expirado.')).toBeTruthy();
      expect(mockRouterPush).not.toHaveBeenCalledWith('/reset-password');
    });
  });

  it('mantem protegido quando o limite de tentativas e atingido', async () => {
    const verifyResetCodeAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'CODE_MAX_ATTEMPTS_REACHED',
        message: 'Limite de tentativas atingido.',
        status: 429,
      }),
    );
    const screen = renderVerifyCodeScreen({ verifyResetCodeAction });

    await fillVerificationCode(screen, '111111');
    fireEvent.press(screen.getByTestId('verify-code-submit-button'));

    await waitFor(() => {
      expect(verifyResetCodeAction).toHaveBeenCalledWith(
        'pessoa@email.com',
        '111111',
      );
      expect(
        screen.getByText(
          'Limite de tentativas atingido. Solicite um novo codigo.',
        ),
      ).toBeTruthy();
      expect(mockRouterPush).not.toHaveBeenCalledWith('/reset-password');
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('reenvia codigo pelo fluxo real e limpa erro de verificacao', async () => {
    const requestPasswordResetAction = jest
      .fn()
      .mockResolvedValue({ ok: true });
    const verifyResetCodeAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'INVALID_OR_EXPIRED_CODE',
        message: 'Codigo invalido ou expirado.',
        status: 400,
      }),
    );
    const screen = renderVerifyCodeScreen({
      requestPasswordResetAction,
      verifyResetCodeAction,
    });

    await fillVerificationCode(screen, '000000');
    fireEvent.press(screen.getByTestId('verify-code-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Codigo invalido ou expirado.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Reenviar agora'));

    await waitFor(() => {
      expect(requestPasswordResetAction).toHaveBeenCalledTimes(2);
      expect(requestPasswordResetAction).toHaveBeenLastCalledWith(
        'pessoa@email.com',
      );
      expect(screen.queryByText('Codigo invalido ou expirado.')).toBeNull();
    });
  });

  it('desabilita o botao durante a verificacao real', async () => {
    let resolveVerify: (value: { resetToken: string }) => void = () => {};
    const verifyResetCodeAction = jest.fn(
      () =>
        new Promise<{ resetToken: string }>((resolve) => {
          resolveVerify = resolve;
        }),
    );
    const screen = renderVerifyCodeScreen({ verifyResetCodeAction });

    await fillVerificationCode(screen, '123456');
    fireEvent.press(screen.getByTestId('verify-code-submit-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('verify-code-submit-button').props
          .accessibilityState.disabled,
      ).toBe(true);
    });

    await act(async () => {
      resolveVerify({ resetToken: 'reset-token-123' });
    });
  });

  it('voltar para login cancela o fluxo de verificacao', async () => {
    const screen = renderVerifyCodeScreen();

    await waitFor(() => {
      expect(screen.getByText('CONFIRME SEU ACESSO')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Voltar para o login'));

    expect(mockRouterReplace).toHaveBeenCalledWith('/login');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

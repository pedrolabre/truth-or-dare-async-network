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
import PasswordSuccessScreen from '../app/password-success';
import ResetPasswordScreen from '../app/reset-password';
import VerifyCodeScreen from '../app/verify-code';
import {
  RecoveryFlowProvider,
  useRecoveryFlowContext,
} from '../context/RecoveryFlowContext';
import { ThemeProvider } from '../context/ThemeContext';
import RecoveryTextField from '../components/auth-recovery/RecoveryTextField';
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

const recoveryTextFieldColors = {
  text: '#171d1a',
  textMuted: '#6d7a74',
  textSoft: '#3d4944',
  danger: '#D70015',
  border: '#bccac2',
  inputBackground: '#e4eae5',
};

describe('RecoveryTextField', () => {
  it('exibe errorMessage abaixo do campo sem alterar o valor', () => {
    const onChangeText = jest.fn();
    const { getByText, getByDisplayValue } = render(
      <RecoveryTextField
        label="E-mail"
        value="pessoa@email.com"
        onChangeText={onChangeText}
        colors={recoveryTextFieldColors}
        errorMessage="Informe um e-mail valido."
      />,
    );

    expect(getByDisplayValue('pessoa@email.com')).toBeTruthy();
    expect(getByText('Informe um e-mail valido.')).toBeTruthy();
  });

  it('inicia senha oculta e alterna visibilidade pelo toggle acessivel', () => {
    const { UNSAFE_getByType, getByTestId } = render(
      <RecoveryTextField
        label="Senha"
        value="NovaSenha123"
        onChangeText={jest.fn()}
        colors={recoveryTextFieldColors}
        secureTextEntry
        showPasswordToggle
        passwordToggleTestID="password-visibility-toggle"
      />,
    );

    expect(UNSAFE_getByType(TextInput).props.secureTextEntry).toBe(true);
    expect(getByTestId('password-visibility-toggle').props.accessibilityLabel).toBe(
      'Mostrar senha',
    );

    fireEvent.press(getByTestId('password-visibility-toggle'));

    expect(UNSAFE_getByType(TextInput).props.secureTextEntry).toBe(false);
    expect(getByTestId('password-visibility-toggle').props.accessibilityLabel).toBe(
      'Ocultar senha',
    );

    fireEvent.press(getByTestId('password-visibility-toggle'));

    expect(UNSAFE_getByType(TextInput).props.secureTextEntry).toBe(true);
  });
});

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

  it('ignora envio duplicado enquanto a solicitacao esta em andamento', async () => {
    let resolveRequest: (value: { ok: true }) => void = () => {};
    const requestPasswordResetAction = jest.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useRecoveryFlow({ requestPasswordResetAction }),
    );
    const requests: Promise<boolean>[] = [];

    act(() => {
      result.current.setEmail('pessoa@email.com');
    });

    act(() => {
      requests.push(result.current.handleSendCode());
      requests.push(result.current.handleSendCode());
    });

    await expect(requests[1]).resolves.toBe(false);
    expect(requestPasswordResetAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({ ok: true });
      await requests[0];
    });
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
    expect(result.current.errorMessage).toBe(
      'Codigo invalido ou expirado. Solicite um novo codigo.',
    );
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

  it('usa mensagem generica para erro desconhecido sem vazar detalhe da API', async () => {
    const requestPasswordResetAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'UNKNOWN_ERROR',
        message: 'stack trace interno',
        status: 500,
      }),
    );
    const { result } = renderHook(() =>
      useRecoveryFlow({ requestPasswordResetAction }),
    );

    act(() => {
      result.current.setEmail('pessoa@email.com');
    });

    await act(async () => {
      await result.current.handleSendCode();
    });

    expect(result.current.errorCode).toBe('UNKNOWN_ERROR');
    expect(result.current.errorMessage).toBe(
      'Nao foi possivel concluir a recuperacao de senha. Tente novamente.',
    );
  });

  it('ignora reset duplicado enquanto a redefinicao esta em andamento', async () => {
    const verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' });
    let resolveReset: (value: { ok: true }) => void = () => {};
    const resetPasswordAction = jest.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveReset = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useRecoveryFlow({ verifyResetCodeAction, resetPasswordAction }),
    );
    const requests: Promise<boolean>[] = [];

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

    act(() => {
      requests.push(result.current.handleResetPassword());
      requests.push(result.current.handleResetPassword());
    });

    await expect(requests[1]).resolves.toBe(false);
    expect(resetPasswordAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveReset({ ok: true });
      await requests[0];
    });
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

  it('mantem foco inicial e envio por teclado no campo de e-mail', async () => {
    const { getByPlaceholderText, requestPasswordResetAction } =
      renderForgotPasswordScreen();

    const emailInput = getByPlaceholderText('Seu e-mail');
    expect(emailInput.props.autoFocus).toBe(true);
    expect(emailInput.props.returnKeyType).toBe('send');

    fireEvent.changeText(emailInput, ' Pessoa@Email.com ');
    fireEvent(getByPlaceholderText('Seu e-mail'), 'submitEditing');

    await waitFor(() => {
      expect(requestPasswordResetAction).toHaveBeenCalledWith(
        'pessoa@email.com',
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/verify-code');
    });
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
        getByText(
          'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
        ),
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
      if (!flow.email && !ready) {
        flow.setEmail(initialEmail);
      }
    }, [flow, initialEmail, ready]);

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

    fireEvent.changeText(screen.getByTestId('verification-code-digit-1'), code);
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

  it('mantem foco inicial, labels acessiveis e envio por teclado no codigo', async () => {
    const screen = renderVerifyCodeScreen();

    await waitFor(() => {
      expect(screen.getByText('CONFIRME SEU ACESSO')).toBeTruthy();
    });

    expect(screen.getByTestId('verification-code-digit-1').props.autoFocus).toBe(
      true,
    );
    expect(
      screen.getByLabelText('Digito 1 do codigo de recuperacao'),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Digito 6 do codigo de recuperacao'),
    ).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId('verification-code-digit-1'),
      '123456',
    );
    fireEvent(screen.getByTestId('verification-code-digit-6'), 'submitEditing');

    await waitFor(() => {
      expect(screen.verifyResetCodeAction).toHaveBeenCalledWith(
        'pessoa@email.com',
        '123456',
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/reset-password');
    });
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
      expect(
        screen.getByText(
          'Codigo invalido ou expirado. Solicite um novo codigo.',
        ),
      ).toBeTruthy();
      expect(mockRouterPush).not.toHaveBeenCalledWith('/reset-password');
    });
    expect(
      screen.getByTestId('verification-code-digit-1').props.accessibilityHint,
    ).toBe('Codigo com erro');
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
      expect(
        screen.getByText(
          'Codigo invalido ou expirado. Solicite um novo codigo.',
        ),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Reenviar agora'));

    await waitFor(() => {
      expect(requestPasswordResetAction).toHaveBeenCalledTimes(2);
      expect(requestPasswordResetAction).toHaveBeenLastCalledWith(
        'pessoa@email.com',
      );
      expect(
        screen.queryByText(
          'Codigo invalido ou expirado. Solicite um novo codigo.',
        ),
      ).toBeNull();
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
      expect(screen.getByTestId('verification-code-digit-1').props.editable).toBe(
        false,
      );
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

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  type RenderResetPasswordOptions = {
    requestPasswordResetAction?: jest.Mock;
    verifyResetCodeAction?: jest.Mock;
    resetPasswordAction?: jest.Mock;
  };

  function FlowObserver({
    onChange,
  }: {
    onChange: (flow: ReturnType<typeof useRecoveryFlowContext>) => void;
  }) {
    const flow = useRecoveryFlowContext();

    React.useEffect(() => {
      onChange(flow);
    }, [flow, onChange]);

    return null;
  }

  function SeededResetPasswordScreen({
    initialEmail,
    initialCode,
  }: {
    initialEmail: string;
    initialCode: string;
  }) {
    const flow = useRecoveryFlowContext();
    const [requested, setRequested] = React.useState(false);
    const [verified, setVerified] = React.useState(false);
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
      if (flow.step === 'code' && flow.code !== initialCode) {
        flow.setCode(initialCode);
      }
    }, [flow, initialCode]);

    React.useEffect(() => {
      if (flow.step === 'code' && flow.code === initialCode && !verified) {
        setVerified(true);
        void flow.handleVerifyCode();
      }
    }, [flow, initialCode, verified]);

    React.useEffect(() => {
      if (flow.step === 'new-password') {
        setReady(true);
      }
    }, [flow.step]);

    if (!ready) {
      return null;
    }

    return <ResetPasswordScreen />;
  }

  function renderResetPasswordScreen({
    requestPasswordResetAction = jest.fn().mockResolvedValue({ ok: true }),
    verifyResetCodeAction = jest
      .fn()
      .mockResolvedValue({ resetToken: 'reset-token-123' }),
    resetPasswordAction = jest.fn().mockResolvedValue({ ok: true }),
  }: RenderResetPasswordOptions = {}) {
    let latestFlow: ReturnType<typeof useRecoveryFlowContext> | null = null;
    const handleFlowChange = (
      flow: ReturnType<typeof useRecoveryFlowContext>,
    ) => {
      latestFlow = flow;
    };

    return {
      requestPasswordResetAction,
      verifyResetCodeAction,
      resetPasswordAction,
      getFlow: () => latestFlow,
      ...render(
        <ThemeProvider>
          <RecoveryFlowProvider
            requestPasswordResetAction={requestPasswordResetAction}
            verifyResetCodeAction={verifyResetCodeAction}
            resetPasswordAction={resetPasswordAction}
            resendCooldownSeconds={0}
          >
            <FlowObserver onChange={handleFlowChange} />
            <SeededResetPasswordScreen
              initialEmail="pessoa@email.com"
              initialCode="123456"
            />
          </RecoveryFlowProvider>
        </ThemeProvider>,
      ),
    };
  }

  async function fillResetPasswords(
    screen: ReturnType<typeof renderResetPasswordScreen>,
    password: string,
    confirmPassword: string,
  ) {
    await waitFor(() => {
      expect(screen.getByText('NOVA SENHA')).toBeTruthy();
    });

    const inputs = screen.UNSAFE_getAllByType(TextInput);

    fireEvent.changeText(inputs[0], password);
    fireEvent.changeText(inputs[1], confirmPassword);
  }

  it('nao chama resetPassword nem navega com senha fraca', async () => {
    const screen = renderResetPasswordScreen();

    await fillResetPasswords(screen, 'fraca', 'fraca');
    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    expect(
      screen.getByText(
        'Use uma senha com pelo menos 8 caracteres, uma letra maiuscula e um numero.',
      ),
    ).toBeTruthy();
    expect(screen.resetPasswordAction).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/password-success');
    expect(
      screen.getByTestId('reset-password-submit-button').props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it('nao chama resetPassword nem navega com confirmacao divergente', async () => {
    const screen = renderResetPasswordScreen();

    await fillResetPasswords(screen, 'NovaSenha123', 'OutraSenha123');
    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    expect(screen.getByText('As senhas precisam coincidir.')).toBeTruthy();
    expect(screen.resetPasswordAction).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/password-success');
    expect(
      screen.getByTestId('reset-password-submit-button').props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it('redefine senha pelo fluxo real usando resetToken em memoria e navega para sucesso', async () => {
    const screen = renderResetPasswordScreen();

    await fillResetPasswords(screen, 'NovaSenha123', 'NovaSenha123');
    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    await waitFor(() => {
      expect(screen.resetPasswordAction).toHaveBeenCalledWith(
        'reset-token-123',
        'NovaSenha123',
      );
      expect(mockRouterReplace).toHaveBeenCalledWith('/password-success');
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('mantem campos de senha ocultos e alterna visibilidade pelos toggles', async () => {
    const screen = renderResetPasswordScreen();

    await waitFor(() => {
      expect(screen.getByText('NOVA SENHA')).toBeTruthy();
    });

    expect(screen.UNSAFE_getAllByType(TextInput)[0].props.secureTextEntry).toBe(
      true,
    );
    expect(screen.UNSAFE_getAllByType(TextInput)[1].props.secureTextEntry).toBe(
      true,
    );
    expect(
      screen.getByTestId('new-password-visibility-toggle').props
        .accessibilityLabel,
    ).toBe('Mostrar senha');

    fireEvent.press(screen.getByTestId('new-password-visibility-toggle'));

    expect(screen.UNSAFE_getAllByType(TextInput)[0].props.secureTextEntry).toBe(
      false,
    );
    expect(
      screen.getByTestId('new-password-visibility-toggle').props
        .accessibilityLabel,
    ).toBe('Ocultar senha');

    fireEvent.press(screen.getByTestId('new-password-visibility-toggle'));
    fireEvent.press(screen.getByTestId('confirm-password-visibility-toggle'));

    expect(screen.UNSAFE_getAllByType(TextInput)[0].props.secureTextEntry).toBe(
      true,
    );
    expect(screen.UNSAFE_getAllByType(TextInput)[1].props.secureTextEntry).toBe(
      false,
    );
  });

  it('usa returnKeyType adequado e envia senha valida pelo teclado', async () => {
    const screen = renderResetPasswordScreen();

    await fillResetPasswords(screen, 'NovaSenha123', 'NovaSenha123');

    const inputs = screen.UNSAFE_getAllByType(TextInput);
    expect(inputs[0].props.returnKeyType).toBe('next');
    expect(inputs[1].props.returnKeyType).toBe('done');

    fireEvent(inputs[1], 'submitEditing');

    await waitFor(() => {
      expect(screen.resetPasswordAction).toHaveBeenCalledWith(
        'reset-token-123',
        'NovaSenha123',
      );
      expect(mockRouterReplace).toHaveBeenCalledWith('/password-success');
    });
  });

  it('exibe PASSWORD_TOO_WEAK da API sem navegar para sucesso', async () => {
    const resetPasswordAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'PASSWORD_TOO_WEAK',
        message: 'Senha muito fraca.',
        status: 400,
      }),
    );
    const screen = renderResetPasswordScreen({ resetPasswordAction });

    await fillResetPasswords(screen, 'NovaSenha123', 'NovaSenha123');
    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    await waitFor(() => {
      expect(resetPasswordAction).toHaveBeenCalledWith(
        'reset-token-123',
        'NovaSenha123',
      );
      expect(
        screen.getByText(
          'Use uma senha com pelo menos 8 caracteres, uma letra maiuscula e um numero.',
        ),
      ).toBeTruthy();
      expect(mockRouterReplace).not.toHaveBeenCalledWith('/password-success');
    });
  });

  it('exibe SAME_PASSWORD da API sem navegar para sucesso', async () => {
    const resetPasswordAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'SAME_PASSWORD',
        message: 'Escolha uma senha diferente da senha atual.',
        status: 400,
      }),
    );
    const screen = renderResetPasswordScreen({ resetPasswordAction });

    await fillResetPasswords(screen, 'NovaSenha123', 'NovaSenha123');
    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    await waitFor(() => {
      expect(resetPasswordAction).toHaveBeenCalledWith(
        'reset-token-123',
        'NovaSenha123',
      );
      expect(
        screen.getByText('Escolha uma senha diferente da senha atual.'),
      ).toBeTruthy();
      expect(mockRouterReplace).not.toHaveBeenCalledWith('/password-success');
    });
  });

  it('limpa resetToken e protege o fluxo quando RESET_TOKEN_INVALID vem da API', async () => {
    const resetPasswordAction = jest.fn().mockRejectedValue(
      new AuthRecoveryRequestError({
        code: 'RESET_TOKEN_INVALID',
        message: 'Sua sessao de recuperacao expirou. Solicite um novo codigo.',
        status: 400,
      }),
    );
    const screen = renderResetPasswordScreen({ resetPasswordAction });

    await fillResetPasswords(screen, 'NovaSenha123', 'NovaSenha123');
    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    await waitFor(() => {
      expect(resetPasswordAction).toHaveBeenCalledWith(
        'reset-token-123',
        'NovaSenha123',
      );
      expect(mockRouterReplace).toHaveBeenCalledWith('/forgot-password');
      expect(mockRouterReplace).not.toHaveBeenCalledWith('/password-success');
      expect(screen.getFlow()?.hasResetToken).toBe(false);
      expect(screen.getFlow()?.newPassword).toBe('');
      expect(screen.getFlow()?.confirmPassword).toBe('');
    });
  });

  it('desabilita o botao durante a redefinicao real', async () => {
    let resolveReset: (value: { ok: true }) => void = () => {};
    const resetPasswordAction = jest.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveReset = resolve;
        }),
    );
    const screen = renderResetPasswordScreen({ resetPasswordAction });

    await fillResetPasswords(screen, 'NovaSenha123', 'NovaSenha123');
    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('reset-password-submit-button').props
          .accessibilityState.disabled,
      ).toBe(true);
    });

    await act(async () => {
      resolveReset({ ok: true });
    });
  });

  it('cancelar limpa estado sensivel e volta para solicitacao', async () => {
    const screen = renderResetPasswordScreen();

    await fillResetPasswords(screen, 'NovaSenha123', 'NovaSenha123');
    fireEvent.press(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/forgot-password');
      expect(screen.getFlow()?.step).toBe('email');
      expect(screen.getFlow()?.newPassword).toBe('');
      expect(screen.getFlow()?.confirmPassword).toBe('');
      expect(screen.getFlow()?.hasResetToken).toBe(false);
    });
  });
});

describe('PasswordSuccessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function FlowObserver({
    onChange,
  }: {
    onChange: (flow: ReturnType<typeof useRecoveryFlowContext>) => void;
  }) {
    const flow = useRecoveryFlowContext();

    React.useEffect(() => {
      onChange(flow);
    }, [flow, onChange]);

    return null;
  }

  function SeededPasswordSuccessScreen() {
    const flow = useRecoveryFlowContext();
    const [requested, setRequested] = React.useState(false);
    const [verified, setVerified] = React.useState(false);
    const [reset, setReset] = React.useState(false);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
      if (!flow.email && !ready) {
        flow.setEmail('pessoa@email.com');
      }
    }, [flow, ready]);

    React.useEffect(() => {
      if (
        flow.email === 'pessoa@email.com' &&
        flow.step === 'email' &&
        !requested
      ) {
        setRequested(true);
        void flow.handleSendCode();
      }
    }, [flow, requested]);

    React.useEffect(() => {
      if (flow.step === 'code' && flow.code !== '123456') {
        flow.setCode('123456');
      }
    }, [flow]);

    React.useEffect(() => {
      if (flow.step === 'code' && flow.code === '123456' && !verified) {
        setVerified(true);
        void flow.handleVerifyCode();
      }
    }, [flow, verified]);

    React.useEffect(() => {
      if (flow.step === 'new-password' && !reset) {
        setReset(true);
        flow.setNewPassword('NovaSenha123');
        flow.setConfirmPassword('NovaSenha123');
      }
    }, [flow, reset]);

    React.useEffect(() => {
      if (
        flow.step === 'new-password' &&
        flow.newPassword === 'NovaSenha123' &&
        flow.confirmPassword === 'NovaSenha123' &&
        reset
      ) {
        void flow.handleResetPassword();
      }
    }, [flow, reset]);

    React.useEffect(() => {
      if (flow.step === 'success') {
        setReady(true);
      }
    }, [flow.step]);

    if (!ready) {
      return null;
    }

    return <PasswordSuccessScreen />;
  }

  function renderPasswordSuccessScreen() {
    let latestFlow: ReturnType<typeof useRecoveryFlowContext> | null = null;
    const handleFlowChange = (
      flow: ReturnType<typeof useRecoveryFlowContext>,
    ) => {
      latestFlow = flow;
    };

    return {
      getFlow: () => latestFlow,
      ...render(
        <ThemeProvider>
          <RecoveryFlowProvider
            requestPasswordResetAction={jest.fn().mockResolvedValue({ ok: true })}
            verifyResetCodeAction={jest
              .fn()
              .mockResolvedValue({ resetToken: 'reset-token-123' })}
            resetPasswordAction={jest.fn().mockResolvedValue({ ok: true })}
            resendCooldownSeconds={0}
          >
            <FlowObserver onChange={handleFlowChange} />
            <SeededPasswordSuccessScreen />
          </RecoveryFlowProvider>
        </ThemeProvider>,
      ),
    };
  }

  it('redireciona sucesso sem etapa success para solicitacao', () => {
    render(
      <ThemeProvider>
        <RecoveryFlowProvider>
          <PasswordSuccessScreen />
        </RecoveryFlowProvider>
      </ThemeProvider>,
    );

    expect(mockRouterReplace).toHaveBeenCalledWith('/forgot-password');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('ir para login limpa o fluxo em memoria', async () => {
    const screen = renderPasswordSuccessScreen();

    await waitFor(() => {
      expect(screen.getByText('SENHA ALTERADA!')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('IR PARA O LOGIN'));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/login');
      expect(screen.getFlow()?.step).toBe('email');
      expect(screen.getFlow()?.email).toBe('');
      expect(screen.getFlow()?.hasResetToken).toBe(false);
      expect(screen.getFlow()?.newPassword).toBe('');
      expect(screen.getFlow()?.confirmPassword).toBe('');
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

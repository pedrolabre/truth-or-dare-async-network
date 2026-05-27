import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AuthRecoveryRequestError,
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
} from '../services/api';
import type {
  AuthRecoveryNormalizedErrorCode,
  ForgotPasswordResponse,
  RecoveryFlowStep,
  ResetPasswordResponse,
  VerifyResetCodeResponse,
} from '../types/authRecovery';

export const RECOVERY_CODE_LENGTH = 6;
export const RECOVERY_PASSWORD_MIN_LENGTH = 8;
export const RECOVERY_RESEND_COOLDOWN_SECONDS = 59;

type RequestPasswordResetAction = (
  email: string,
) => Promise<ForgotPasswordResponse>;

type VerifyResetCodeAction = (
  email: string,
  code: string,
) => Promise<VerifyResetCodeResponse>;

type ResetPasswordAction = (
  resetToken: string,
  newPassword: string,
) => Promise<ResetPasswordResponse>;

type RecoveryLoadingAction =
  | 'send-code'
  | 'verify-code'
  | 'resend-code'
  | 'reset-password';

type RecoveryFlowError = {
  code: AuthRecoveryNormalizedErrorCode;
  message: string;
};

export type UseRecoveryFlowOptions = {
  requestPasswordResetAction?: RequestPasswordResetAction;
  verifyResetCodeAction?: VerifyResetCodeAction;
  resetPasswordAction?: ResetPasswordAction;
  resendCooldownSeconds?: number;
};

const GENERIC_ERROR_MESSAGE =
  'Nao foi possivel concluir a recuperacao de senha. Tente novamente.';

const LOCAL_ERROR_MESSAGES: Record<AuthRecoveryNormalizedErrorCode, string> = {
  RATE_LIMIT_EXCEEDED:
    'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  INVALID_OR_EXPIRED_CODE: 'Codigo invalido ou expirado. Solicite um novo codigo.',
  CODE_MAX_ATTEMPTS_REACHED:
    'Limite de tentativas atingido. Solicite um novo codigo.',
  RESET_TOKEN_INVALID:
    'Sua sessao de recuperacao expirou. Solicite um novo codigo.',
  PASSWORD_TOO_WEAK:
    'Use uma senha com pelo menos 8 caracteres, uma letra maiuscula e um numero.',
  SAME_PASSWORD: 'Escolha uma senha diferente da senha atual.',
  VALIDATION_ERROR: 'Confira os dados informados e tente novamente.',
  UNKNOWN_ERROR: GENERIC_ERROR_MESSAGE,
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidCode(value: string) {
  return new RegExp(`^\\d{${RECOVERY_CODE_LENGTH}}$`).test(value.trim());
}

function getPasswordValidationError(password: string) {
  const trimmedPassword = password.trim();

  if (trimmedPassword.length < RECOVERY_PASSWORD_MIN_LENGTH) {
    return LOCAL_ERROR_MESSAGES.PASSWORD_TOO_WEAK;
  }

  if (!/[A-Z]/.test(trimmedPassword) || !/\d/.test(trimmedPassword)) {
    return LOCAL_ERROR_MESSAGES.PASSWORD_TOO_WEAK;
  }

  return null;
}

function getNormalizedError(error: unknown): RecoveryFlowError {
  if (error instanceof AuthRecoveryRequestError) {
    return {
      code: error.code,
      message: error.message || LOCAL_ERROR_MESSAGES[error.code],
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: GENERIC_ERROR_MESSAGE,
  };
}

export function useRecoveryFlow({
  requestPasswordResetAction = requestPasswordReset,
  verifyResetCodeAction = verifyResetCode,
  resetPasswordAction = resetPassword,
  resendCooldownSeconds = RECOVERY_RESEND_COOLDOWN_SECONDS,
}: UseRecoveryFlowOptions = {}) {
  const [step, setStep] = useState<RecoveryFlowStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] =
    useState<RecoveryLoadingAction | null>(null);
  const [error, setError] = useState<RecoveryFlowError | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSecondsLeft]);

  const emailErrorMessage = useMemo(() => {
    if (!email.trim() || isValidEmail(email)) {
      return null;
    }

    return 'Informe um e-mail valido.';
  }, [email]);

  const codeErrorMessage = useMemo(() => {
    if (!code.trim() || isValidCode(code)) {
      return null;
    }

    return 'Informe o codigo de 6 digitos.';
  }, [code]);

  const passwordValidationError = useMemo(
    () => getPasswordValidationError(newPassword),
    [newPassword],
  );
  const passwordErrorMessage = newPassword.trim()
    ? passwordValidationError
    : null;
  const confirmPasswordErrorMessage = useMemo(() => {
    if (!confirmPassword.trim()) {
      return null;
    }

    return newPassword.trim() === confirmPassword.trim()
      ? null
      : 'As senhas precisam coincidir.';
  }, [confirmPassword, newPassword]);

  const canSendCode = isValidEmail(email) && loadingAction === null;
  const canVerifyCode = isValidCode(code) && loadingAction === null;
  const canResendCode = resendSecondsLeft === 0 && loadingAction === null;
  const canResetPassword =
    resetToken !== null &&
    passwordValidationError === null &&
    newPassword.trim() === confirmPassword.trim() &&
    confirmPassword.trim().length > 0 &&
    loadingAction === null;
  const hasRecoveryEmail = isValidEmail(email);
  const hasResetToken = resetToken !== null;
  const canAccessCodeStep = hasRecoveryEmail;
  const canAccessNewPasswordStep =
    step === 'new-password' && hasRecoveryEmail && hasResetToken;
  const canAccessSuccessStep = step === 'success';

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setLocalError = useCallback(
    (codeValue: AuthRecoveryNormalizedErrorCode) => {
      setError({
        code: codeValue,
        message: LOCAL_ERROR_MESSAGES[codeValue],
      });
    },
    [],
  );

  const startCooldown = useCallback(() => {
    setResendSecondsLeft(Math.max(resendCooldownSeconds, 0));
  }, [resendCooldownSeconds]);

  const handleRecoverySessionExpired = useCallback(() => {
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken(null);
    setLoadingAction(null);
    setResendSecondsLeft(0);
    setStep(isValidEmail(email) ? 'code' : 'email');
    setError({
      code: 'RESET_TOKEN_INVALID',
      message: LOCAL_ERROR_MESSAGES.RESET_TOKEN_INVALID,
    });
  }, [email]);

  const handleCodeBlocked = useCallback(() => {
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken(null);
    setLoadingAction(null);
    setResendSecondsLeft(0);
    setStep('email');
    setError({
      code: 'CODE_MAX_ATTEMPTS_REACHED',
      message: LOCAL_ERROR_MESSAGES.CODE_MAX_ATTEMPTS_REACHED,
    });
  }, []);

  const handleSendCode = useCallback(async () => {
    if (loadingAction) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setLocalError('VALIDATION_ERROR');
      return false;
    }

    setLoadingAction('send-code');
    setError(null);

    try {
      await requestPasswordResetAction(normalizedEmail);
      setEmail(normalizedEmail);
      setCode('');
      setResetToken(null);
      setStep('code');
      startCooldown();
      return true;
    } catch (caughtError) {
      setError(getNormalizedError(caughtError));
      return false;
    } finally {
      setLoadingAction(null);
    }
  }, [
    email,
    loadingAction,
    requestPasswordResetAction,
    setLocalError,
    startCooldown,
  ]);

  const handleVerifyCode = useCallback(async () => {
    if (loadingAction) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!isValidEmail(normalizedEmail)) {
      setLocalError('VALIDATION_ERROR');
      return false;
    }

    if (!isValidCode(normalizedCode)) {
      setLocalError('VALIDATION_ERROR');
      return false;
    }

    setLoadingAction('verify-code');
    setError(null);

    try {
      const response = await verifyResetCodeAction(
        normalizedEmail,
        normalizedCode,
      );

      setEmail(normalizedEmail);
      setCode(normalizedCode);
      setResetToken(response.resetToken);
      setNewPassword('');
      setConfirmPassword('');
      setStep('new-password');
      return true;
    } catch (caughtError) {
      const normalizedError = getNormalizedError(caughtError);
      setError(normalizedError);

      if (normalizedError.code === 'CODE_MAX_ATTEMPTS_REACHED') {
        handleCodeBlocked();
      } else if (normalizedError.code === 'INVALID_OR_EXPIRED_CODE') {
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken(null);
      }

      return false;
    } finally {
      setLoadingAction(null);
    }
  }, [
    code,
    email,
    handleCodeBlocked,
    loadingAction,
    setLocalError,
    verifyResetCodeAction,
  ]);

  const handleResendCode = useCallback(async () => {
    if (loadingAction || resendSecondsLeft > 0) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setLocalError('VALIDATION_ERROR');
      return false;
    }

    setLoadingAction('resend-code');
    setError(null);

    try {
      await requestPasswordResetAction(normalizedEmail);
      setEmail(normalizedEmail);
      setCode('');
      setResetToken(null);
      setStep('code');
      startCooldown();
      return true;
    } catch (caughtError) {
      setError(getNormalizedError(caughtError));
      return false;
    } finally {
      setLoadingAction(null);
    }
  }, [
    email,
    loadingAction,
    requestPasswordResetAction,
    resendSecondsLeft,
    setLocalError,
    startCooldown,
  ]);

  const handleResetPassword = useCallback(async () => {
    if (loadingAction) {
      return false;
    }

    const trimmedPassword = newPassword.trim();
    const passwordValidationError = getPasswordValidationError(trimmedPassword);

    if (passwordValidationError) {
      setLocalError('PASSWORD_TOO_WEAK');
      return false;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setError({
        code: 'VALIDATION_ERROR',
        message: 'As senhas precisam coincidir.',
      });
      return false;
    }

    if (!resetToken) {
      handleRecoverySessionExpired();
      return false;
    }

    setLoadingAction('reset-password');
    setError(null);

    try {
      await resetPasswordAction(resetToken, trimmedPassword);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken(null);
      setResendSecondsLeft(0);
      setStep('success');
      return true;
    } catch (caughtError) {
      const normalizedError = getNormalizedError(caughtError);
      setError(normalizedError);

      if (normalizedError.code === 'RESET_TOKEN_INVALID') {
        handleRecoverySessionExpired();
      }

      return false;
    } finally {
      setLoadingAction(null);
    }
  }, [
    confirmPassword,
    loadingAction,
    handleRecoverySessionExpired,
    newPassword,
    resetPasswordAction,
    resetToken,
    setLocalError,
  ]);

  const resetFlow = useCallback(() => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken(null);
    setLoadingAction(null);
    setError(null);
    setResendSecondsLeft(0);
  }, []);

  return {
    step,
    email,
    code,
    newPassword,
    confirmPassword,
    loadingAction,
    isLoading: loadingAction !== null,
    isSendingCode: loadingAction === 'send-code',
    isVerifyingCode: loadingAction === 'verify-code',
    isResendingCode: loadingAction === 'resend-code',
    isResettingPassword: loadingAction === 'reset-password',
    errorCode: error?.code ?? null,
    errorMessage: error?.message ?? null,
    emailErrorMessage,
    codeErrorMessage,
    passwordErrorMessage,
    confirmPasswordErrorMessage,
    resendSecondsLeft,
    canSendCode,
    canVerifyCode,
    canResendCode,
    canResetPassword,
    hasRecoveryEmail,
    hasResetToken,
    canAccessCodeStep,
    canAccessNewPasswordStep,
    canAccessSuccessStep,
    setEmail,
    setCode,
    setNewPassword,
    setConfirmPassword,
    clearError,
    handleSendCode,
    handleVerifyCode,
    handleResendCode,
    handleResetPassword,
    handleRecoverySessionExpired,
    handleCodeBlocked,
    resetFlow,
  };
}

export type RecoveryFlow = ReturnType<typeof useRecoveryFlow>;

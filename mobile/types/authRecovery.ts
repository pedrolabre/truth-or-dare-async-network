export type RecoveryFlowStep = 'email' | 'code' | 'new-password' | 'success';

export type AuthRecoveryEndpoint =
  | '/auth/forgot-password'
  | '/auth/verify-reset-code'
  | '/auth/reset-password';

export type ForgotPasswordPayload = {
  email: string;
};

export type VerifyResetCodePayload = {
  email: string;
  code: string;
};

export type ResetPasswordPayload = {
  resetToken: string;
  newPassword: string;
};

export type ForgotPasswordResponse = {
  ok: true;
};

export type VerifyResetCodeResponse = {
  resetToken: string;
};

export type ResetPasswordResponse = {
  ok: true;
};

export type AuthRecoveryErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_OR_EXPIRED_CODE'
  | 'CODE_MAX_ATTEMPTS_REACHED'
  | 'RESET_TOKEN_INVALID'
  | 'PASSWORD_TOO_WEAK'
  | 'SAME_PASSWORD'
  | 'VALIDATION_ERROR';

export type AuthRecoveryNormalizedErrorCode =
  | AuthRecoveryErrorCode
  | 'UNKNOWN_ERROR';

export type AuthRecoveryBackendErrorResponse = {
  error?: string;
  message?: string;
  code?: string;
};

export type AuthRecoveryApiError = {
  code: AuthRecoveryNormalizedErrorCode;
  message: string;
  status?: number;
};

export type AuthRecoveryRequestByEndpoint = {
  '/auth/forgot-password': ForgotPasswordPayload;
  '/auth/verify-reset-code': VerifyResetCodePayload;
  '/auth/reset-password': ResetPasswordPayload;
};

export type AuthRecoveryResponseByEndpoint = {
  '/auth/forgot-password': ForgotPasswordResponse;
  '/auth/verify-reset-code': VerifyResetCodeResponse;
  '/auth/reset-password': ResetPasswordResponse;
};

export type AuthRecoveryPayload =
  | ForgotPasswordPayload
  | VerifyResetCodePayload
  | ResetPasswordPayload;

export type AuthRecoveryResponse =
  | ForgotPasswordResponse
  | VerifyResetCodeResponse
  | ResetPasswordResponse;

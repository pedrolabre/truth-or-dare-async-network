export type PasswordResetErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_OR_EXPIRED_CODE'
  | 'CODE_MAX_ATTEMPTS_REACHED'
  | 'RESET_TOKEN_INVALID'
  | 'PASSWORD_TOO_WEAK'
  | 'SAME_PASSWORD'
  | 'VALIDATION_ERROR';

export class PasswordResetServiceError extends Error {
  constructor(
    public code: PasswordResetErrorCode,
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export function validationError(message: string): never {
  throw new PasswordResetServiceError('VALIDATION_ERROR', message, 400);
}

export function rateLimitExceededError(): never {
  throw new PasswordResetServiceError(
    'RATE_LIMIT_EXCEEDED',
    'Too many reset requests',
    429,
  );
}

export function invalidOrExpiredCodeError(): never {
  throw new PasswordResetServiceError(
    'INVALID_OR_EXPIRED_CODE',
    'Invalid or expired code',
    400,
  );
}

export function codeMaxAttemptsReachedError(): never {
  throw new PasswordResetServiceError(
    'CODE_MAX_ATTEMPTS_REACHED',
    'Code max attempts reached',
    429,
  );
}

export function resetTokenInvalidError(): never {
  throw new PasswordResetServiceError(
    'RESET_TOKEN_INVALID',
    'Reset token is invalid',
    401,
  );
}

export function passwordTooWeakError(): never {
  throw new PasswordResetServiceError(
    'PASSWORD_TOO_WEAK',
    'Password too weak',
    400,
  );
}

export function samePasswordError(): never {
  throw new PasswordResetServiceError(
    'SAME_PASSWORD',
    'Password must be different',
    409,
  );
}

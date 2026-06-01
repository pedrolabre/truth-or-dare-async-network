export type AccountSettingsErrorCode =
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_IN_USE'
  | 'INVALID_CURRENT_PASSWORD'
  | 'PASSWORD_TOO_WEAK'
  | 'SAME_PASSWORD'
  | 'VALIDATION_ERROR';

export class AccountSettingsServiceError extends Error {
  constructor(
    public code: AccountSettingsErrorCode,
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export function userNotFoundError(): never {
  throw new AccountSettingsServiceError(
    'USER_NOT_FOUND',
    'Usuario nao encontrado',
    404,
  );
}

export function emailAlreadyInUseError(): never {
  throw new AccountSettingsServiceError(
    'EMAIL_ALREADY_IN_USE',
    'E-mail ja esta em uso',
    409,
  );
}

export function invalidCurrentPasswordError(): never {
  throw new AccountSettingsServiceError(
    'INVALID_CURRENT_PASSWORD',
    'Senha atual incorreta',
    401,
  );
}

export function passwordTooWeakError(): never {
  throw new AccountSettingsServiceError(
    'PASSWORD_TOO_WEAK',
    'A nova senha deve ter pelo menos 8 caracteres',
    400,
  );
}

export function samePasswordError(): never {
  throw new AccountSettingsServiceError(
    'SAME_PASSWORD',
    'A nova senha deve ser diferente da senha atual',
    409,
  );
}

export function validationError(message: string): never {
  throw new AccountSettingsServiceError('VALIDATION_ERROR', message, 400);
}

export type UserSettingsErrorCode =
  | 'USER_NOT_FOUND'
  | 'INVALID_NAME'
  | 'INVALID_USERNAME'
  | 'INVALID_BIO'
  | 'INVALID_IS_PRIVATE'
  | 'INVALID_CURRENT_PASSWORD'
  | 'NO_FIELDS_TO_UPDATE'
  | 'USERNAME_ALREADY_IN_USE'
  | 'VALIDATION_ERROR';

export class UserSettingsServiceError extends Error {
  constructor(
    public code: UserSettingsErrorCode,
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export function userNotFoundError(): never {
  throw new UserSettingsServiceError(
    'USER_NOT_FOUND',
    'Usuario nao encontrado',
    404,
  );
}

export function invalidNameError(): never {
  throw new UserSettingsServiceError('INVALID_NAME', 'Nome invalido', 400);
}

export function invalidUsernameError(): never {
  throw new UserSettingsServiceError(
    'INVALID_USERNAME',
    'Username invalido',
    400,
  );
}

export function invalidBioError(): never {
  throw new UserSettingsServiceError('INVALID_BIO', 'Bio invalida', 400);
}

export function invalidIsPrivateError(): never {
  throw new UserSettingsServiceError(
    'INVALID_IS_PRIVATE',
    'Privacidade da conta invalida',
    400,
  );
}

export function invalidCurrentPasswordError(): never {
  throw new UserSettingsServiceError(
    'INVALID_CURRENT_PASSWORD',
    'Senha atual incorreta',
    401,
  );
}

export function noFieldsToUpdateError(): never {
  throw new UserSettingsServiceError(
    'NO_FIELDS_TO_UPDATE',
    'Nenhum campo valido para atualizacao',
    400,
  );
}

export function usernameAlreadyInUseError(): never {
  throw new UserSettingsServiceError(
    'USERNAME_ALREADY_IN_USE',
    'Username ja esta em uso',
    409,
  );
}

export function validationError(message: string): never {
  throw new UserSettingsServiceError('VALIDATION_ERROR', message, 400);
}

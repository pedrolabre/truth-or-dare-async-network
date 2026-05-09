export type ClubErrorCode =
  | 'CLUB_NOT_FOUND'
  | 'CLUB_FORBIDDEN'
  | 'CLUB_DUPLICATE_SLUG'
  | 'CLUB_VALIDATION_ERROR';

export class ClubServiceError extends Error {
  constructor(
    public code: ClubErrorCode,
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export function validationError(message: string): never {
  throw new ClubServiceError('CLUB_VALIDATION_ERROR', message, 400);
}

export function notFoundError(): never {
  throw new ClubServiceError('CLUB_NOT_FOUND', 'Clube nao encontrado', 404);
}

export function forbiddenError(): never {
  throw new ClubServiceError(
    'CLUB_FORBIDDEN',
    'Sem permissao para este clube',
    403,
  );
}

export function duplicateSlugError(): never {
  throw new ClubServiceError('CLUB_DUPLICATE_SLUG', 'Slug de clube ja existe', 409);
}

export function requireAuthenticatedUser(userId: string) {
  if (!userId) {
    validationError('Usuario autenticado nao encontrado');
  }
}

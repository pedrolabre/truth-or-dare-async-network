export type ClubErrorCode =
  | 'CLUB_NOT_FOUND'
  | 'CLUB_FORBIDDEN'
  | 'CLUB_DUPLICATE_SLUG'
  | 'CLUB_DUPLICATE_INVITE'
  | 'CLUB_DUPLICATE_REPORT'
  | 'CLUB_RATE_LIMIT_EXCEEDED'
  | 'CLUB_MEMBER_BLOCKED'
  | 'CLUB_POSTING_SUSPENDED'
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

export function forbiddenError(message = 'Sem permissao para este clube'): never {
  throw new ClubServiceError(
    'CLUB_FORBIDDEN',
    message,
    403,
  );
}

export function duplicateSlugError(): never {
  throw new ClubServiceError('CLUB_DUPLICATE_SLUG', 'Slug de clube ja existe', 409);
}

export function duplicateReportError(): never {
  throw new ClubServiceError(
    'CLUB_DUPLICATE_REPORT',
    'Denuncia ja registrada',
    409,
  );
}

export function duplicateInviteError(): never {
  throw new ClubServiceError(
    'CLUB_DUPLICATE_INVITE',
    'Usuario ja recebeu convite recente para este clube',
    409,
  );
}

export function rateLimitError(message: string): never {
  throw new ClubServiceError('CLUB_RATE_LIMIT_EXCEEDED', message, 429);
}

export function blockedMemberError(): never {
  throw new ClubServiceError(
    'CLUB_MEMBER_BLOCKED',
    'Usuario bloqueado neste clube',
    403,
  );
}

export function postingSuspendedError(suspendedUntil: Date): never {
  throw new ClubServiceError(
    'CLUB_POSTING_SUSPENDED',
    `Postagem suspensa neste clube ate ${suspendedUntil.toISOString()}`,
    403,
  );
}

export function requireAuthenticatedUser(userId: string) {
  if (!userId) {
    validationError('Usuario autenticado nao encontrado');
  }
}

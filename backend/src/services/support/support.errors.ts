export type SupportTicketErrorCode =
  | 'USER_NOT_FOUND'
  | 'INVALID_CATEGORY'
  | 'INVALID_DESCRIPTION'
  | 'INVALID_REFERENCE_ID'
  | 'INVALID_REFERENCE_TYPE';

export class SupportTicketServiceError extends Error {
  constructor(
    public code: SupportTicketErrorCode,
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export function supportUserNotFoundError(): never {
  throw new SupportTicketServiceError(
    'USER_NOT_FOUND',
    'Usuario nao encontrado',
    404,
  );
}

export function invalidSupportCategoryError(): never {
  throw new SupportTicketServiceError(
    'INVALID_CATEGORY',
    'Categoria de denuncia invalida',
    400,
  );
}

export function invalidSupportDescriptionError(): never {
  throw new SupportTicketServiceError(
    'INVALID_DESCRIPTION',
    'Descricao da denuncia invalida',
    400,
  );
}

export function invalidSupportReferenceIdError(): never {
  throw new SupportTicketServiceError(
    'INVALID_REFERENCE_ID',
    'Referencia da denuncia invalida',
    400,
  );
}

export function invalidSupportReferenceTypeError(): never {
  throw new SupportTicketServiceError(
    'INVALID_REFERENCE_TYPE',
    'Tipo da referencia da denuncia invalido',
    400,
  );
}

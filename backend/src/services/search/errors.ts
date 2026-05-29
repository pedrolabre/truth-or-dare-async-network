export type SearchErrorCode =
  | 'SEARCH_QUERY_TOO_SHORT'
  | 'SEARCH_QUERY_TOO_LONG'
  | 'SEARCH_UNAVAILABLE';

export class SearchServiceError extends Error {
  constructor(
    public code: SearchErrorCode,
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export function queryTooShortError(): never {
  throw new SearchServiceError(
    'SEARCH_QUERY_TOO_SHORT',
    'Busca deve ter pelo menos 2 caracteres',
    400,
  );
}

export function queryTooLongError(): never {
  throw new SearchServiceError(
    'SEARCH_QUERY_TOO_LONG',
    'Busca deve ter no maximo 80 caracteres',
    400,
  );
}

export function searchUnavailableError(): never {
  throw new SearchServiceError(
    'SEARCH_UNAVAILABLE',
    'Busca indisponivel no momento',
    503,
  );
}

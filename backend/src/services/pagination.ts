export type CursorPaginationInput = {
  limit?: unknown;
  cursor?: unknown;
  offset?: unknown;
};

export type NormalizedCursorPagination = {
  limit: number;
  cursor?: string;
  offset?: number;
};

type NormalizeCursorPaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
  allowOffset?: boolean;
};

export const DEFAULT_CURSOR_LIMIT = 20;
export const MAX_CURSOR_LIMIT = 50;

export function normalizeCursorPagination(
  input: CursorPaginationInput = {},
  options: NormalizeCursorPaginationOptions = {},
): NormalizedCursorPagination {
  const defaultLimit = options.defaultLimit ?? DEFAULT_CURSOR_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_CURSOR_LIMIT;
  const rawLimit = Number(input.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), maxLimit)
    : defaultLimit;
  const cursor =
    typeof input.cursor === 'string' && input.cursor.trim()
      ? input.cursor.trim()
      : undefined;
  const rawOffset = Number(input.offset);
  const offset =
    options.allowOffset &&
    !cursor &&
    Number.isFinite(rawOffset) &&
    rawOffset > 0
      ? Math.trunc(rawOffset)
      : undefined;

  return {
    limit,
    cursor,
    offset,
  };
}

export function getCursorPaginationArgs({
  cursor,
  offset,
}: {
  cursor?: string;
  offset?: number;
}): { cursor?: { id: string }; skip?: number } {
  if (cursor) {
    return {
      cursor: {
        id: cursor,
      },
      skip: 1,
    };
  }

  if (offset) {
    return {
      skip: offset,
    };
  }

  return {};
}

export function buildCursorPaginationResult<T extends { id: string }>(
  records: T[],
  limit: number,
) {
  const hasNextPage = records.length > limit;
  const items = records.slice(0, limit);

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1]?.id ?? null : null,
  };
}

export function paginateRecordsInMemory<T extends { id: string }>(
  records: T[],
  pagination: { limit: number; cursor?: string; offset?: number },
) {
  const startIndex = pagination.cursor
    ? records.findIndex((record) => record.id === pagination.cursor) + 1
    : pagination.offset ?? 0;

  return buildCursorPaginationResult(
    records.slice(Math.max(0, startIndex)),
    pagination.limit,
  );
}

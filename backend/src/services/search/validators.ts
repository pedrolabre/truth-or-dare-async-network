import { queryTooLongError, queryTooShortError } from './errors';
import { NormalizedSearchPaginationOptions, SearchPaginationOptions } from './types';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 80;
export const SEARCH_DEFAULT_LIMIT = 20;
export const SEARCH_MAX_LIMIT = 50;
export const SEARCH_TRENDING_WINDOW_HOURS = 48;
export const SEARCH_TRENDING_MEMBER_GROWTH_THRESHOLD = 5;

export function normalizeSearchQuery(query: unknown) {
  if (typeof query !== 'string') {
    queryTooShortError();
  }

  const normalizedQuery = query.trim();

  if (normalizedQuery.length < SEARCH_QUERY_MIN_LENGTH) {
    queryTooShortError();
  }

  if (normalizedQuery.length > SEARCH_QUERY_MAX_LENGTH) {
    queryTooLongError();
  }

  return normalizedQuery;
}

export function normalizePaginationOptions(
  options: SearchPaginationOptions = {},
): NormalizedSearchPaginationOptions {
  const rawLimit = Number(options.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), SEARCH_MAX_LIMIT)
    : SEARCH_DEFAULT_LIMIT;

  const cursor =
    typeof options.cursor === 'string' && options.cursor.trim()
      ? options.cursor.trim()
      : undefined;

  const rawOffset = Number(options.offset);
  const offset =
    !cursor && Number.isFinite(rawOffset) && rawOffset > 0
      ? Math.trunc(rawOffset)
      : undefined;

  return {
    limit,
    cursor,
    offset,
  };
}

export function normalizeTrendingThreshold(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return SEARCH_TRENDING_MEMBER_GROWTH_THRESHOLD;
  }

  return Math.trunc(numericValue);
}

export function normalizeTrendingWindowHours(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return SEARCH_TRENDING_WINDOW_HOURS;
  }

  return Math.trunc(numericValue);
}

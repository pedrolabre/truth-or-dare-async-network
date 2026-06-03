import { queryTooLongError, queryTooShortError } from './errors';
import { NormalizedSearchPaginationOptions, SearchPaginationOptions } from './types';
import { normalizeCursorPagination } from '../pagination';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 80;
export const SEARCH_DEFAULT_LIMIT = 20;
export const SEARCH_MAX_LIMIT = 50;
export const SEARCH_TRENDING_WINDOW_HOURS = 48;
export const SEARCH_TRENDING_MEMBER_GROWTH_THRESHOLD = 5;
export const SEARCH_ONLINE_WINDOW_MINUTES = 5;

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
  return normalizeCursorPagination(options, {
    defaultLimit: SEARCH_DEFAULT_LIMIT,
    maxLimit: SEARCH_MAX_LIMIT,
    allowOffset: true,
  });
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

export function normalizeSearchLevel(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return undefined;
  }

  return Math.trunc(numericValue);
}

export function normalizeBooleanFilter(value: unknown) {
  return value === true || value === 'true' || value === '1';
}

export function normalizeClubVisibilityFilter(value: unknown) {
  return value === 'public' ? 'public' : undefined;
}

export function normalizeClubTagFilter(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedTag = value.trim().toLowerCase();

  return normalizedTag || undefined;
}

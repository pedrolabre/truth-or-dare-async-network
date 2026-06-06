import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SearchFilters } from '../types/search';

const SEARCH_FILTERS_STORAGE_PREFIX = '@truth-or-dare/search/filters';
const ANONYMOUS_SEARCH_FILTERS_NAMESPACE = 'anonymous';

function normalizeFilterNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeSearchFilters(filters: SearchFilters = {}): SearchFilters {
  const clubTag = filters.clubTag?.trim() || null;

  return {
    minLevel: normalizeFilterNumber(filters.minLevel),
    maxLevel: normalizeFilterNumber(filters.maxLevel),
    onlineOnly: Boolean(filters.onlineOnly),
    clubVisibility:
      filters.clubVisibility === 'public' ? 'public' : undefined,
    clubTag,
  };
}

function getSearchFiltersStorageKey(userId?: string | null) {
  const namespace =
    userId?.trim() || ANONYMOUS_SEARCH_FILTERS_NAMESPACE;

  return `${SEARCH_FILTERS_STORAGE_PREFIX}/${encodeURIComponent(namespace)}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseSearchFilters(value: string | null): SearchFilters | null {
  if (!value) {
    return null;
  }

  const parsedValue = JSON.parse(value);

  if (!isPlainObject(parsedValue)) {
    return null;
  }

  return normalizeSearchFilters(parsedValue as SearchFilters);
}

export async function loadSearchFilters(
  userId?: string | null,
): Promise<SearchFilters | null> {
  try {
    const storedValue = await AsyncStorage.getItem(
      getSearchFiltersStorageKey(userId),
    );

    return parseSearchFilters(storedValue);
  } catch {
    return null;
  }
}

export async function saveSearchFilters(
  userId: string | null | undefined,
  filters: SearchFilters,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      getSearchFiltersStorageKey(userId),
      JSON.stringify(normalizeSearchFilters(filters)),
    );
  } catch {
    return;
  }
}

export async function clearSearchFilters(
  userId?: string | null,
): Promise<void> {
  try {
    await AsyncStorage.removeItem(getSearchFiltersStorageKey(userId));
  } catch {
    return;
  }
}

export const searchPreferencesInternals = {
  getSearchFiltersStorageKey,
  normalizeSearchFilters,
};

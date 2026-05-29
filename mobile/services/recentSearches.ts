import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SearchRecentItem, SearchResultType } from '../types/search';

export const RECENT_SEARCHES_LIMIT = 10;

const RECENT_SEARCHES_STORAGE_PREFIX = '@truth-or-dare/search/recent';
const SEARCH_RECENT_TYPES = new Set<SearchResultType>(['user', 'club']);

function getRecentSearchesStorageKey(userId: string): string | null {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return null;
  }

  return `${RECENT_SEARCHES_STORAGE_PREFIX}/${encodeURIComponent(
    normalizedUserId,
  )}`;
}

function isSearchRecentItem(value: unknown): value is SearchRecentItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<SearchRecentItem>;

  return (
    typeof item.id === 'string' &&
    typeof item.label === 'string' &&
    typeof item.referenceId === 'string' &&
    typeof item.type === 'string' &&
    SEARCH_RECENT_TYPES.has(item.type as SearchResultType)
  );
}

function parseRecentSearches(value: string | null): SearchRecentItem[] {
  if (!value) {
    return [];
  }

  const parsedValue = JSON.parse(value);

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue.filter(isSearchRecentItem).slice(0, RECENT_SEARCHES_LIMIT);
}

export async function loadRecentSearches(
  userId: string,
): Promise<SearchRecentItem[]> {
  const storageKey = getRecentSearchesStorageKey(userId);

  if (!storageKey) {
    return [];
  }

  try {
    const storedValue = await AsyncStorage.getItem(storageKey);

    return parseRecentSearches(storedValue);
  } catch {
    return [];
  }
}

export async function saveRecentSearch(
  userId: string,
  item: SearchRecentItem,
): Promise<void> {
  const storageKey = getRecentSearchesStorageKey(userId);

  if (!storageKey) {
    return;
  }

  try {
    const recentSearches = await loadRecentSearches(userId);
    const nextRecentSearches = [
      item,
      ...recentSearches.filter((recentItem) => recentItem.id !== item.id),
    ].slice(0, RECENT_SEARCHES_LIMIT);

    await AsyncStorage.setItem(storageKey, JSON.stringify(nextRecentSearches));
  } catch {
    return;
  }
}

export async function removeRecentSearch(
  userId: string,
  id: string,
): Promise<void> {
  const storageKey = getRecentSearchesStorageKey(userId);

  if (!storageKey) {
    return;
  }

  try {
    const recentSearches = await loadRecentSearches(userId);
    const nextRecentSearches = recentSearches.filter(
      (recentItem) => recentItem.id !== id,
    );

    await AsyncStorage.setItem(storageKey, JSON.stringify(nextRecentSearches));
  } catch {
    return;
  }
}

export async function clearRecentSearches(userId: string): Promise<void> {
  const storageKey = getRecentSearchesStorageKey(userId);

  if (!storageKey) {
    return;
  }

  try {
    await AsyncStorage.removeItem(storageKey);
  } catch {
    return;
  }
}

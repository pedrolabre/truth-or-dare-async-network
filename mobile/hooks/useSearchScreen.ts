import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getMyProfile,
  getRecommendedUsers,
  getTrendingClubs,
  searchAll,
} from '../services/api';
import {
  clearRecentSearches,
  loadRecentSearches,
  RECENT_SEARCHES_LIMIT,
  removeRecentSearch,
  saveRecentSearch,
} from '../services/recentSearches';
import type {
  SearchClubItem,
  SearchFilterKey,
  SearchRecentItem,
  SearchResultGroup,
  SearchUserItem,
} from '../types/search';

type SearchResultItem = SearchUserItem | SearchClubItem;

const SEARCH_DEBOUNCE_MS = 350;

type UseSearchScreenOptions = {
  userId?: string | null;
  onPressFilter?: () => void;
  onPressUserResult?: (user: SearchUserItem) => void;
  onPressClubResult?: (club: SearchClubItem) => void;
};

export type UseSearchScreenReturn = {
  query: string;
  activeFilter: SearchFilterKey;
  recentSearches: SearchRecentItem[];
  recommendedUsers: SearchUserItem[];
  trendingClubs: SearchClubItem[];
  results: SearchResultGroup;
  isLoading: boolean;
  isLoadingMore: boolean;
  isInitialState: boolean;
  isEmptyResult: boolean;
  hasAnyResults: boolean;
  error: string | null;
  hasMoreUsers: boolean;
  hasMoreClubs: boolean;
  setQuery: (value: string) => void;
  setActiveFilter: (value: SearchFilterKey) => void;
  retry: () => Promise<void>;
  clearQuery: () => void;
  onPressFilter: () => void;
  saveRecentFromResult: (item: SearchResultItem) => Promise<void>;
  removeRecent: (id: string) => Promise<void>;
  clearAllRecent: () => Promise<void>;
  onPressRecent: (item: SearchRecentItem) => Promise<void>;
  onPressUserResult: (user: SearchUserItem) => Promise<void>;
  onPressClubResult: (club: SearchClubItem) => Promise<void>;
};

function isSearchUserItem(item: SearchResultItem): item is SearchUserItem {
  return 'username' in item;
}

function mapResultToRecentItem(item: SearchResultItem): SearchRecentItem {
  const type = isSearchUserItem(item) ? 'user' : 'club';

  return {
    id: `${type}:${item.id}`,
    label: item.name,
    type,
    referenceId: item.id,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Nao foi possivel carregar a busca.';
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function useSearchScreen(
  options: UseSearchScreenOptions = {},
): UseSearchScreenReturn {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterKey>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    options.userId?.trim() || null,
  );
  const currentUserIdRef = useRef<string | null>(options.userId?.trim() || null);
  const [recentSearches, setRecentSearches] = useState<SearchRecentItem[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<SearchUserItem[]>(
    [],
  );
  const [trendingClubs, setTrendingClubs] = useState<SearchClubItem[]>([]);
  const [baseResults, setBaseResults] = useState<SearchResultGroup>({
    users: [],
    clubs: [],
  });
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [isSearchingImmediate, setIsSearchingImmediate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDebouncedSearchRef = useRef<string | null>(null);

  const trimmedQuery = query.trim();

  const clearDebouncedSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const cancelCurrentSearch = useCallback(() => {
    clearDebouncedSearch();
    searchRequestIdRef.current += 1;
    searchAbortControllerRef.current?.abort();
    searchAbortControllerRef.current = null;
    setIsSearchingImmediate(false);
  }, [clearDebouncedSearch]);

  const resolveRecentSearchesUserId = useCallback(async () => {
    const optionUserId = options.userId?.trim();

    if (optionUserId) {
      return optionUserId;
    }

    if (currentUserIdRef.current) {
      return currentUserIdRef.current;
    }

    try {
      const profile = await getMyProfile();

      return profile.id;
    } catch {
      return null;
    }
  }, [options.userId]);

  const applyResolvedUserId = useCallback((userId: string | null) => {
    currentUserIdRef.current = userId;
    setCurrentUserId(userId);
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoadingInitialData(true);

    try {
      const [nextRecommendedUsers, nextTrendingClubs, resolvedUserId] =
        await Promise.all([
          getRecommendedUsers().catch(() => []),
          getTrendingClubs().catch(() => []),
          resolveRecentSearchesUserId(),
        ]);

      const nextRecentSearches = resolvedUserId
        ? await loadRecentSearches(resolvedUserId).catch(() => [])
        : [];

      applyResolvedUserId(resolvedUserId);
      setRecommendedUsers(nextRecommendedUsers);
      setTrendingClubs(nextTrendingClubs);
      setRecentSearches(nextRecentSearches);
    } catch {
      setRecommendedUsers([]);
      setTrendingClubs([]);
      setRecentSearches([]);
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [applyResolvedUserId, resolveRecentSearchesUserId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoadingInitialData(true);

      try {
        const [nextRecommendedUsers, nextTrendingClubs, resolvedUserId] =
          await Promise.all([
            getRecommendedUsers().catch(() => []),
            getTrendingClubs().catch(() => []),
            resolveRecentSearchesUserId(),
          ]);

        const nextRecentSearches = resolvedUserId
          ? await loadRecentSearches(resolvedUserId).catch(() => [])
          : [];

        if (!isMounted) {
          return;
        }

        applyResolvedUserId(resolvedUserId);
        setRecommendedUsers(nextRecommendedUsers);
        setTrendingClubs(nextTrendingClubs);
        setRecentSearches(nextRecentSearches);
      } catch {
        if (!isMounted) {
          return;
        }

        setRecommendedUsers([]);
        setTrendingClubs([]);
        setRecentSearches([]);
      } finally {
        if (isMounted) {
          setIsLoadingInitialData(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [applyResolvedUserId, resolveRecentSearchesUserId]);

  const runImmediateSearch = useCallback(
    async (term: string) => {
      const nextQuery = term.trim();

      if (!nextQuery) {
        cancelCurrentSearch();
        setBaseResults({ users: [], clubs: [] });
        setError(null);
        return;
      }

      clearDebouncedSearch();
      const requestId = searchRequestIdRef.current + 1;
      const abortController = new AbortController();

      searchRequestIdRef.current = requestId;
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = abortController;
      setIsSearchingImmediate(true);
      setError(null);

      try {
        const nextResults = await searchAll(
          nextQuery,
          undefined,
          abortController.signal,
        );

        if (
          searchRequestIdRef.current !== requestId ||
          abortController.signal.aborted
        ) {
          return;
        }

        setBaseResults(nextResults);
      } catch (searchError) {
        if (
          searchRequestIdRef.current !== requestId ||
          abortController.signal.aborted ||
          isAbortError(searchError)
        ) {
          return;
        }

        setBaseResults({ users: [], clubs: [] });
        setError(getErrorMessage(searchError));
      } finally {
        if (searchRequestIdRef.current === requestId) {
          searchAbortControllerRef.current = null;
          setIsSearchingImmediate(false);
        }
      }
    },
    [cancelCurrentSearch, clearDebouncedSearch],
  );

  useEffect(() => {
    if (!trimmedQuery) {
      cancelCurrentSearch();
      setBaseResults({ users: [], clubs: [] });
      setError(null);
      skipNextDebouncedSearchRef.current = null;
      return;
    }

    if (skipNextDebouncedSearchRef.current === trimmedQuery) {
      skipNextDebouncedSearchRef.current = null;
      return;
    }

    skipNextDebouncedSearchRef.current = null;
    cancelCurrentSearch();

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      runImmediateSearch(trimmedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearDebouncedSearch();
    };
  }, [
    cancelCurrentSearch,
    clearDebouncedSearch,
    runImmediateSearch,
    trimmedQuery,
  ]);

  useEffect(() => {
    return () => {
      searchRequestIdRef.current += 1;
      clearDebouncedSearch();
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = null;
    };
  }, [clearDebouncedSearch]);

  const persistRecentItem = useCallback(
    async (item: SearchRecentItem) => {
      const userId = currentUserId?.trim();

      setRecentSearches((currentItems) => [
        item,
        ...currentItems.filter((currentItem) => currentItem.id !== item.id),
      ].slice(0, RECENT_SEARCHES_LIMIT));

      if (userId) {
        await saveRecentSearch(userId, item);
      }
    },
    [currentUserId],
  );

  const saveRecentFromResult = useCallback(
    async (item: SearchResultItem) => {
      await persistRecentItem(mapResultToRecentItem(item));
    },
    [persistRecentItem],
  );

  const removeRecent = useCallback(
    async (id: string) => {
      const userId = currentUserId?.trim();

      setRecentSearches((currentItems) =>
        currentItems.filter((item) => item.id !== id),
      );

      if (userId) {
        await removeRecentSearch(userId, id);
      }
    },
    [currentUserId],
  );

  const clearAllRecent = useCallback(async () => {
    const userId = currentUserId?.trim();

    setRecentSearches([]);

    if (userId) {
      await clearRecentSearches(userId);
    }
  }, [currentUserId]);

  const onPressRecent = useCallback(
    async (item: SearchRecentItem) => {
      cancelCurrentSearch();
      skipNextDebouncedSearchRef.current = item.label.trim();
      setQuery(item.label);
      await persistRecentItem(item);
      await runImmediateSearch(item.label);
    },
    [cancelCurrentSearch, persistRecentItem, runImmediateSearch],
  );

  const clearQuery = useCallback(() => {
    cancelCurrentSearch();
    setQuery('');
    setBaseResults({ users: [], clubs: [] });
    setError(null);
  }, [cancelCurrentSearch]);

  const retry = useCallback(async () => {
    if (!trimmedQuery) {
      await loadInitialData();
      return;
    }

    await runImmediateSearch(trimmedQuery);
  }, [loadInitialData, runImmediateSearch, trimmedQuery]);

  const onPressFilter = useCallback(() => {
    options.onPressFilter?.();
  }, [options]);

  const onPressUserResult = useCallback(
    async (user: SearchUserItem) => {
      await saveRecentFromResult(user);
      options.onPressUserResult?.(user);
    },
    [options, saveRecentFromResult],
  );

  const onPressClubResult = useCallback(
    async (club: SearchClubItem) => {
      await saveRecentFromResult(club);
      options.onPressClubResult?.(club);
    },
    [options, saveRecentFromResult],
  );

  const results = useMemo<SearchResultGroup>(() => {
    if (activeFilter === 'users') {
      return {
        users: baseResults.users,
        clubs: [],
      };
    }

    if (activeFilter === 'clubs') {
      return {
        users: [],
        clubs: baseResults.clubs,
      };
    }

    return baseResults;
  }, [activeFilter, baseResults]);

  const isInitialState = trimmedQuery.length === 0;
  const hasAnyResults = results.users.length > 0 || results.clubs.length > 0;
  const isEmptyResult = !isInitialState && !hasAnyResults;
  const isLoading = isSearchingImmediate;

  return {
    query,
    activeFilter,
    recentSearches,
    recommendedUsers,
    trendingClubs,
    results,
    isLoading,
    isLoadingMore: false,
    isInitialState,
    isEmptyResult,
    hasAnyResults,
    error,
    hasMoreUsers: false,
    hasMoreClubs: false,
    setQuery,
    setActiveFilter,
    retry,
    clearQuery,
    onPressFilter,
    saveRecentFromResult,
    removeRecent,
    clearAllRecent,
    onPressRecent,
    onPressUserResult,
    onPressClubResult,
  };
}

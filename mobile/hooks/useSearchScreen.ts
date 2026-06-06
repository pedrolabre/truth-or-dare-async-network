import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getMyProfile,
  getRecommendedUsers,
  getTrendingClubs,
  searchClubs,
  searchContent,
  searchUsers,
} from '../services/api';
import {
  clearRecentSearches,
  loadRecentSearches,
  RECENT_SEARCHES_LIMIT,
  removeRecentSearch,
  saveRecentSearch,
} from '../services/recentSearches';
import {
  clearSearchFilters,
  loadSearchFilters,
  saveSearchFilters,
} from '../services/searchPreferences';
import type {
  SearchClubItem,
  SearchContentItem,
  SearchFilters,
  SearchFilterKey,
  SearchRecentItem,
  SearchResultGroup,
  SearchUserItem,
} from '../types/search';

type SearchResultItem = SearchUserItem | SearchClubItem;

const SEARCH_DEBOUNCE_MS = 350;

const EMPTY_SEARCH_FILTERS: SearchFilters = {
  minLevel: null,
  maxLevel: null,
  onlineOnly: false,
  clubVisibility: undefined,
  clubTag: null,
};

type UseSearchScreenOptions = {
  userId?: string | null;
  onPressFilter?: () => void;
  onPressUserResult?: (user: SearchUserItem) => void;
  onPressClubResult?: (club: SearchClubItem) => void;
  onPressContentResult?: (content: SearchContentItem) => void;
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
  hasMoreContent: boolean;
  filters: SearchFilters;
  hasActiveFilters: boolean;
  loadMoreUsers: () => Promise<void>;
  loadMoreClubs: () => Promise<void>;
  loadMoreContent: () => Promise<void>;
  setQuery: (value: string) => void;
  setActiveFilter: (value: SearchFilterKey) => void;
  retry: () => Promise<void>;
  clearQuery: () => void;
  applyFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  onPressFilter: () => void;
  saveRecentFromResult: (item: SearchResultItem) => Promise<void>;
  removeRecent: (id: string) => Promise<void>;
  clearAllRecent: () => Promise<void>;
  onPressRecent: (item: SearchRecentItem) => Promise<void>;
  onPressUserResult: (user: SearchUserItem) => Promise<void>;
  onPressClubResult: (club: SearchClubItem) => Promise<void>;
  onPressContentResult: (content: SearchContentItem) => Promise<void>;
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

function normalizeFilterNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeFilters(filters: SearchFilters = {}): SearchFilters {
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

function areSearchFiltersActive(filters: SearchFilters) {
  return (
    filters.minLevel !== null ||
    filters.maxLevel !== null ||
    Boolean(filters.onlineOnly) ||
    filters.clubVisibility === 'public' ||
    Boolean(filters.clubTag?.trim())
  );
}

export function useSearchScreen(
  options: UseSearchScreenOptions = {},
): UseSearchScreenReturn {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterKey>('all');
  const [filters, setFilters] = useState<SearchFilters>(
    EMPTY_SEARCH_FILTERS,
  );
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
    content: [],
  });
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [isSearchingImmediate, setIsSearchingImmediate] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userNextCursor, setUserNextCursor] = useState<string | null>(null);
  const [clubNextCursor, setClubNextCursor] = useState<string | null>(null);
  const [contentNextCursor, setContentNextCursor] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const paginationAbortControllerRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);
  const paginationRequestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDebouncedSearchRef = useRef<string | null>(null);
  const searchPreferencesLoadIdRef = useRef(0);
  const filtersChangedByUserRef = useRef(false);
  const lastSearchPreferencesUserIdRef = useRef<string | null | undefined>(
    undefined,
  );

  const trimmedQuery = query.trim();
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filters]);
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        minLevel: normalizedFilters.minLevel,
        maxLevel: normalizedFilters.maxLevel,
        onlineOnly: Boolean(normalizedFilters.onlineOnly),
        clubVisibility: normalizedFilters.clubVisibility ?? null,
        clubTag: normalizedFilters.clubTag ?? null,
      }),
    [normalizedFilters],
  );
  const hasActiveFilters = useMemo(
    () => areSearchFiltersActive(normalizedFilters),
    [normalizedFilters],
  );

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

  const cancelCurrentPagination = useCallback(() => {
    paginationRequestIdRef.current += 1;
    paginationAbortControllerRef.current?.abort();
    paginationAbortControllerRef.current = null;
    setIsLoadingMore(false);
  }, []);

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

  useEffect(() => {
    const preferencesUserId = currentUserId?.trim() || null;
    const loadId = searchPreferencesLoadIdRef.current + 1;

    searchPreferencesLoadIdRef.current = loadId;

    if (lastSearchPreferencesUserIdRef.current !== preferencesUserId) {
      filtersChangedByUserRef.current = false;
      lastSearchPreferencesUserIdRef.current = preferencesUserId;
      setFilters(EMPTY_SEARCH_FILTERS);
    }

    void loadSearchFilters(preferencesUserId).then((storedFilters) => {
      if (
        searchPreferencesLoadIdRef.current !== loadId ||
        filtersChangedByUserRef.current ||
        !storedFilters
      ) {
        return;
      }

      setFilters(normalizeFilters(storedFilters));
    });
  }, [currentUserId]);

  const runImmediateSearch = useCallback(
    async (term: string) => {
      const nextQuery = term.trim();

      if (!nextQuery) {
        cancelCurrentSearch();
        cancelCurrentPagination();
        setBaseResults({ users: [], clubs: [], content: [] });
        setUserNextCursor(null);
        setClubNextCursor(null);
        setContentNextCursor(null);
        setError(null);
        return;
      }

      clearDebouncedSearch();
      cancelCurrentPagination();
      const requestId = searchRequestIdRef.current + 1;
      const abortController = new AbortController();

      searchRequestIdRef.current = requestId;
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = abortController;
      setIsSearchingImmediate(true);
      setError(null);

      try {
        const [nextUsers, nextClubs, nextContent] = await Promise.all([
          searchUsers(
            nextQuery,
            null,
            undefined,
            abortController.signal,
            normalizedFilters,
          ),
          searchClubs(
            nextQuery,
            null,
            undefined,
            abortController.signal,
            normalizedFilters,
          ),
          searchContent(
            nextQuery,
            null,
            undefined,
            abortController.signal,
          ),
        ]);

        if (
          searchRequestIdRef.current !== requestId ||
          abortController.signal.aborted
        ) {
          return;
        }

        setBaseResults({
          users: nextUsers.items,
          clubs: nextClubs.items,
          content: nextContent.items,
        });
        setUserNextCursor(nextUsers.nextCursor);
        setClubNextCursor(nextClubs.nextCursor);
        setContentNextCursor(nextContent.nextCursor);
      } catch (searchError) {
        if (
          searchRequestIdRef.current !== requestId ||
          abortController.signal.aborted ||
          isAbortError(searchError)
        ) {
          return;
        }

        setBaseResults({ users: [], clubs: [], content: [] });
        setUserNextCursor(null);
        setClubNextCursor(null);
        setContentNextCursor(null);
        setError(getErrorMessage(searchError));
      } finally {
        if (searchRequestIdRef.current === requestId) {
          searchAbortControllerRef.current = null;
          setIsSearchingImmediate(false);
        }
      }
    },
    [
      cancelCurrentPagination,
      cancelCurrentSearch,
      clearDebouncedSearch,
      normalizedFilters,
    ],
  );

  useEffect(() => {
    if (!trimmedQuery) {
      cancelCurrentSearch();
      cancelCurrentPagination();
      setBaseResults({ users: [], clubs: [], content: [] });
      setUserNextCursor(null);
      setClubNextCursor(null);
      setContentNextCursor(null);
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
    cancelCurrentPagination,
    clearDebouncedSearch,
    runImmediateSearch,
    filtersKey,
    trimmedQuery,
  ]);

  useEffect(() => {
    return () => {
      searchRequestIdRef.current += 1;
      paginationRequestIdRef.current += 1;
      clearDebouncedSearch();
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = null;
      paginationAbortControllerRef.current?.abort();
      paginationAbortControllerRef.current = null;
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
    cancelCurrentPagination();
    setQuery('');
    setBaseResults({ users: [], clubs: [], content: [] });
    setUserNextCursor(null);
    setClubNextCursor(null);
    setContentNextCursor(null);
    setError(null);
  }, [cancelCurrentPagination, cancelCurrentSearch]);

  const loadMoreUsers = useCallback(async () => {
    const nextQuery = trimmedQuery;
    const cursor = userNextCursor?.trim();

    if (
      !nextQuery ||
      !cursor ||
      activeFilter === 'clubs' ||
      activeFilter === 'content' ||
      isLoadingMore ||
      isSearchingImmediate
    ) {
      return;
    }

    const requestId = paginationRequestIdRef.current + 1;
    const abortController = new AbortController();

    paginationRequestIdRef.current = requestId;
    paginationAbortControllerRef.current?.abort();
    paginationAbortControllerRef.current = abortController;
    setIsLoadingMore(true);
    setError(null);

    try {
      const nextUsers = await searchUsers(
        nextQuery,
        cursor,
        undefined,
        abortController.signal,
        normalizedFilters,
      );

      if (
        paginationRequestIdRef.current !== requestId ||
        abortController.signal.aborted
      ) {
        return;
      }

      setBaseResults((currentResults) => ({
        ...currentResults,
        users: [...currentResults.users, ...nextUsers.items],
      }));
      setUserNextCursor(nextUsers.nextCursor);
    } catch (paginationError) {
      if (
        paginationRequestIdRef.current !== requestId ||
        abortController.signal.aborted ||
        isAbortError(paginationError)
      ) {
        return;
      }

      setError(getErrorMessage(paginationError));
    } finally {
      if (paginationRequestIdRef.current === requestId) {
        paginationAbortControllerRef.current = null;
        setIsLoadingMore(false);
      }
    }
  }, [
    activeFilter,
    isLoadingMore,
    isSearchingImmediate,
    normalizedFilters,
    trimmedQuery,
    userNextCursor,
  ]);

  const loadMoreClubs = useCallback(async () => {
    const nextQuery = trimmedQuery;
    const cursor = clubNextCursor?.trim();

    if (
      !nextQuery ||
      !cursor ||
      activeFilter === 'users' ||
      activeFilter === 'content' ||
      isLoadingMore ||
      isSearchingImmediate
    ) {
      return;
    }

    const requestId = paginationRequestIdRef.current + 1;
    const abortController = new AbortController();

    paginationRequestIdRef.current = requestId;
    paginationAbortControllerRef.current?.abort();
    paginationAbortControllerRef.current = abortController;
    setIsLoadingMore(true);
    setError(null);

    try {
      const nextClubs = await searchClubs(
        nextQuery,
        cursor,
        undefined,
        abortController.signal,
        normalizedFilters,
      );

      if (
        paginationRequestIdRef.current !== requestId ||
        abortController.signal.aborted
      ) {
        return;
      }

      setBaseResults((currentResults) => ({
        ...currentResults,
        clubs: [...currentResults.clubs, ...nextClubs.items],
      }));
      setClubNextCursor(nextClubs.nextCursor);
    } catch (paginationError) {
      if (
        paginationRequestIdRef.current !== requestId ||
        abortController.signal.aborted ||
        isAbortError(paginationError)
      ) {
        return;
      }

      setError(getErrorMessage(paginationError));
    } finally {
      if (paginationRequestIdRef.current === requestId) {
        paginationAbortControllerRef.current = null;
        setIsLoadingMore(false);
      }
    }
  }, [
    activeFilter,
    clubNextCursor,
    isLoadingMore,
    isSearchingImmediate,
    normalizedFilters,
    trimmedQuery,
  ]);

  const loadMoreContent = useCallback(async () => {
    const nextQuery = trimmedQuery;
    const cursor = contentNextCursor?.trim();

    if (
      !nextQuery ||
      !cursor ||
      activeFilter === 'users' ||
      activeFilter === 'clubs' ||
      isLoadingMore ||
      isSearchingImmediate
    ) {
      return;
    }

    const requestId = paginationRequestIdRef.current + 1;
    const abortController = new AbortController();

    paginationRequestIdRef.current = requestId;
    paginationAbortControllerRef.current?.abort();
    paginationAbortControllerRef.current = abortController;
    setIsLoadingMore(true);
    setError(null);

    try {
      const nextContent = await searchContent(
        nextQuery,
        cursor,
        undefined,
        abortController.signal,
      );

      if (
        paginationRequestIdRef.current !== requestId ||
        abortController.signal.aborted
      ) {
        return;
      }

      setBaseResults((currentResults) => ({
        ...currentResults,
        content: [...currentResults.content, ...nextContent.items],
      }));
      setContentNextCursor(nextContent.nextCursor);
    } catch (paginationError) {
      if (
        paginationRequestIdRef.current !== requestId ||
        abortController.signal.aborted ||
        isAbortError(paginationError)
      ) {
        return;
      }

      setError(getErrorMessage(paginationError));
    } finally {
      if (paginationRequestIdRef.current === requestId) {
        paginationAbortControllerRef.current = null;
        setIsLoadingMore(false);
      }
    }
  }, [
    activeFilter,
    contentNextCursor,
    isLoadingMore,
    isSearchingImmediate,
    trimmedQuery,
  ]);

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

  const applyFilters = useCallback(
    (nextFilters: SearchFilters) => {
      const normalizedNextFilters = normalizeFilters(nextFilters);
      const userId = currentUserIdRef.current;

      filtersChangedByUserRef.current = true;
      cancelCurrentSearch();
      cancelCurrentPagination();
      setFilters(normalizedNextFilters);
      if (areSearchFiltersActive(normalizedNextFilters)) {
        void saveSearchFilters(userId, normalizedNextFilters);
      } else {
        void clearSearchFilters(userId);
      }
    },
    [cancelCurrentPagination, cancelCurrentSearch],
  );

  const clearFilters = useCallback(() => {
    const userId = currentUserIdRef.current;

    filtersChangedByUserRef.current = true;
    cancelCurrentSearch();
    cancelCurrentPagination();
    setFilters(EMPTY_SEARCH_FILTERS);
    void clearSearchFilters(userId);
  }, [cancelCurrentPagination, cancelCurrentSearch]);

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
        content: [],
      };
    }

    if (activeFilter === 'clubs') {
      return {
        users: [],
        clubs: baseResults.clubs,
        content: [],
      };
    }

    if (activeFilter === 'content') {
      return {
        users: [],
        clubs: [],
        content: baseResults.content,
      };
    }

    return baseResults;
  }, [activeFilter, baseResults]);

  const isInitialState = trimmedQuery.length === 0;
  const hasAnyResults =
    results.users.length > 0 ||
    results.clubs.length > 0 ||
    results.content.length > 0;
  const isEmptyResult = !isInitialState && !hasAnyResults;
  const isLoading = isSearchingImmediate;
  const hasMoreUsers = Boolean(userNextCursor);
  const hasMoreClubs = Boolean(clubNextCursor);
  const hasMoreContent = Boolean(contentNextCursor);

  const onPressContentResult = useCallback(
    async (content: SearchContentItem) => {
      options.onPressContentResult?.(content);
    },
    [options],
  );

  return {
    query,
    activeFilter,
    recentSearches,
    recommendedUsers,
    trendingClubs,
    results,
    isLoading,
    isLoadingMore,
    isInitialState,
    isEmptyResult,
    hasAnyResults,
    error,
    hasMoreUsers,
    hasMoreClubs,
    hasMoreContent,
    filters: normalizedFilters,
    hasActiveFilters,
    loadMoreUsers,
    loadMoreClubs,
    loadMoreContent,
    setQuery,
    setActiveFilter,
    retry,
    clearQuery,
    applyFilters,
    clearFilters,
    onPressFilter,
    saveRecentFromResult,
    removeRecent,
    clearAllRecent,
    onPressRecent,
    onPressUserResult,
    onPressClubResult,
    onPressContentResult,
  };
}

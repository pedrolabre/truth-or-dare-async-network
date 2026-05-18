import { useEffect, useMemo, useRef, useState } from 'react';
import {
  discoverClubs as fetchDiscoverClubs,
  getMyClubs,
  searchClubs as fetchSearchClubs,
} from '../services/clubsApi';
import {
  mapClubSummaryToDiscoverItem,
  mapClubSummaryToListItem,
} from '../services/clubsMappers';
import type { ClubDiscoverySource } from '../services/clubsMappers';
import type {
  ClubDiscoverItem,
  ClubListItem,
  ClubsContentState,
  ClubsScreenState,
  ClubsTabKey,
} from '../types/clubs';
import type { DiscoverClubsApi } from '../types/clubsApi';

const DISCOVERY_SOURCES: ClubDiscoverySource[] = [
  'suggested',
  'popular',
  'recent',
];

export const CLUBS_SEARCH_DEBOUNCE_MS = 350;

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function mapDiscoverClubsResponse(
  clubsResponse: DiscoverClubsApi,
): ClubDiscoverItem[] {
  const mappedClubs: ClubDiscoverItem[] = [];
  const mappedClubIds = new Set<string>();

  for (const source of DISCOVERY_SOURCES) {
    for (const club of clubsResponse[source]) {
      if (mappedClubIds.has(club.id)) {
        continue;
      }

      mappedClubIds.add(club.id);
      mappedClubs.push(mapClubSummaryToDiscoverItem(club, source));
    }
  }

  return mappedClubs;
}

export function useClubsScreen() {
  const [activeTab, setActiveTab] = useState<ClubsTabKey>('my-clubs');
  const [query, setQuery] = useState('');
  const [myClubs, setMyClubs] = useState<ClubListItem[]>([]);
  const [discoverClubs, setDiscoverClubs] = useState<ClubDiscoverItem[]>([]);
  const [searchResults, setSearchResults] = useState<ClubDiscoverItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [myClubsErrorMessage, setMyClubsErrorMessage] = useState<string | null>(
    null,
  );
  const [discoverErrorMessage, setDiscoverErrorMessage] = useState<
    string | null
  >(null);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(
    null,
  );
  const hasRequestedDiscoverRef = useRef(false);
  const isMountedRef = useRef(true);
  const searchRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMyClubs() {
      try {
        setIsInitialLoading(true);
        setMyClubsErrorMessage(null);

        const clubs = await getMyClubs();

        if (!isMounted) {
          return;
        }

        setMyClubs(clubs.map(mapClubSummaryToListItem));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMyClubs([]);
        setMyClubsErrorMessage(
          getErrorMessage(error, 'Não foi possível carregar seus clubes.'),
        );
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }

    void loadMyClubs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'discover' || hasRequestedDiscoverRef.current) {
      return;
    }

    hasRequestedDiscoverRef.current = true;

    async function loadDiscoverClubs() {
      try {
        setIsDiscoverLoading(true);
        setDiscoverErrorMessage(null);

        const clubsResponse = await fetchDiscoverClubs();

        if (!isMountedRef.current) {
          return;
        }

        setDiscoverClubs(mapDiscoverClubsResponse(clubsResponse));
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        setDiscoverClubs([]);
        setDiscoverErrorMessage(
          getErrorMessage(
            error,
            'Não foi possível carregar clubes para descobrir.',
          ),
        );
      } finally {
        if (isMountedRef.current) {
          setIsDiscoverLoading(false);
        }
      }
    }

    void loadDiscoverClubs();
  }, [activeTab]);

  useEffect(() => {
    const trimmedSearchQuery = query.trim();
    const searchRequestId = searchRequestIdRef.current + 1;

    searchRequestIdRef.current = searchRequestId;

    if (activeTab !== 'discover' || trimmedSearchQuery.length === 0) {
      setIsSearchLoading(false);
      setSearchErrorMessage(null);

      if (trimmedSearchQuery.length === 0) {
        setSearchResults([]);
      }

      return;
    }

    setIsSearchLoading(true);
    setSearchErrorMessage(null);

    const timeoutId = setTimeout(() => {
      async function loadSearchClubs() {
        try {
          const clubs = await fetchSearchClubs(trimmedSearchQuery);

          if (
            !isMountedRef.current ||
            searchRequestIdRef.current !== searchRequestId
          ) {
            return;
          }

          setSearchResults(
            clubs.map((club) => mapClubSummaryToDiscoverItem(club, 'search')),
          );
        } catch (error) {
          if (
            !isMountedRef.current ||
            searchRequestIdRef.current !== searchRequestId
          ) {
            return;
          }

          setSearchErrorMessage(
            getErrorMessage(error, 'Não foi possível buscar clubes.'),
          );
          setSearchResults([]);
        } finally {
          if (
            isMountedRef.current &&
            searchRequestIdRef.current === searchRequestId
          ) {
            setIsSearchLoading(false);
          }
        }
      }

      void loadSearchClubs();
    }, CLUBS_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeTab, query]);

  const trimmedQuery = query.trim();
  const hasSearchQuery = trimmedQuery.length > 0;

  const visibleDiscoverClubs = useMemo(() => {
    return hasSearchQuery ? searchResults : discoverClubs;
  }, [discoverClubs, hasSearchQuery, searchResults]);

  const myClubsContentState = useMemo<ClubsContentState>(() => {
    if (isInitialLoading) {
      return 'loading';
    }

    if (myClubsErrorMessage) {
      return 'error';
    }

    return myClubs.length > 0 ? 'list' : 'empty';
  }, [isInitialLoading, myClubs.length, myClubsErrorMessage]);

  const discoverContentState = useMemo<ClubsContentState>(() => {
    if (hasSearchQuery) {
      if (isSearchLoading) {
        return 'loading';
      }

      if (searchErrorMessage) {
        return 'error';
      }

      return searchResults.length > 0 ? 'search-results' : 'search-empty';
    }

    if (isDiscoverLoading) {
      return 'loading';
    }

    if (discoverErrorMessage) {
      return 'error';
    }

    return discoverClubs.length > 0 ? 'list' : 'empty';
  }, [
    discoverClubs.length,
    discoverErrorMessage,
    hasSearchQuery,
    isDiscoverLoading,
    isSearchLoading,
    searchErrorMessage,
    searchResults.length,
  ]);

  const activeContentState =
    activeTab === 'my-clubs' ? myClubsContentState : discoverContentState;
  const errorMessage =
    activeTab === 'my-clubs'
      ? myClubsErrorMessage
      : hasSearchQuery
        ? searchErrorMessage
        : discoverErrorMessage;

  function handleChangeTab(tab: ClubsTabKey) {
    setActiveTab(tab);
  }

  const state: ClubsScreenState = {
    activeTab,
    query,
    myClubs,
    discoverClubs,
    searchResults,
    filteredDiscoverClubs: visibleDiscoverClubs,
    visibleDiscoverClubs,
    activeContentState,
    myClubsContentState,
    discoverContentState,
    isLoading: activeContentState === 'loading',
    isInitialLoading,
    isSearchLoading,
    errorMessage,
    searchErrorMessage,
    hasSearchQuery,
    isDiscoverEmpty: discoverContentState === 'empty',
    isMyClubsEmpty: myClubsContentState === 'empty',
  };

  return {
    ...state,
    setQuery,
    handleChangeTab,
  };
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { discoverClubs as fetchDiscoverClubs, getMyClubs } from '../services/clubsApi';
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
  const [searchResults] = useState<ClubDiscoverItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [myClubsErrorMessage, setMyClubsErrorMessage] = useState<string | null>(
    null,
  );
  const [discoverErrorMessage, setDiscoverErrorMessage] = useState<
    string | null
  >(null);
  const hasRequestedDiscoverRef = useRef(false);
  const isMountedRef = useRef(true);

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
    if (isDiscoverLoading) {
      return 'loading';
    }

    if (discoverErrorMessage) {
      return 'error';
    }

    if (hasSearchQuery) {
      return searchResults.length > 0 ? 'search-results' : 'search-empty';
    }

    return discoverClubs.length > 0 ? 'list' : 'empty';
  }, [
    discoverClubs.length,
    discoverErrorMessage,
    hasSearchQuery,
    isDiscoverLoading,
    searchResults.length,
  ]);

  const activeContentState =
    activeTab === 'my-clubs' ? myClubsContentState : discoverContentState;
  const errorMessage =
    activeTab === 'my-clubs' ? myClubsErrorMessage : discoverErrorMessage;

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
    errorMessage,
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

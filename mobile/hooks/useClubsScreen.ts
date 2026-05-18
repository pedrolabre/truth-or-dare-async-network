import { useEffect, useMemo, useState } from 'react';
import { getMyClubs } from '../services/clubsApi';
import { mapClubSummaryToListItem } from '../services/clubsMappers';
import type {
  ClubDiscoverItem,
  ClubListItem,
  ClubsContentState,
  ClubsScreenState,
  ClubsTabKey,
} from '../types/clubs';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar seus clubes.';
}

export function useClubsScreen() {
  const [activeTab, setActiveTab] = useState<ClubsTabKey>('my-clubs');
  const [query, setQuery] = useState('');
  const [myClubs, setMyClubs] = useState<ClubListItem[]>([]);
  const [discoverClubs] = useState<ClubDiscoverItem[]>([]);
  const [searchResults] = useState<ClubDiscoverItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMyClubs() {
      try {
        setIsInitialLoading(true);
        setErrorMessage(null);

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
        setErrorMessage(getErrorMessage(error));
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

  const trimmedQuery = query.trim();
  const hasSearchQuery = trimmedQuery.length > 0;

  const visibleDiscoverClubs = useMemo(() => {
    return hasSearchQuery ? searchResults : discoverClubs;
  }, [discoverClubs, hasSearchQuery, searchResults]);

  const myClubsContentState = useMemo<ClubsContentState>(() => {
    if (isInitialLoading) {
      return 'loading';
    }

    if (errorMessage) {
      return 'error';
    }

    return myClubs.length > 0 ? 'list' : 'empty';
  }, [errorMessage, isInitialLoading, myClubs.length]);

  const discoverContentState = useMemo<ClubsContentState>(() => {
    if (hasSearchQuery) {
      return searchResults.length > 0 ? 'search-results' : 'search-empty';
    }

    return discoverClubs.length > 0 ? 'list' : 'empty';
  }, [discoverClubs.length, hasSearchQuery, searchResults.length]);

  const activeContentState =
    activeTab === 'my-clubs' ? myClubsContentState : discoverContentState;

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
    isLoading: isInitialLoading,
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

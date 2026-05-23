import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  discoverClubs as fetchDiscoverClubs,
  getMyClubs,
  joinClub,
  searchClubs as fetchSearchClubs,
} from '../services/clubsApi';
import {
  formatClubMembersLabel,
  mapClubSummaryToDiscoverItem,
  mapClubSummaryToListItem,
  upsertClubListItem,
} from '../services/clubsMappers';
import { subscribeToMyClubsUpserts } from '../services/clubsLocalUpdates';
import type { ClubDiscoverySource } from '../services/clubsMappers';
import type {
  ClubDiscoverItem,
  ClubListItem,
  ClubsContentState,
  ClubsScreenState,
  ClubsTabKey,
} from '../types/clubs';
import type {
  ClubMemberApi,
  ClubMemberRoleApi,
  ClubMemberStatusApi,
  ClubSummaryApi,
  DiscoverClubsApi,
} from '../types/clubsApi';

const DISCOVERY_SOURCES: ClubDiscoverySource[] = [
  'suggested',
  'popular',
  'recent',
];

export const CLUBS_SEARCH_DEBOUNCE_MS = 350;

type LoadOptions = {
  clearOnError?: boolean;
  showLoading?: boolean;
  showRefreshing?: boolean;
};

type LoadSearchOptions = Pick<LoadOptions, 'showLoading' | 'showRefreshing'>;

const MEMBER_STATUS_LABELS: Record<ClubMemberStatusApi, string> = {
  active: 'Membro',
  invited: 'Convite',
  requested: 'Pendente',
  removed: 'Removido',
  blocked: 'Bloqueado',
};

const MEMBER_ROLE_LABELS: Record<ClubMemberRoleApi, string> = {
  owner: 'Dono',
  admin: 'Admin',
  moderator: 'Moderador',
  member: 'Membro',
};

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joiningClubIds, setJoiningClubIds] = useState<string[]>([]);
  const [myClubsErrorMessage, setMyClubsErrorMessage] = useState<string | null>(
    null,
  );
  const [discoverErrorMessage, setDiscoverErrorMessage] = useState<
    string | null
  >(null);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(
    null,
  );
  const [clubActionErrorMessage, setClubActionErrorMessage] = useState<
    string | null
  >(null);
  const hasRequestedDiscoverRef = useRef(false);
  const isMountedRef = useRef(true);
  const joiningClubIdsRef = useRef<Set<string>>(new Set());
  const searchRequestIdRef = useRef(0);
  const pendingMyClubUpsertsRef = useRef<ClubListItem[]>([]);

  const mergeWithPendingMyClubUpserts = useCallback(
    (clubs: ClubListItem[]) => {
      const apiClubIds = new Set(clubs.map((club) => club.id));
      const pendingClubs = pendingMyClubUpsertsRef.current.filter(
        (club) => !apiClubIds.has(club.id),
      );

      pendingMyClubUpsertsRef.current = pendingClubs;

      return pendingClubs.reduceRight(
        (currentClubs, club) => upsertClubListItem(currentClubs, club),
        clubs,
      );
    },
    [],
  );

  const upsertCreatedClubInMyClubs = useCallback((club: ClubSummaryApi) => {
    const clubItem = mapClubSummaryToListItem(club);

    pendingMyClubUpsertsRef.current = upsertClubListItem(
      pendingMyClubUpsertsRef.current,
      clubItem,
    );

    setMyClubs((currentClubs) => upsertClubListItem(currentClubs, clubItem));
    setMyClubsErrorMessage(null);
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToMyClubsUpserts((club) => {
      if (!isMountedRef.current) {
        return;
      }

      upsertCreatedClubInMyClubs(club);
    });
  }, [upsertCreatedClubInMyClubs]);

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

        setMyClubs(
          mergeWithPendingMyClubUpserts(clubs.map(mapClubSummaryToListItem)),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const pendingClubs = mergeWithPendingMyClubUpserts([]);

        setMyClubs(pendingClubs);
        setMyClubsErrorMessage(
          pendingClubs.length > 0
            ? null
            : getErrorMessage(
                error,
                'Não foi possível carregar seus clubes.',
              ),
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
  }, [mergeWithPendingMyClubUpserts]);

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
          if (searchRequestIdRef.current !== searchRequestId) {
            return;
          }

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

  async function reloadMyClubs({
    clearOnError = true,
    showLoading = true,
    showRefreshing = false,
  }: LoadOptions = {}) {
    try {
      if (showLoading) {
        setIsInitialLoading(true);
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      setMyClubsErrorMessage(null);

      const clubs = await getMyClubs();

      if (!isMountedRef.current) {
        return;
      }

      setMyClubs(
        mergeWithPendingMyClubUpserts(clubs.map(mapClubSummaryToListItem)),
      );
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      if (clearOnError) {
        const pendingClubs = mergeWithPendingMyClubUpserts([]);

        setMyClubs(pendingClubs);

        if (pendingClubs.length > 0) {
          setMyClubsErrorMessage(null);
          return;
        }
      }

      setMyClubsErrorMessage(
        getErrorMessage(error, 'Não foi possível carregar seus clubes.'),
      );
    } finally {
      if (isMountedRef.current) {
        if (showLoading) {
          setIsInitialLoading(false);
        }

        if (showRefreshing) {
          setIsRefreshing(false);
        }
      }
    }
  }

  async function reloadDiscoverClubs({
    clearOnError = true,
    showLoading = true,
    showRefreshing = false,
  }: LoadOptions = {}) {
    hasRequestedDiscoverRef.current = true;

    try {
      if (showLoading) {
        setIsDiscoverLoading(true);
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

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

      if (clearOnError) {
        setDiscoverClubs([]);
      }

      setDiscoverErrorMessage(
        getErrorMessage(
          error,
          'Não foi possível carregar clubes para descobrir.',
        ),
      );
    } finally {
      if (isMountedRef.current) {
        if (showLoading) {
          setIsDiscoverLoading(false);
        }

        if (showRefreshing) {
          setIsRefreshing(false);
        }
      }
    }
  }

  async function reloadSearchClubs(
    searchQuery: string,
    {
      showLoading = true,
      showRefreshing = false,
    }: LoadSearchOptions = {},
  ) {
    const trimmedSearchQuery = searchQuery.trim();

    if (trimmedSearchQuery.length === 0) {
      setIsSearchLoading(false);
      setSearchErrorMessage(null);
      setSearchResults([]);

      return;
    }

    const searchRequestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = searchRequestId;

    try {
      if (showLoading) {
        setIsSearchLoading(true);
      }

      if (showRefreshing) {
        setIsRefreshing(true);
      }

      setSearchErrorMessage(null);

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

      if (isMountedRef.current && showRefreshing) {
        setIsRefreshing(false);
      }
    }
  }

  function setClubJoinPending(clubId: string, isJoining: boolean) {
    const nextJoiningClubIds = new Set(joiningClubIdsRef.current);

    if (isJoining) {
      nextJoiningClubIds.add(clubId);
    } else {
      nextJoiningClubIds.delete(clubId);
    }

    joiningClubIdsRef.current = nextJoiningClubIds;
    setJoiningClubIds(Array.from(nextJoiningClubIds));
  }

  function getJoinedMemberCount(
    club: ClubDiscoverItem,
    membership: ClubMemberApi,
  ) {
    if (membership.status !== 'active' || club.isMember) {
      return club.memberCount;
    }

    return club.memberCount + 1;
  }

  function updateDiscoverClubAfterJoin(
    club: ClubDiscoverItem,
    membership: ClubMemberApi,
  ) {
    return (currentClub: ClubDiscoverItem): ClubDiscoverItem => {
      if (currentClub.id !== club.id) {
        return currentClub;
      }

      const memberCount = getJoinedMemberCount(currentClub, membership);
      const isActiveMember = membership.status === 'active';

      return {
        ...currentClub,
        memberCount,
        membersLabel: formatClubMembersLabel(memberCount),
        isMember: isActiveMember,
        membershipStatus: membership.status,
      };
    };
  }

  function getJoinedClubStatusLabel(membership: ClubMemberApi) {
    if (membership.status === 'active' && membership.role) {
      return MEMBER_ROLE_LABELS[membership.role];
    }

    return MEMBER_STATUS_LABELS[membership.status];
  }

  function upsertJoinedClubInMyClubs(
    club: ClubDiscoverItem,
    membership: ClubMemberApi,
  ) {
    const memberCount = getJoinedMemberCount(club, membership);
    const membersLabel = formatClubMembersLabel(memberCount);
    const statusLabel = getJoinedClubStatusLabel(membership);
    const isActive = membership.status === 'active';

    setMyClubs((currentClubs) => {
      const hasClub = currentClubs.some((currentClub) => currentClub.id === club.id);

      if (hasClub) {
        return currentClubs.map((currentClub) =>
          currentClub.id === club.id
            ? {
                ...currentClub,
                memberCount,
                membersLabel,
                statusLabel,
                isActive,
              }
            : currentClub,
        );
      }

      const joinedClub: ClubListItem = {
        id: club.id,
        name: club.name,
        description: club.description,
        memberCount,
        membersLabel,
        statusLabel,
        iconName: club.iconName,
        isActive,
      };

      return [joinedClub, ...currentClubs];
    });
  }

  async function handleJoinClub(club: ClubDiscoverItem) {
    if (club.isMember || joiningClubIdsRef.current.has(club.id)) {
      return;
    }

    setClubJoinPending(club.id, true);
    setClubActionErrorMessage(null);

    try {
      const membership = await joinClub(club.id);

      if (!isMountedRef.current) {
        return;
      }

      setDiscoverClubs((currentClubs) =>
        currentClubs.map(updateDiscoverClubAfterJoin(club, membership)),
      );
      setSearchResults((currentClubs) =>
        currentClubs.map(updateDiscoverClubAfterJoin(club, membership)),
      );

      if (membership.status === 'active') {
        upsertJoinedClubInMyClubs(club, membership);
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setClubActionErrorMessage(
        getErrorMessage(error, 'Nao foi possivel entrar no clube.'),
      );
    } finally {
      if (isMountedRef.current) {
        setClubJoinPending(club.id, false);
      }
    }
  }

  async function handleRefresh() {
    if (activeTab === 'my-clubs') {
      await reloadMyClubs({
        clearOnError: false,
        showLoading: false,
        showRefreshing: true,
      });

      return;
    }

    if (hasSearchQuery) {
      await reloadSearchClubs(trimmedQuery, {
        showLoading: false,
        showRefreshing: true,
      });

      return;
    }

    await reloadDiscoverClubs({
      clearOnError: false,
      showLoading: false,
      showRefreshing: true,
    });
  }

  async function handleRetry() {
    if (activeTab === 'my-clubs') {
      await reloadMyClubs();

      return;
    }

    if (hasSearchQuery) {
      await reloadSearchClubs(trimmedQuery);

      return;
    }

    await reloadDiscoverClubs();
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
    isRefreshing,
    isSearchLoading,
    joiningClubIds,
    errorMessage,
    searchErrorMessage,
    clubActionErrorMessage,
    hasSearchQuery,
    isDiscoverEmpty: discoverContentState === 'empty',
    isMyClubsEmpty: myClubsContentState === 'empty',
  };

  return {
    ...state,
    setQuery,
    handleChangeTab,
    handleRefresh,
    handleRetry,
    handleJoinClub,
  };
}

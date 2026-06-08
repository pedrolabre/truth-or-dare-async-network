import { useCallback, useEffect, useRef, useState } from 'react';

import { ClubsApiError, getClubMembers } from '../services/clubsApi';
import { loadCachedResource } from '../services/cachedApi';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS } from '../services/cache';
import type {
  ClubMemberApi,
  ClubMemberRoleApi,
  ClubMemberStatusApi,
  ClubMembersApi,
  ClubMembersQueryApi,
} from '../types/clubsApi';
import type {
  ClubMembersContentState,
  ClubMembersScreenState,
} from '../types/clubs';

type LoadClubMembers = (
  clubId: string,
  query?: ClubMembersQueryApi,
) => Promise<ClubMembersApi>;

type UseClubMembersOptions = {
  clubId: string | null;
  isActive: boolean;
  pageSize?: number;
  loadClubMembers?: LoadClubMembers;
};

type LoadOptions = {
  page?: number;
  append?: boolean;
  showLoading?: boolean;
  showRefreshing?: boolean;
  showLoadingMore?: boolean;
};

const DEFAULT_PAGE_SIZE = 20;
const GENERIC_MEMBERS_ERROR_MESSAGE =
  'Nao foi possivel carregar os membros do clube. Tente novamente.';

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : GENERIC_MEMBERS_ERROR_MESSAGE;
}

function getContentState(response: ClubMembersApi): ClubMembersContentState {
  return response.items.length > 0 ? 'ready' : 'empty';
}

export function useClubMembers({
  clubId,
  isActive,
  pageSize = DEFAULT_PAGE_SIZE,
  loadClubMembers = getClubMembers,
}: UseClubMembersOptions): ClubMembersScreenState {
  const [items, setItems] = useState<ClubMembersApi['items']>([]);
  const [pagination, setPagination] = useState<ClubMembersApi['pagination'] | null>(
    null,
  );
  const [contentState, setContentState] =
    useState<ClubMembersContentState>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<ClubMemberRoleApi | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<ClubMemberStatusApi | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setItems([]);
    setPagination(null);
    setErrorMessage(null);
    setIsFromCache(false);
    setSyncErrorMessage(null);
    setContentState('idle');
    setIsInitialLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
  }, [clubId, roleFilter, searchQuery, statusFilter]);

  const loadMembers = useCallback(
    async ({
      page = 1,
      append = false,
      showLoading = true,
      showRefreshing = false,
      showLoadingMore = false,
    }: LoadOptions = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!clubId) {
        setItems([]);
        setPagination(null);
        setContentState('idle');
        setErrorMessage(null);
        return null;
      }

      try {
        if (showLoading) {
          setIsInitialLoading(true);
          setContentState('loading');
        }

        if (showRefreshing) {
          setIsRefreshing(true);
        }

        if (showLoadingMore) {
          setIsLoadingMore(true);
        }

        setErrorMessage(null);
        setSyncErrorMessage(null);

        const query = {
          page,
          limit: pageSize,
          role: roleFilter,
          status: statusFilter,
          search: searchQuery,
        };
        const canUseCache =
          page === 1 &&
          !append &&
          !roleFilter &&
          !statusFilter &&
          searchQuery.trim().length === 0;
        const result = canUseCache
          ? await loadCachedResource<ClubMembersApi>({
              key: LOCAL_CACHE_KEYS.clubMembers(clubId),
              ttlMs: LOCAL_CACHE_TTLS.clubMembers,
              fetcher: () => loadClubMembers(clubId, query),
              fallbackSyncErrorMessage:
                'Nao foi possivel sincronizar os membros agora.',
              onCacheHit: ({ record }) => {
                if (
                  !isMountedRef.current ||
                  requestIdRef.current !== requestId
                ) {
                  return;
                }

                setItems(record.value.items);
                setPagination(record.value.pagination);
                setContentState(getContentState(record.value));
                setIsFromCache(true);

                if (showLoading) {
                  setIsInitialLoading(false);
                }
              },
            })
          : {
              value: await loadClubMembers(clubId, query),
              isFromCache: false,
              syncErrorMessage: null,
            };
        const response = result.value;

        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        setItems((currentItems) =>
          append ? [...currentItems, ...response.items] : response.items,
        );
        setPagination(response.pagination);
        setContentState(
          append || response.items.length > 0
            ? 'ready'
            : getContentState(response),
        );
        setErrorMessage(null);
        setIsFromCache(result.isFromCache);
        setSyncErrorMessage(result.syncErrorMessage);

        return response;
      } catch (error) {
        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        const message = getErrorMessage(error);
        setErrorMessage(message);
        setIsFromCache(false);
        setSyncErrorMessage(null);

        if (error instanceof ClubsApiError && error.status === 403) {
          setItems([]);
          setPagination(null);
          setContentState('access-denied');
        } else if (items.length === 0) {
          setContentState('error');
        }

        return null;
      } finally {
        if (isMountedRef.current && requestIdRef.current === requestId) {
          if (showLoading) {
            setIsInitialLoading(false);
          }

          if (showRefreshing) {
            setIsRefreshing(false);
          }

          if (showLoadingMore) {
            setIsLoadingMore(false);
          }
        }
      }
    },
    [
      clubId,
      items.length,
      loadClubMembers,
      pageSize,
      roleFilter,
      searchQuery,
      statusFilter,
    ],
  );

  useEffect(() => {
    if (!isActive || !clubId || contentState !== 'idle') {
      return;
    }

    void loadMembers({
      page: 1,
      append: false,
      showLoading: true,
    });
  }, [clubId, contentState, isActive, loadMembers]);

  const canLoadMore = Boolean(
    pagination && pagination.page < pagination.totalPages,
  );

  const handleRetry = useCallback(async () => {
    await loadMembers({
      page: 1,
      append: false,
      showLoading: items.length === 0,
    });
  }, [items.length, loadMembers]);

  const handleRefresh = useCallback(async () => {
    await loadMembers({
      page: 1,
      append: false,
      showLoading: false,
      showRefreshing: true,
    });
  }, [loadMembers]);

  const handleLoadMore = useCallback(async () => {
    if (!pagination || !canLoadMore || isLoadingMore) {
      return;
    }

    await loadMembers({
      page: pagination.page + 1,
      append: true,
      showLoading: false,
      showLoadingMore: true,
    });
  }, [canLoadMore, isLoadingMore, loadMembers, pagination]);

  const replaceMember = useCallback((member: ClubMemberApi) => {
    setItems((currentItems) =>
      currentItems.map((currentMember) =>
        currentMember.userId === member.userId ? member : currentMember,
      ),
    );
  }, []);

  return {
    items,
    contentState,
    searchQuery,
    roleFilter,
    statusFilter,
    pagination,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    errorMessage,
    isFromCache,
    syncErrorMessage,
    canRetry: Boolean(clubId) && !isInitialLoading,
    canLoadMore,
    setSearchQuery,
    setRoleFilter,
    setStatusFilter,
    handleRetry,
    handleRefresh,
    handleLoadMore,
    replaceMember,
  };
}

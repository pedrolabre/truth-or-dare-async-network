import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ClubsApiError, getClubAuditLogs } from '../services/clubsApi';
import { mapClubAuditLogToItem } from '../services/clubsMappers';
import type {
  ClubAuditFilters,
  ClubAuditLogContentState,
  ClubAuditLogScreenState,
} from '../types/clubs';
import type {
  ClubAuditLogsApi,
  ClubAuditLogsQueryApi,
} from '../types/clubsApi';

type LoadClubAuditLogs = (
  clubId: string,
  query?: ClubAuditLogsQueryApi,
) => Promise<ClubAuditLogsApi>;

type UseClubAuditLogOptions = {
  clubId: string | null;
  isActive: boolean;
  canViewAudit: boolean;
  pageSize?: number;
  loadClubAuditLogs?: LoadClubAuditLogs;
};

type LoadOptions = {
  cursor?: string | null;
  append?: boolean;
  showLoading?: boolean;
  showRefreshing?: boolean;
  showLoadingMore?: boolean;
};

const DEFAULT_AUDIT_PAGE_SIZE = 20;
const EMPTY_AUDIT_FILTERS: ClubAuditFilters = {
  action: null,
  targetUserId: null,
  entityType: null,
  from: null,
  to: null,
};
const GENERIC_AUDIT_ERROR_MESSAGE =
  'Nao foi possivel carregar a auditoria do clube. Tente novamente.';

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : GENERIC_AUDIT_ERROR_MESSAGE;
}

function normalizeAuditFilterValue(value: string | null | undefined) {
  const normalizedValue = value?.trim();

  return normalizedValue || null;
}

function normalizeAuditFilters(filters: ClubAuditFilters): ClubAuditFilters {
  return {
    action: normalizeAuditFilterValue(filters.action),
    targetUserId: normalizeAuditFilterValue(filters.targetUserId),
    entityType: normalizeAuditFilterValue(filters.entityType),
    from: normalizeAuditFilterValue(filters.from),
    to: normalizeAuditFilterValue(filters.to),
  };
}

function getContentState(response: ClubAuditLogsApi): ClubAuditLogContentState {
  return response.items.length > 0 ? 'ready' : 'empty';
}

export function useClubAuditLog({
  clubId,
  isActive,
  canViewAudit,
  pageSize = DEFAULT_AUDIT_PAGE_SIZE,
  loadClubAuditLogs = getClubAuditLogs,
}: UseClubAuditLogOptions): ClubAuditLogScreenState {
  const [items, setItems] = useState<ClubAuditLogScreenState['items']>([]);
  const [filters, setFilters] =
    useState<ClubAuditFilters>(EMPTY_AUDIT_FILTERS);
  const [contentState, setContentState] =
    useState<ClubAuditLogContentState>(
      canViewAudit ? 'idle' : 'access-denied',
    );
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const normalizedFilters = useMemo(
    () => normalizeAuditFilters(filters),
    [filters],
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setErrorMessage(null);
    setIsInitialLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
    setContentState(canViewAudit ? 'idle' : 'access-denied');
  }, [canViewAudit, clubId, normalizedFilters]);

  const loadAudit = useCallback(
    async ({
      cursor = null,
      append = false,
      showLoading = true,
      showRefreshing = false,
      showLoadingMore = false,
    }: LoadOptions = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!clubId || !canViewAudit) {
        setItems([]);
        setNextCursor(null);
        setErrorMessage(null);
        setContentState(canViewAudit ? 'idle' : 'access-denied');
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
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

        const response = await loadClubAuditLogs(clubId, {
          limit: pageSize,
          cursor,
          ...normalizedFilters,
        });

        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        const mappedItems = response.items.map(mapClubAuditLogToItem);

        setItems((currentItems) =>
          append ? [...currentItems, ...mappedItems] : mappedItems,
        );
        setNextCursor(response.nextCursor ?? null);
        setContentState(
          append || mappedItems.length > 0
            ? 'ready'
            : getContentState(response),
        );
        setErrorMessage(null);

        return response;
      } catch (error) {
        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));

        if (error instanceof ClubsApiError && error.status === 403) {
          setItems([]);
          setNextCursor(null);
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
      canViewAudit,
      clubId,
      items.length,
      loadClubAuditLogs,
      normalizedFilters,
      pageSize,
    ],
  );

  useEffect(() => {
    if (!isActive || !clubId || !canViewAudit || contentState !== 'idle') {
      return;
    }

    void loadAudit({
      showLoading: true,
    });
  }, [canViewAudit, clubId, contentState, isActive, loadAudit]);

  const setFilterValue = useCallback(
    (key: keyof ClubAuditFilters, value: string) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        [key]: normalizeAuditFilterValue(value),
      }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_AUDIT_FILTERS);
  }, []);

  const handleRetry = useCallback(async () => {
    await loadAudit({
      showLoading: items.length === 0,
    });
  }, [items.length, loadAudit]);

  const handleRefresh = useCallback(async () => {
    await loadAudit({
      showLoading: false,
      showRefreshing: true,
    });
  }, [loadAudit]);

  const canLoadMore = Boolean(nextCursor);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    await loadAudit({
      cursor: nextCursor,
      append: true,
      showLoading: false,
      showLoadingMore: true,
    });
  }, [isLoadingMore, loadAudit, nextCursor]);

  return {
    items,
    filters: normalizedFilters,
    contentState,
    nextCursor,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    errorMessage,
    canRetry: Boolean(clubId) && canViewAudit && !isInitialLoading,
    canLoadMore,
    setActionFilter: (value) => setFilterValue('action', value),
    setTargetUserIdFilter: (value) => setFilterValue('targetUserId', value),
    setEntityTypeFilter: (value) => setFilterValue('entityType', value),
    setFromFilter: (value) => setFilterValue('from', value),
    setToFilter: (value) => setFilterValue('to', value),
    clearFilters,
    handleRetry,
    handleRefresh,
    handleLoadMore,
  };
}

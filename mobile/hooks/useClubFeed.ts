import { useCallback, useEffect, useRef, useState } from 'react';

import { getClubFeed } from '../services/clubsApi';
import type {
  ClubFeedContentState,
  ClubFeedScreenState,
} from '../types/clubs';
import type {
  ClubFeedApi,
  ClubFeedItemApi,
  ClubFeedOrderApi,
} from '../types/clubsApi';

type LoadClubFeed = (
  clubId: string,
  order?: ClubFeedOrderApi,
) => Promise<ClubFeedApi>;

type UseClubFeedOptions = {
  clubId: string | null;
  isActive: boolean;
  canViewFeed: boolean;
  order?: ClubFeedOrderApi;
  loadClubFeed?: LoadClubFeed;
};

type LoadOptions = {
  showLoading?: boolean;
  showRefreshing?: boolean;
};

const GENERIC_FEED_ERROR_MESSAGE =
  'Nao foi possivel carregar o feed do clube. Tente novamente.';

export const CLUB_FEED_HAS_REAL_PROMPT_PAGINATION = false;

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : GENERIC_FEED_ERROR_MESSAGE;
}

export function getClubFeedContentState(
  items: ClubFeedItemApi[],
): ClubFeedContentState {
  return items.length > 0 ? 'ready' : 'empty';
}

export function useClubFeed({
  clubId,
  isActive,
  canViewFeed,
  order = 'activity',
  loadClubFeed = getClubFeed,
}: UseClubFeedOptions): ClubFeedScreenState {
  const [items, setItems] = useState<ClubFeedItemApi[]>([]);
  const [contentState, setContentState] = useState<ClubFeedContentState>(
    canViewFeed ? 'idle' : 'access-denied',
  );
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setItems([]);
    setErrorMessage(null);
    setIsInitialLoading(false);
    setIsRefreshing(false);
    setContentState(canViewFeed ? 'idle' : 'access-denied');
  }, [canViewFeed, clubId]);

  const loadFeed = useCallback(
    async ({
      showLoading = true,
      showRefreshing = false,
    }: LoadOptions = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!clubId || !canViewFeed) {
        setItems([]);
        setErrorMessage(null);
        setContentState(canViewFeed ? 'idle' : 'access-denied');
        setIsInitialLoading(false);
        setIsRefreshing(false);
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

        setErrorMessage(null);

        const feed = await loadClubFeed(clubId, order);

        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        setItems(feed.items);
        setContentState(getClubFeedContentState(feed.items));
        setErrorMessage(null);

        return feed;
      } catch (error) {
        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));

        if (items.length === 0) {
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
        }
      }
    },
    [canViewFeed, clubId, items.length, loadClubFeed, order],
  );

  useEffect(() => {
    if (!isActive || !clubId || !canViewFeed || contentState !== 'idle') {
      return;
    }

    void loadFeed({
      showLoading: true,
      showRefreshing: false,
    });
  }, [canViewFeed, clubId, contentState, isActive, loadFeed]);

  const handleRetry = useCallback(async () => {
    await loadFeed({
      showLoading: items.length === 0,
      showRefreshing: false,
    });
  }, [items.length, loadFeed]);

  const handleRefresh = useCallback(async () => {
    await loadFeed({
      showLoading: false,
      showRefreshing: true,
    });
  }, [loadFeed]);

  return {
    items,
    contentState,
    isInitialLoading,
    isRefreshing,
    errorMessage,
    canRetry: Boolean(clubId) && canViewFeed && !isInitialLoading,
    hasRealPromptPagination: CLUB_FEED_HAS_REAL_PROMPT_PAGINATION,
    handleRetry,
    handleRefresh,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createClubPromptResponse,
  getClubFeed,
  markClubFeedSeen,
} from '../services/clubsApi';
import { loadCachedResource } from '../services/cachedApi';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS } from '../services/cache';
import { publishMyClubActivityUpdate } from '../services/clubsLocalUpdates';
import type {
  ClubFeedContentState,
  ClubFeedScreenState,
} from '../types/clubs';
import type {
  ClubFeedApi,
  ClubFeedSeenApi,
  ClubFeedItemApi,
  ClubFeedOrderApi,
  ClubFeedQueryApi,
  ClubPromptResponseApi,
  CreateClubPromptResponsePayloadApi,
} from '../types/clubsApi';

type LoadClubFeed = (
  clubId: string,
  order?: ClubFeedOrderApi,
  query?: ClubFeedQueryApi,
) => Promise<ClubFeedApi>;

type SubmitClubPromptResponse = (
  clubId: string,
  promptId: string,
  payload: CreateClubPromptResponsePayloadApi,
) => Promise<ClubPromptResponseApi>;

type MarkClubFeedSeen = (clubId: string) => Promise<ClubFeedSeenApi>;

type UseClubFeedOptions = {
  clubId: string | null;
  isActive: boolean;
  canViewFeed: boolean;
  order?: ClubFeedOrderApi;
  loadClubFeed?: LoadClubFeed;
  markClubFeedSeenAction?: MarkClubFeedSeen;
  submitClubPromptResponse?: SubmitClubPromptResponse;
  onFeedSeen?: (seen: ClubFeedSeenApi) => void;
};

type LoadOptions = {
  showLoading?: boolean;
  showRefreshing?: boolean;
  cursor?: string | null;
  append?: boolean;
};

const GENERIC_FEED_ERROR_MESSAGE =
  'Nao foi possivel carregar o feed do clube. Tente novamente.';
const GENERIC_RESPONSE_ERROR_MESSAGE =
  'Nao foi possivel enviar a resposta do prompt. Tente novamente.';

export const CLUB_FEED_PAGE_SIZE = 20;
export const CLUB_FEED_HAS_REAL_PROMPT_PAGINATION = true;

function getErrorMessage(
  error: unknown,
  fallbackMessage = GENERIC_FEED_ERROR_MESSAGE,
): string {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

export function getClubFeedContentState(
  items: ClubFeedItemApi[],
): ClubFeedContentState {
  return items.length > 0 ? 'ready' : 'empty';
}

function mergePromptResponse(
  item: ClubFeedItemApi,
  response: ClubPromptResponseApi,
): ClubFeedItemApi {
  const recentResponses = [
    response,
    ...item.recentResponses.filter(
      (recentResponse) => recentResponse.id !== response.id,
    ),
  ].slice(0, 3);

  return {
    ...item,
    answersCount: item.answersCount + 1,
    viewerState: {
      ...item.viewerState,
      answeredByMe: true,
      canAnswer: false,
    },
    recentResponses,
  };
}

function mergeFeedItems(
  currentItems: ClubFeedItemApi[],
  nextItems: ClubFeedItemApi[],
) {
  const knownIds = new Set(currentItems.map((item) => item.id));
  const uniqueNextItems = nextItems.filter((item) => !knownIds.has(item.id));

  return [...currentItems, ...uniqueNextItems];
}

export function useClubFeed({
  clubId,
  isActive,
  canViewFeed,
  order = 'activity',
  loadClubFeed = getClubFeed,
  markClubFeedSeenAction = markClubFeedSeen,
  submitClubPromptResponse = createClubPromptResponse,
  onFeedSeen,
}: UseClubFeedOptions): ClubFeedScreenState {
  const [items, setItems] = useState<ClubFeedItemApi[]>([]);
  const [contentState, setContentState] = useState<ClubFeedContentState>(
    canViewFeed ? 'idle' : 'access-denied',
  );
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [responseSubmittingPromptId, setResponseSubmittingPromptId] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [responseErrorMessage, setResponseErrorMessage] = useState<
    string | null
  >(null);
  const itemsRef = useRef<ClubFeedItemApi[]>([]);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const seenMarkedClubIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    itemsRef.current = [];
    setItems([]);
    setErrorMessage(null);
    setIsFromCache(false);
    setSyncErrorMessage(null);
    setResponseErrorMessage(null);
    setResponseSubmittingPromptId(null);
    setIsInitialLoading(false);
    setIsRefreshing(false);
    setIsLoadingMore(false);
    setNextCursor(null);
    setContentState(canViewFeed ? 'idle' : 'access-denied');
    seenMarkedClubIdRef.current = null;
  }, [canViewFeed, clubId]);

  const loadFeed = useCallback(
    async ({
      showLoading = true,
      showRefreshing = false,
      cursor = null,
      append = false,
    }: LoadOptions = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const normalizedCursor = cursor?.trim() || null;

      if (!clubId || !canViewFeed) {
        itemsRef.current = [];
        setItems([]);
        setErrorMessage(null);
        setNextCursor(null);
        setContentState(canViewFeed ? 'idle' : 'access-denied');
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

        if (append) {
          setIsLoadingMore(true);
        }

        setErrorMessage(null);
        setSyncErrorMessage(null);

        const fetchFeed = () =>
          loadClubFeed(clubId, order, {
            limit: CLUB_FEED_PAGE_SIZE,
            cursor: normalizedCursor,
          });

        const result = append
          ? {
              value: await fetchFeed(),
              isFromCache: false,
              syncErrorMessage: null,
            }
          : await loadCachedResource<ClubFeedApi>({
              key: LOCAL_CACHE_KEYS.clubFeed(clubId),
              ttlMs: LOCAL_CACHE_TTLS.clubFeed,
              fetcher: fetchFeed,
              fallbackSyncErrorMessage:
                'Nao foi possivel sincronizar o feed do clube agora.',
              onCacheHit: ({ record }) => {
                if (
                  !isMountedRef.current ||
                  requestIdRef.current !== requestId
                ) {
                  return;
                }

                itemsRef.current = record.value.items;
                setItems(record.value.items);
                setNextCursor(record.value.nextCursor ?? null);
                setContentState(getClubFeedContentState(record.value.items));
                setErrorMessage(null);
                setIsFromCache(true);

                if (showLoading) {
                  setIsInitialLoading(false);
                }
              },
            });

        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        const nextItems = append
          ? mergeFeedItems(itemsRef.current, result.value.items)
          : result.value.items;

        itemsRef.current = nextItems;
        setItems(nextItems);
        setNextCursor(result.value.nextCursor ?? null);
        setContentState(getClubFeedContentState(nextItems));
        setErrorMessage(null);
        setIsFromCache(result.isFromCache);
        setSyncErrorMessage(result.syncErrorMessage);

        if (
          !append &&
          !result.isFromCache &&
          seenMarkedClubIdRef.current !== clubId
        ) {
          seenMarkedClubIdRef.current = clubId;

          void markClubFeedSeenAction(clubId)
            .then((seen) => {
              if (!isMountedRef.current) {
                return;
              }

              publishMyClubActivityUpdate(clubId, {
                unreadCount: seen.unreadCount,
                lastSeenAt: seen.lastSeenAt,
              });
              onFeedSeen?.(seen);
            })
            .catch(() => {
              seenMarkedClubIdRef.current = null;
            });
        }

        return result.value;
      } catch (error) {
        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));
        setIsFromCache(false);
        setSyncErrorMessage(null);

        if (itemsRef.current.length === 0) {
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

          if (append) {
            setIsLoadingMore(false);
          }
        }
      }
    },
    [
      canViewFeed,
      clubId,
      loadClubFeed,
      markClubFeedSeenAction,
      onFeedSeen,
      order,
    ],
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
      cursor: null,
      append: false,
    });
  }, [loadFeed]);

  const handleLoadMore = useCallback(async () => {
    const cursor = nextCursor?.trim();

    if (!cursor || isLoadingMore) {
      return;
    }

    await loadFeed({
      showLoading: false,
      showRefreshing: false,
      cursor,
      append: true,
    });
  }, [isLoadingMore, loadFeed, nextCursor]);

  const clearResponseError = useCallback(() => {
    setResponseErrorMessage(null);
  }, []);

  const submitPromptResponse = useCallback(
    async (
      promptId: string,
      payload: CreateClubPromptResponsePayloadApi,
    ): Promise<ClubPromptResponseApi | null> => {
      if (!clubId) {
        const message = 'Clube nao identificado para enviar resposta.';
        setResponseErrorMessage(message);
        throw new Error(message);
      }

      setResponseSubmittingPromptId(promptId);
      setResponseErrorMessage(null);

      try {
        const response = await submitClubPromptResponse(
          clubId,
          promptId,
          payload,
        );

        if (!isMountedRef.current) {
          return null;
        }

        setItems((currentItems) => {
          const nextItems = currentItems.map((item) =>
            item.id === promptId ? mergePromptResponse(item, response) : item,
          );

          itemsRef.current = nextItems;

          return nextItems;
        });
        setContentState((currentState) =>
          currentState === 'empty' ? 'ready' : currentState,
        );
        setIsFromCache(false);
        setSyncErrorMessage(null);

        return response;
      } catch (error) {
        if (isMountedRef.current) {
          setResponseErrorMessage(
            getErrorMessage(error, GENERIC_RESPONSE_ERROR_MESSAGE),
          );
        }

        throw error;
      } finally {
        if (isMountedRef.current) {
          setResponseSubmittingPromptId(null);
        }
      }
    },
    [clubId, submitClubPromptResponse],
  );

  return {
    items,
    contentState,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    isSubmittingResponse: responseSubmittingPromptId !== null,
    responseSubmittingPromptId,
    nextCursor,
    errorMessage,
    responseErrorMessage,
    isFromCache,
    syncErrorMessage,
    canRetry: Boolean(clubId) && canViewFeed && !isInitialLoading,
    canLoadMore: Boolean(nextCursor) && !isInitialLoading,
    hasRealPromptPagination: CLUB_FEED_HAS_REAL_PROMPT_PAGINATION,
    handleRetry,
    handleRefresh,
    handleLoadMore,
    clearResponseError,
    submitPromptResponse,
  };
}

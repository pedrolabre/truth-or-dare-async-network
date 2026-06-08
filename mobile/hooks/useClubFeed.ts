import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createClubPromptResponse,
  getClubFeed,
  markClubFeedSeen,
} from '../services/clubsApi';
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
  ClubPromptResponseApi,
  CreateClubPromptResponsePayloadApi,
} from '../types/clubsApi';

type LoadClubFeed = (
  clubId: string,
  order?: ClubFeedOrderApi,
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
};

const GENERIC_FEED_ERROR_MESSAGE =
  'Nao foi possivel carregar o feed do clube. Tente novamente.';
const GENERIC_RESPONSE_ERROR_MESSAGE =
  'Nao foi possivel enviar a resposta do prompt. Tente novamente.';

export const CLUB_FEED_HAS_REAL_PROMPT_PAGINATION = false;

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
  const [responseSubmittingPromptId, setResponseSubmittingPromptId] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseErrorMessage, setResponseErrorMessage] = useState<
    string | null
  >(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const seenMarkedClubIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setItems([]);
    setErrorMessage(null);
    setResponseErrorMessage(null);
    setResponseSubmittingPromptId(null);
    setIsInitialLoading(false);
    setIsRefreshing(false);
    setContentState(canViewFeed ? 'idle' : 'access-denied');
    seenMarkedClubIdRef.current = null;
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

        if (seenMarkedClubIdRef.current !== clubId) {
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
    [
      canViewFeed,
      clubId,
      items.length,
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
    });
  }, [loadFeed]);

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

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === promptId ? mergePromptResponse(item, response) : item,
          ),
        );
        setContentState((currentState) =>
          currentState === 'empty' ? 'ready' : currentState,
        );

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
    isSubmittingResponse: responseSubmittingPromptId !== null,
    responseSubmittingPromptId,
    errorMessage,
    responseErrorMessage,
    isFromCache: false,
    syncErrorMessage: null,
    canRetry: Boolean(clubId) && canViewFeed && !isInitialLoading,
    hasRealPromptPagination: CLUB_FEED_HAS_REAL_PROMPT_PAGINATION,
    handleRetry,
    handleRefresh,
    clearResponseError,
    submitPromptResponse,
  };
}

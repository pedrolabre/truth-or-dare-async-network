import { useCallback, useEffect, useRef, useState } from 'react';

import { getUnreadNotificationsCount } from '../services/notificationsApi';
import type { UnreadNotificationsCount } from '../types/notifications';

type LoadUnreadNotificationsCountAction =
  () => Promise<UnreadNotificationsCount>;

type UseNotificationsUnreadCountOptions = {
  loadUnreadNotificationsCount?: LoadUnreadNotificationsCountAction;
  loadOnMount?: boolean;
};

const GENERIC_UNREAD_COUNT_ERROR =
  'Nao foi possivel carregar o contador de notificacoes.';

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : GENERIC_UNREAD_COUNT_ERROR;
}

export function useNotificationsUnreadCount({
  loadUnreadNotificationsCount = getUnreadNotificationsCount,
  loadOnMount = true,
}: UseNotificationsUnreadCountOptions = {}) {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(loadOnMount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUnreadCount = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await loadUnreadNotificationsCount();

      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      setUnreadCount(Math.max(0, response.unreadCount));
    } catch (error) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        return;
      }

      setErrorMessage(getErrorMessage(error));
    } finally {
      if (isMountedRef.current && requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [loadUnreadNotificationsCount]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((currentCount) => {
      if (currentCount === null) {
        return currentCount;
      }

      return Math.max(0, currentCount - 1);
    });
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!loadOnMount) {
      return;
    }

    void loadUnreadCount();
  }, [loadOnMount, loadUnreadCount]);

  return {
    unreadCount,
    isLoading,
    errorMessage,
    loadUnreadCount,
    decrementUnreadCount,
    clearUnreadCount,
  };
}

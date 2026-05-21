import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getClubDetails } from '../services/clubsApi';
import { mapClubDetailsToDetail } from '../services/clubsMappers';
import type {
  ClubDetail,
  ClubDetailContentState,
  ClubDetailsScreenState,
} from '../types/clubs';
import type { ClubDetailsApi } from '../types/clubsApi';

type LoadClubDetails = (clubId: string) => Promise<ClubDetailsApi>;

type UseClubDetailsScreenOptions = {
  clubId?: string | string[];
  loadClubDetails?: LoadClubDetails;
};

type LoadOptions = {
  clearOnError?: boolean;
  showLoading?: boolean;
  showRefreshing?: boolean;
};

const GENERIC_DETAIL_ERROR_MESSAGE =
  'Nao foi possivel carregar este clube. Verifique sua conexao e tente novamente.';

export function normalizeClubRouteId(value?: string | string[]): string | null {
  const routeValue = Array.isArray(value) ? value[0] : value;
  const trimmedValue = routeValue?.trim();

  return trimmedValue ? trimmedValue : null;
}

function getErrorStatus(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status;
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : GENERIC_DETAIL_ERROR_MESSAGE;
}

export function getClubDetailContentState(
  club: ClubDetail,
): ClubDetailContentState {
  if (club.status === 'deleted' || club.deletedAt) {
    return 'not-found';
  }

  if (club.status === 'archived') {
    return 'archived';
  }

  if (club.status === 'suspended') {
    return 'suspended';
  }

  return 'ready';
}

export function getClubDetailErrorState(
  error: unknown,
): ClubDetailContentState {
  const status = getErrorStatus(error);

  if (status === 403) {
    return 'access-denied';
  }

  if (status === 404 || status === 410) {
    return 'not-found';
  }

  return 'error';
}

export function getClubDetailErrorMessage(
  error: unknown,
  state: ClubDetailContentState,
): string {
  if (state === 'access-denied') {
    return 'Este clube e privado ou voce nao tem permissao para acessa-lo.';
  }

  if (state === 'not-found') {
    return 'Este clube foi removido ou nao existe mais.';
  }

  return getErrorMessage(error);
}

export function useClubDetailsScreen({
  clubId,
  loadClubDetails = getClubDetails,
}: UseClubDetailsScreenOptions): ClubDetailsScreenState & {
  handleRefresh: () => Promise<void>;
  handleRetry: () => Promise<void>;
} {
  const normalizedClubId = useMemo(
    () => normalizeClubRouteId(clubId),
    [clubId],
  );
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [contentState, setContentState] = useState<ClubDetailContentState>(
    normalizedClubId ? 'loading' : 'invalid-id',
  );
  const [isInitialLoading, setIsInitialLoading] = useState(
    Boolean(normalizedClubId),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadClub = useCallback(
    async ({
      clearOnError = true,
      showLoading = true,
      showRefreshing = false,
    }: LoadOptions = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!normalizedClubId) {
        setClub(null);
        setContentState('invalid-id');
        setErrorMessage(null);
        setIsInitialLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        if (showLoading) {
          setClub(null);
          setIsInitialLoading(true);
          setContentState('loading');
        }

        if (showRefreshing) {
          setIsRefreshing(true);
        }

        setErrorMessage(null);

        const clubDetails = await loadClubDetails(normalizedClubId);

        if (
          !isMountedRef.current ||
          requestIdRef.current !== requestId
        ) {
          return;
        }

        const mappedClub = mapClubDetailsToDetail(clubDetails);

        setClub(mappedClub);
        setContentState(getClubDetailContentState(mappedClub));
        setErrorMessage(null);
      } catch (error) {
        if (
          !isMountedRef.current ||
          requestIdRef.current !== requestId
        ) {
          return;
        }

        const nextState = getClubDetailErrorState(error);

        if (clearOnError) {
          setClub(null);
          setContentState(nextState);
        }

        setErrorMessage(getClubDetailErrorMessage(error, nextState));
      } finally {
        if (
          isMountedRef.current &&
          requestIdRef.current === requestId
        ) {
          if (showLoading) {
            setIsInitialLoading(false);
          }

          if (showRefreshing) {
            setIsRefreshing(false);
          }
        }
      }
    },
    [loadClubDetails, normalizedClubId],
  );

  useEffect(() => {
    void loadClub({
      clearOnError: true,
      showLoading: true,
      showRefreshing: false,
    });
  }, [loadClub]);

  const handleRetry = useCallback(async () => {
    await loadClub({
      clearOnError: true,
      showLoading: true,
      showRefreshing: false,
    });
  }, [loadClub]);

  const handleRefresh = useCallback(async () => {
    await loadClub({
      clearOnError: false,
      showLoading: false,
      showRefreshing: true,
    });
  }, [loadClub]);

  return {
    clubId: normalizedClubId,
    club,
    membership: club?.viewerMembership ?? null,
    permissions: club?.permissions ?? null,
    contentState,
    isInitialLoading,
    isRefreshing,
    errorMessage,
    canRetry: normalizedClubId !== null && !isInitialLoading,
    handleRefresh,
    handleRetry,
  };
}

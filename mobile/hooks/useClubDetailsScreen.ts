import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createClubPrompt,
  getClubDetails,
  joinClub,
  leaveClub,
  muteClub,
  requestClubJoin,
  unmuteClub,
} from '../services/clubsApi';
import { mapClubDetailsToDetail } from '../services/clubsMappers';
import type {
  ClubDetailActionKey,
  ClubDetail,
  ClubDetailContentState,
  ClubDetailsScreenState,
  ClubPromptComposerPayload,
} from '../types/clubs';
import type {
  ClubDetailsApi,
  ClubJoinRequestApi,
  ClubMemberApi,
  ClubPromptApi,
  CreateClubPromptPayloadApi,
} from '../types/clubsApi';

type LoadClubDetails = (clubId: string) => Promise<ClubDetailsApi>;
type JoinClubAction = (clubId: string) => Promise<ClubMemberApi>;
type RequestClubJoinAction = (
  clubId: string,
  message?: string | null,
) => Promise<ClubJoinRequestApi>;
type LeaveClubAction = (clubId: string) => Promise<ClubMemberApi>;
type ToggleClubMuteAction = (clubId: string) => Promise<ClubMemberApi>;
type CreateClubPromptAction = (
  clubId: string,
  payload: CreateClubPromptPayloadApi,
) => Promise<ClubPromptApi>;

type UseClubDetailsScreenOptions = {
  clubId?: string | string[];
  loadClubDetails?: LoadClubDetails;
  joinClubAction?: JoinClubAction;
  requestClubJoinAction?: RequestClubJoinAction;
  leaveClubAction?: LeaveClubAction;
  muteClubAction?: ToggleClubMuteAction;
  unmuteClubAction?: ToggleClubMuteAction;
  createClubPromptAction?: CreateClubPromptAction;
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

function getFriendlyClubAccessMessage(message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('bloqueado')) {
    return 'Voce foi bloqueado neste clube e nao pode acessar os detalhes internos.';
  }

  if (normalizedMessage.includes('removido')) {
    return 'Sua participacao foi removida deste clube.';
  }

  if (normalizedMessage.includes('pendente')) {
    return 'Sua solicitacao ainda esta pendente de aprovacao.';
  }

  if (normalizedMessage.includes('privado')) {
    return 'Este clube e privado e exige permissao para acessar.';
  }

  if (normalizedMessage.includes('permissao')) {
    return 'Voce nao tem permissao para acessar este clube no momento.';
  }

  if (normalizedMessage.includes('acesso negado')) {
    return 'Este clube e privado ou voce nao tem permissao para acessa-lo.';
  }

  return message;
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
    return getFriendlyClubAccessMessage(getErrorMessage(error));
  }

  if (state === 'not-found') {
    return 'Este clube foi removido ou nao existe mais.';
  }

  return getErrorMessage(error);
}

export function useClubDetailsScreen({
  clubId,
  loadClubDetails = getClubDetails,
  joinClubAction = joinClub,
  requestClubJoinAction = requestClubJoin,
  leaveClubAction = leaveClub,
  muteClubAction = muteClub,
  unmuteClubAction = unmuteClub,
  createClubPromptAction = createClubPrompt,
}: UseClubDetailsScreenOptions): ClubDetailsScreenState & {
  pendingAction: ClubDetailActionKey | null;
  actionErrorMessage: string | null;
  actionSuccessMessage: string | null;
  isMuted: boolean;
  clearActionFeedback: () => void;
  handleClubUpdated: (clubDetails: ClubDetailsApi) => void;
  handleJoinClub: () => Promise<void>;
  handleLeaveClub: () => Promise<void>;
  handleToggleMute: () => Promise<void>;
  handleCreatePrompt: (
    payload: ClubPromptComposerPayload,
  ) => Promise<ClubPromptApi | null>;
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
  const [pendingAction, setPendingAction] =
    useState<ClubDetailActionKey | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );
  const [actionSuccessMessage, setActionSuccessMessage] = useState<
    string | null
  >(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setIsMuted(false);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);
    setPendingAction(null);
  }, [normalizedClubId]);

  const clearActionFeedback = useCallback(() => {
    setActionErrorMessage(null);
    setActionSuccessMessage(null);
  }, []);

  const handleClubUpdated = useCallback((clubDetails: ClubDetailsApi) => {
    const mappedClub = mapClubDetailsToDetail(clubDetails);

    setClub(mappedClub);
    setContentState(getClubDetailContentState(mappedClub));
    setErrorMessage(null);
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
        return null;
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
        return clubDetails;
      } catch (error) {
        if (
          !isMountedRef.current ||
          requestIdRef.current !== requestId
        ) {
          return null;
        }

        const nextState = getClubDetailErrorState(error);

        if (clearOnError) {
          setClub(null);
          setContentState(nextState);
        }

        setErrorMessage(getClubDetailErrorMessage(error, nextState));
        return null;
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

  const reloadAfterAction = useCallback(async () => {
    await loadClub({
      clearOnError: false,
      showLoading: false,
      showRefreshing: false,
    });
  }, [loadClub]);

  const getActionErrorMessage = useCallback(
    (error: unknown, fallbackMessage: string) => {
      return error instanceof Error && error.message
        ? error.message
        : fallbackMessage;
    },
    [],
  );

  const handleJoinClub = useCallback(async () => {
    if (!normalizedClubId || !club || pendingAction) {
      return;
    }

    if (club.viewerMembership.isMember) {
      setActionErrorMessage('Voce ja e membro deste clube.');
      setActionSuccessMessage(null);
      return;
    }

    if (club.viewerMembership.status === 'requested') {
      setActionErrorMessage('Sua solicitacao de entrada ja esta pendente.');
      setActionSuccessMessage(null);
      return;
    }

    if (club.joinPolicy === 'invite_only') {
      setActionErrorMessage('Este clube aceita entrada apenas por convite.');
      setActionSuccessMessage(null);
      return;
    }

    const actionKey: ClubDetailActionKey =
      club.joinPolicy === 'approval_required' ? 'join-request' : 'join';

    setPendingAction(actionKey);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      if (club.joinPolicy === 'approval_required') {
        await requestClubJoinAction(normalizedClubId, null);
        setActionSuccessMessage('Solicitacao de entrada enviada.');
      } else {
        await joinClubAction(normalizedClubId);
        setActionSuccessMessage('Voce entrou no clube.');
      }

      await reloadAfterAction();
    } catch (error) {
      setActionErrorMessage(
        getActionErrorMessage(error, 'Nao foi possivel entrar no clube.'),
      );
    } finally {
      setPendingAction(null);
    }
  }, [
    club,
    getActionErrorMessage,
    joinClubAction,
    normalizedClubId,
    pendingAction,
    reloadAfterAction,
    requestClubJoinAction,
  ]);

  const handleLeaveClub = useCallback(async () => {
    if (!normalizedClubId || !club || pendingAction) {
      return;
    }

    if (club.viewerMembership.role === 'owner') {
      setActionErrorMessage(
        'Dono do clube precisa transferir a posse antes de sair.',
      );
      setActionSuccessMessage(null);
      return;
    }

    if (!club.viewerMembership.isMember) {
      setActionErrorMessage('Voce nao e membro ativo deste clube.');
      setActionSuccessMessage(null);
      return;
    }

    setPendingAction('leave');
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      await leaveClubAction(normalizedClubId);
      setActionSuccessMessage('Voce saiu do clube.');
      await reloadAfterAction();
    } catch (error) {
      setActionErrorMessage(
        getActionErrorMessage(error, 'Nao foi possivel sair do clube.'),
      );
    } finally {
      setPendingAction(null);
    }
  }, [
    club,
    getActionErrorMessage,
    leaveClubAction,
    normalizedClubId,
    pendingAction,
    reloadAfterAction,
  ]);

  const handleToggleMute = useCallback(async () => {
    if (!normalizedClubId || !club || pendingAction) {
      return;
    }

    if (!club.viewerMembership.isMember) {
      setActionErrorMessage('Entre no clube para silenciar notificacoes.');
      setActionSuccessMessage(null);
      return;
    }

    const nextMuted = !isMuted;
    const actionKey: ClubDetailActionKey = nextMuted ? 'mute' : 'unmute';

    setPendingAction(actionKey);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      if (nextMuted) {
        await muteClubAction(normalizedClubId);
        setActionSuccessMessage('Clube silenciado.');
      } else {
        await unmuteClubAction(normalizedClubId);
        setActionSuccessMessage('Silencio removido.');
      }

      setIsMuted(nextMuted);
      await reloadAfterAction();
    } catch (error) {
      setActionErrorMessage(
        getActionErrorMessage(
          error,
          nextMuted
            ? 'Nao foi possivel silenciar o clube.'
            : 'Nao foi possivel remover o silencio.',
        ),
      );
    } finally {
      setPendingAction(null);
    }
  }, [
    club,
    getActionErrorMessage,
    isMuted,
    muteClubAction,
    normalizedClubId,
    pendingAction,
    reloadAfterAction,
    unmuteClubAction,
  ]);

  const handleCreatePrompt = useCallback(
    async (payload: ClubPromptComposerPayload) => {
      if (!normalizedClubId || !club || pendingAction) {
        return null;
      }

      if (!club.permissions.canPostPrompt) {
        setActionErrorMessage('Voce nao tem permissao para postar neste clube.');
        setActionSuccessMessage(null);
        return null;
      }

      const apiPayload: CreateClubPromptPayloadApi = {
        type: payload.type,
        content: payload.content,
        difficulty: payload.difficulty,
        expiresAt: payload.expiresAt,
        isMembersOnly: payload.isMembersOnly,
        maxAttempts:
          payload.type === 'dare' ? payload.maxAttempts : null,
      };

      setPendingAction('prompt');
      setActionErrorMessage(null);
      setActionSuccessMessage(null);

      try {
        const prompt = await createClubPromptAction(normalizedClubId, apiPayload);

        setActionSuccessMessage('Prompt publicado no clube.');
        await reloadAfterAction();

        return prompt;
      } catch (error) {
        setActionErrorMessage(
          getActionErrorMessage(error, 'Nao foi possivel postar o prompt.'),
        );
        return null;
      } finally {
        setPendingAction(null);
      }
    },
    [
      club,
      createClubPromptAction,
      getActionErrorMessage,
      normalizedClubId,
      pendingAction,
      reloadAfterAction,
    ],
  );

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
    pendingAction,
    actionErrorMessage,
    actionSuccessMessage,
    isMuted,
    clearActionFeedback,
    handleClubUpdated,
    handleJoinClub,
    handleLeaveClub,
    handleToggleMute,
    handleCreatePrompt,
    handleRefresh,
    handleRetry,
  };
}

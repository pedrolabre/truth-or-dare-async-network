import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useClubDetailsScreen } from '../hooks/useClubDetailsScreen';
import type { ClubDetailsApi } from '../types/clubsApi';

jest.mock('../services/clubsApi', () => ({
  getClubDetails: jest.fn(),
}));

function makeApiError(status: number, message: string) {
  return Object.assign(new Error(message), {
    status,
  });
}

function makeClubDetails(
  overrides: Partial<ClubDetailsApi> = {},
): ClubDetailsApi {
  return {
    id: 'club-real-1',
    slug: 'bons-desafios',
    name: 'Bons Desafios',
    description: 'Um clube para desafios leves.',
    iconName: 'sports-esports',
    avatarUrl: null,
    visibility: 'public',
    status: 'active',
    memberCount: 4,
    promptCount: 7,
    lastActivityAt: '2026-05-21T12:00:00.000Z',
    viewerMembership: {
      isMember: true,
      role: 'admin',
      status: 'active',
    },
    coverUrl: null,
    rules: 'Sem spam.',
    tags: ['games'],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    joinPolicy: 'open',
    permissions: {
      canViewFeed: true,
      canPostPrompt: true,
      canInviteMembers: true,
      canManageMembers: false,
      canEditClub: false,
      canArchiveClub: false,
      canTransferOwnership: false,
    },
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

describe('useClubDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega detalhe real pelo id da rota e expoe membership e permissoes', async () => {
    const loadClubDetails = jest.fn().mockResolvedValue(makeClubDetails());

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-real-1',
        loadClubDetails,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadClubDetails).toHaveBeenCalledTimes(1);
    expect(loadClubDetails).toHaveBeenCalledWith('club-real-1');
    expect(result.current.club?.name).toBe('Bons Desafios');
    expect(result.current.club?.membersLabel).toBe('4 membros');
    expect(result.current.club?.promptsLabel).toBe('7 prompts');
    expect(result.current.membership).toEqual({
      isMember: true,
      role: 'admin',
      status: 'active',
    });
    expect(result.current.permissions?.canPostPrompt).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it('mantem loading inicial enquanto o detalhe esta pendente', async () => {
    const deferred = createDeferred<ClubDetailsApi>();
    const loadClubDetails = jest.fn().mockReturnValue(deferred.promise);

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-loading',
        loadClubDetails,
      }),
    );

    expect(result.current.contentState).toBe('loading');
    expect(result.current.isInitialLoading).toBe(true);

    await act(async () => {
      deferred.resolve(makeClubDetails({ id: 'club-loading' }));
      await deferred.promise;
    });

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(result.current.isInitialLoading).toBe(false);
  });

  it('trata id ausente ou vazio sem chamar a API', async () => {
    const loadClubDetails = jest.fn();

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: '   ',
        loadClubDetails,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('invalid-id');
    });

    expect(result.current.clubId).toBeNull();
    expect(result.current.club).toBeNull();
    expect(result.current.canRetry).toBe(false);
    expect(loadClubDetails).not.toHaveBeenCalled();
  });

  it('mostra erro generico e retry recupera o detalhe', async () => {
    const loadClubDetails = jest
      .fn()
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce(makeClubDetails({ id: 'club-retry' }));

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-retry',
        loadClubDetails,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('error');
    });

    expect(result.current.errorMessage).toBe('Falha de rede');
    expect(result.current.club).toBeNull();

    await act(async () => {
      await result.current.handleRetry();
    });

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadClubDetails).toHaveBeenCalledTimes(2);
    expect(result.current.club?.id).toBe('club-retry');
    expect(result.current.errorMessage).toBeNull();
  });

  it('mapeia 403 para acesso negado de clube privado', async () => {
    const loadClubDetails = jest
      .fn()
      .mockRejectedValue(makeApiError(403, 'Acesso negado'));

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-private',
        loadClubDetails,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('access-denied');
    });

    expect(result.current.errorMessage).toBe(
      'Este clube e privado ou voce nao tem permissao para acessa-lo.',
    );
    expect(result.current.club).toBeNull();
  });

  it('traduz mensagens de usuario bloqueado ou removido sem esconder o motivo', async () => {
    const blockedLoad = jest
      .fn()
      .mockRejectedValue(makeApiError(403, 'Usuario bloqueado neste clube'));
    const removedLoad = jest
      .fn()
      .mockRejectedValue(makeApiError(403, 'Usuario removido deste clube'));

    const blockedHook = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-blocked',
        loadClubDetails: blockedLoad,
      }),
    );
    const removedHook = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-removed',
        loadClubDetails: removedLoad,
      }),
    );

    await waitFor(() => {
      expect(blockedHook.result.current.contentState).toBe('access-denied');
    });
    await waitFor(() => {
      expect(removedHook.result.current.contentState).toBe('access-denied');
    });

    expect(blockedHook.result.current.errorMessage).toBe(
      'Voce foi bloqueado neste clube e nao pode acessar os detalhes internos.',
    );
    expect(removedHook.result.current.errorMessage).toBe(
      'Sua participacao foi removida deste clube.',
    );
  });

  it('mapeia 404 para clube removido ou inexistente', async () => {
    const loadClubDetails = jest
      .fn()
      .mockRejectedValue(makeApiError(404, 'Nao encontrado'));

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-missing',
        loadClubDetails,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('not-found');
    });

    expect(result.current.errorMessage).toBe(
      'Este clube foi removido ou nao existe mais.',
    );
  });

  it('representa arquivado, suspenso e removido a partir do detalhe retornado', async () => {
    const archivedLoad = jest.fn().mockResolvedValue(
      makeClubDetails({
        id: 'club-archived',
        status: 'archived',
        archivedAt: '2026-05-21T10:00:00.000Z',
        permissions: {
          ...makeClubDetails().permissions,
          canPostPrompt: false,
        },
      }),
    );
    const suspendedLoad = jest.fn().mockResolvedValue(
      makeClubDetails({
        id: 'club-suspended',
        status: 'suspended',
        permissions: {
          ...makeClubDetails().permissions,
          canViewFeed: false,
        },
      }),
    );
    const deletedLoad = jest.fn().mockResolvedValue(
      makeClubDetails({
        id: 'club-deleted',
        status: 'deleted',
        deletedAt: '2026-05-21T11:00:00.000Z',
      }),
    );

    const archivedHook = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-archived',
        loadClubDetails: archivedLoad,
      }),
    );
    const suspendedHook = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-suspended',
        loadClubDetails: suspendedLoad,
      }),
    );
    const deletedHook = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-deleted',
        loadClubDetails: deletedLoad,
      }),
    );

    await waitFor(() => {
      expect(archivedHook.result.current.contentState).toBe('archived');
    });
    await waitFor(() => {
      expect(suspendedHook.result.current.contentState).toBe('suspended');
    });
    await waitFor(() => {
      expect(deletedHook.result.current.contentState).toBe('not-found');
    });

    expect(archivedHook.result.current.permissions?.canPostPrompt).toBe(false);
    expect(suspendedHook.result.current.permissions?.canViewFeed).toBe(false);
    expect(deletedHook.result.current.club?.status).toBe('deleted');
  });

  it('refresh preserva detalhe carregado quando a API falha', async () => {
    const loadClubDetails = jest
      .fn()
      .mockResolvedValueOnce(makeClubDetails({ id: 'club-refresh' }))
      .mockRejectedValueOnce(new Error('Offline'));

    const { result } = renderHook(() =>
      useClubDetailsScreen({
        clubId: 'club-refresh',
        loadClubDetails,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(result.current.contentState).toBe('ready');
    expect(result.current.club?.id).toBe('club-refresh');
    expect(result.current.errorMessage).toBe('Offline');
  });
});

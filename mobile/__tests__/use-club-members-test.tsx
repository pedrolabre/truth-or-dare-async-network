import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ClubsApiError } from '../services/clubsApi';
import { useClubMembers } from '../hooks/useClubMembers';
import type { ClubMemberApi, ClubMembersApi } from '../types/clubsApi';

function makeMember(overrides: Partial<ClubMemberApi> = {}): ClubMemberApi {
  return {
    id: 'membership-1',
    clubId: 'club-1',
    userId: 'user-1',
    name: 'Ana Membro',
    username: 'ana',
    role: 'member',
    status: 'active',
    joinedAt: '2026-05-20T12:00:00.000Z',
    lastSeenAt: null,
    mutedUntil: null,
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

function makeMembersResponse({
  items = [makeMember()],
  page = 1,
  limit = 20,
  total = items.length,
  totalPages = total > 0 ? Math.ceil(total / limit) : 0,
}: {
  items?: ClubMemberApi[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
} = {}): ClubMembersApi {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
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

describe('useClubMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('nao carrega membros enquanto a aba nao esta ativa', () => {
    const loadClubMembers = jest.fn().mockResolvedValue(makeMembersResponse());

    const { result } = renderHook(() =>
      useClubMembers({
        clubId: 'club-1',
        isActive: false,
        loadClubMembers,
      }),
    );

    expect(result.current.contentState).toBe('idle');
    expect(loadClubMembers).not.toHaveBeenCalled();
  });

  it('carrega membros com page e limit reais quando ativo', async () => {
    const loadClubMembers = jest.fn().mockResolvedValue(makeMembersResponse());

    const { result } = renderHook(() =>
      useClubMembers({
        clubId: 'club-1',
        isActive: true,
        pageSize: 10,
        loadClubMembers,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadClubMembers).toHaveBeenCalledWith('club-1', {
      page: 1,
      limit: 10,
      role: null,
      status: null,
      search: '',
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('mostra loading, vazio e retry apos erro', async () => {
    const deferred = createDeferred<ClubMembersApi>();
    const loadClubMembers = jest
      .fn()
      .mockReturnValueOnce(deferred.promise)
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce(makeMembersResponse({ items: [] }));

    const { result } = renderHook(() =>
      useClubMembers({
        clubId: 'club-1',
        isActive: true,
        loadClubMembers,
      }),
    );

    expect(result.current.contentState).toBe('loading');
    expect(result.current.isInitialLoading).toBe(true);

    await act(async () => {
      deferred.resolve(makeMembersResponse());
      await deferred.promise;
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(result.current.contentState).toBe('ready');
    expect(result.current.items).toHaveLength(1);
    expect(result.current.errorMessage).toBe('Falha de rede');

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(result.current.contentState).toBe('empty');
    expect(result.current.items).toEqual([]);
  });

  it('aplica busca, papel e status somente como parametros do endpoint', async () => {
    const loadClubMembers = jest
      .fn()
      .mockResolvedValue(
        makeMembersResponse({ items: [makeMember({ role: 'admin' })] }),
      );

    const { result } = renderHook(() =>
      useClubMembers({
        clubId: 'club-1',
        isActive: true,
        loadClubMembers,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    act(() => {
      result.current.setSearchQuery('admin');
      result.current.setRoleFilter('admin');
      result.current.setStatusFilter('active');
    });

    await waitFor(() => {
      expect(loadClubMembers).toHaveBeenLastCalledWith('club-1', {
        page: 1,
        limit: 20,
        role: 'admin',
        status: 'active',
        search: 'admin',
      });
    });
  });

  it('carrega mais usando a proxima pagina real', async () => {
    const loadClubMembers = jest
      .fn()
      .mockResolvedValueOnce(
        makeMembersResponse({
          items: [makeMember({ id: 'membership-1', userId: 'user-1' })],
          page: 1,
          limit: 1,
          total: 2,
          totalPages: 2,
        }),
      )
      .mockResolvedValueOnce(
        makeMembersResponse({
          items: [makeMember({ id: 'membership-2', userId: 'user-2' })],
          page: 2,
          limit: 1,
          total: 2,
          totalPages: 2,
        }),
      );

    const { result } = renderHook(() =>
      useClubMembers({
        clubId: 'club-1',
        isActive: true,
        pageSize: 1,
        loadClubMembers,
      }),
    );

    await waitFor(() => {
      expect(result.current.canLoadMore).toBe(true);
    });

    await act(async () => {
      await result.current.handleLoadMore();
    });

    expect(loadClubMembers).toHaveBeenLastCalledWith('club-1', {
      page: 2,
      limit: 1,
      role: null,
      status: null,
      search: '',
    });
    expect(result.current.items.map((member) => member.userId)).toEqual([
      'user-1',
      'user-2',
    ]);
  });

  it('mapeia falta de acesso para estado claro sem quebrar a tela de detalhe', async () => {
    const loadClubMembers = jest
      .fn()
      .mockRejectedValue(new ClubsApiError(403, 'Acesso negado'));

    const { result } = renderHook(() =>
      useClubMembers({
        clubId: 'club-1',
        isActive: true,
        loadClubMembers,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('access-denied');
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.errorMessage).toBe('Acesso negado');
  });
});

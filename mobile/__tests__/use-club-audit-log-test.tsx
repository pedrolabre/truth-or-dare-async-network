import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ClubsApiError } from '../services/clubsApi';
import { useClubAuditLog } from '../hooks/useClubAuditLog';
import type {
  ClubAuditLogApi,
  ClubAuditLogsApi,
} from '../types/clubsApi';

function makeAuditLog(
  overrides: Partial<ClubAuditLogApi> = {},
): ClubAuditLogApi {
  return {
    id: 'audit-1',
    action: 'club_member_role_updated',
    actorId: 'owner-123456789',
    targetUserId: 'member-123456789',
    entityType: 'club_member',
    entityId: 'membership-123456789',
    metadata: {
      previousRole: 'member',
      newRole: 'admin',
      passwordHash: 'hidden',
      nested: {
        visible: true,
        token: 'hidden-token',
      },
    },
    createdAt: '2026-06-06T12:30:00.000Z',
    ...overrides,
  };
}

function makeAuditResponse({
  items = [makeAuditLog()],
  nextCursor = null,
}: {
  items?: ClubAuditLogApi[];
  nextCursor?: string | null;
} = {}): ClubAuditLogsApi {
  return {
    items,
    nextCursor,
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

describe('useClubAuditLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('nao carrega enquanto a aba de auditoria nao esta ativa', () => {
    const loadClubAuditLogs = jest.fn().mockResolvedValue(makeAuditResponse());

    const { result } = renderHook(() =>
      useClubAuditLog({
        clubId: 'club-1',
        isActive: false,
        canViewAudit: true,
        loadClubAuditLogs,
      }),
    );

    expect(result.current.contentState).toBe('idle');
    expect(loadClubAuditLogs).not.toHaveBeenCalled();
  });

  it('carrega auditoria ativa e sanitiza metadata para itens de tela', async () => {
    const loadClubAuditLogs = jest.fn().mockResolvedValue(makeAuditResponse());

    const { result } = renderHook(() =>
      useClubAuditLog({
        clubId: 'club-1',
        isActive: true,
        canViewAudit: true,
        pageSize: 10,
        loadClubAuditLogs,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadClubAuditLogs).toHaveBeenCalledWith('club-1', {
      limit: 10,
      cursor: null,
      action: null,
      targetUserId: null,
      entityType: null,
      from: null,
      to: null,
    });
    expect(result.current.items[0]).toMatchObject({
      actionLabel: 'Papel alterado',
      actorLabel: 'Ator owner-12...',
      targetLabel: 'Alvo member-1...',
      entityLabel: 'Membro membersh...',
      createdAtLabel: '06/06/2026 12:30',
    });
    expect(JSON.stringify(result.current.items[0].metadataEntries)).not.toContain(
      'passwordHash',
    );
    expect(JSON.stringify(result.current.items[0].metadataEntries)).not.toContain(
      'hidden-token',
    );
    expect(result.current.items[0].metadataEntries).toEqual(
      expect.arrayContaining([
        { label: 'Papel anterior', value: 'member' },
        { label: 'Novo papel', value: 'admin' },
        { label: 'Nested Visible', value: 'Sim' },
      ]),
    );
  });

  it('mostra vazio e recarrega por retry apos erro', async () => {
    const deferred = createDeferred<ClubAuditLogsApi>();
    const loadClubAuditLogs = jest
      .fn()
      .mockReturnValueOnce(deferred.promise)
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce(makeAuditResponse({ items: [] }));

    const { result } = renderHook(() =>
      useClubAuditLog({
        clubId: 'club-1',
        isActive: true,
        canViewAudit: true,
        loadClubAuditLogs,
      }),
    );

    expect(result.current.contentState).toBe('loading');
    expect(result.current.isInitialLoading).toBe(true);

    await act(async () => {
      deferred.resolve(makeAuditResponse());
      await deferred.promise;
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(result.current.contentState).toBe('ready');
    expect(result.current.errorMessage).toBe('Falha de rede');

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(result.current.contentState).toBe('empty');
    expect(result.current.items).toEqual([]);
  });

  it('mapeia 403 para acesso negado', async () => {
    const loadClubAuditLogs = jest
      .fn()
      .mockRejectedValue(new ClubsApiError(403, 'Acesso negado'));

    const { result } = renderHook(() =>
      useClubAuditLog({
        clubId: 'club-1',
        isActive: true,
        canViewAudit: true,
        loadClubAuditLogs,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('access-denied');
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.errorMessage).toBe('Acesso negado');
  });

  it('carrega mais com cursor e aplica filtros normalizados', async () => {
    const loadClubAuditLogs = jest
      .fn()
      .mockResolvedValueOnce(
        makeAuditResponse({
          items: [makeAuditLog({ id: 'audit-1' })],
          nextCursor: 'audit-1',
        }),
      )
      .mockResolvedValueOnce(
        makeAuditResponse({
          items: [makeAuditLog({ id: 'audit-2', action: 'club_member_left' })],
          nextCursor: null,
        }),
      )
      .mockResolvedValueOnce(
        makeAuditResponse({
          items: [makeAuditLog({ id: 'audit-3' })],
          nextCursor: null,
        }),
      );

    const { result } = renderHook(() =>
      useClubAuditLog({
        clubId: 'club-1',
        isActive: true,
        canViewAudit: true,
        pageSize: 1,
        loadClubAuditLogs,
      }),
    );

    await waitFor(() => {
      expect(result.current.canLoadMore).toBe(true);
    });

    await act(async () => {
      await result.current.handleLoadMore();
    });

    expect(loadClubAuditLogs).toHaveBeenLastCalledWith('club-1', {
      limit: 1,
      cursor: 'audit-1',
      action: null,
      targetUserId: null,
      entityType: null,
      from: null,
      to: null,
    });
    expect(result.current.items.map((item) => item.id)).toEqual([
      'audit-1',
      'audit-2',
    ]);

    act(() => {
      result.current.setActionFilter(' club_member_role_updated ');
      result.current.setEntityTypeFilter('club_member');
      result.current.setTargetUserIdFilter('member-1');
      result.current.setFromFilter('2026-06-01T00:00:00.000Z');
      result.current.setToFilter('2026-06-06T23:59:59.000Z');
    });

    await waitFor(() => {
      expect(loadClubAuditLogs).toHaveBeenLastCalledWith('club-1', {
        limit: 1,
        cursor: null,
        action: 'club_member_role_updated',
        targetUserId: 'member-1',
        entityType: 'club_member',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-06T23:59:59.000Z',
      });
    });
  });

  it('bloqueia a consulta localmente quando permissao nao esta disponivel', () => {
    const loadClubAuditLogs = jest.fn().mockResolvedValue(makeAuditResponse());

    const { result } = renderHook(() =>
      useClubAuditLog({
        clubId: 'club-1',
        isActive: true,
        canViewAudit: false,
        loadClubAuditLogs,
      }),
    );

    expect(result.current.contentState).toBe('access-denied');
    expect(result.current.canRetry).toBe(false);
    expect(loadClubAuditLogs).not.toHaveBeenCalled();
  });
});

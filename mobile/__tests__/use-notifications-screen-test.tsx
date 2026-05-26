import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  getNotificationNavigationTarget,
  groupNotificationsByPeriod,
  useNotificationsScreen,
} from '../hooks/useNotificationsScreen';
import type {
  ListNotificationsResponse,
  NotificationItem,
} from '../types/notifications';

function makeNotification(
  overrides: Partial<NotificationItem> = {},
): NotificationItem {
  return {
    id: 'notification-1',
    type: 'club_new_prompt',
    title: 'Novo prompt no clube',
    body: 'Ana publicou um novo prompt.',
    deepLink: '/clubs/club-1/prompts/prompt-1',
    actorId: 'user-2',
    clubId: 'club-1',
    referenceType: 'club_prompt',
    referenceId: 'prompt-1',
    readAt: null,
    createdAt: '2026-05-23T12:00:00.000Z',
    ...overrides,
  };
}

function makeResponse(
  items: NotificationItem[] = [makeNotification()],
): ListNotificationsResponse {
  return {
    items,
    nextCursor: null,
  };
}

describe('useNotificationsScreen', () => {
  it('lista notificacoes persistentes reais do servico mobile', async () => {
    const loadNotifications = jest.fn().mockResolvedValue(makeResponse());

    const { result } = renderHook(() =>
      useNotificationsScreen({ loadNotifications }),
    );

    expect(result.current.contentState).toBe('loading');

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadNotifications).toHaveBeenCalledTimes(1);
    expect(result.current.items).toEqual([makeNotification()]);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.allRead).toBe(false);
  });

  it('exibe estado vazio quando a listagem volta sem itens', async () => {
    const loadNotifications = jest.fn().mockResolvedValue(makeResponse([]));

    const { result } = renderHook(() =>
      useNotificationsScreen({ loadNotifications }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('empty');
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.allRead).toBe(true);
  });

  it('exibe erro e retry recupera a lista', async () => {
    const loadNotifications = jest
      .fn()
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce(makeResponse([makeNotification({ id: 'retry' })]));

    const { result } = renderHook(() =>
      useNotificationsScreen({ loadNotifications }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('error');
    });

    expect(result.current.errorMessage).toBe('Falha de rede');

    await act(async () => {
      await result.current.handleRetry();
    });

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadNotifications).toHaveBeenCalledTimes(2);
    expect(result.current.items[0]?.id).toBe('retry');
  });

  it('refresh preserva lista carregada quando ocorre erro', async () => {
    const loadNotifications = jest
      .fn()
      .mockResolvedValueOnce(makeResponse([makeNotification({ id: 'loaded' })]))
      .mockRejectedValueOnce(new Error('Offline'));

    const { result } = renderHook(() =>
      useNotificationsScreen({ loadNotifications }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(result.current.contentState).toBe('ready');
    expect(result.current.items[0]?.id).toBe('loaded');
    expect(result.current.errorMessage).toBe('Offline');
  });

  it('agrupa notificacoes universais por Hoje, Esta semana e Anteriores', async () => {
    const now = new Date('2026-05-26T15:00:00.000Z');
    const today = makeNotification({
      id: 'today',
      type: 'feed_truth_received',
      title: 'Nova verdade',
      deepLink: '/feed',
      clubId: null,
      createdAt: '2026-05-26T12:00:00.000Z',
    });
    const thisWeek = makeNotification({
      id: 'this-week',
      type: 'feed_like',
      title: 'Curtida no feed',
      deepLink: '/feed',
      clubId: null,
      createdAt: '2026-05-25T12:00:00.000Z',
    });
    const older = makeNotification({
      id: 'older',
      type: 'account_password_reset_completed',
      title: 'Senha atualizada',
      deepLink: '/settings',
      clubId: null,
      createdAt: '2026-05-19T12:00:00.000Z',
    });

    expect(groupNotificationsByPeriod([older, today, thisWeek], now)).toEqual([
      {
        id: 'today',
        title: 'Hoje',
        items: [today],
      },
      {
        id: 'this_week',
        title: 'Esta semana',
        items: [thisWeek],
      },
      {
        id: 'older',
        title: 'Anteriores',
        items: [older],
      },
    ]);
  });

  it('exibe grupos de mais de um dominio apos carregar a inbox', async () => {
    const loadNotifications = jest.fn().mockResolvedValue(
      makeResponse([
        makeNotification({
          id: 'club',
          type: 'club_invite_received',
          title: 'Convite de clube',
          clubId: 'club-1',
          createdAt: new Date().toISOString(),
        }),
        makeNotification({
          id: 'feed',
          type: 'feed_dare_received',
          title: 'Novo desafio',
          deepLink: '/feed',
          clubId: null,
          createdAt: new Date().toISOString(),
        }),
      ]),
    );

    const { result } = renderHook(() =>
      useNotificationsScreen({ loadNotifications }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(result.current.groupedItems).toHaveLength(1);
    expect(result.current.groupedItems[0]?.title).toBe('Hoje');
    expect(result.current.groupedItems[0]?.items.map((item) => item.type)).toEqual(
      ['club_invite_received', 'feed_dare_received'],
    );
  });

  it('tocar em notificacao marca como lida e retorna destino do clube', async () => {
    const notification = makeNotification();
    const readNotification = {
      ...notification,
      readAt: '2026-05-23T12:30:00.000Z',
    };
    const onNotificationRead = jest.fn();
    const markNotificationReadAction = jest.fn().mockResolvedValue({
      notification: readNotification,
    });
    const loadNotifications = jest
      .fn()
      .mockResolvedValue(makeResponse([notification]));

    const { result } = renderHook(() =>
      useNotificationsScreen({
        loadNotifications,
        markNotificationReadAction,
        onNotificationRead,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    let target: unknown = null;

    await act(async () => {
      target = await result.current.handlePressNotification(notification);
    });

    expect(markNotificationReadAction).toHaveBeenCalledWith('notification-1');
    expect(onNotificationRead).toHaveBeenCalledTimes(1);
    expect(target).toEqual({ type: 'club', clubId: 'club-1' });
    expect(result.current.items[0]?.readAt).toBe('2026-05-23T12:30:00.000Z');
  });

  it('nao sincroniza leitura local quando a chamada individual falha', async () => {
    const notification = makeNotification();
    const onNotificationRead = jest.fn();
    const markNotificationReadAction = jest
      .fn()
      .mockRejectedValue(new Error('Falha ao ler'));
    const loadNotifications = jest
      .fn()
      .mockResolvedValue(makeResponse([notification]));

    const { result } = renderHook(() =>
      useNotificationsScreen({
        loadNotifications,
        markNotificationReadAction,
        onNotificationRead,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    let target: unknown = null;

    await act(async () => {
      target = await result.current.handlePressNotification(notification);
    });

    expect(markNotificationReadAction).toHaveBeenCalledWith('notification-1');
    expect(onNotificationRead).not.toHaveBeenCalled();
    expect(target).toEqual({ type: 'club', clubId: 'club-1' });
    expect(result.current.items[0]?.readAt).toBeNull();
    expect(result.current.errorMessage).toBe('Falha ao ler');
  });

  it('nao decrementa contador ao tocar em notificacao ja lida', async () => {
    const notification = makeNotification({
      readAt: '2026-05-23T12:30:00.000Z',
    });
    const onNotificationRead = jest.fn();
    const markNotificationReadAction = jest.fn();
    const loadNotifications = jest
      .fn()
      .mockResolvedValue(makeResponse([notification]));

    const { result } = renderHook(() =>
      useNotificationsScreen({
        loadNotifications,
        markNotificationReadAction,
        onNotificationRead,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    let target: unknown = null;

    await act(async () => {
      target = await result.current.handlePressNotification(notification);
    });

    expect(markNotificationReadAction).not.toHaveBeenCalled();
    expect(onNotificationRead).not.toHaveBeenCalled();
    expect(target).toEqual({ type: 'club', clubId: 'club-1' });
    expect(result.current.unreadCount).toBe(0);
  });

  it('deepLink de prompt cai no destino seguro do clube', () => {
    expect(
      getNotificationNavigationTarget(
        makeNotification({
          clubId: null,
          deepLink: '/clubs/club-safe/prompts/prompt-9',
        }),
      ),
    ).toEqual({
      type: 'club',
      clubId: 'club-safe',
    });
  });

  it('clubId explicito tem prioridade sobre deepLink de clube diferente', () => {
    expect(
      getNotificationNavigationTarget(
        makeNotification({
          clubId: 'club-explicit',
          deepLink: '/clubs/club-deep-link/prompts/prompt-9',
        }),
      ),
    ).toEqual({
      type: 'club',
      clubId: 'club-explicit',
    });
  });

  it('resolve destinos seguros para feed, comentarios de truth, dare, prova e configuracoes', () => {
    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'feed_truth_received',
          clubId: null,
          deepLink: '/feed',
        }),
      ),
    ).toEqual({ type: 'feed' });

    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'feed_truth_comment',
          clubId: null,
          deepLink:
            '/feed-comments?itemId=truth-1&itemType=truth&title=Verdade',
        }),
      ),
    ).toEqual({
      type: 'comments',
      itemId: 'truth-1',
      itemType: 'truth',
      clubId: undefined,
      title: 'Verdade',
      clubName: undefined,
      badge: undefined,
      quote: undefined,
      commentsCount: undefined,
      likesCount: undefined,
      status: undefined,
    });

    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'feed_dare_received',
          clubId: null,
          deepLink: '/action-screen?dareId=dare-1&title=Desafio',
        }),
      ),
    ).toEqual({
      type: 'dare',
      dareId: 'dare-1',
      title: 'Desafio',
      challenger: undefined,
      status: undefined,
      attemptsUsed: undefined,
      maxAttempts: undefined,
      expiresAt: undefined,
      expiresIn: undefined,
    });

    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'feed_dare_proof_submitted',
          clubId: null,
          deepLink:
            '/proof-detail?proofId=proof-1&dareId=dare-1&source=backend',
        }),
      ),
    ).toEqual({
      type: 'proof',
      proofId: 'proof-1',
      dareId: 'dare-1',
      title: undefined,
      challenger: undefined,
      mediaType: undefined,
      localUri: undefined,
      fileName: undefined,
      durationSeconds: undefined,
      text: undefined,
      source: 'backend',
    });

    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'account_password_reset_completed',
          clubId: null,
          deepLink: '/settings',
        }),
      ),
    ).toEqual({ type: 'settings' });
  });

  it('resolve perfil e variantes parametrizadas suportadas sem inventar rotas novas', () => {
    expect(
      getNotificationNavigationTarget(
        makeNotification({
          clubId: null,
          deepLink: '/profile',
        }),
      ),
    ).toEqual({ type: 'profile' });

    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'feed_truth_comment',
          clubId: null,
          deepLink:
            '/feed-comments?itemId=club-prompt-1&itemType=club&clubId=club-1&clubName=Bons%20Desafios',
        }),
      ),
    ).toEqual({
      type: 'comments',
      itemId: 'club-prompt-1',
      itemType: 'club',
      clubId: 'club-1',
      title: undefined,
      clubName: 'Bons Desafios',
      badge: undefined,
      quote: undefined,
      commentsCount: undefined,
      likesCount: undefined,
      status: undefined,
    });

    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'feed_dare_received',
          clubId: null,
          deepLink: '/action-screen?challengeId=challenge-1',
        }),
      ),
    ).toEqual({
      type: 'dare',
      dareId: 'challenge-1',
      title: undefined,
      challenger: undefined,
      status: undefined,
      attemptsUsed: undefined,
      maxAttempts: undefined,
      expiresAt: undefined,
      expiresIn: undefined,
    });

    expect(
      getNotificationNavigationTarget(
        makeNotification({
          type: 'feed_dare_proof_submitted',
          clubId: null,
          deepLink: '/proof-detail?dareId=dare-1',
        }),
      ),
    ).toEqual({
      type: 'proof',
      proofId: undefined,
      dareId: 'dare-1',
      title: undefined,
      challenger: undefined,
      mediaType: undefined,
      localUri: undefined,
      fileName: undefined,
      durationSeconds: undefined,
      text: undefined,
      source: undefined,
    });
  });

  it('destino nao suportado nao quebra a navegacao', () => {
    expect(
      getNotificationNavigationTarget(
        makeNotification({
          clubId: null,
          deepLink: '/unknown/path',
        }),
      ),
    ).toEqual({
      type: 'unsupported',
    });
  });

  it('rejeita deepLinks invalidos, externos ou sem parametros minimos', () => {
    const unsupportedDeepLinks = [
      '',
      'https://example.com/feed',
      'truth-or-dare://feed',
      '/feed-comments?itemType=truth',
      '/feed-comments?itemId=truth-1',
      '/feed-comments?itemId=club-prompt-1&itemType=club',
      '/action-screen',
      '/proof-detail',
    ];

    unsupportedDeepLinks.forEach((deepLink) => {
      expect(
        getNotificationNavigationTarget(
          makeNotification({
            clubId: null,
            deepLink,
          }),
        ),
      ).toEqual({
        type: 'unsupported',
      });
    });
  });

  it('tocar em destino nao suportado marca como lida sem destino navegavel', async () => {
    const notification = makeNotification({
      id: 'unsupported',
      clubId: null,
      deepLink: '/unknown/path',
    });
    const readNotification = {
      ...notification,
      readAt: '2026-05-23T12:30:00.000Z',
    };
    const markNotificationReadAction = jest.fn().mockResolvedValue({
      notification: readNotification,
    });
    const loadNotifications = jest
      .fn()
      .mockResolvedValue(makeResponse([notification]));

    const { result } = renderHook(() =>
      useNotificationsScreen({
        loadNotifications,
        markNotificationReadAction,
      }),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    let target: unknown = null;

    await act(async () => {
      target = await result.current.handlePressNotification(notification);
    });

    expect(markNotificationReadAction).toHaveBeenCalledWith('unsupported');
    expect(target).toEqual({ type: 'unsupported' });
    expect(result.current.items[0]?.readAt).toBe('2026-05-23T12:30:00.000Z');
  });

  it('marca todas como lidas quando ha acao simples disponivel', async () => {
    const onAllNotificationsRead = jest.fn();
    const markAllNotificationsReadAction = jest.fn().mockResolvedValue({
      updatedCount: 2,
    });
    const loadNotifications = jest.fn().mockResolvedValue(
      makeResponse([
        makeNotification({ id: 'one' }),
        makeNotification({ id: 'two' }),
      ]),
    );

    const { result } = renderHook(() =>
      useNotificationsScreen({
        loadNotifications,
        markAllNotificationsReadAction,
        onAllNotificationsRead,
      }),
    );

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    await act(async () => {
      await result.current.handleMarkAllRead();
    });

    expect(markAllNotificationsReadAction).toHaveBeenCalledTimes(1);
    expect(onAllNotificationsRead).toHaveBeenCalledTimes(1);
    expect(result.current.allRead).toBe(true);
    expect(result.current.items.every((item) => item.readAt !== null)).toBe(true);
  });

  it('nao zera contador local quando marcar todas como lidas falha', async () => {
    const onAllNotificationsRead = jest.fn();
    const markAllNotificationsReadAction = jest
      .fn()
      .mockRejectedValue(new Error('Falha ao marcar todas'));
    const loadNotifications = jest.fn().mockResolvedValue(
      makeResponse([
        makeNotification({ id: 'one' }),
        makeNotification({ id: 'two' }),
      ]),
    );

    const { result } = renderHook(() =>
      useNotificationsScreen({
        loadNotifications,
        markAllNotificationsReadAction,
        onAllNotificationsRead,
      }),
    );

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    await act(async () => {
      await result.current.handleMarkAllRead();
    });

    expect(markAllNotificationsReadAction).toHaveBeenCalledTimes(1);
    expect(onAllNotificationsRead).not.toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(2);
    expect(result.current.allRead).toBe(false);
    expect(result.current.errorMessage).toBe('Falha ao marcar todas');
  });
});

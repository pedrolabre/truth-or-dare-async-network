import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  getNotificationNavigationTarget,
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

  it('tocar em notificacao marca como lida e retorna destino do clube', async () => {
    const notification = makeNotification();
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

    expect(markNotificationReadAction).toHaveBeenCalledWith('notification-1');
    expect(target).toEqual({ type: 'club', clubId: 'club-1' });
    expect(result.current.items[0]?.readAt).toBe('2026-05-23T12:30:00.000Z');
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

  it('marca todas como lidas quando ha acao simples disponivel', async () => {
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
      }),
    );

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    await act(async () => {
      await result.current.handleMarkAllRead();
    });

    expect(markAllNotificationsReadAction).toHaveBeenCalledTimes(1);
    expect(result.current.allRead).toBe(true);
    expect(result.current.items.every((item) => item.readAt !== null)).toBe(true);
  });
});

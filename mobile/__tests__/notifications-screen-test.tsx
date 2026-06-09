import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import NotificationsScreen from '../app/notifications';
import { useNotificationsScreen } from '../hooks/useNotificationsScreen';
import { useNotificationsUnreadCount } from '../hooks/useNotificationsUnreadCount';
import type {
  NotificationItem,
  NotificationNavigationTarget,
} from '../types/notifications';

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock('../hooks/useNotificationsScreen', () => ({
  useNotificationsScreen: jest.fn(),
}));

jest.mock('../hooks/useNotificationsUnreadCount', () => ({
  useNotificationsUnreadCount: jest.fn(() => ({
    unreadCount: 0,
    isLoading: false,
    errorMessage: null,
    loadUnreadCount: jest.fn(),
    decrementUnreadCount: jest.fn(),
    clearUnreadCount: jest.fn(),
  })),
}));

const mockedUseNotificationsScreen =
  useNotificationsScreen as jest.MockedFunction<typeof useNotificationsScreen>;
const mockedUseNotificationsUnreadCount =
  useNotificationsUnreadCount as jest.MockedFunction<
    typeof useNotificationsUnreadCount
  >;

function makeNotification(
  overrides: Partial<NotificationItem> = {},
): NotificationItem {
  return {
    id: 'notification-1',
    type: 'club_invite_received',
    title: 'Convite de clube',
    body: 'Ana convidou voce para um clube.',
    deepLink: '/clubs/club-1',
    actorId: 'user-2',
    clubId: 'club-1',
    referenceType: 'club_invite',
    referenceId: 'invite-1',
    readAt: null,
    createdAt: '2026-05-26T12:00:00.000Z',
    ...overrides,
  };
}

function makeHookState(
  overrides: Partial<ReturnType<typeof useNotificationsScreen>> = {},
): ReturnType<typeof useNotificationsScreen> {
  const item = makeNotification();

  return {
    items: [item],
    groupedItems: [
      {
        id: 'today',
        title: 'Hoje',
        items: [item],
      },
    ],
    contentState: 'ready',
    unreadCount: 1,
    allRead: false,
    isInitialLoading: false,
    isRefreshing: false,
    isMarkingAllRead: false,
    readingNotificationIds: [],
    errorMessage: null,
    canRetry: true,
    handleRetry: jest.fn().mockResolvedValue(undefined),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handlePressNotification: jest.fn().mockResolvedValue({ type: 'club', clubId: 'club-1' }),
    handleMarkAllRead: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeUnreadCountHookState(
  overrides: Partial<ReturnType<typeof useNotificationsUnreadCount>> = {},
): ReturnType<typeof useNotificationsUnreadCount> {
  return {
    unreadCount: 0,
    isLoading: false,
    errorMessage: null,
    loadUnreadCount: jest.fn().mockResolvedValue(undefined),
    decrementUnreadCount: jest.fn(),
    clearUnreadCount: jest.fn(),
    ...overrides,
  };
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNotificationsUnreadCount.mockReturnValue(makeUnreadCountHookState());
  });

  it('renderiza inbox universal agrupada com tipos de Clube, Feed e Conta', () => {
    const clubNotification = makeNotification({
      id: 'club',
      type: 'club_invite_received',
      title: 'Convite para Bons Desafios',
      body: 'Ana convidou voce para entrar.',
      clubId: 'club-1',
      createdAt: '2026-05-26T12:00:00.000Z',
    });
    const feedNotification = makeNotification({
      id: 'feed',
      type: 'feed_like',
      title: 'Curtida no feed',
      body: 'Bruno curtiu sua verdade.',
      deepLink: '/feed',
      clubId: null,
      readAt: '2026-05-26T12:10:00.000Z',
      createdAt: '2026-05-25T12:00:00.000Z',
    });
    const accountNotification = makeNotification({
      id: 'account',
      type: 'account_password_reset_completed',
      title: 'Senha atualizada',
      body: 'Sua senha foi redefinida com sucesso.',
      deepLink: '/settings',
      clubId: null,
      readAt: '2026-05-20T12:10:00.000Z',
      createdAt: '2026-05-19T12:00:00.000Z',
    });

    mockedUseNotificationsScreen.mockReturnValue(
      makeHookState({
        items: [clubNotification, feedNotification, accountNotification],
        groupedItems: [
          {
            id: 'today',
            title: 'Hoje',
            items: [clubNotification],
          },
          {
            id: 'this_week',
            title: 'Esta semana',
            items: [feedNotification],
          },
          {
            id: 'older',
            title: 'Anteriores',
            items: [accountNotification],
          },
        ],
        unreadCount: 1,
      }),
    );

    const { getByText, queryByText } = render(<NotificationsScreen />);

    expect(getByText('Hoje')).toBeTruthy();
    expect(getByText('Esta semana')).toBeTruthy();
    expect(getByText('Anteriores')).toBeTruthy();
    expect(getByText('Convite para Bons Desafios')).toBeTruthy();
    expect(getByText('Curtida no feed')).toBeTruthy();
    expect(getByText('Senha atualizada')).toBeTruthy();
    expect(getByText('person-add')).toBeTruthy();
    expect(getByText('favorite')).toBeTruthy();
    expect(getByText('verified-user')).toBeTruthy();
    expect(queryByText('Perfil')).toBeNull();
  });

  it.each([
    [
      'clube',
      makeNotification({ id: 'club', title: 'Abrir clube', clubId: 'club-1' }),
      { type: 'club', clubId: 'club-1' } as NotificationNavigationTarget,
      '/clubs/club-1',
    ],
    [
      'feed',
      makeNotification({
        id: 'feed',
        type: 'feed_truth_received',
        title: 'Abrir feed',
        deepLink: '/feed',
        clubId: null,
      }),
      { type: 'feed' } as NotificationNavigationTarget,
      '/feed',
    ],
    [
      'comentarios de truth',
      makeNotification({
        id: 'comments',
        type: 'feed_truth_comment',
        title: 'Abrir comentarios',
        deepLink: '/feed-comments?itemId=truth-1&itemType=truth',
        clubId: null,
      }),
      {
        type: 'comments',
        itemId: 'truth-1',
        itemType: 'truth',
      } as NotificationNavigationTarget,
      {
        pathname: '/feed-comments',
        params: {
          itemId: 'truth-1',
          itemType: 'truth',
        },
      },
    ],
    [
      'dare',
      makeNotification({
        id: 'dare',
        type: 'feed_dare_received',
        title: 'Abrir desafio',
        deepLink: '/action-screen?dareId=dare-1',
        clubId: null,
      }),
      {
        type: 'dare',
        dareId: 'dare-1',
      } as NotificationNavigationTarget,
      {
        pathname: '/action-screen',
        params: {
          dareId: 'dare-1',
        },
      },
    ],
    [
      'prova de dare',
      makeNotification({
        id: 'proof',
        type: 'feed_dare_proof_submitted',
        title: 'Abrir prova',
        deepLink: '/proof-detail?proofId=proof-1&dareId=dare-1',
        clubId: null,
      }),
      {
        type: 'proof',
        proofId: 'proof-1',
        dareId: 'dare-1',
      } as NotificationNavigationTarget,
      {
        pathname: '/proof-detail',
        params: {
          proofId: 'proof-1',
          dareId: 'dare-1',
        },
      },
    ],
    [
      'perfil',
      makeNotification({
        id: 'profile',
        type: 'account_password_reset_completed',
        title: 'Abrir perfil',
        deepLink: '/profile',
        clubId: null,
      }),
      { type: 'profile' } as NotificationNavigationTarget,
      '/profile',
    ],
    [
      'configuracoes',
      makeNotification({
        id: 'settings',
        type: 'account_password_reset_completed',
        title: 'Abrir configuracoes',
        deepLink: '/settings',
        clubId: null,
      }),
      { type: 'settings' } as NotificationNavigationTarget,
      '/settings',
    ],
  ])('navega para destino seguro de %s ao tocar no card', async (_, notification, target, expectedRoute) => {
    const handlePressNotification = jest.fn().mockResolvedValue(target);

    mockedUseNotificationsScreen.mockReturnValue(
      makeHookState({
        items: [notification],
        groupedItems: [
          {
            id: 'today',
            title: 'Hoje',
            items: [notification],
          },
        ],
        handlePressNotification,
      }),
    );

    const { getByText } = render(<NotificationsScreen />);

    fireEvent.press(getByText(notification.title));

    await waitFor(() => {
      expect(handlePressNotification).toHaveBeenCalledWith(notification);
      expect(mockRouterPush).toHaveBeenCalledWith(expectedRoute);
    });
  });

  it('nao navega quando o destino retornado e unsupported', async () => {
    const notification = makeNotification({
      id: 'unsupported',
      title: 'Destino sem rota',
      deepLink: '/unknown/path',
      clubId: null,
    });
    const handlePressNotification = jest
      .fn()
      .mockResolvedValue({ type: 'unsupported' });

    mockedUseNotificationsScreen.mockReturnValue(
      makeHookState({
        items: [notification],
        groupedItems: [
          {
            id: 'today',
            title: 'Hoje',
            items: [notification],
          },
        ],
        handlePressNotification,
      }),
    );

    const { getByText } = render(<NotificationsScreen />);

    fireEvent.press(getByText('Destino sem rota'));

    await waitFor(() => {
      expect(handlePressNotification).toHaveBeenCalledWith(notification);
    });

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('mantem notificacao privada sanitizada sem navegar para entidade oculta', async () => {
    const notification = makeNotification({
      id: 'private',
      title: 'Atividade privada',
      body: 'Ha uma atualizacao privada disponivel para sua conta.',
      deepLink: '/notifications',
      actorId: null,
      clubId: null,
      referenceType: null,
      referenceId: null,
    });
    const handlePressNotification = jest
      .fn()
      .mockResolvedValue({ type: 'unsupported' });

    mockedUseNotificationsScreen.mockReturnValue(
      makeHookState({
        items: [notification],
        groupedItems: [
          {
            id: 'today',
            title: 'Hoje',
            items: [notification],
          },
        ],
        handlePressNotification,
      }),
    );

    const { getByText, queryByText } = render(<NotificationsScreen />);

    expect(getByText('Atividade privada')).toBeTruthy();
    expect(
      getByText('Ha uma atualizacao privada disponivel para sua conta.'),
    ).toBeTruthy();
    expect(queryByText('Ana')).toBeNull();
    expect(queryByText('Bons Desafios')).toBeNull();

    fireEvent.press(getByText('Atividade privada'));

    await waitFor(() => {
      expect(handlePressNotification).toHaveBeenCalledWith(notification);
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('renderiza loading, estado vazio e estado de erro sem depender de layout fragil', () => {
    mockedUseNotificationsScreen.mockReturnValue(
      makeHookState({
        items: [],
        groupedItems: [],
        contentState: 'loading',
        allRead: true,
        unreadCount: 0,
      }),
    );

    const loading = render(<NotificationsScreen />);
    expect(loading.getByTestId('notifications-skeleton')).toBeTruthy();
    loading.unmount();

    mockedUseNotificationsScreen.mockReturnValue(
      makeHookState({
        items: [],
        groupedItems: [],
        contentState: 'empty',
        allRead: true,
        unreadCount: 0,
      }),
    );

    const empty = render(<NotificationsScreen />);
    expect(empty.getByText('Nenhuma notificacao por enquanto')).toBeTruthy();
    expect(
      empty.getByText(
        'Avisos de clubes, feed e conta aparecerao aqui quando houver novidade.',
      ),
    ).toBeTruthy();
    empty.unmount();

    mockedUseNotificationsScreen.mockReturnValue(
      makeHookState({
        items: [],
        groupedItems: [],
        contentState: 'error',
        errorMessage: 'Falha de rede',
        allRead: true,
        unreadCount: 0,
      }),
    );

    const error = render(<NotificationsScreen />);
    expect(
      error.getByText('Nao foi possivel carregar as notificacoes'),
    ).toBeTruthy();
    expect(error.getByText('Falha de rede')).toBeTruthy();
  });

  it('exibe badge de nao lidas no header limitando valores altos a 99+', () => {
    mockedUseNotificationsUnreadCount.mockReturnValue(makeUnreadCountHookState({
      unreadCount: 104,
    }));
    mockedUseNotificationsScreen.mockReturnValue(makeHookState());

    const { getByTestId, getByText } = render(<NotificationsScreen />);

    expect(getByTestId('notifications-unread-badge')).toBeTruthy();
    expect(getByText('99+')).toBeTruthy();
  });

  it('nao exibe badge sem contador positivo ou quando ha erro no contador', () => {
    mockedUseNotificationsUnreadCount.mockReturnValue(makeUnreadCountHookState({
      unreadCount: null,
      isLoading: true,
    }));
    mockedUseNotificationsScreen.mockReturnValue(makeHookState());

    const loading = render(<NotificationsScreen />);
    expect(loading.queryByTestId('notifications-unread-badge')).toBeNull();
    loading.unmount();

    mockedUseNotificationsUnreadCount.mockReturnValue(makeUnreadCountHookState({
      unreadCount: 8,
      errorMessage: 'Falha de rede',
    }));

    const error = render(<NotificationsScreen />);
    expect(error.queryByTestId('notifications-unread-badge')).toBeNull();
  });

  it('conecta leitura da inbox a sincronizacao local do contador', () => {
    const decrementUnreadCount = jest.fn();
    const clearUnreadCount = jest.fn();

    mockedUseNotificationsUnreadCount.mockReturnValue(
      makeUnreadCountHookState({
        decrementUnreadCount,
        clearUnreadCount,
      }),
    );
    mockedUseNotificationsScreen.mockReturnValue(makeHookState());

    render(<NotificationsScreen />);

    expect(mockedUseNotificationsScreen).toHaveBeenCalledWith({
      onNotificationRead: decrementUnreadCount,
      onAllNotificationsRead: clearUnreadCount,
    });
  });
});

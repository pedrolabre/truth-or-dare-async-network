import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationsApi';
import type {
  ListNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItem,
  NotificationNavigationTarget,
  NotificationPeriodGroup,
  NotificationPeriodGroupId,
  NotificationsContentState,
} from '../types/notifications';

type ListNotificationsAction = () => Promise<ListNotificationsResponse>;
type MarkNotificationReadAction = (
  notificationId: string,
) => Promise<MarkNotificationReadResponse>;
type MarkAllNotificationsReadAction =
  () => Promise<MarkAllNotificationsReadResponse>;

type UseNotificationsScreenOptions = {
  loadNotifications?: ListNotificationsAction;
  markNotificationReadAction?: MarkNotificationReadAction;
  markAllNotificationsReadAction?: MarkAllNotificationsReadAction;
  onNotificationRead?: () => void;
  onAllNotificationsRead?: () => void;
};

type LoadOptions = {
  clearOnError?: boolean;
  showLoading?: boolean;
  showRefreshing?: boolean;
};

const GENERIC_NOTIFICATIONS_ERROR =
  'Nao foi possivel carregar suas notificacoes.';

const NOTIFICATION_PERIOD_GROUPS: {
  id: NotificationPeriodGroupId;
  title: string;
}[] = [
  { id: 'today', title: 'Hoje' },
  { id: 'this_week', title: 'Esta semana' },
  { id: 'older', title: 'Anteriores' },
];

type ParsedNotificationDeepLink = {
  pathname: string;
  params: Record<string, string>;
};

function defaultLoadNotifications() {
  return listNotifications({ limit: 50 });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : GENERIC_NOTIFICATIONS_ERROR;
}

function startOfLocalDay(date: Date): Date {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

function startOfLocalWeek(date: Date): Date {
  const weekStart = startOfLocalDay(date);
  const dayOfWeek = weekStart.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  weekStart.setDate(weekStart.getDate() - daysFromMonday);
  return weekStart;
}

export function getNotificationPeriodGroupId(
  createdAt: string,
  now = new Date(),
): NotificationPeriodGroupId {
  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return 'older';
  }

  const todayStart = startOfLocalDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (createdDate >= todayStart && createdDate < tomorrowStart) {
    return 'today';
  }

  const weekStart = startOfLocalWeek(now);

  if (createdDate >= weekStart && createdDate < todayStart) {
    return 'this_week';
  }

  return 'older';
}

export function groupNotificationsByPeriod(
  items: NotificationItem[],
  now = new Date(),
): NotificationPeriodGroup[] {
  const groupedItems = new Map<NotificationPeriodGroupId, NotificationItem[]>(
    NOTIFICATION_PERIOD_GROUPS.map((group) => [group.id, []]),
  );

  items.forEach((item) => {
    const groupId = getNotificationPeriodGroupId(item.createdAt, now);
    groupedItems.get(groupId)?.push(item);
  });

  return NOTIFICATION_PERIOD_GROUPS.map((group) => ({
    ...group,
    items: groupedItems.get(group.id) ?? [],
  })).filter((group) => group.items.length > 0);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

function parseNotificationDeepLink(
  deepLink: string,
): ParsedNotificationDeepLink | null {
  const trimmedDeepLink = deepLink.trim();

  if (!trimmedDeepLink.startsWith('/')) {
    return null;
  }

  const [rawPathname, rawQuery = ''] = trimmedDeepLink.split('?');
  const pathname = rawPathname.replace(/\/+$/, '') || '/';
  const params: Record<string, string> = {};

  rawQuery
    .split('&')
    .filter(Boolean)
    .forEach((param) => {
      const [rawKey, ...rawValueParts] = param.split('=');
      const key = safeDecode(rawKey ?? '').trim();

      if (!key) {
        return;
      }

      params[key] = safeDecode(rawValueParts.join('='));
    });

  return {
    pathname,
    params,
  };
}

function getDeepLinkPathSegment(pathname: string, index: number) {
  const segment = pathname.split('/').filter(Boolean)[index];

  return segment ? safeDecode(segment) : null;
}

function getSupportedCommentsItemType(value?: string) {
  if (value === 'truth' || value === 'dare' || value === 'club') {
    return value;
  }

  return null;
}

export function getNotificationNavigationTarget(
  notification: NotificationItem,
): NotificationNavigationTarget {
  if (notification.clubId) {
    return {
      type: 'club',
      clubId: notification.clubId,
    };
  }

  const parsedDeepLink = parseNotificationDeepLink(notification.deepLink);

  if (!parsedDeepLink) {
    return {
      type: 'unsupported',
    };
  }

  const clubId = getDeepLinkPathSegment(parsedDeepLink.pathname, 1);

  if (parsedDeepLink.pathname.startsWith('/clubs/') && clubId) {
    return {
      type: 'club',
      clubId,
    };
  }

  if (parsedDeepLink.pathname === '/feed') {
    return {
      type: 'feed',
    };
  }

  if (parsedDeepLink.pathname === '/feed-comments') {
    const itemType = getSupportedCommentsItemType(
      parsedDeepLink.params.itemType,
    );
    const itemId = parsedDeepLink.params.itemId?.trim();

    if (
      !itemType ||
      !itemId ||
      (itemType === 'club' && !parsedDeepLink.params.clubId)
    ) {
      return {
        type: 'unsupported',
      };
    }

    return {
      type: 'comments',
      itemId,
      itemType,
      clubId: parsedDeepLink.params.clubId,
      title: parsedDeepLink.params.title,
      clubName: parsedDeepLink.params.clubName,
      badge: parsedDeepLink.params.badge,
      quote: parsedDeepLink.params.quote,
      commentsCount: parsedDeepLink.params.commentsCount,
      likesCount: parsedDeepLink.params.likesCount,
      status: parsedDeepLink.params.status,
    };
  }

  if (parsedDeepLink.pathname === '/action-screen') {
    const dareId =
      parsedDeepLink.params.dareId?.trim() ??
      parsedDeepLink.params.challengeId?.trim();

    if (!dareId) {
      return {
        type: 'unsupported',
      };
    }

    return {
      type: 'dare',
      dareId,
      title: parsedDeepLink.params.title,
      challenger: parsedDeepLink.params.challenger,
      status: parsedDeepLink.params.status,
      attemptsUsed: parsedDeepLink.params.attemptsUsed,
      maxAttempts: parsedDeepLink.params.maxAttempts,
      expiresAt: parsedDeepLink.params.expiresAt,
      expiresIn: parsedDeepLink.params.expiresIn,
    };
  }

  if (parsedDeepLink.pathname === '/proof-detail') {
    const proofId = parsedDeepLink.params.proofId?.trim();
    const dareId = parsedDeepLink.params.dareId?.trim();

    if (!proofId && !dareId) {
      return {
        type: 'unsupported',
      };
    }

    return {
      type: 'proof',
      proofId,
      dareId,
      title: parsedDeepLink.params.title,
      challenger: parsedDeepLink.params.challenger,
      mediaType: parsedDeepLink.params.mediaType,
      localUri: parsedDeepLink.params.localUri,
      fileName: parsedDeepLink.params.fileName,
      durationSeconds: parsedDeepLink.params.durationSeconds,
      text: parsedDeepLink.params.text,
      source: parsedDeepLink.params.source,
    };
  }

  if (parsedDeepLink.pathname === '/profile') {
    return {
      type: 'profile',
    };
  }

  if (parsedDeepLink.pathname === '/settings') {
    return {
      type: 'settings',
    };
  }

  return {
    type: 'unsupported',
  };
}

export function useNotificationsScreen({
  loadNotifications = defaultLoadNotifications,
  markNotificationReadAction = markNotificationRead,
  markAllNotificationsReadAction = markAllNotificationsRead,
  onNotificationRead,
  onAllNotificationsRead,
}: UseNotificationsScreenOptions = {}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [contentState, setContentState] =
    useState<NotificationsContentState>('loading');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [readingNotificationIds, setReadingNotificationIds] = useState<
    string[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => item.readAt === null).length,
    [items],
  );
  const allRead = unreadCount === 0;
  const groupedItems = useMemo(() => groupNotificationsByPeriod(items), [items]);

  const load = useCallback(
    async ({
      clearOnError = true,
      showLoading = true,
      showRefreshing = false,
    }: LoadOptions = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      try {
        if (showLoading) {
          setIsInitialLoading(true);
          setContentState('loading');
        }

        if (showRefreshing) {
          setIsRefreshing(true);
        }

        setErrorMessage(null);

        const response = await loadNotifications();

        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return;
        }

        setItems(response.items);
        setContentState(response.items.length > 0 ? 'ready' : 'empty');
      } catch (error) {
        if (!isMountedRef.current || requestIdRef.current !== requestId) {
          return;
        }

        if (clearOnError) {
          setItems([]);
          setContentState('error');
        }

        setErrorMessage(getErrorMessage(error));
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
    [loadNotifications],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleRetry = useCallback(async () => {
    await load({
      clearOnError: true,
      showLoading: true,
      showRefreshing: false,
    });
  }, [load]);

  const handleRefresh = useCallback(async () => {
    await load({
      clearOnError: false,
      showLoading: false,
      showRefreshing: true,
    });
  }, [load]);

  const setNotificationRead = useCallback((notification: NotificationItem) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === notification.id ? notification : item,
      ),
    );
  }, []);

  const handlePressNotification = useCallback(
    async (notification: NotificationItem) => {
      const target = getNotificationNavigationTarget(notification);

      if (notification.readAt !== null) {
        return target;
      }

      setReadingNotificationIds((currentIds) => [
        ...new Set([...currentIds, notification.id]),
      ]);

      try {
        const response = await markNotificationReadAction(notification.id);

      if (isMountedRef.current) {
        setNotificationRead(response.notification);
        onNotificationRead?.();
      }
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
        if (isMountedRef.current) {
          setReadingNotificationIds((currentIds) =>
            currentIds.filter((id) => id !== notification.id),
          );
        }
      }

      return target;
    },
    [markNotificationReadAction, onNotificationRead, setNotificationRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (allRead || isMarkingAllRead) {
      return;
    }

    setIsMarkingAllRead(true);

    try {
      await markAllNotificationsReadAction();

      if (!isMountedRef.current) {
        return;
      }

      const readAt = new Date().toISOString();

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.readAt === null ? { ...item, readAt } : item,
        ),
      );
      onAllNotificationsRead?.();
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (isMountedRef.current) {
        setIsMarkingAllRead(false);
      }
    }
  }, [
    allRead,
    isMarkingAllRead,
    markAllNotificationsReadAction,
    onAllNotificationsRead,
  ]);

  return {
    items,
    groupedItems,
    contentState,
    unreadCount,
    allRead,
    isInitialLoading,
    isRefreshing,
    isMarkingAllRead,
    readingNotificationIds,
    errorMessage,
    canRetry: !isInitialLoading,
    handleRetry,
    handleRefresh,
    handlePressNotification,
    handleMarkAllRead,
  };
}

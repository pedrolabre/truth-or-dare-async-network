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

export function getNotificationNavigationTarget(
  notification: NotificationItem,
): NotificationNavigationTarget {
  if (notification.clubId) {
    return {
      type: 'club',
      clubId: notification.clubId,
    };
  }

  const clubMatch = notification.deepLink?.match(/^\/clubs\/([^/]+)/);

  if (clubMatch?.[1]) {
    return {
      type: 'club',
      clubId: decodeURIComponent(clubMatch[1]),
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
        }
      } catch {
        if (isMountedRef.current) {
          setNotificationRead({
            ...notification,
            readAt: new Date().toISOString(),
          });
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
    [markNotificationReadAction, setNotificationRead],
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
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (isMountedRef.current) {
        setIsMarkingAllRead(false);
      }
    }
  }, [allRead, isMarkingAllRead, markAllNotificationsReadAction]);

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

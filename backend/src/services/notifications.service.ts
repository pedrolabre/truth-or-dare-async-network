import { Prisma, Notification, NotificationType } from '../generated/prisma/client';
import {
  ListNotificationsQueryDto,
  ListNotificationsResponseDto,
  MarkAllNotificationsReadResponseDto,
  MarkNotificationReadResponseDto,
  NotificationItemDto,
  UnreadNotificationsCountDto,
} from '../dtos/notifications.dto';
import { prisma } from '../lib/prisma';

type NotificationErrorCode =
  | 'NOTIFICATION_NOT_FOUND'
  | 'NOTIFICATION_FORBIDDEN'
  | 'NOTIFICATION_UNAUTHENTICATED'
  | 'NOTIFICATION_VALIDATION_ERROR';

export class NotificationServiceError extends Error {
  constructor(
    public code: NotificationErrorCode,
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export type CreateNotificationPayload = {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  deepLink: string;
  clubId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  dedupeKey?: string | null;
};

function requireUserId(userId: string) {
  if (!userId) {
    throw new NotificationServiceError(
      'NOTIFICATION_UNAUTHENTICATED',
      'Usuario autenticado nao encontrado',
      401,
    );
  }
}

function validateCreatePayload(payload: CreateNotificationPayload) {
  requireUserId(payload.userId);

  if (!payload.type || !payload.title || !payload.body || !payload.deepLink) {
    throw new NotificationServiceError(
      'NOTIFICATION_VALIDATION_ERROR',
      'Dados de notificacao invalidos',
      400,
    );
  }
}

function mapNotification(notification: Notification): NotificationItemDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    deepLink: notification.deepLink,
    actorId: notification.actorId,
    clubId: notification.clubId,
    referenceType: notification.referenceType,
    referenceId: notification.referenceId,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

function normalizeLimit(limit: number | undefined) {
  if (!limit || Number.isNaN(limit)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

function getReadFilter(read: boolean | undefined) {
  if (read === true) {
    return {
      not: null,
    };
  }

  if (read === false) {
    return null;
  }

  return undefined;
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<NotificationItemDto | null> {
  validateCreatePayload(payload);

  if (payload.actorId && payload.actorId === payload.userId) {
    return null;
  }

  if (payload.dedupeKey) {
    const existingNotification = await prisma.notification.findUnique({
      where: {
        dedupeKey: payload.dedupeKey,
      },
    });

    if (existingNotification) {
      return mapNotification(existingNotification);
    }
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        actorId: payload.actorId ?? null,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink,
        clubId: payload.clubId ?? null,
        referenceType: payload.referenceType ?? null,
        referenceId: payload.referenceId ?? null,
        dedupeKey: payload.dedupeKey ?? null,
      },
    });

    return mapNotification(notification);
  } catch (error) {
    if (payload.dedupeKey && error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const existingNotification = await prisma.notification.findUnique({
          where: {
            dedupeKey: payload.dedupeKey,
          },
        });

        if (existingNotification) {
          return mapNotification(existingNotification);
        }
      }
    }

    throw error;
  }
}

export async function listNotificationsForUser({
  userId,
  limit,
  cursor,
  read,
}: { userId: string } & ListNotificationsQueryDto): Promise<ListNotificationsResponseDto> {
  requireUserId(userId);

  const take = normalizeLimit(limit);
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      readAt: getReadFilter(read),
    },
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
    take: take + 1,
    ...(cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }
      : {}),
  });

  const hasNextPage = notifications.length > take;
  const items = notifications.slice(0, take);

  return {
    items: items.map(mapNotification),
    nextCursor: hasNextPage ? items[items.length - 1]?.id ?? null : null,
  };
}

export async function countUnreadNotifications(
  userId: string,
): Promise<UnreadNotificationsCountDto> {
  requireUserId(userId);

  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return {
    unreadCount,
  };
}

export async function markNotificationRead({
  userId,
  notificationId,
}: {
  userId: string;
  notificationId: string;
}): Promise<MarkNotificationReadResponseDto> {
  requireUserId(userId);

  if (!notificationId) {
    throw new NotificationServiceError(
      'NOTIFICATION_NOT_FOUND',
      'Notificacao nao encontrada',
      404,
    );
  }

  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });

  if (!notification) {
    throw new NotificationServiceError(
      'NOTIFICATION_NOT_FOUND',
      'Notificacao nao encontrada',
      404,
    );
  }

  if (notification.userId !== userId) {
    throw new NotificationServiceError(
      'NOTIFICATION_FORBIDDEN',
      'Sem permissao para esta notificacao',
      403,
    );
  }

  if (notification.readAt) {
    return {
      notification: mapNotification(notification),
    };
  }

  const updatedNotification = await prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      readAt: new Date(),
    },
  });

  return {
    notification: mapNotification(updatedNotification),
  };
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<MarkAllNotificationsReadResponseDto> {
  requireUserId(userId);

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return {
    updatedCount: result.count,
  };
}

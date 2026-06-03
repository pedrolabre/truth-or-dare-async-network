import {
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
  Prisma,
  Notification,
  NotificationType,
} from '../generated/prisma/client';
import {
  ListNotificationsQueryDto,
  ListNotificationsResponseDto,
  MarkAllNotificationsReadResponseDto,
  MarkNotificationReadResponseDto,
  NotificationItemDto,
  UnreadNotificationsCountDto,
} from '../dtos/notifications.dto';
import { prisma } from '../lib/prisma';
import {
  canViewClubPrivacyRecord,
  canViewPrivateUserProfile,
} from './search/privacy';
import {
  buildCursorPaginationResult,
  getCursorPaginationArgs,
  normalizeCursorPagination,
} from './pagination';

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

export const CLUB_FEED_ACTIVITY_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.club_new_prompt,
  NotificationType.club_prompt_response,
  NotificationType.club_prompt_comment,
  NotificationType.club_mention,
];

const PRIVATE_NOTIFICATION_TITLE = 'Atividade privada';
const PRIVATE_NOTIFICATION_BODY =
  'Ha uma atualizacao privada disponivel para sua conta.';
const PRIVATE_NOTIFICATION_DEEP_LINK = '/notifications';

type NotificationPrivacyRecord = Pick<
  Notification,
  | 'id'
  | 'userId'
  | 'type'
  | 'title'
  | 'body'
  | 'deepLink'
  | 'actorId'
  | 'clubId'
  | 'referenceType'
  | 'referenceId'
  | 'readAt'
  | 'createdAt'
> & {
  actor?: {
    id: string;
    isPrivate: boolean;
    deletedAt: Date | null;
  } | null;
  club?: {
    id: string;
    visibility: ClubVisibility;
    status: ClubStatus;
    deletedAt: Date | null;
    members: Array<{
      userId: string;
      status: ClubMemberStatus;
    }>;
  } | null;
};

const notificationBaseSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  body: true,
  deepLink: true,
  actorId: true,
  clubId: true,
  referenceType: true,
  referenceId: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

function notificationSelectForViewer(viewerId: string) {
  return {
    ...notificationBaseSelect,
    actor: {
      select: {
        id: true,
        isPrivate: true,
        deletedAt: true,
      },
    },
    club: {
      select: {
        id: true,
        visibility: true,
        status: true,
        deletedAt: true,
        members: {
          where: {
            userId: viewerId,
          },
          select: {
            userId: true,
            status: true,
          },
        },
      },
    },
  } satisfies Prisma.NotificationSelect;
}

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

function mapNotificationRecord(
  notification: NotificationPrivacyRecord,
): NotificationItemDto {
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

async function shouldSanitizeNotification(
  notification: NotificationPrivacyRecord,
  viewerId: string,
) {
  if (
    notification.actor?.isPrivate &&
    !(await canViewPrivateUserProfile({
      viewerId,
      targetUserId: notification.actor.id,
    }))
  ) {
    return true;
  }

  if (
    notification.club &&
    !canViewClubPrivacyRecord({
      viewerId,
      club: notification.club,
    })
  ) {
    return true;
  }

  return false;
}

async function mapNotification(
  notification: NotificationPrivacyRecord,
  viewerId: string,
): Promise<NotificationItemDto> {
  const mappedNotification = mapNotificationRecord(notification);

  if (!(await shouldSanitizeNotification(notification, viewerId))) {
    return mappedNotification;
  }

  return {
    ...mappedNotification,
    title: PRIVATE_NOTIFICATION_TITLE,
    body: PRIVATE_NOTIFICATION_BODY,
    deepLink: PRIVATE_NOTIFICATION_DEEP_LINK,
    actorId: null,
    clubId: null,
    referenceType: null,
    referenceId: null,
  };
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
      select: notificationSelectForViewer(payload.userId),
    });

    if (existingNotification) {
      return mapNotification(existingNotification, payload.userId);
    }
  }

  const shouldSanitizePayload = await shouldSanitizeNotification(
    {
      id: '',
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      deepLink: payload.deepLink,
      actorId: payload.actorId ?? null,
      clubId: payload.clubId ?? null,
      referenceType: payload.referenceType ?? null,
      referenceId: payload.referenceId ?? null,
      readAt: null,
      createdAt: new Date(),
      actor: payload.actorId
        ? await prisma.user.findUnique({
            where: {
              id: payload.actorId,
            },
            select: {
              id: true,
              isPrivate: true,
              deletedAt: true,
            },
          })
        : null,
      club: payload.clubId
        ? await prisma.club.findUnique({
            where: {
              id: payload.clubId,
            },
            select: {
              id: true,
              visibility: true,
              status: true,
              deletedAt: true,
              members: {
                where: {
                  userId: payload.userId,
                },
                select: {
                  userId: true,
                  status: true,
                },
              },
            },
          })
        : null,
    },
    payload.userId,
  );
  const storedPayload = shouldSanitizePayload
    ? {
        ...payload,
        title: PRIVATE_NOTIFICATION_TITLE,
        body: PRIVATE_NOTIFICATION_BODY,
        deepLink: PRIVATE_NOTIFICATION_DEEP_LINK,
        actorId: null,
        clubId: null,
        referenceType: null,
        referenceId: null,
      }
    : payload;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: storedPayload.userId,
        actorId: storedPayload.actorId ?? null,
        type: storedPayload.type,
        title: storedPayload.title,
        body: storedPayload.body,
        deepLink: storedPayload.deepLink,
        clubId: storedPayload.clubId ?? null,
        referenceType: storedPayload.referenceType ?? null,
        referenceId: storedPayload.referenceId ?? null,
        dedupeKey: storedPayload.dedupeKey ?? null,
      },
      select: notificationSelectForViewer(payload.userId),
    });

    return mapNotification(notification, payload.userId);
  } catch (error) {
    if (payload.dedupeKey && error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const existingNotification = await prisma.notification.findUnique({
          where: {
            dedupeKey: payload.dedupeKey,
          },
          select: notificationSelectForViewer(payload.userId),
        });

        if (existingNotification) {
          return mapNotification(existingNotification, payload.userId);
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

  const pagination = normalizeCursorPagination({
    limit,
    cursor,
  });
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
    take: pagination.limit + 1,
    ...getCursorPaginationArgs(pagination),
    select: notificationSelectForViewer(userId),
  });

  const page = buildCursorPaginationResult(notifications, pagination.limit);

  return {
    items: await Promise.all(
      page.items.map((notification) => mapNotification(notification, userId)),
    ),
    nextCursor: page.nextCursor,
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

export async function countUnreadNotificationsByClub({
  userId,
  clubIds,
}: {
  userId: string;
  clubIds: string[];
}): Promise<Map<string, number>> {
  requireUserId(userId);

  const uniqueClubIds = [...new Set(clubIds.filter(Boolean))];

  if (uniqueClubIds.length === 0) {
    return new Map();
  }

  const groupedCounts = await prisma.notification.groupBy({
    by: ['clubId'],
    where: {
      userId,
      readAt: null,
      clubId: {
        in: uniqueClubIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  const countsByClubId = new Map<string, number>();

  groupedCounts.forEach((group) => {
    if (group.clubId) {
      countsByClubId.set(group.clubId, group._count._all);
    }
  });

  return countsByClubId;
}

export async function markClubFeedActivityNotificationsRead({
  userId,
  clubId,
  readAt,
}: {
  userId: string;
  clubId: string;
  readAt: Date;
}): Promise<number> {
  requireUserId(userId);

  if (!clubId) {
    return 0;
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      clubId,
      readAt: null,
      type: {
        in: CLUB_FEED_ACTIVITY_NOTIFICATION_TYPES,
      },
    },
    data: {
      readAt,
    },
  });

  return result.count;
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
    select: notificationSelectForViewer(userId),
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
      notification: await mapNotification(notification, userId),
    };
  }

  const updatedNotification = await prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      readAt: new Date(),
    },
    select: notificationSelectForViewer(userId),
  });

  return {
    notification: await mapNotification(updatedNotification, userId),
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

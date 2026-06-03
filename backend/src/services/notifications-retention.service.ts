import { prisma } from '../lib/prisma';
import { recordDailyMetric } from './observability/metrics';
import { safeInfo } from './observability/safe-logger';

export type CleanupOldNotificationsInput = {
  now?: Date;
  retentionDays?: number;
  limit?: number;
  dryRun?: boolean;
};

export type CleanupOldNotificationsResult = {
  dryRun: boolean;
  retentionDays: number;
  limit: number;
  cutoff: string;
  matchedCount: number;
  deletedCount: number;
  batchCount: number;
};

export const DEFAULT_NOTIFICATION_RETENTION_DAYS = 90;
export const DEFAULT_NOTIFICATION_CLEANUP_LIMIT = 500;
export const MIN_NOTIFICATION_RETENTION_DAYS = 1;
export const MAX_NOTIFICATION_RETENTION_DAYS = 3650;
export const MIN_NOTIFICATION_CLEANUP_LIMIT = 1;
export const MAX_NOTIFICATION_CLEANUP_LIMIT = 1000;

type NotificationRetentionEnv = {
  NOTIFICATION_RETENTION_DAYS?: string;
};

function normalizeIntegerInRange({
  value,
  fallback,
  min,
  max,
}: {
  value: unknown;
  fallback: number;
  min: number;
  max: number;
}) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}

export function normalizeNotificationRetentionDays(value: unknown): number {
  return normalizeIntegerInRange({
    value,
    fallback: DEFAULT_NOTIFICATION_RETENTION_DAYS,
    min: MIN_NOTIFICATION_RETENTION_DAYS,
    max: MAX_NOTIFICATION_RETENTION_DAYS,
  });
}

export function getNotificationRetentionDays(
  env: NotificationRetentionEnv = process.env,
): number {
  return normalizeNotificationRetentionDays(env.NOTIFICATION_RETENTION_DAYS);
}

export function normalizeNotificationCleanupLimit(value: unknown): number {
  return normalizeIntegerInRange({
    value,
    fallback: DEFAULT_NOTIFICATION_CLEANUP_LIMIT,
    min: MIN_NOTIFICATION_CLEANUP_LIMIT,
    max: MAX_NOTIFICATION_CLEANUP_LIMIT,
  });
}

function getCutoffDate(now: Date, retentionDays: number) {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

function getValidNow(now: Date | undefined) {
  return now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
}

export async function cleanupOldNotifications({
  now,
  retentionDays,
  limit,
  dryRun = true,
}: CleanupOldNotificationsInput = {}): Promise<CleanupOldNotificationsResult> {
  const normalizedNow = getValidNow(now);
  const normalizedRetentionDays =
    retentionDays === undefined
      ? getNotificationRetentionDays()
      : normalizeNotificationRetentionDays(retentionDays);
  const normalizedLimit = normalizeNotificationCleanupLimit(limit);
  const cutoff = getCutoffDate(normalizedNow, normalizedRetentionDays);

  if (dryRun) {
    const matchedCount = await prisma.notification.count({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
    const result = {
      dryRun: true,
      retentionDays: normalizedRetentionDays,
      limit: normalizedLimit,
      cutoff: cutoff.toISOString(),
      matchedCount,
      deletedCount: 0,
      batchCount: Math.ceil(matchedCount / normalizedLimit),
    };

    recordDailyMetric({
      domain: 'notifications',
      type: 'retention_cleanup',
      result: 'dry_run',
      occurredAt: normalizedNow,
    });
    safeInfo({
      event: 'notifications.retention.cleanup',
      timestamp: normalizedNow.toISOString(),
      dryRun: result.dryRun,
      retentionDays: result.retentionDays,
      limit: result.limit,
      cutoff: result.cutoff,
      matchedCount: result.matchedCount,
      deletedCount: result.deletedCount,
      batchCount: result.batchCount,
    });

    return result;
  }

  let matchedCount = 0;
  let deletedCount = 0;
  let batchCount = 0;

  while (true) {
    const batch = await prisma.notification.findMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: normalizedLimit,
      select: {
        id: true,
      },
    });

    if (batch.length === 0) {
      break;
    }

    batchCount += 1;
    matchedCount += batch.length;

    const deleteResult = await prisma.notification.deleteMany({
      where: {
        id: {
          in: batch.map((notification) => notification.id),
        },
      },
    });

    deletedCount += deleteResult.count;

    if (deleteResult.count === 0) {
      break;
    }
  }

  const result = {
    dryRun: false,
    retentionDays: normalizedRetentionDays,
    limit: normalizedLimit,
    cutoff: cutoff.toISOString(),
    matchedCount,
    deletedCount,
    batchCount,
  };

  recordDailyMetric({
    domain: 'notifications',
    type: 'retention_cleanup',
    result: 'deleted',
    occurredAt: normalizedNow,
    count: deletedCount || 1,
  });
  safeInfo({
    event: 'notifications.retention.cleanup',
    timestamp: normalizedNow.toISOString(),
    dryRun: result.dryRun,
    retentionDays: result.retentionDays,
    limit: result.limit,
    cutoff: result.cutoff,
    matchedCount: result.matchedCount,
    deletedCount: result.deletedCount,
    batchCount: result.batchCount,
  });

  return result;
}

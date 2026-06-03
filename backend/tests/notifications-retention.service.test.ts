import { NotificationType } from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  cleanupOldNotifications,
  getNotificationRetentionDays,
} from '../src/services/notifications-retention.service';
import {
  getDailyMetric,
  resetDailyMetrics,
} from '../src/services/observability/metrics';
import {
  createTestNotification,
  createTestUser,
  resetFeedData,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('notifications-retention.service', () => {
  applyTestDatabaseHooks({
    resetBeforeEach: false,
    resetAfterAll: false,
    disconnectAfterAll: false,
  });

  let infoSpy: jest.SpyInstance;

  beforeEach(async () => {
    resetDailyMetrics();
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    await resetFeedData({ deleteUsers: true });
  });

  afterEach(() => {
    infoSpy.mockRestore();
    resetDailyMetrics();
  });

  afterAll(async () => {
    await resetFeedData({ deleteUsers: true });
    await prisma.$disconnect();
  });

  it('usa 90 dias por padrao e aceita override valido por ambiente', () => {
    expect(getNotificationRetentionDays({})).toBe(90);
    expect(
      getNotificationRetentionDays({
        NOTIFICATION_RETENTION_DAYS: '30',
      }),
    ).toBe(30);
    expect(
      getNotificationRetentionDays({
        NOTIFICATION_RETENTION_DAYS: '0',
      }),
    ).toBe(90);
    expect(
      getNotificationRetentionDays({
        NOTIFICATION_RETENTION_DAYS: 'abc',
      }),
    ).toBe(90);
  });

  it('remove notificacoes antigas e preserva notificacoes recentes', async () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const user = await createTestUser();
    const oldNotification = await createTestNotification({
      userId: user.id,
      type: NotificationType.feed_like,
      createdAt: new Date('2026-02-01T12:00:00.000Z'),
    });
    const recentNotification = await createTestNotification({
      userId: user.id,
      type: NotificationType.feed_like,
      createdAt: new Date('2026-05-30T12:00:00.000Z'),
    });

    const result = await cleanupOldNotifications({
      now,
      retentionDays: 90,
      limit: 10,
      dryRun: false,
    });

    expect(result).toMatchObject({
      dryRun: false,
      retentionDays: 90,
      limit: 10,
      matchedCount: 1,
      deletedCount: 1,
      batchCount: 1,
    });
    await expect(
      prisma.notification.findUnique({
        where: {
          id: oldNotification.id,
        },
      }),
    ).resolves.toBeNull();
    await expect(
      prisma.notification.findUnique({
        where: {
          id: recentNotification.id,
        },
      }),
    ).resolves.toMatchObject({
      id: recentNotification.id,
    });
    expect(
      getDailyMetric({
        domain: 'notifications',
        type: 'retention_cleanup',
        result: 'deleted',
        date: now,
      }).count,
    ).toBe(1);
  });

  it('dryRun conta notificacoes antigas sem apagar registros', async () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const user = await createTestUser();

    await createTestNotification({
      userId: user.id,
      createdAt: new Date('2026-02-01T12:00:00.000Z'),
    });
    await createTestNotification({
      userId: user.id,
      createdAt: new Date('2026-02-02T12:00:00.000Z'),
    });

    const result = await cleanupOldNotifications({
      now,
      retentionDays: 90,
      limit: 1,
      dryRun: true,
    });

    expect(result).toMatchObject({
      dryRun: true,
      matchedCount: 2,
      deletedCount: 0,
      batchCount: 2,
    });
    await expect(prisma.notification.count()).resolves.toBe(2);
    expect(
      getDailyMetric({
        domain: 'notifications',
        type: 'retention_cleanup',
        result: 'dry_run',
        date: now,
      }).count,
    ).toBe(1);
  });

  it('respeita o limite por lote durante limpeza real', async () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const user = await createTestUser();

    for (let index = 0; index < 3; index += 1) {
      await createTestNotification({
        userId: user.id,
        createdAt: new Date(`2026-02-0${index + 1}T12:00:00.000Z`),
      });
    }

    const result = await cleanupOldNotifications({
      now,
      retentionDays: 90,
      limit: 1,
      dryRun: false,
    });

    expect(result).toMatchObject({
      matchedCount: 3,
      deletedCount: 3,
      batchCount: 3,
    });
    await expect(prisma.notification.count()).resolves.toBe(0);
  });
});

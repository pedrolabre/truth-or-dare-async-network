import { prisma } from '../src/lib/prisma';
import {
  cleanupOldNotifications,
  getNotificationRetentionDays,
  normalizeNotificationCleanupLimit,
  normalizeNotificationRetentionDays,
} from '../src/services/notifications-retention.service';

function getFlagValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((argument) => argument.startsWith(prefix));

  return match ? match.slice(prefix.length) : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const dryRun = !hasFlag('execute');
  const retentionDaysInput = getFlagValue('retention-days');
  const limitInput = getFlagValue('limit');
  const retentionDays =
    retentionDaysInput === undefined
      ? getNotificationRetentionDays()
      : normalizeNotificationRetentionDays(retentionDaysInput);
  const limit = normalizeNotificationCleanupLimit(limitInput);

  const result = await cleanupOldNotifications({
    retentionDays,
    limit,
    dryRun,
  });

  console.info({
    event: 'notifications.cleanup_notifications.finished',
    mode: dryRun ? 'dry_run' : 'execute',
    result,
  });
}

main()
  .catch((error) => {
    console.error({
      event: 'notifications.cleanup_notifications.failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

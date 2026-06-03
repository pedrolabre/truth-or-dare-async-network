import {
  type SettingsCredentialChangeType,
  recordSettingsCredentialChangeMetric,
} from './settings.metrics';
import { safeInfo } from '../observability/safe-logger';

type SettingsCredentialChangeLogInput = {
  userId: string;
  changeType: SettingsCredentialChangeType;
  changedAt?: Date;
};

export function logSettingsCredentialChange({
  userId,
  changeType,
  changedAt = new Date(),
}: SettingsCredentialChangeLogInput) {
  const timestamp = changedAt.toISOString();
  const metrics = recordSettingsCredentialChangeMetric(changeType, changedAt);

  safeInfo({
    event: 'settings.credential_change.completed',
    timestamp,
    userId,
    changeType,
    dailyVolume: {
      date: metrics.date,
      emailChanges: metrics.emailChanges,
      passwordChanges: metrics.passwordChanges,
      totalChanges: metrics.totalChanges,
    },
  });

  return metrics;
}

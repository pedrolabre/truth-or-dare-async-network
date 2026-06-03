export type SettingsCredentialChangeType = 'email' | 'password';

export type DailySettingsCredentialChangeMetrics = {
  date: string;
  emailChanges: number;
  passwordChanges: number;
  totalChanges: number;
};

const dailyMetrics = new Map<string, DailySettingsCredentialChangeMetrics>();

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getEmptyDailyMetrics(date: string): DailySettingsCredentialChangeMetrics {
  return {
    date,
    emailChanges: 0,
    passwordChanges: 0,
    totalChanges: 0,
  };
}

export function recordSettingsCredentialChangeMetric(
  changeType: SettingsCredentialChangeType,
  changedAt = new Date(),
): DailySettingsCredentialChangeMetrics {
  const date = getDateKey(changedAt);
  const current = dailyMetrics.get(date) ?? getEmptyDailyMetrics(date);
  const nextMetrics = {
    ...current,
    emailChanges:
      changeType === 'email'
        ? current.emailChanges + 1
        : current.emailChanges,
    passwordChanges:
      changeType === 'password'
        ? current.passwordChanges + 1
        : current.passwordChanges,
    totalChanges: current.totalChanges + 1,
  };

  dailyMetrics.set(date, nextMetrics);

  return nextMetrics;
}

export function getDailySettingsCredentialChangeMetrics(
  date = new Date(),
): DailySettingsCredentialChangeMetrics {
  const dateKey = getDateKey(date);

  return dailyMetrics.get(dateKey) ?? getEmptyDailyMetrics(dateKey);
}

export function resetSettingsCredentialChangeMetrics() {
  dailyMetrics.clear();
}

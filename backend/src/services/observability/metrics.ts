export type DailyMetricInput = {
  domain: string;
  type: string;
  result?: string | null;
  occurredAt?: Date;
  count?: number;
};

export type DailyMetricCounter = {
  date: string;
  domain: string;
  type: string;
  result: string | null;
  count: number;
};

const dailyMetrics = new Map<string, DailyMetricCounter>();

const TOKEN_LIKE_PATTERN = /^[A-Za-z0-9._~+/=-]{32,}$/;
const RESET_CODE_PATTERN = /^\d{6}$/;
const SENSITIVE_METRIC_PARTS = new Set([
  'authorization',
  'password',
  'passwordhash',
  'token',
  'tokenhash',
  'resettoken',
  'code',
  'email',
]);

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeMetricPart(value: string, fallback: string) {
  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.includes('@') ||
    /^bearer\s+/i.test(trimmed) ||
    TOKEN_LIKE_PATTERN.test(trimmed) ||
    RESET_CODE_PATTERN.test(trimmed) ||
    SENSITIVE_METRIC_PARTS.has(trimmed.toLowerCase())
  ) {
    return fallback;
  }

  return (
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9_.:-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || fallback
  );
}

function buildMetricKey(metric: Omit<DailyMetricCounter, 'count'>) {
  return [
    metric.date,
    metric.domain,
    metric.type,
    metric.result ?? 'none',
  ].join(':');
}

export function recordDailyMetric({
  domain,
  type,
  result = null,
  occurredAt = new Date(),
  count = 1,
}: DailyMetricInput): DailyMetricCounter {
  const metric = {
    date: getDateKey(occurredAt),
    domain: normalizeMetricPart(domain, 'unknown_domain'),
    type: normalizeMetricPart(type, 'unknown_event'),
    result:
      typeof result === 'string'
        ? normalizeMetricPart(result, 'redacted')
        : null,
  };
  const key = buildMetricKey(metric);
  const current = dailyMetrics.get(key);
  const nextMetric = {
    ...metric,
    count: (current?.count ?? 0) + Math.max(0, Math.trunc(count)),
  };

  dailyMetrics.set(key, nextMetric);

  return nextMetric;
}

export function getDailyMetrics(date = new Date()): DailyMetricCounter[] {
  const dateKey = getDateKey(date);

  return [...dailyMetrics.values()]
    .filter((metric) => metric.date === dateKey)
    .sort((first, second) =>
      [first.domain, first.type, first.result ?? ''].join(':').localeCompare(
        [second.domain, second.type, second.result ?? ''].join(':'),
      ),
    );
}

export function getDailyMetric(
  input: Pick<DailyMetricInput, 'domain' | 'type' | 'result'> & {
    date?: Date;
  },
): DailyMetricCounter {
  const metric = {
    date: getDateKey(input.date ?? new Date()),
    domain: normalizeMetricPart(input.domain, 'unknown_domain'),
    type: normalizeMetricPart(input.type, 'unknown_event'),
    result:
      typeof input.result === 'string'
        ? normalizeMetricPart(input.result, 'redacted')
        : null,
  };
  const key = buildMetricKey(metric);

  return dailyMetrics.get(key) ?? { ...metric, count: 0 };
}

export function resetDailyMetrics() {
  dailyMetrics.clear();
}

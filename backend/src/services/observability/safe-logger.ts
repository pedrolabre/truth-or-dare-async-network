type LogLevel = 'info' | 'warn' | 'error';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const REDACTED = '[redacted]';
const MAX_DEPTH = 6;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const AUTHORIZATION_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi;

const SENSITIVE_KEY_PATTERNS = [
  /authorization/i,
  /^headers?$/i,
  /^password$/i,
  /^currentPassword$/i,
  /^newPassword$/i,
  /passwordHash/i,
  /resetToken/i,
  /^token$/i,
  /tokenHash/i,
  /^code$/i,
  /resetCode/i,
  /^email$/i,
  /^currentEmail$/i,
  /^newEmail$/i,
  /emailAddress/i,
  /searchTerm/i,
  /searchQuery/i,
  /^query$/i,
  /^term$/i,
  /^payload$/i,
  /^body$/i,
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function isSensitiveKey(key: string) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeString(value: string) {
  return value
    .replace(AUTHORIZATION_PATTERN, REDACTED)
    .replace(EMAIL_PATTERN, REDACTED);
}

function sanitizeValue(value: unknown, depth: number): JsonValue {
  if (depth > MAX_DEPTH) {
    return '[max_depth]';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        isSensitiveKey(key) ? REDACTED : sanitizeValue(entryValue, depth + 1),
      ]),
    );
  }

  return sanitizeString(String(value));
}

function writeLog(level: LogLevel, payload: Record<string, unknown>) {
  const sanitizedPayload = sanitizeObservabilityPayload(payload);

  if (level === 'warn') {
    console.warn(sanitizedPayload);
    return sanitizedPayload;
  }

  if (level === 'error') {
    console.error(sanitizedPayload);
    return sanitizedPayload;
  }

  console.info(sanitizedPayload);
  return sanitizedPayload;
}

export function sanitizeObservabilityPayload(
  payload: Record<string, unknown>,
): Record<string, JsonValue> {
  return sanitizeValue(payload, 0) as Record<string, JsonValue>;
}

export function safeInfo(payload: Record<string, unknown>) {
  return writeLog('info', payload);
}

export function safeWarn(payload: Record<string, unknown>) {
  return writeLog('warn', payload);
}

export function safeError(payload: Record<string, unknown>) {
  return writeLog('error', payload);
}

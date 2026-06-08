import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
const CACHE_STORAGE_PREFIX = 'tod:local-cache';

export const LOCAL_CACHE_SCHEMA_VERSION = 1;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const LOCAL_CACHE_TTLS = {
  profileMe: 24 * HOUR_MS,
  profilePublic: 6 * HOUR_MS,
  feedMain: 5 * MINUTE_MS,
  clubsMy: 15 * MINUTE_MS,
  clubsDiscover: 15 * MINUTE_MS,
  clubDetails: 30 * MINUTE_MS,
  clubFeed: 5 * MINUTE_MS,
  clubMembers: 15 * MINUTE_MS,
  proofDetails: 24 * HOUR_MS,
} as const;

export const LOCAL_CACHE_KEYS = {
  profileMe: 'profile/me',
  profilePublic: (profileId: string) =>
    `profile/public/${encodeCachePathSegment(profileId)}`,
  feedMain: 'feed/main',
  clubsMy: 'clubs/my',
  clubsDiscover: 'clubs/discover',
  clubDetails: (clubId: string) =>
    `clubs/details/${encodeCachePathSegment(clubId)}`,
  clubFeed: (clubId: string) => `clubs/feed/${encodeCachePathSegment(clubId)}`,
  clubMembers: (clubId: string) =>
    `clubs/members/${encodeCachePathSegment(clubId)}`,
  proofDetails: (proofId: string) =>
    `proofs/${encodeCachePathSegment(proofId)}`,
} as const;

export type CacheRecord<T> = {
  schemaVersion: number;
  key: string;
  value: T;
  writtenAt: number;
  expiresAt: number;
};

export type CacheNamespace = 'user' | 'anonymous';

export type CacheOptions = {
  namespace?: CacheNamespace;
};

export type WriteCacheOptions = CacheOptions & {
  ttlMs: number;
  now?: number;
};

const SENSITIVE_CACHE_KEY_PATTERN =
  /authorization|bearer|connectionstring|jwt|password|reset(code|token)?|secret|service.?role|token/i;

type JwtPayload = {
  sub?: unknown;
};

function encodeCachePathSegment(value: string) {
  return encodeURIComponent(value.trim());
}

function getAnonymousNamespaceKey() {
  return `${CACHE_STORAGE_PREFIX}:v${LOCAL_CACHE_SCHEMA_VERSION}:anonymous`;
}

function getUserNamespaceKey(userId: string) {
  return `${CACHE_STORAGE_PREFIX}:v${LOCAL_CACHE_SCHEMA_VERSION}:user:${encodeURIComponent(
    userId,
  )}`;
}

function getStorageKey(namespaceKey: string, key: string) {
  return `${namespaceKey}:${key}`;
}

function decodeBase64UrlJson(segment: string): unknown {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded =
    normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const decoder = (globalThis as { atob?: (input: string) => string }).atob;

  if (!decoder) {
    return null;
  }

  const binary = decoder(padded);
  const encoded = Array.from(binary)
    .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
    .join('');

  return JSON.parse(decodeURIComponent(encoded));
}

export function getCacheUserIdFromToken(token: string | null | undefined) {
  const payloadSegment = token?.split('.')[1];

  if (!payloadSegment) {
    return null;
  }

  try {
    const payload = decodeBase64UrlJson(payloadSegment) as JwtPayload | null;
    const subject = payload?.sub;

    return typeof subject === 'string' && subject.trim()
      ? subject.trim()
      : null;
  } catch {
    return null;
  }
}

async function getCurrentCacheUserId() {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  return getCacheUserIdFromToken(token);
}

async function getNamespaceKey(namespace: CacheNamespace) {
  if (namespace === 'anonymous') {
    return getAnonymousNamespaceKey();
  }

  const userId = await getCurrentCacheUserId();

  return userId ? getUserNamespaceKey(userId) : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidCacheRecord<T>(
  key: string,
  value: unknown,
): value is CacheRecord<T> {
  if (!isPlainRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === LOCAL_CACHE_SCHEMA_VERSION &&
    value.key === key &&
    'value' in value &&
    typeof value.writtenAt === 'number' &&
    Number.isFinite(value.writtenAt) &&
    typeof value.expiresAt === 'number' &&
    Number.isFinite(value.expiresAt)
  );
}

function containsSensitiveCacheField(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsSensitiveCacheField);
  }

  if (!isPlainRecord(value)) {
    return false;
  }

  return Object.entries(value).some(([key, childValue]) => {
    return (
      SENSITIVE_CACHE_KEY_PATTERN.test(key) ||
      containsSensitiveCacheField(childValue)
    );
  });
}

function assertCacheValueIsSafe(value: unknown) {
  if (containsSensitiveCacheField(value)) {
    throw new Error('Cache local recebeu payload com campo sensivel.');
  }
}

export function isCacheFresh<T>(
  record: CacheRecord<T> | null | undefined,
  now = Date.now(),
) {
  return Boolean(record && record.expiresAt > now);
}

export async function readCache<T>(
  key: string,
  options: CacheOptions = {},
): Promise<CacheRecord<T> | null> {
  const namespaceKey = await getNamespaceKey(options.namespace ?? 'user');

  if (!namespaceKey) {
    return null;
  }

  const storageKey = getStorageKey(namespaceKey, key);
  const storedValue = await AsyncStorage.getItem(storageKey);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!isValidCacheRecord<T>(key, parsedValue)) {
      await AsyncStorage.removeItem(storageKey);
      return null;
    }

    return parsedValue;
  } catch {
    await AsyncStorage.removeItem(storageKey);
    return null;
  }
}

export async function writeCache<T>(
  key: string,
  value: T,
  options: WriteCacheOptions,
): Promise<CacheRecord<T> | null> {
  assertCacheValueIsSafe(value);

  const namespaceKey = await getNamespaceKey(options.namespace ?? 'user');

  if (!namespaceKey) {
    return null;
  }

  const now = options.now ?? Date.now();
  const record: CacheRecord<T> = {
    schemaVersion: LOCAL_CACHE_SCHEMA_VERSION,
    key,
    value,
    writtenAt: now,
    expiresAt: now + options.ttlMs,
  };

  await AsyncStorage.setItem(
    getStorageKey(namespaceKey, key),
    JSON.stringify(record),
  );

  return record;
}

export async function removeCache(
  key: string,
  options: CacheOptions = {},
) {
  const namespaceKey = await getNamespaceKey(options.namespace ?? 'user');

  if (!namespaceKey) {
    return;
  }

  await AsyncStorage.removeItem(getStorageKey(namespaceKey, key));
}

export async function clearCacheByPrefix(
  prefix: string,
  options: CacheOptions = {},
) {
  const namespaceKey = await getNamespaceKey(options.namespace ?? 'user');

  if (!namespaceKey) {
    return;
  }

  const storagePrefix = getStorageKey(namespaceKey, prefix);
  const keys = await AsyncStorage.getAllKeys();
  const keysToRemove = keys.filter((key) => key.startsWith(storagePrefix));

  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
  }
}

export async function clearCacheForUserId(userId: string | null | undefined) {
  if (!userId?.trim()) {
    return;
  }

  const namespaceKey = getUserNamespaceKey(userId.trim());
  const keys = await AsyncStorage.getAllKeys();
  const keysToRemove = keys.filter((key) =>
    key.startsWith(`${namespaceKey}:`),
  );

  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
  }
}

export async function clearCurrentUserCache() {
  const userId = await getCurrentCacheUserId();

  await clearCacheForUserId(userId);
}

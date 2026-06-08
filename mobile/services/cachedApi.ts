import {
  isCacheFresh,
  readCache,
  writeCache,
  type CacheNamespace,
  type CacheRecord,
} from './cache';

export type CachedResourceHit<T> = {
  record: CacheRecord<T>;
  isFresh: boolean;
};

export type LoadCachedResourceOptions<T> = {
  key: string;
  ttlMs: number;
  fetcher: () => Promise<T>;
  namespace?: CacheNamespace;
  fallbackSyncErrorMessage?: string;
  onCacheHit?: (hit: CachedResourceHit<T>) => void;
  onFreshValue?: (value: T) => void;
};

export type LoadCachedResourceResult<T> = {
  value: T;
  isFromCache: boolean;
  syncErrorMessage: string | null;
  cacheRecord: CacheRecord<T> | null;
};

export function getCachedApiErrorMessage(
  error: unknown,
  fallbackMessage = 'Nao foi possivel sincronizar os dados mais recentes.',
) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export async function loadCachedResource<T>({
  key,
  ttlMs,
  fetcher,
  namespace,
  fallbackSyncErrorMessage,
  onCacheHit,
  onFreshValue,
}: LoadCachedResourceOptions<T>): Promise<LoadCachedResourceResult<T>> {
  const cacheRecord = await readCache<T>(key, { namespace });

  if (cacheRecord) {
    onCacheHit?.({
      record: cacheRecord,
      isFresh: isCacheFresh(cacheRecord),
    });
  }

  try {
    const freshValue = await fetcher();

    try {
      await writeCache(key, freshValue, {
        namespace,
        ttlMs,
      });
    } catch {
      // Cache is an optimization; a local write failure must not break API data.
    }

    onFreshValue?.(freshValue);

    return {
      value: freshValue,
      isFromCache: false,
      syncErrorMessage: null,
      cacheRecord: null,
    };
  } catch (error) {
    if (cacheRecord) {
      return {
        value: cacheRecord.value,
        isFromCache: true,
        syncErrorMessage: getCachedApiErrorMessage(
          error,
          fallbackSyncErrorMessage,
        ),
        cacheRecord,
      };
    }

    throw error;
  }
}

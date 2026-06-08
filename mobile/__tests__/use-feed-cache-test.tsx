import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useFeedState } from '../hooks/useFeedState';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS, writeCache } from '../services/cache';
import type { FeedItem } from '../types/feed';

function makeToken(userId: string) {
  const payload = btoa(JSON.stringify({ sub: userId }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}

function makeTruth(id: string, title: string): FeedItem {
  return {
    id,
    type: 'truth',
    title,
    time: 'agora',
    likes: 0,
    likesCount: 0,
    likedByMe: false,
    comments: 0,
    participants: [],
    extraCount: 0,
    canDelete: false,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe('useFeedState cache', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await AsyncStorage.setItem('auth_token', makeToken('user-1'));
  });

  it('mostra feed cacheado e depois substitui por feed fresco', async () => {
    await writeCache(LOCAL_CACHE_KEYS.feedMain, [makeTruth('old', 'Cache')], {
      ttlMs: LOCAL_CACHE_TTLS.feedMain,
    });
    const deferred = createDeferred<FeedItem[]>();
    const loadFeedItems = jest.fn().mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useFeedState({ loadFeedItems }));

    await waitFor(() => {
      expect(result.current.filteredItems[0]?.id).toBe('old');
      expect(result.current.isFromCache).toBe(true);
    });
    deferred.resolve([makeTruth('new', 'Backend')]);
    await waitFor(() => {
      expect(result.current.filteredItems[0]?.id).toBe('new');
      expect(result.current.isFromCache).toBe(false);
    });
  });

  it('mantem feed cacheado quando API falha', async () => {
    await writeCache(LOCAL_CACHE_KEYS.feedMain, [makeTruth('old', 'Cache')], {
      ttlMs: LOCAL_CACHE_TTLS.feedMain,
    });

    const loadFeedItems = jest.fn().mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useFeedState({ loadFeedItems }));

    await waitFor(() => {
      expect(result.current.filteredItems[0]?.id).toBe('old');
      expect(result.current.isFromCache).toBe(true);
      expect(result.current.syncErrorMessage).toBe('Offline');
    });
  });
});

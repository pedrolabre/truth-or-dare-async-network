import { useCallback, useEffect, useMemo, useState } from 'react';
import { FEED_ITEMS } from '../data/feedMock';
import { getFeed } from '../services/api';
import { loadCachedResource } from '../services/cachedApi';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS } from '../services/cache';
import { BottomNavKey, FeedItem, FilterKey } from '../types/feed';

type UseFeedStateOptions = {
  loadFeedItems?: () => Promise<FeedItem[]>;
};

export function useFeedState({
  loadFeedItems = getFeed,
}: UseFeedStateOptions = {}) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('popular');
  const [activeTab, setActiveTab] = useState<BottomNavKey>('play');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [items, setItems] = useState<FeedItem[]>(FEED_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFromCache, setIsFromCache] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  const loadFeed = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage('');
        setSyncErrorMessage(null);

        const result = await loadCachedResource<FeedItem[]>({
          key: LOCAL_CACHE_KEYS.feedMain,
          ttlMs: LOCAL_CACHE_TTLS.feedMain,
          fetcher: loadFeedItems,
          fallbackSyncErrorMessage:
            'Nao foi possivel sincronizar o feed agora.',
          onCacheHit: ({ record }) => {
            setItems(record.value);
            setIsFromCache(true);
            setIsLoading(false);
          },
        });

        setItems(result.value);
        setIsFromCache(result.isFromCache);
        setSyncErrorMessage(result.syncErrorMessage);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel carregar o feed.';

        console.log('NÃ£o foi possÃ­vel carregar o feed da API:', error);
        setErrorMessage(message);
        setItems(FEED_ITEMS);
        setIsFromCache(false);
        setSyncErrorMessage(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [loadFeedItems],
  );

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  function toggleLike(id: string) {
    setLikedIds((current) => {
      if (current.includes(id)) {
        return current.filter((itemId) => itemId !== id);
      }

      return [...current, id];
    });
  }

  const filteredItems = useMemo<FeedItem[]>(() => {
    switch (activeFilter) {
      case 'dares':
        return items.filter((item) => item.type === 'dare');

      case 'truths':
        return items.filter((item) => item.type === 'truth');

      case 'clubs':
        return items.filter((item) => item.type === 'club');

      case 'friends':
        return items.filter((item) => item.type !== 'club');

      case 'party':
        return items.filter((item) => item.type !== 'truth');

      case 'spicy':
        return items.filter((item) => item.type !== 'club');

      case 'popular':
      default:
        return items;
    }
  }, [activeFilter, items]);

  function isLiked(id: string) {
    return likedIds.includes(id);
  }

  return {
    activeFilter,
    setActiveFilter,
    activeTab,
    setActiveTab,
    likedIds,
    toggleLike,
    items,
    setItems,
    filteredItems,
    isLoading,
    isRefreshing,
    errorMessage,
    isFromCache,
    syncErrorMessage,
    loadFeed,
    isLiked,
  };
}

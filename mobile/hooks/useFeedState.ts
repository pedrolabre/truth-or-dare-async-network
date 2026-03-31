import { useMemo, useState } from 'react';
import { FEED_ITEMS } from '../data/feedMock';
import { BottomNavKey, FeedItem, FilterKey } from '../types/feed';

export function useFeedState() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('popular');
  const [activeTab, setActiveTab] = useState<BottomNavKey>('play');
  const [likedIds, setLikedIds] = useState<string[]>([]);

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
      case 'friends':
        return FEED_ITEMS.filter((item) => item.type !== 'club');

      case 'party':
        return FEED_ITEMS.filter((item) => item.type !== 'truth');

      case 'spicy':
        return FEED_ITEMS.filter((item) => item.type !== 'club');

      case 'popular':
      default:
        return FEED_ITEMS;
    }
  }, [activeFilter]);

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
    filteredItems,
    isLiked,
  };
}
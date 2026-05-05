import type { BottomNavItem, FeedFilterOption, FeedItem } from '../types/feed';

export const FEED_FILTERS: FeedFilterOption[] = [
  { key: 'popular', label: '🔥 Populares' },
  { key: 'dares' as FeedFilterOption['key'], label: '⚡ Desafios' },
  { key: 'truths' as FeedFilterOption['key'], label: '💬 Verdades' },
  { key: 'clubs' as FeedFilterOption['key'], label: '👥 Clubes' },
];

export const FEED_ITEMS: FeedItem[] = [];

export const FEED_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    key: 'play',
    label: 'Jogar',
    icon: 'style',
  },
  {
    key: 'search',
    label: 'Buscar',
    icon: 'search',
  },
  {
    key: 'clubs',
    label: 'Clubes',
    icon: 'groups',
  },
  {
    key: 'profile',
    label: 'Perfil',
    icon: 'person',
  },
];
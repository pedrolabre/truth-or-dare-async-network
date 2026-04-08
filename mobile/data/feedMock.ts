import { BottomNavItem, FeedFilterOption, FeedItem } from '../types/feed';

export const FEED_FILTERS: FeedFilterOption[] = [
  { key: 'popular', label: '🔥 Populares' },
  { key: 'dares', label: '⚡ Desafios' },
  { key: 'truths', label: '💬 Verdades' },
  { key: 'clubs', label: '👥 Clubes' },
];

export const FEED_ITEMS: FeedItem[] = [
  {
    id: 'truth-placeholder',
    type: 'truth',
    title: '',
    time: '',
    likes: 0,
    comments: 0,
    participants: [],
    extraCount: 0,
  },
  {
    id: 'dare-placeholder',
    type: 'dare',
    challenger: '',
    title: '',
    attemptsLabel: '',
    expiresIn: '',
    progress: 0,
  },
  {
    id: 'club-placeholder',
    type: 'club',
    clubName: '',
    badge: 'Verdade',
    quote: '',
    answersCount: 0,
  },
];

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
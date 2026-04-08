export type SearchFilterKey = 'all' | 'users' | 'clubs';

export type SearchRecentItem = {
  id: string;
  label: string;
  type: 'user' | 'club';
};

export type SearchUserItem = {
  id: string;
  name: string;
  username: string;
  levelLabel: string;
  avatarUrl?: string;
  isOnline?: boolean;
  mutualCount?: number;
};

export type SearchClubItem = {
  id: string;
  name: string;
  memberCountLabel: string;
  description: string;
  imageUrl?: string;
  badgeLabel?: string;
  isTrending?: boolean;
};

export type SearchResultGroup = {
  users: SearchUserItem[];
  clubs: SearchClubItem[];
};

export type SearchScreenState = {
  query: string;
  activeFilter: SearchFilterKey;
  recentSearches: SearchRecentItem[];
  recommendedUsers: SearchUserItem[];
  trendingClubs: SearchClubItem[];
  results: SearchResultGroup;
  isLoading: boolean;
};

export type SearchSectionKey =
  | 'recent'
  | 'recommended-users'
  | 'trending-clubs'
  | 'result-users'
  | 'result-clubs';
export type SearchFilterKey = 'all' | 'users' | 'clubs';

export type SearchResultType = 'user' | 'club';

export type SearchClubIconName =
  | 'groups'
  | 'sports-esports'
  | 'local-fire-department'
  | 'auto-awesome'
  | 'celebration'
  | 'school'
  | 'nightlife'
  | 'favorite';

export type SearchPagination<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export type SearchApiUserItem = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  level: number | null;
  mutualCount: number;
};

export type SearchApiClubItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: SearchClubIconName | null;
  avatarUrl: string | null;
  memberCount: number;
  isTrending: boolean;
  tags: string[];
};

export type SearchApiUsersResponse = SearchPagination<SearchApiUserItem>;

export type SearchApiClubsResponse = SearchPagination<SearchApiClubItem>;

export type SearchApiResponse = {
  users: SearchApiUsersResponse;
  clubs: SearchApiClubsResponse;
};

export type SearchRecommendedResponse = SearchApiUserItem[];

export type SearchTrendingResponse = SearchApiClubItem[];

export type SearchFilters = {
  query?: string;
  minLevel?: number | null;
  maxLevel?: number | null;
  onlineOnly?: boolean;
  clubVisibility?: 'public';
  clubTag?: string | null;
};

export type SearchRecentItem = {
  id: string;
  label: string;
  type: SearchResultType;
  referenceId: string;
};

export type SearchUserItem = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  level: number | null;
  levelLabel: string;
  avatarUrl?: string;
  isOnline?: boolean;
  mutualCount?: number;
};

export type SearchClubItem = {
  id: string;
  slug: string;
  name: string;
  memberCount: number;
  memberCountLabel: string;
  description: string;
  iconName: SearchClubIconName;
  imageUrl?: string;
  badgeLabel?: string;
  isTrending?: boolean;
  tags: string[];
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
  isLoadingMore: boolean;
  isInitialState: boolean;
  isEmptyResult: boolean;
  hasAnyResults: boolean;
  error: string | null;
  hasMoreUsers: boolean;
  hasMoreClubs: boolean;
};

export type SearchSectionKey =
  | 'recent'
  | 'recommended-users'
  | 'trending-clubs'
  | 'result-users'
  | 'result-clubs';

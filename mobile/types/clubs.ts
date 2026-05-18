export type ClubsTabKey = 'my-clubs' | 'discover';

export type ClubsContentState =
  | 'loading'
  | 'error'
  | 'empty'
  | 'list'
  | 'search-empty'
  | 'search-results';

export type ClubListItem = {
  id: string;
  name: string;
  description: string;
  membersLabel: string;
  statusLabel?: string;
  iconName?: string;
  isActive?: boolean;
};

export type ClubDiscoverItem = {
  id: string;
  name: string;
  description: string;
  membersLabel: string;
  badgeLabel?: string;
  iconName?: string;
  isTrending?: boolean;
};

export type ClubsScreenState = {
  activeTab: ClubsTabKey;
  query: string;
  myClubs: ClubListItem[];
  discoverClubs: ClubDiscoverItem[];
  searchResults: ClubDiscoverItem[];
  filteredDiscoverClubs: ClubDiscoverItem[];
  visibleDiscoverClubs: ClubDiscoverItem[];
  activeContentState: ClubsContentState;
  myClubsContentState: ClubsContentState;
  discoverContentState: ClubsContentState;
  isLoading: boolean;
  isInitialLoading: boolean;
  isSearchLoading: boolean;
  errorMessage: string | null;
  searchErrorMessage: string | null;
  hasSearchQuery: boolean;
  isDiscoverEmpty: boolean;
  isMyClubsEmpty: boolean;
};

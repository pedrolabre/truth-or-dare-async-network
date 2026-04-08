export type ClubsTabKey = 'my-clubs' | 'discover';

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
  filteredDiscoverClubs: ClubDiscoverItem[];
  isLoading: boolean;
};
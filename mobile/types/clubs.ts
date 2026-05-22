import type {
  ClubJoinPolicyApi,
  ClubPermissionsApi,
  ClubPromptApi,
  ClubPromptTypeApi,
  ClubStatusApi,
  ClubViewerMembershipApi,
  ClubVisibilityApi,
} from './clubsApi';

export type ClubsTabKey = 'my-clubs' | 'discover';

export type ClubDetailTabKey = 'feed' | 'members' | 'ranking' | 'about';

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
  memberCount: number;
  membersLabel: string;
  statusLabel?: string;
  iconName?: string;
  isActive?: boolean;
};

export type ClubDiscoverItem = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  membersLabel: string;
  badgeLabel?: string;
  iconName?: string;
  isTrending?: boolean;
  isMember: boolean;
  membershipStatus?: 'active' | 'invited' | 'requested' | 'removed' | null;
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
  isRefreshing: boolean;
  isSearchLoading: boolean;
  joiningClubIds: string[];
  errorMessage: string | null;
  searchErrorMessage: string | null;
  clubActionErrorMessage: string | null;
  hasSearchQuery: boolean;
  isDiscoverEmpty: boolean;
  isMyClubsEmpty: boolean;
};

export type ClubDetailContentState =
  | 'loading'
  | 'ready'
  | 'invalid-id'
  | 'access-denied'
  | 'not-found'
  | 'archived'
  | 'suspended'
  | 'error';

export type ClubDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  descriptionText: string;
  iconName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  visibility: ClubVisibilityApi;
  visibilityLabel: string;
  status: ClubStatusApi;
  statusLabel: string;
  memberCount: number;
  membersLabel: string;
  promptCount: number;
  promptsLabel: string;
  lastActivityAt: string | null;
  rules: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
  joinPolicy: ClubJoinPolicyApi;
  viewerMembership: ClubViewerMembershipApi;
  membershipLabel: string;
  permissions: ClubPermissionsApi;
};

export type ClubDetailsScreenState = {
  clubId: string | null;
  club: ClubDetail | null;
  membership: ClubViewerMembershipApi | null;
  permissions: ClubPermissionsApi | null;
  contentState: ClubDetailContentState;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  canRetry: boolean;
};

export type ClubDetailActionKey =
  | 'join'
  | 'join-request'
  | 'leave'
  | 'mute'
  | 'unmute'
  | 'prompt';

export type ClubPromptComposerPayload = {
  type: ClubPromptTypeApi;
  content: string;
  difficulty: string | null;
  maxAttempts: number | null;
  expiresAt: string | null;
  isMembersOnly: boolean;
};

export type ClubPromptComposerSubmit = (
  payload: ClubPromptComposerPayload,
) => Promise<ClubPromptApi | null>;

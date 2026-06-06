import type {
  ClubFeedItemApi,
  ClubJoinPolicyApi,
  ClubAuditLogsQueryApi,
  ClubMemberApi,
  ClubMemberRoleApi,
  ClubMemberStatusApi,
  ClubMembersPaginationApi,
  ClubPermissionsApi,
  ClubPromptApi,
  ClubPromptResponseApi,
  ClubPromptTypeApi,
  ClubReportReasonApi,
  ClubStatusApi,
  ClubViewerActivityApi,
  ClubViewerMembershipApi,
  ClubVisibilityApi,
  CreateClubPromptResponsePayloadApi,
} from './clubsApi';

export type ClubsTabKey = 'my-clubs' | 'discover';

export type ClubDetailTabKey =
  | 'feed'
  | 'members'
  | 'media'
  | 'about'
  | 'audit';

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
  viewerActivity: ClubViewerActivityApi;
  unreadCount: number;
  hasUnreadActivity: boolean;
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
  membershipStatus?:
    | 'active'
    | 'invited'
    | 'requested'
    | 'removed'
    | 'blocked'
    | null;
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
  viewerActivity: ClubViewerActivityApi;
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
  | 'prompt'
  | 'report'
  | 'block-member'
  | 'suspend-member';

export type ClubPromptComposerPayload = {
  type: ClubPromptTypeApi;
  content: string;
  difficulty: string | null;
  maxAttempts: number | null;
  expiresAt: string | null;
  isMembersOnly: boolean;
};

export type ClubReportReasonOption = {
  label: string;
  reason: ClubReportReasonApi;
};

export type ClubReportTarget =
  | {
      type: 'club';
      clubId: string;
      title: string;
    }
  | {
      type: 'prompt';
      clubId: string;
      promptId: string;
      title: string;
    }
  | {
      type: 'response';
      clubId: string;
      promptId: string;
      responseId: string;
      title: string;
    }
  | {
      type: 'comment';
      clubId: string;
      promptId: string;
      commentId: string;
      title: string;
    };

export type ClubPromptComposerSubmit = (
  payload: ClubPromptComposerPayload,
) => Promise<ClubPromptApi | null>;

export type ClubFeedContentState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'
  | 'access-denied';

export type ClubFeedScreenState = {
  items: ClubFeedItemApi[];
  contentState: ClubFeedContentState;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isSubmittingResponse: boolean;
  responseSubmittingPromptId: string | null;
  errorMessage: string | null;
  responseErrorMessage: string | null;
  canRetry: boolean;
  hasRealPromptPagination: false;
  handleRetry: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  clearResponseError: () => void;
  submitPromptResponse: (
    promptId: string,
    payload: CreateClubPromptResponsePayloadApi,
  ) => Promise<ClubPromptResponseApi | null>;
};

export type ClubMembersContentState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'
  | 'access-denied';

export type ClubMembersScreenState = {
  items: ClubMemberApi[];
  contentState: ClubMembersContentState;
  searchQuery: string;
  roleFilter: ClubMemberRoleApi | null;
  statusFilter: ClubMemberStatusApi | null;
  pagination: ClubMembersPaginationApi | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  canRetry: boolean;
  canLoadMore: boolean;
  setSearchQuery: (value: string) => void;
  setRoleFilter: (value: ClubMemberRoleApi | null) => void;
  setStatusFilter: (value: ClubMemberStatusApi | null) => void;
  handleRetry: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleLoadMore: () => Promise<void>;
  replaceMember: (member: ClubMemberApi) => void;
};

export type ClubAuditMetadataEntry = {
  label: string;
  value: string;
};

export type ClubAuditLogItem = {
  id: string;
  action: string;
  actionLabel: string;
  actorId: string | null;
  actorLabel: string;
  targetUserId: string | null;
  targetLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  entityLabel: string | null;
  createdAt: string;
  createdAtLabel: string;
  metadataEntries: ClubAuditMetadataEntry[];
};

export type ClubAuditFilters = Required<
  Pick<
    ClubAuditLogsQueryApi,
    'action' | 'targetUserId' | 'entityType' | 'from' | 'to'
  >
>;

export type ClubAuditLogContentState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'
  | 'access-denied';

export type ClubAuditLogScreenState = {
  items: ClubAuditLogItem[];
  filters: ClubAuditFilters;
  contentState: ClubAuditLogContentState;
  nextCursor: string | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  canRetry: boolean;
  canLoadMore: boolean;
  setActionFilter: (value: string) => void;
  setTargetUserIdFilter: (value: string) => void;
  setEntityTypeFilter: (value: string) => void;
  setFromFilter: (value: string) => void;
  setToFilter: (value: string) => void;
  clearFilters: () => void;
  handleRetry: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleLoadMore: () => Promise<void>;
};

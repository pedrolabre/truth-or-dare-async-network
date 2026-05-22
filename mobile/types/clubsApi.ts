export type ClubIconNameApi =
  | 'groups'
  | 'sports-esports'
  | 'local-fire-department'
  | 'auto-awesome'
  | 'celebration'
  | 'school'
  | 'nightlife'
  | 'favorite';

export type ClubVisibilityApi = 'public' | 'private' | 'invite_only';

export type ClubStatusApi = 'active' | 'archived' | 'suspended' | 'deleted';

export type ClubMemberRoleApi = 'owner' | 'admin' | 'moderator' | 'member';

export type ClubMemberStatusApi =
  | 'active'
  | 'invited'
  | 'requested'
  | 'removed';

export type ClubPromptTypeApi = 'truth' | 'dare';

export type ClubPromptStatusApi =
  | 'draft'
  | 'published'
  | 'archived'
  | 'removed';

export type ClubJoinPolicyApi = 'open' | 'approval_required' | 'invite_only';

export type ClubViewerMembershipApi = {
  isMember: boolean;
  role: ClubMemberRoleApi | null;
  status: ClubMemberStatusApi | null;
};

export type ClubPermissionsApi = {
  canViewFeed: boolean;
  canPostPrompt: boolean;
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canEditClub: boolean;
  canArchiveClub: boolean;
  canTransferOwnership: boolean;
};

export type ClubSummaryApi = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconName: string;
  avatarUrl: string | null;
  visibility: ClubVisibilityApi;
  status: ClubStatusApi;
  memberCount: number;
  promptCount: number;
  lastActivityAt: string | null;
  viewerMembership: ClubViewerMembershipApi;
};

export type ClubDetailsApi = ClubSummaryApi & {
  coverUrl: string | null;
  rules: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
  joinPolicy: ClubJoinPolicyApi;
  permissions: ClubPermissionsApi;
};

export type CreateClubPayloadApi = {
  name: string;
  description: string | null;
  iconName: ClubIconNameApi;
  visibility: ClubVisibilityApi;
  rules: string | null;
  tags: string[];
  initialMemberIds: string[];
};

export type CreateClubResponseApi = ClubDetailsApi;

export type ClubMemberApi = {
  id: string;
  clubId: string;
  userId: string;
  name: string;
  username: string | null;
  role: ClubMemberRoleApi;
  status: ClubMemberStatusApi;
  joinedAt: string | null;
  lastSeenAt: string | null;
  mutedUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClubMemberSummaryApi = ClubMemberApi;

export type ClubMembersPaginationApi = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ClubMembersApi = {
  items: ClubMemberApi[];
  pagination: ClubMembersPaginationApi;
};

export type ClubMembersQueryApi = {
  page?: number;
  limit?: number;
  role?: ClubMemberRoleApi | null;
  status?: ClubMemberStatusApi | null;
  search?: string | null;
};

export type ClubPromptAttachmentApi = {
  id?: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'link';
  url: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationSeconds?: number;
};

export type ClubPromptApi = {
  id: string;
  clubId: string;
  authorId: string;
  authorName: string;
  type: ClubPromptTypeApi;
  status: ClubPromptStatusApi;
  content: string;
  difficulty: string | null;
  attachments: ClubPromptAttachmentApi[];
  maxAttempts: number | null;
  expiresAt: string | null;
  publishedAt: string | null;
  answersCount: number;
  commentsCount: number;
  likesCount: number;
  isPinned: boolean;
  isMembersOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClubPromptSummaryApi = ClubPromptApi;

export type ClubPromptResponseApi = {
  id: string;
  clubId: string;
  promptId: string;
  userId: string;
  userName: string;
  text: string | null;
  mediaUrl: string | null;
  mediaType: 'video' | 'audio' | 'file' | null;
  dareProofId: string | null;
  attemptsUsed: number;
  completedAt: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ClubPromptResponseSummaryApi = ClubPromptResponseApi;

export type CreateClubPromptResponsePayloadApi = {
  text?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'video' | 'audio' | 'file' | null;
  dareProofId?: string | null;
};

export type ClubPromptViewerStateApi = {
  likedByMe: boolean;
  answeredByMe: boolean;
  canAnswer: boolean;
};

export type ClubPromptDetailApi = ClubPromptApi & {
  archivedAt: string | null;
  removedAt: string | null;
  removedById: string | null;
  removalReason: string | null;
  responses: ClubPromptResponseApi[];
  viewerState: ClubPromptViewerStateApi & {
    canEdit: boolean;
    canRemove: boolean;
  };
};

export type ClubFeedItemApi = ClubPromptApi & {
  viewerState: ClubPromptViewerStateApi;
  recentResponses: ClubPromptResponseApi[];
};

export type ClubFeedOrderApi =
  | 'activity'
  | 'relevance'
  | 'deadline'
  | 'pinned';

export type ClubFeedApi = {
  club: ClubSummaryApi;
  items: ClubFeedItemApi[];
};

export type ClubJoinRequestApi = {
  id: string;
  clubId: string;
  userId: string;
  status: ClubMemberStatusApi;
  message: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClubInviteApi = {
  id: string;
  clubId: string;
  inviteeId: string;
  inviterId: string;
  status: ClubMemberStatusApi;
  message: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateClubPayloadApi = {
  name?: string;
  description?: string | null;
  iconName?: ClubIconNameApi;
  visibility?: ClubVisibilityApi;
  rules?: string | null;
  tags?: string[];
};

export type CreateClubPromptPayloadApi = {
  type: ClubPromptTypeApi;
  content: string;
  difficulty?: string | null;
  maxAttempts?: number | null;
  expiresAt?: string | null;
  attachments?: ClubPromptAttachmentApi[];
  isPinned?: boolean;
  isMembersOnly?: boolean;
};

export type DiscoverClubsApi = {
  suggested: ClubSummaryApi[];
  popular: ClubSummaryApi[];
  recent: ClubSummaryApi[];
};

export type ToggleClubLikeApi = {
  liked: boolean;
  likesCount: number;
};

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

export type ClubMemberSummaryApi = {
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

export type ClubPromptAttachmentApi = {
  id?: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'link';
  url: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationSeconds?: number;
};

export type ClubPromptSummaryApi = {
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

export type ClubPromptResponseSummaryApi = {
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

export type ClubPromptDetailApi = ClubPromptSummaryApi & {
  archivedAt: string | null;
  removedAt: string | null;
  removedById: string | null;
  removalReason: string | null;
  responses: ClubPromptResponseSummaryApi[];
  viewerState: {
    likedByMe: boolean;
    answeredByMe: boolean;
    canAnswer: boolean;
    canEdit: boolean;
    canRemove: boolean;
  };
};

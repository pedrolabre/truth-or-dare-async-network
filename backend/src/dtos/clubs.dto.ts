export type ClubVisibilityDto = 'public' | 'private' | 'invite_only';

export type ClubStatusDto = 'active' | 'archived' | 'suspended' | 'deleted';

export type ClubMemberRoleDto = 'owner' | 'admin' | 'moderator' | 'member';

export type ClubMemberStatusDto =
  | 'active'
  | 'invited'
  | 'requested'
  | 'removed'
  | 'blocked';

export type ClubPromptTypeDto = 'truth' | 'dare';

export type ClubPromptStatusDto =
  | 'draft'
  | 'published'
  | 'archived'
  | 'removed';

export type ClubReportTargetTypeDto =
  | 'club'
  | 'club_prompt'
  | 'club_prompt_response'
  | 'club_prompt_comment';

export type ClubJoinPolicyDto = 'open' | 'approval_required' | 'invite_only';

export type ClubViewerMembershipDto = {
  isMember: boolean;
  role: ClubMemberRoleDto | null;
  status: ClubMemberStatusDto | null;
};

export type ClubViewerActivityDto = {
  unreadCount: number;
  lastSeenAt: string | null;
  mutedUntil: string | null;
  isMuted: boolean;
};

export type ClubPermissionsDto = {
  canViewFeed: boolean;
  canPostPrompt: boolean;
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canEditClub: boolean;
  canArchiveClub: boolean;
  canTransferOwnership: boolean;
};

export type ClubSummaryDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconName: string;
  avatarUrl: string | null;
  visibility: ClubVisibilityDto;
  status: ClubStatusDto;
  memberCount: number;
  promptCount: number;
  lastActivityAt: string | null;
  viewerMembership: ClubViewerMembershipDto;
  viewerActivity: ClubViewerActivityDto;
};

export type ClubDetailsDto = ClubSummaryDto & {
  coverUrl: string | null;
  rules: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
  joinPolicy: ClubJoinPolicyDto;
  permissions: ClubPermissionsDto;
};

export type ClubMemberSummaryDto = {
  id: string;
  clubId: string;
  userId: string;
  name: string;
  username: string | null;
  role: ClubMemberRoleDto;
  status: ClubMemberStatusDto;
  joinedAt: string | null;
  lastSeenAt: string | null;
  mutedUntil: string | null;
  postingSuspendedUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClubPromptAttachmentDto = {
  id?: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'link';
  url: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationSeconds?: number;
};

export type ClubPromptSummaryDto = {
  id: string;
  clubId: string;
  authorId: string;
  authorName: string;
  type: ClubPromptTypeDto;
  status: ClubPromptStatusDto;
  content: string;
  difficulty: string | null;
  attachments: ClubPromptAttachmentDto[];
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

export type ClubPromptResponseSummaryDto = {
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

export type ClubPromptResponsesPageDto = {
  items: ClubPromptResponseSummaryDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ClubPromptCommentSummaryDto = {
  id: string;
  clubId: string;
  promptId: string;
  responseId: string | null;
  userId: string;
  userName: string;
  parentId: string | null;
  text: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ClubPromptDetailDto = ClubPromptSummaryDto & {
  archivedAt: string | null;
  removedAt: string | null;
  removedById: string | null;
  removalReason: string | null;
  responses: ClubPromptResponseSummaryDto[];
  viewerState: {
    likedByMe: boolean;
    answeredByMe: boolean;
    canAnswer: boolean;
    canEdit: boolean;
    canRemove: boolean;
  };
};

export type ClubFeedPromptItemDto = ClubPromptSummaryDto & {
  viewerState: {
    likedByMe: boolean;
    answeredByMe: boolean;
    canAnswer: boolean;
  };
  recentResponses: ClubPromptResponseSummaryDto[];
};

export type ClubFeedOrderDto =
  | 'activity'
  | 'relevance'
  | 'deadline'
  | 'pinned';

export type ClubFeedDto = {
  club: ClubSummaryDto;
  items: ClubFeedPromptItemDto[];
  nextCursor: string | null;
};

export type ClubFeedSeenDto = {
  lastSeenAt: string;
  unreadCount: number;
  readCount: number;
};

export type ClubsAggregatedFeedPromptActivityDto = {
  id: string;
  activityType: 'prompt';
  activityAt: string;
  club: ClubSummaryDto;
  prompt: ClubFeedPromptItemDto;
};

export type ClubsAggregatedFeedResponseActivityDto = {
  id: string;
  activityType: 'response';
  activityAt: string;
  club: ClubSummaryDto;
  prompt: ClubPromptSummaryDto;
  response: ClubPromptResponseSummaryDto;
};

export type ClubsAggregatedFeedItemDto =
  | ClubsAggregatedFeedPromptActivityDto
  | ClubsAggregatedFeedResponseActivityDto;

export type ClubsAggregatedFeedDto = {
  items: ClubsAggregatedFeedItemDto[];
  nextCursor: string | null;
};

export type ClubReportDto = {
  id: string;
  clubId: string;
  targetType: ClubReportTargetTypeDto;
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: string;
};

export type ClubAuditMetadataDto =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export type ClubAuditLogDto = {
  id: string;
  action: string;
  actorId: string | null;
  targetUserId: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: ClubAuditMetadataDto;
  createdAt: string;
};

export type ListClubAuditLogsResponseDto = {
  items: ClubAuditLogDto[];
  nextCursor: string | null;
};

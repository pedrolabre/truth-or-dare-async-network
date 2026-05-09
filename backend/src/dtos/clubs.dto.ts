export type ClubVisibilityDto = 'public' | 'private' | 'invite_only';

export type ClubStatusDto = 'active' | 'archived' | 'suspended' | 'deleted';

export type ClubMemberRoleDto = 'owner' | 'admin' | 'moderator' | 'member';

export type ClubMemberStatusDto =
  | 'active'
  | 'invited'
  | 'requested'
  | 'removed';

export type ClubPromptTypeDto = 'truth' | 'dare';

export type ClubPromptStatusDto =
  | 'draft'
  | 'published'
  | 'archived'
  | 'removed';

export type ClubJoinPolicyDto = 'open' | 'approval_required' | 'invite_only';

export type ClubViewerMembershipDto = {
  isMember: boolean;
  role: ClubMemberRoleDto | null;
  status: ClubMemberStatusDto | null;
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

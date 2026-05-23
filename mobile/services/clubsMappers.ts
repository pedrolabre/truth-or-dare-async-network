import type {
  ClubDetail,
  ClubDiscoverItem,
  ClubListItem,
} from '../types/clubs';
import type {
  ClubDetailsApi,
  ClubMemberRoleApi,
  ClubMemberStatusApi,
  ClubPermissionsApi,
  ClubStatusApi,
  ClubSummaryApi,
  ClubVisibilityApi,
  DiscoverClubsApi,
} from '../types/clubsApi';

export type ClubDiscoverySource = keyof DiscoverClubsApi;
export type ClubDiscoverItemSource = ClubDiscoverySource | 'search';

const DEFAULT_CLUB_DESCRIPTION = 'Clube sem descrição por enquanto.';
const DEFAULT_CLUB_ICON_NAME = 'groups';

const DISCOVERY_BADGE_LABELS: Record<ClubDiscoverItemSource, string> = {
  suggested: 'Sugestão',
  popular: 'Popular',
  recent: 'Novo',
  search: 'Busca',
};

const CLUB_STATUS_LABELS: Record<ClubStatusApi, string | undefined> = {
  active: undefined,
  archived: 'Arquivado',
  suspended: 'Suspenso',
  deleted: 'Removido',
};

const MEMBER_STATUS_LABELS: Record<ClubMemberStatusApi, string> = {
  active: 'Membro',
  invited: 'Convite',
  requested: 'Pendente',
  removed: 'Removido',
  blocked: 'Bloqueado',
};

const MEMBER_ROLE_LABELS: Record<ClubMemberRoleApi, string> = {
  owner: 'Dono',
  admin: 'Admin',
  moderator: 'Moderador',
  member: 'Membro',
};

const CLUB_VISIBILITY_LABELS: Record<ClubVisibilityApi, string> = {
  public: 'Publico',
  private: 'Privado',
  invite_only: 'Convite',
};

const CLUB_DETAIL_STATUS_LABELS: Record<ClubStatusApi, string> = {
  active: 'Ativo',
  archived: 'Arquivado',
  suspended: 'Suspenso',
  deleted: 'Removido',
};

const BLOCKED_CLUB_DETAIL_PERMISSIONS: ClubPermissionsApi = {
  canViewFeed: false,
  canPostPrompt: false,
  canInviteMembers: false,
  canManageMembers: false,
  canEditClub: false,
  canArchiveClub: false,
  canTransferOwnership: false,
};

export function formatClubMembersLabel(memberCount: number): string {
  const normalizedMemberCount = Math.max(0, memberCount);
  const memberLabel = normalizedMemberCount === 1 ? 'membro' : 'membros';

  return `${normalizedMemberCount} ${memberLabel}`;
}

export function formatClubPromptsLabel(promptCount: number): string {
  const normalizedPromptCount = Math.max(0, promptCount);
  const promptLabel = normalizedPromptCount === 1 ? 'prompt' : 'prompts';

  return `${normalizedPromptCount} ${promptLabel}`;
}

export function upsertClubListItem(
  currentClubs: ClubListItem[],
  nextClub: ClubListItem,
): ClubListItem[] {
  const hasClub = currentClubs.some((club) => club.id === nextClub.id);

  if (!hasClub) {
    return [nextClub, ...currentClubs];
  }

  return currentClubs.map((club) =>
    club.id === nextClub.id ? nextClub : club,
  );
}

function getClubDescription(description: string | null | undefined): string {
  const trimmedDescription = description?.trim();

  return trimmedDescription || DEFAULT_CLUB_DESCRIPTION;
}

function getClubIconName(iconName: string | null | undefined): string {
  const trimmedIconName = iconName?.trim();

  return trimmedIconName || DEFAULT_CLUB_ICON_NAME;
}

function getMembershipStatusLabel(club: ClubSummaryApi): string | undefined {
  const { viewerMembership } = club;

  if (!viewerMembership.status) {
    return undefined;
  }

  if (viewerMembership.status !== 'active') {
    return MEMBER_STATUS_LABELS[viewerMembership.status];
  }

  if (!viewerMembership.isMember) {
    return undefined;
  }

  return viewerMembership.role
    ? MEMBER_ROLE_LABELS[viewerMembership.role]
    : MEMBER_STATUS_LABELS.active;
}

function getClubListStatusLabel(club: ClubSummaryApi): string | undefined {
  return CLUB_STATUS_LABELS[club.status] ?? getMembershipStatusLabel(club);
}

function getClubListIsActive(club: ClubSummaryApi): boolean {
  return (
    club.status === 'active' &&
    club.viewerMembership.isMember &&
    club.viewerMembership.status === 'active'
  );
}

function getMembershipLabel(club: ClubSummaryApi): string {
  const { viewerMembership } = club;

  if (!viewerMembership.status) {
    return club.visibility === 'private' ? 'Acesso privado' : 'Visitante';
  }

  if (viewerMembership.status !== 'active') {
    return MEMBER_STATUS_LABELS[viewerMembership.status];
  }

  if (!viewerMembership.isMember) {
    return 'Visitante';
  }

  return viewerMembership.role
    ? MEMBER_ROLE_LABELS[viewerMembership.role]
    : MEMBER_STATUS_LABELS.active;
}

export function mapClubSummaryToListItem(
  club: ClubSummaryApi,
): ClubListItem {
  return {
    id: club.id,
    name: club.name,
    description: getClubDescription(club.description),
    memberCount: club.memberCount,
    membersLabel: formatClubMembersLabel(club.memberCount),
    statusLabel: getClubListStatusLabel(club),
    iconName: getClubIconName(club.iconName),
    isActive: getClubListIsActive(club),
  };
}

export function mapClubSummaryToDiscoverItem(
  club: ClubSummaryApi,
  source: ClubDiscoverItemSource,
): ClubDiscoverItem {
  return {
    id: club.id,
    name: club.name,
    description: getClubDescription(club.description),
    memberCount: club.memberCount,
    membersLabel: formatClubMembersLabel(club.memberCount),
    badgeLabel: DISCOVERY_BADGE_LABELS[source],
    iconName: getClubIconName(club.iconName),
    // The "popular" discovery source is the one that should receive trending treatment in the card.
    isTrending: source === 'popular',
    isMember: club.viewerMembership.isMember,
    membershipStatus: club.viewerMembership.status,
  };
}

export function getBlockedClubDetailPermissions(): ClubPermissionsApi {
  return { ...BLOCKED_CLUB_DETAIL_PERMISSIONS };
}

export function mapClubDetailsToDetail(club: ClubDetailsApi): ClubDetail {
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: getClubDescription(club.description),
    descriptionText: club.description ?? '',
    iconName: getClubIconName(club.iconName),
    avatarUrl: club.avatarUrl,
    coverUrl: club.coverUrl,
    visibility: club.visibility,
    visibilityLabel: CLUB_VISIBILITY_LABELS[club.visibility],
    status: club.status,
    statusLabel: CLUB_DETAIL_STATUS_LABELS[club.status],
    memberCount: club.memberCount,
    membersLabel: formatClubMembersLabel(club.memberCount),
    promptCount: club.promptCount,
    promptsLabel: formatClubPromptsLabel(club.promptCount),
    lastActivityAt: club.lastActivityAt,
    rules: club.rules,
    tags: club.tags,
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
    archivedAt: club.archivedAt,
    deletedAt: club.deletedAt,
    joinPolicy: club.joinPolicy,
    viewerMembership: club.viewerMembership,
    membershipLabel: getMembershipLabel(club),
    permissions: club.permissions,
  };
}

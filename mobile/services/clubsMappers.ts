import type { ClubDiscoverItem, ClubListItem } from '../types/clubs';
import type {
  ClubMemberRoleApi,
  ClubMemberStatusApi,
  ClubStatusApi,
  ClubSummaryApi,
  DiscoverClubsApi,
} from '../types/clubsApi';

export type ClubDiscoverySource = keyof DiscoverClubsApi;

const DEFAULT_CLUB_DESCRIPTION = 'Clube sem descrição por enquanto.';
const DEFAULT_CLUB_ICON_NAME = 'groups';

const DISCOVERY_BADGE_LABELS: Record<ClubDiscoverySource, string> = {
  suggested: 'Sugestão',
  popular: 'Popular',
  recent: 'Novo',
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
};

const MEMBER_ROLE_LABELS: Record<ClubMemberRoleApi, string> = {
  owner: 'Dono',
  admin: 'Admin',
  moderator: 'Moderador',
  member: 'Membro',
};

export function formatClubMembersLabel(memberCount: number): string {
  const normalizedMemberCount = Math.max(0, memberCount);
  const memberLabel = normalizedMemberCount === 1 ? 'membro' : 'membros';

  return `${normalizedMemberCount} ${memberLabel}`;
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

export function mapClubSummaryToListItem(
  club: ClubSummaryApi,
): ClubListItem {
  return {
    id: club.id,
    name: club.name,
    description: getClubDescription(club.description),
    membersLabel: formatClubMembersLabel(club.memberCount),
    statusLabel: getClubListStatusLabel(club),
    iconName: getClubIconName(club.iconName),
    isActive: getClubListIsActive(club),
  };
}

export function mapClubSummaryToDiscoverItem(
  club: ClubSummaryApi,
  source: ClubDiscoverySource,
): ClubDiscoverItem {
  return {
    id: club.id,
    name: club.name,
    description: getClubDescription(club.description),
    membersLabel: formatClubMembersLabel(club.memberCount),
    badgeLabel: DISCOVERY_BADGE_LABELS[source],
    iconName: getClubIconName(club.iconName),
    // The "popular" discovery source is the one that should receive trending treatment in the card.
    isTrending: source === 'popular',
  };
}

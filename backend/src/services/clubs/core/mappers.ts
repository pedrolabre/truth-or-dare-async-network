import { ClubMemberStatus, ClubVisibility } from '../../../generated/prisma/client';
import {
  ClubViewerActivityDto,
  ClubDetailsDto,
  ClubSummaryDto,
  ClubViewerMembershipDto,
} from '../../../dtos/clubs.dto';
import { isClubMembershipMuted } from '../notification-recipients';
import { getPermissions } from './permissions';
import { ClubWithViewerMembers } from './types';

function toViewerMembership(
  club: ClubWithViewerMembers,
  viewerId: string,
): ClubViewerMembershipDto {
  const membership = club.members.find((member) => member.userId === viewerId);

  return {
    isMember: membership?.status === ClubMemberStatus.active,
    role: membership?.role ?? null,
    status: membership?.status ?? null,
  };
}

function toViewerActivity(
  club: ClubWithViewerMembers,
  viewerId: string,
  unreadCount = 0,
): ClubViewerActivityDto {
  const membership = club.members.find((member) => member.userId === viewerId);

  return {
    unreadCount,
    lastSeenAt: membership?.lastSeenAt?.toISOString() ?? null,
    mutedUntil: membership?.mutedUntil?.toISOString() ?? null,
    isMuted: isClubMembershipMuted(membership?.mutedUntil),
  };
}

function visibilityToJoinPolicy(visibility: ClubVisibility) {
  if (visibility === ClubVisibility.public) {
    return 'open';
  }

  if (visibility === ClubVisibility.private) {
    return 'approval_required';
  }

  return 'invite_only';
}

export function mapSummary(
  club: ClubWithViewerMembers,
  viewerId: string,
  unreadCount = 0,
): ClubSummaryDto {
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: club.description,
    iconName: club.iconName,
    avatarUrl: club.avatarUrl,
    visibility: club.visibility,
    status: club.status,
    memberCount: club.memberCount,
    promptCount: club.promptCount,
    lastActivityAt: club.lastActivityAt?.toISOString() ?? null,
    viewerMembership: toViewerMembership(club, viewerId),
    viewerActivity: toViewerActivity(club, viewerId, unreadCount),
  };
}

export function mapDetails(
  club: ClubWithViewerMembers,
  viewerId: string,
  unreadCount = 0,
): ClubDetailsDto {
  return {
    ...mapSummary(club, viewerId, unreadCount),
    coverUrl: club.coverUrl,
    rules: club.rules,
    tags: club.tags,
    createdAt: club.createdAt.toISOString(),
    updatedAt: club.updatedAt.toISOString(),
    archivedAt: club.archivedAt?.toISOString() ?? null,
    deletedAt: club.deletedAt?.toISOString() ?? null,
    joinPolicy: visibilityToJoinPolicy(club.visibility),
    permissions: getPermissions(club, viewerId),
  };
}

import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../generated/prisma/client';
import { ClubPermissionsDto } from '../dtos/clubs.dto';
import { forbiddenError } from './clubs.errors';
import { ClubWithViewerMembers } from './clubs.types';

export function getPermissions(
  club: ClubWithViewerMembers,
  viewerId: string,
): ClubPermissionsDto {
  const membership = club.members.find((member) => member.userId === viewerId);
  const isActive = club.status === ClubStatus.active;
  const isActiveMember = membership?.status === ClubMemberStatus.active;
  const isOwner = membership?.role === ClubMemberRole.owner && isActiveMember;
  const isAdmin = membership?.role === ClubMemberRole.admin && isActiveMember;
  const isModerator =
    membership?.role === ClubMemberRole.moderator && isActiveMember;
  const canManage = isOwner || isAdmin || isModerator;

  return {
    canViewFeed:
      isActive &&
      (club.visibility === ClubVisibility.public || Boolean(isActiveMember)),
    canPostPrompt: isActive && Boolean(isActiveMember),
    canInviteMembers: isActive && (isOwner || isAdmin),
    canManageMembers: isActive && canManage,
    canEditClub: isActive && (isOwner || isAdmin),
    canArchiveClub: isOwner,
    canTransferOwnership: isOwner,
  };
}

export function ensureCanViewClub(club: ClubWithViewerMembers, userId: string) {
  if (
    club.visibility === ClubVisibility.public &&
    club.status === ClubStatus.active
  ) {
    return;
  }

  const membership = club.members.find((member) => member.userId === userId);

  if (!membership || membership.status === ClubMemberStatus.removed) {
    forbiddenError();
  }
}

export function ensureCanEditClub(club: ClubWithViewerMembers, userId: string) {
  const permissions = getPermissions(club, userId);

  if (!permissions.canEditClub) {
    forbiddenError();
  }
}

export function ensureCanArchiveClub(
  club: ClubWithViewerMembers,
  userId: string,
) {
  const permissions = getPermissions(club, userId);

  if (!permissions.canArchiveClub) {
    forbiddenError();
  }
}

import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../../../generated/prisma/client';
import { ClubPermissionsDto } from '../../../dtos/clubs.dto';
import { blockedMemberError, forbiddenError } from './errors';
import { ClubWithViewerMembers } from './types';
import { getClubWithMembers } from './repository';

export type ClubPermissionFlags = {
  podeEditar: boolean;
  podeConvidar: boolean;
  podeModerar: boolean;
  podePostar: boolean;
  podeResponder: boolean;
};

function calculateClubPermissions(
  club: ClubWithViewerMembers,
  viewerId: string,
): ClubPermissionFlags {
  const membership = club.members.find((member) => member.userId === viewerId);
  const isActive = club.status === ClubStatus.active;
  const isActiveMember = membership?.status === ClubMemberStatus.active;
  const postingSuspendedUntil = membership?.postingSuspendedUntil ?? null;
  const isPostingSuspended = Boolean(
    postingSuspendedUntil && postingSuspendedUntil.getTime() > Date.now(),
  );
  const isOwner = membership?.role === ClubMemberRole.owner && isActiveMember;
  const isAdmin = membership?.role === ClubMemberRole.admin && isActiveMember;
  const isModerator =
    membership?.role === ClubMemberRole.moderator && isActiveMember;
  const canPostOrRespond =
    isActive &&
    !isPostingSuspended &&
    (isOwner || isAdmin || isModerator || Boolean(isActiveMember));

  return {
    podeEditar: isActive && (isOwner || isAdmin),
    podeConvidar: isActive && (isOwner || isAdmin),
    podeModerar: isActive && (isOwner || isAdmin || isModerator),
    podePostar: canPostOrRespond,
    podeResponder: canPostOrRespond,
  };
}

export async function getClubPermissions(
  userId: string,
  clubId: string,
): Promise<ClubPermissionFlags> {
  const club = await getClubWithMembers(clubId);

  return calculateClubPermissions(club, userId);
}

export function getPermissions(
  club: ClubWithViewerMembers,
  viewerId: string,
): ClubPermissionsDto {
  const flags = calculateClubPermissions(club, viewerId);
  const isActive = club.status === ClubStatus.active;
  const membership = club.members.find((member) => member.userId === viewerId);
  const isActiveMember = membership?.status === ClubMemberStatus.active;
  const isOwner =
    isActiveMember && membership?.role === ClubMemberRole.owner;

  return {
    canViewFeed:
      isActive &&
      (club.visibility === ClubVisibility.public || Boolean(isActiveMember)),
    canPostPrompt: flags.podePostar,
    canInviteMembers: flags.podeConvidar,
    canManageMembers: flags.podeModerar,
    canEditClub: flags.podeEditar,
    canArchiveClub: isOwner,
    canTransferOwnership: isOwner,
  };
}

export function ensureCanViewClub(club: ClubWithViewerMembers, userId: string) {
  const membership = club.members.find((member) => member.userId === userId);

  if (membership?.status === ClubMemberStatus.blocked) {
    blockedMemberError();
  }

  if (
    club.visibility === ClubVisibility.public &&
    club.status === ClubStatus.active
  ) {
    return;
  }

  if (!membership || membership.status !== ClubMemberStatus.active) {
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

export function ensureCanViewClubAuditLogs(
  club: ClubWithViewerMembers,
  userId: string,
) {
  const membership = club.members.find((member) => member.userId === userId);
  const isActiveMember = membership?.status === ClubMemberStatus.active;
  const canViewAuditLogs =
    isActiveMember &&
    (membership?.role === ClubMemberRole.owner ||
      membership?.role === ClubMemberRole.admin);

  if (membership?.status === ClubMemberStatus.blocked) {
    blockedMemberError();
  }

  if (!canViewAuditLogs) {
    forbiddenError();
  }
}

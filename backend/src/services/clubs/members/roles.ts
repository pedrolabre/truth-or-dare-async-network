import { ClubMemberRole } from '../../../generated/prisma/client';

export const clubMemberRoleRank: Record<ClubMemberRole, number> = {
  [ClubMemberRole.owner]: 4,
  [ClubMemberRole.admin]: 3,
  [ClubMemberRole.moderator]: 2,
  [ClubMemberRole.member]: 1,
};

export function isRoleBelow(
  actorRole: ClubMemberRole,
  targetRole: ClubMemberRole,
) {
  return clubMemberRoleRank[actorRole] > clubMemberRoleRank[targetRole];
}

export function isManagedRole(value: unknown): value is Exclude<
  ClubMemberRole,
  typeof ClubMemberRole.owner
> {
  return (
    value === ClubMemberRole.admin ||
    value === ClubMemberRole.moderator ||
    value === ClubMemberRole.member
  );
}

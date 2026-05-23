import { Prisma } from '../../../generated/prisma/client';
import { ClubMemberSummaryDto } from '../../../dtos/clubs.dto';

export type ClubMemberWithUser = Prisma.ClubMemberGetPayload<{
  include: {
    user: true;
  };
}>;

export function mapClubMember(member: ClubMemberWithUser): ClubMemberSummaryDto {
  return {
    id: member.id,
    clubId: member.clubId,
    userId: member.userId,
    name: member.user.name,
    username: member.user.username,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt?.toISOString() ?? null,
    lastSeenAt: member.lastSeenAt?.toISOString() ?? null,
    mutedUntil: member.mutedUntil?.toISOString() ?? null,
    postingSuspendedUntil:
      member.postingSuspendedUntil?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}

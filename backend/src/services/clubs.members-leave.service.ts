import {
  ClubMemberRole,
  ClubMemberStatus,
} from '../generated/prisma/client';
import { ClubMemberSummaryDto } from '../dtos/clubs.dto';
import { prisma } from '../lib/prisma';
import { requireAuthenticatedUser, validationError } from './clubs.errors';
import { mapClubMember } from './clubs.members.mappers';
import { getClubWithMembers } from './clubs.repository';

export type LeaveClubInput = {
  clubId: string;
  userId: string;
};

async function getClubMemberSummary(clubId: string, userId: string) {
  const membership = await prisma.clubMember.findUniqueOrThrow({
    where: {
      clubId_userId: {
        clubId,
        userId,
      },
    },
    include: {
      user: true,
    },
  });

  return mapClubMember(membership);
}

export async function leaveClub(
  input: LeaveClubInput,
): Promise<ClubMemberSummaryDto> {
  requireAuthenticatedUser(input.userId);

  const club = await getClubWithMembers(input.clubId);
  const membership = club.members.find((member) => member.userId === input.userId);

  if (!membership || membership.status !== ClubMemberStatus.active) {
    validationError('Apenas membros ativos podem sair do clube');
  }

  if (membership.role === ClubMemberRole.owner) {
    validationError('Owner deve transferir a posse antes de sair do clube');
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: input.userId,
        },
      },
      data: {
        status: ClubMemberStatus.removed,
      },
    });

    await tx.club.update({
      where: {
        id: input.clubId,
      },
      data: {
        memberCount: {
          decrement: 1,
        },
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.userId,
        targetUserId: input.userId,
        action: 'club_member_left',
        entityType: 'club_member',
        entityId: membership.id,
        metadata: {
          previousRole: membership.role,
        },
      },
    });
  });

  return getClubMemberSummary(input.clubId, input.userId);
}

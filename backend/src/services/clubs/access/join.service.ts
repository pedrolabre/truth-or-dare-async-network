import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../../../generated/prisma/client';
import { ClubMemberSummaryDto } from '../../../dtos/clubs.dto';
import { prisma } from '../../../lib/prisma';
import {
  blockedMemberError,
  requireAuthenticatedUser,
  validationError,
} from '../core/errors';
import { mapClubMember } from '../members/mappers';
import { getClubWithMembers } from '../core/repository';

export type JoinPublicClubInput = {
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

export async function joinPublicClub(
  input: JoinPublicClubInput,
): Promise<ClubMemberSummaryDto> {
  requireAuthenticatedUser(input.userId);

  const club = await getClubWithMembers(input.clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos aceitam entrada direta');
  }

  if (club.visibility !== ClubVisibility.public) {
    validationError('Apenas clubes publicos aceitam entrada direta');
  }

  const existingMembership = club.members.find(
    (member) => member.userId === input.userId,
  );

  if (existingMembership?.status === ClubMemberStatus.active) {
    validationError('Usuario ja e membro ativo do clube');
  }

  if (existingMembership?.status === ClubMemberStatus.blocked) {
    blockedMemberError();
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.upsert({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: input.userId,
        },
      },
      update: {
        role:
          existingMembership?.role === ClubMemberRole.owner
            ? ClubMemberRole.owner
            : ClubMemberRole.member,
        status: ClubMemberStatus.active,
        joinedAt: existingMembership?.joinedAt ?? now,
      },
      create: {
        clubId: input.clubId,
        userId: input.userId,
        role: ClubMemberRole.member,
        status: ClubMemberStatus.active,
        joinedAt: now,
      },
    });

    await tx.club.update({
      where: {
        id: input.clubId,
      },
      data: {
        memberCount: {
          increment: 1,
        },
        lastActivityAt: now,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.userId,
        targetUserId: input.userId,
        action: 'club_joined',
        entityType: 'club_member',
        metadata: {
          previousStatus: existingMembership?.status ?? null,
        },
      },
    });
  });

  return getClubMemberSummary(input.clubId, input.userId);
}

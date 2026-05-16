import {
  ClubMemberStatus,
  ClubStatus,
} from '../../../generated/prisma/client';
import { ClubMemberSummaryDto } from '../../../dtos/clubs.dto';
import { prisma } from '../../../lib/prisma';
import {
  forbiddenError,
  requireAuthenticatedUser,
  validationError,
} from '../core/errors';
import { mapClubMember } from './mappers';
import { getClubWithMembers } from '../core/repository';

const DEFAULT_MUTED_UNTIL = new Date('9999-12-31T23:59:59.999Z');

export type MuteClubInput = {
  clubId: string;
  userId: string;
};

export type UnmuteClubInput = {
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

export async function muteClub(
  input: MuteClubInput,
): Promise<ClubMemberSummaryDto> {
  requireAuthenticatedUser(input.userId);

  const club = await getClubWithMembers(input.clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos podem ser silenciados');
  }

  const membership = club.members.find((member) => member.userId === input.userId);

  if (!membership || membership.status !== ClubMemberStatus.active) {
    forbiddenError();
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
        mutedUntil: DEFAULT_MUTED_UNTIL,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.userId,
        targetUserId: input.userId,
        action: 'club_member_muted',
        entityType: 'club_member',
        entityId: membership.id,
        metadata: {
          mutedUntil: DEFAULT_MUTED_UNTIL.toISOString(),
          previousMutedUntil: membership.mutedUntil?.toISOString() ?? null,
        },
      },
    });
  });

  return getClubMemberSummary(input.clubId, input.userId);
}

export async function unmuteClub(
  input: UnmuteClubInput,
): Promise<ClubMemberSummaryDto> {
  requireAuthenticatedUser(input.userId);

  const club = await getClubWithMembers(input.clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos podem remover silencio');
  }

  const membership = club.members.find((member) => member.userId === input.userId);

  if (!membership || membership.status !== ClubMemberStatus.active) {
    forbiddenError();
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
        mutedUntil: null,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.userId,
        targetUserId: input.userId,
        action: 'club_member_unmuted',
        entityType: 'club_member',
        entityId: membership.id,
        metadata: {
          previousMutedUntil: membership.mutedUntil?.toISOString() ?? null,
        },
      },
    });
  });

  return getClubMemberSummary(input.clubId, input.userId);
}

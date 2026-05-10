import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../generated/prisma/client';
import { ClubMemberSummaryDto } from '../dtos/clubs.dto';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  requireAuthenticatedUser,
  validationError,
} from './clubs.errors';
import { mapClubMember } from './clubs.members.mappers';
import { isRoleBelow } from './clubs.members-roles';
import { getClubWithMembers } from './clubs.repository';

export type RemoveClubMemberInput = {
  clubId: string;
  actorId: string;
  targetUserId: string;
};

function ensureCanRemoveMember({
  actorRole,
  targetRole,
}: {
  actorRole: ClubMemberRole;
  targetRole: ClubMemberRole;
}) {
  if (actorRole === ClubMemberRole.member) {
    forbiddenError();
  }

  if (targetRole === ClubMemberRole.owner) {
    validationError('Owner nao pode ser removido por esta rota');
  }

  if (!isRoleBelow(actorRole, targetRole)) {
    forbiddenError();
  }
}

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

export async function removeClubMember(
  input: RemoveClubMemberInput,
): Promise<ClubMemberSummaryDto> {
  requireAuthenticatedUser(input.actorId);

  if (!input.targetUserId) {
    validationError('Usuario alvo e obrigatorio');
  }

  if (input.actorId === input.targetUserId) {
    validationError('Use a rota de saida para remover a si mesmo do clube');
  }

  const club = await getClubWithMembers(input.clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos permitem remocao de membros');
  }

  const actorMembership = club.members.find(
    (member) => member.userId === input.actorId,
  );
  const targetMembership = club.members.find(
    (member) => member.userId === input.targetUserId,
  );

  if (!actorMembership || actorMembership.status !== ClubMemberStatus.active) {
    forbiddenError();
  }

  if (!targetMembership || targetMembership.status !== ClubMemberStatus.active) {
    validationError('Apenas membros ativos podem ser removidos do clube');
  }

  ensureCanRemoveMember({
    actorRole: actorMembership.role,
    targetRole: targetMembership.role,
  });

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: input.targetUserId,
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
        actorId: input.actorId,
        targetUserId: input.targetUserId,
        action: 'club_member_removed',
        entityType: 'club_member',
        entityId: targetMembership.id,
        metadata: {
          previousRole: targetMembership.role,
        },
      },
    });
  });

  return getClubMemberSummary(input.clubId, input.targetUserId);
}

import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../../../generated/prisma/client';
import { ClubDetailsDto } from '../../../dtos/clubs.dto';
import { prisma } from '../../../lib/prisma';
import {
  forbiddenError,
  requireAuthenticatedUser,
  validationError,
} from '../core/errors';
import { getClubDetails } from '../core/clubs.service';
import { getClubWithMembers } from '../core/repository';

export type TransferClubOwnershipInput = {
  clubId: string;
  actorId: string;
  newOwnerId?: unknown;
};

function normalizeNewOwnerId(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    validationError('Novo owner e obrigatorio');
  }

  return value.trim();
}

export async function transferClubOwnership(
  input: TransferClubOwnershipInput,
): Promise<ClubDetailsDto> {
  requireAuthenticatedUser(input.actorId);

  const newOwnerId = normalizeNewOwnerId(input.newOwnerId);

  if (input.actorId === newOwnerId) {
    validationError('Owner atual nao pode transferir a posse para si mesmo');
  }

  const club = await getClubWithMembers(input.clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos permitem transferencia de posse');
  }

  const actorMembership = club.members.find(
    (member) => member.userId === input.actorId,
  );
  const newOwnerMembership = club.members.find(
    (member) => member.userId === newOwnerId,
  );

  if (
    !actorMembership ||
    actorMembership.status !== ClubMemberStatus.active ||
    actorMembership.role !== ClubMemberRole.owner
  ) {
    forbiddenError();
  }

  if (
    !newOwnerMembership ||
    newOwnerMembership.status !== ClubMemberStatus.active
  ) {
    validationError('Novo owner deve ser membro ativo do clube');
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: input.actorId,
        },
      },
      data: {
        role: ClubMemberRole.admin,
      },
    });

    await tx.clubMember.update({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: newOwnerId,
        },
      },
      data: {
        role: ClubMemberRole.owner,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.actorId,
        targetUserId: newOwnerId,
        action: 'club_ownership_transferred',
        entityType: 'club',
        entityId: input.clubId,
        metadata: {
          previousOwnerId: input.actorId,
          newOwnerId,
          previousNewOwnerRole: newOwnerMembership.role,
        },
      },
    });
  });

  return getClubDetails({
    clubId: input.clubId,
    userId: input.actorId,
  });
}

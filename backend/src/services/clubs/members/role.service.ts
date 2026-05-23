import {
  ClubMemberRole,
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
import { clubMemberRoleRank, isManagedRole, isRoleBelow } from './roles';
import { getClubWithMembers } from '../core/repository';
import { emitClubMemberPromotedEvent } from '../club-events.service';

export type UpdateClubMemberRoleInput = {
  clubId: string;
  actorId: string;
  targetUserId: string;
  role?: unknown;
};

function normalizeRole(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    validationError('Papel do membro e obrigatorio');
  }

  const role = value.trim();

  if (role === ClubMemberRole.owner) {
    validationError('Use transferencia de posse para definir owner');
  }

  if (!isManagedRole(role)) {
    validationError('Papel de membro invalido');
  }

  return role;
}

function ensureCanUpdateRole({
  actorRole,
  targetRole,
  newRole,
}: {
  actorRole: ClubMemberRole;
  targetRole: ClubMemberRole;
  newRole: ClubMemberRole;
}) {
  if (actorRole === ClubMemberRole.member || actorRole === ClubMemberRole.moderator) {
    forbiddenError();
  }

  if (targetRole === ClubMemberRole.owner) {
    validationError('Owner nao pode ter papel alterado por esta rota');
  }

  if (!isRoleBelow(actorRole, targetRole) || !isRoleBelow(actorRole, newRole)) {
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

export async function updateClubMemberRole(
  input: UpdateClubMemberRoleInput,
): Promise<ClubMemberSummaryDto> {
  requireAuthenticatedUser(input.actorId);

  if (!input.targetUserId) {
    validationError('Usuario alvo e obrigatorio');
  }

  if (input.actorId === input.targetUserId) {
    validationError('Usuario nao pode alterar o proprio papel');
  }

  const newRole = normalizeRole(input.role);
  const club = await getClubWithMembers(input.clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos permitem alterar papeis');
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
    validationError('Apenas membros ativos podem ter papel alterado');
  }

  if (targetMembership.role === newRole) {
    validationError('Membro ja possui este papel');
  }

  ensureCanUpdateRole({
    actorRole: actorMembership.role,
    targetRole: targetMembership.role,
    newRole,
  });

  const auditLog = await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: input.targetUserId,
        },
      },
      data: {
        role: newRole,
      },
    });

    return tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.actorId,
        targetUserId: input.targetUserId,
        action: 'club_member_role_updated',
        entityType: 'club_member',
        entityId: targetMembership.id,
        metadata: {
          previousRole: targetMembership.role,
          newRole,
        },
      },
    });
  });

  if (clubMemberRoleRank[newRole] > clubMemberRoleRank[targetMembership.role]) {
    await emitClubMemberPromotedEvent({
      clubId: input.clubId,
      clubName: club.name,
      actorId: input.actorId,
      promotedUserId: input.targetUserId,
      promotedById: input.actorId,
      memberId: targetMembership.id,
      eventId: auditLog.id,
      role: newRole,
    });
  }

  return getClubMemberSummary(input.clubId, input.targetUserId);
}

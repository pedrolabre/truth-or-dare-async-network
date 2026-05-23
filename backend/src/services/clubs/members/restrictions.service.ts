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
import { getClubWithMembers } from '../core/repository';
import { mapClubMember } from './mappers';
import { isRoleBelow } from './roles';

export type BlockClubMemberInput = {
  clubId: string;
  actorId: string;
  targetUserId: string;
};

export type SuspendClubMemberPostingInput = BlockClubMemberInput & {
  suspendedUntil?: unknown;
};

function ensureOwnerOrAdmin(role: ClubMemberRole) {
  if (role !== ClubMemberRole.owner && role !== ClubMemberRole.admin) {
    forbiddenError();
  }
}

function normalizeSuspendedUntil(value: unknown) {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    validationError('Data final da suspensao de postagem e obrigatoria');
  }

  const suspendedUntil = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(suspendedUntil.getTime())) {
    validationError('Data final da suspensao de postagem invalida');
  }

  if (suspendedUntil.getTime() <= Date.now()) {
    validationError('Suspensao de postagem deve terminar no futuro');
  }

  return suspendedUntil;
}

function ensureCanRestrictMember({
  actorRole,
  targetRole,
}: {
  actorRole: ClubMemberRole;
  targetRole: ClubMemberRole;
}) {
  ensureOwnerOrAdmin(actorRole);

  if (targetRole === ClubMemberRole.owner) {
    validationError('Owner nao pode ser bloqueado ou suspenso por esta rota');
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

async function getRestrictionContext({
  clubId,
  actorId,
  targetUserId,
}: BlockClubMemberInput) {
  requireAuthenticatedUser(actorId);

  if (!targetUserId) {
    validationError('Usuario alvo e obrigatorio');
  }

  if (actorId === targetUserId) {
    validationError('Usuario nao pode restringir a si mesmo no clube');
  }

  const club = await getClubWithMembers(clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos permitem moderar membros');
  }

  const actorMembership = club.members.find(
    (member) => member.userId === actorId,
  );
  const targetMembership = club.members.find(
    (member) => member.userId === targetUserId,
  );

  if (!actorMembership || actorMembership.status !== ClubMemberStatus.active) {
    forbiddenError();
  }

  if (!targetMembership) {
    validationError('Usuario alvo nao possui relacao com este clube');
  }

  ensureCanRestrictMember({
    actorRole: actorMembership.role,
    targetRole: targetMembership.role,
  });

  return {
    actorMembership,
    targetMembership,
  };
}

export async function blockClubMember(
  input: BlockClubMemberInput,
): Promise<ClubMemberSummaryDto> {
  const { targetMembership } = await getRestrictionContext(input);

  if (targetMembership.status === ClubMemberStatus.blocked) {
    validationError('Usuario ja esta bloqueado neste clube');
  }

  const shouldDecrementMemberCount =
    targetMembership.status === ClubMemberStatus.active;

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: input.targetUserId,
        },
      },
      data: {
        status: ClubMemberStatus.blocked,
        postingSuspendedUntil: null,
      },
    });

    if (shouldDecrementMemberCount) {
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
    }

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.actorId,
        targetUserId: input.targetUserId,
        action: 'club_member_blocked',
        entityType: 'club_member',
        entityId: targetMembership.id,
        metadata: {
          previousStatus: targetMembership.status,
          previousRole: targetMembership.role,
          decrementedMemberCount: shouldDecrementMemberCount,
        },
      },
    });
  });

  return getClubMemberSummary(input.clubId, input.targetUserId);
}

export async function suspendClubMemberPosting(
  input: SuspendClubMemberPostingInput,
): Promise<ClubMemberSummaryDto> {
  const suspendedUntil = normalizeSuspendedUntil(input.suspendedUntil);
  const { targetMembership } = await getRestrictionContext(input);

  if (targetMembership.status !== ClubMemberStatus.active) {
    validationError('Apenas membros ativos podem ter postagem suspensa');
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: input.targetUserId,
        },
      },
      data: {
        postingSuspendedUntil: suspendedUntil,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.actorId,
        targetUserId: input.targetUserId,
        action: 'club_member_posting_suspended',
        entityType: 'club_member',
        entityId: targetMembership.id,
        metadata: {
          suspendedUntil: suspendedUntil.toISOString(),
          previousSuspendedUntil:
            targetMembership.postingSuspendedUntil?.toISOString() ?? null,
        },
      },
    });
  });

  return getClubMemberSummary(input.clubId, input.targetUserId);
}

import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import {
  blockedMemberError,
  duplicateInviteError,
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
  validationError,
} from '../core/errors';
import { getClubPermissions } from '../core/permissions';
import { enforceClubRateLimit } from '../rate-limit.service';

const CLUB_INVITE_MESSAGE_MAX_LENGTH = 500;
const CLUB_INVITE_REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CreateClubInviteInput = {
  clubId: string;
  inviterId: string;
  inviteeId?: unknown;
  message?: unknown;
};

export type AcceptClubInviteInput = {
  inviteId: string;
  userId: string;
};

export type DeclineClubInviteInput = {
  inviteId: string;
  userId: string;
};

export type ClubInviteDto = {
  id: string;
  clubId: string;
  inviteeId: string;
  inviterId: string;
  status: ClubMemberStatus;
  message: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyClubInviteDto = ClubInviteDto & {
  club: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    iconName: string;
    avatarUrl: string | null;
    visibility: string;
    status: string;
    memberCount: number;
  };
  inviter: {
    id: string;
    name: string;
    username: string | null;
  };
};

export type ListMyClubInvitesResult = {
  items: MyClubInviteDto[];
};

function normalizeInviteeId(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    validationError('Usuario convidado e obrigatorio');
  }

  return value.trim();
}

function normalizeInviteMessage(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    validationError('Mensagem do convite deve ser texto');
  }

  const message = value.trim();

  if (message.length > CLUB_INVITE_MESSAGE_MAX_LENGTH) {
    validationError(
      `Mensagem do convite deve ter no maximo ${CLUB_INVITE_MESSAGE_MAX_LENGTH} caracteres`,
    );
  }

  return message || null;
}

function mapInvite(invite: {
  id: string;
  clubId: string;
  inviteeId: string;
  inviterId: string;
  status: ClubMemberStatus;
  message: string | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ClubInviteDto {
  return {
    id: invite.id,
    clubId: invite.clubId,
    inviteeId: invite.inviteeId,
    inviterId: invite.inviterId,
    status: invite.status,
    message: invite.message,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    declinedAt: invite.declinedAt?.toISOString() ?? null,
    cancelledAt: invite.cancelledAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
    updatedAt: invite.updatedAt.toISOString(),
  };
}

function mapMyInvite(invite: {
  id: string;
  clubId: string;
  inviteeId: string;
  inviterId: string;
  status: ClubMemberStatus;
  message: string | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  club: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    iconName: string;
    avatarUrl: string | null;
    visibility: string;
    status: string;
    memberCount: number;
  };
  inviter: {
    id: string;
    name: string;
    username: string | null;
  };
}): MyClubInviteDto {
  return {
    ...mapInvite(invite),
    club: invite.club,
    inviter: invite.inviter,
  };
}

export async function listMyClubInvites(
  userId: string,
): Promise<ListMyClubInvitesResult> {
  requireAuthenticatedUser(userId);

  const invites = await prisma.clubInvite.findMany({
    where: {
      inviteeId: userId,
      status: ClubMemberStatus.invited,
      club: {
        status: {
          not: ClubStatus.deleted,
        },
        deletedAt: null,
      },
    },
    include: {
      club: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          iconName: true,
          avatarUrl: true,
          visibility: true,
          status: true,
          memberCount: true,
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    items: invites.map(mapMyInvite),
  };
}

export async function createClubInvite(
  input: CreateClubInviteInput,
): Promise<ClubInviteDto> {
  requireAuthenticatedUser(input.inviterId);

  const inviteeId = normalizeInviteeId(input.inviteeId);
  const message = normalizeInviteMessage(input.message);

  if (inviteeId === input.inviterId) {
    validationError('Usuario nao pode convidar a si mesmo');
  }

  const permissions = await getClubPermissions(input.inviterId, input.clubId);

  if (!permissions.podeConvidar) {
    forbiddenError();
  }

  const invitee = await prisma.user.findUnique({
    where: {
      id: inviteeId,
    },
    select: {
      id: true,
    },
  });

  if (!invitee) {
    validationError('Usuario convidado nao existe');
  }

  const existingMembership = await prisma.clubMember.findUnique({
    where: {
      clubId_userId: {
        clubId: input.clubId,
        userId: inviteeId,
      },
    },
  });

  if (existingMembership?.status === ClubMemberStatus.active) {
    validationError('Usuario ja e membro ativo do clube');
  }

  if (existingMembership?.status === ClubMemberStatus.blocked) {
    blockedMemberError();
  }

  if (existingMembership?.status === ClubMemberStatus.invited) {
    validationError('Usuario ja possui convite pendente para este clube');
  }

  const existingInvite = await prisma.clubInvite.findUnique({
    where: {
      clubId_inviteeId_status: {
        clubId: input.clubId,
        inviteeId,
        status: ClubMemberStatus.invited,
      },
    },
  });

  if (existingInvite) {
    validationError('Usuario ja possui convite pendente para este clube');
  }

  const recentExistingInvite = await prisma.clubInvite.findFirst({
    where: {
      clubId: input.clubId,
      inviteeId,
      createdAt: {
        gte: new Date(Date.now() - CLUB_INVITE_REPEAT_WINDOW_MS),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (recentExistingInvite) {
    duplicateInviteError();
  }

  await enforceClubRateLimit({
    action: 'create_club_invite',
    actorId: input.inviterId,
    clubId: input.clubId,
  });

  const createdInvite = await prisma.$transaction(async (tx) => {
    const invite = await tx.clubInvite.create({
      data: {
        clubId: input.clubId,
        inviteeId,
        inviterId: input.inviterId,
        status: ClubMemberStatus.invited,
        message,
      },
    });

    await tx.clubMember.upsert({
      where: {
        clubId_userId: {
          clubId: input.clubId,
          userId: inviteeId,
        },
      },
      update: {
        role: ClubMemberRole.member,
        status: ClubMemberStatus.invited,
        invitedById: input.inviterId,
        joinedAt: null,
      },
      create: {
        clubId: input.clubId,
        userId: inviteeId,
        role: ClubMemberRole.member,
        status: ClubMemberStatus.invited,
        invitedById: input.inviterId,
        joinedAt: null,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.inviterId,
        targetUserId: inviteeId,
        action: 'club_invite_created',
        entityType: 'club_invite',
        entityId: invite.id,
        metadata: {
          status: ClubMemberStatus.invited,
          hasMessage: Boolean(message),
        },
      },
    });

    return invite;
  });

  return mapInvite(createdInvite);
}

export async function acceptClubInvite(
  input: AcceptClubInviteInput,
): Promise<ClubInviteDto> {
  requireAuthenticatedUser(input.userId);

  if (!input.inviteId) {
    notFoundError();
  }

  const invite = await prisma.clubInvite.findUnique({
    where: {
      id: input.inviteId,
    },
    include: {
      club: true,
    },
  });

  if (!invite) {
    notFoundError();
  }

  if (invite.inviteeId !== input.userId) {
    forbiddenError();
  }

  if (invite.status !== ClubMemberStatus.invited) {
    validationError('Apenas convites pendentes podem ser aceitos');
  }

  if (invite.club.status === ClubStatus.deleted || invite.club.deletedAt) {
    notFoundError();
  }

  if (invite.club.status !== ClubStatus.active) {
    validationError('Apenas convites de clubes ativos podem ser aceitos');
  }

  const now = new Date();

  const acceptedInvite = await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: invite.clubId,
          userId: input.userId,
        },
      },
    });

    if (existingMembership?.status === ClubMemberStatus.blocked) {
      blockedMemberError();
    }

    const shouldIncrementMemberCount =
      existingMembership?.status !== ClubMemberStatus.active;

    const updatedInvite = await tx.clubInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: ClubMemberStatus.active,
        acceptedAt: now,
      },
    });

    await tx.clubMember.upsert({
      where: {
        clubId_userId: {
          clubId: invite.clubId,
          userId: input.userId,
        },
      },
      update: {
        role:
          existingMembership?.role === ClubMemberRole.owner
            ? ClubMemberRole.owner
            : ClubMemberRole.member,
        status: ClubMemberStatus.active,
        invitedById: invite.inviterId,
        joinedAt: existingMembership?.joinedAt ?? now,
      },
      create: {
        clubId: invite.clubId,
        userId: input.userId,
        role: ClubMemberRole.member,
        status: ClubMemberStatus.active,
        invitedById: invite.inviterId,
        joinedAt: now,
      },
    });

    await tx.club.update({
      where: {
        id: invite.clubId,
      },
      data: {
        memberCount: shouldIncrementMemberCount
          ? {
              increment: 1,
            }
          : undefined,
        lastActivityAt: now,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: invite.clubId,
        actorId: input.userId,
        targetUserId: input.userId,
        action: 'club_invite_accepted',
        entityType: 'club_invite',
        entityId: invite.id,
        metadata: {
          inviterId: invite.inviterId,
          incrementedMemberCount: shouldIncrementMemberCount,
        },
      },
    });

    return updatedInvite;
  });

  return mapInvite(acceptedInvite);
}

export async function declineClubInvite(
  input: DeclineClubInviteInput,
): Promise<ClubInviteDto> {
  requireAuthenticatedUser(input.userId);

  if (!input.inviteId) {
    notFoundError();
  }

  const invite = await prisma.clubInvite.findUnique({
    where: {
      id: input.inviteId,
    },
    include: {
      club: true,
    },
  });

  if (!invite) {
    notFoundError();
  }

  if (invite.inviteeId !== input.userId) {
    forbiddenError();
  }

  if (invite.status !== ClubMemberStatus.invited) {
    validationError('Apenas convites pendentes podem ser recusados');
  }

  if (invite.club.status === ClubStatus.deleted || invite.club.deletedAt) {
    notFoundError();
  }

  const now = new Date();

  const declinedInvite = await prisma.$transaction(async (tx) => {
    const updatedInvite = await tx.clubInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: ClubMemberStatus.removed,
        declinedAt: now,
      },
    });

    await tx.clubMember.updateMany({
      where: {
        clubId: invite.clubId,
        userId: input.userId,
        status: ClubMemberStatus.invited,
      },
      data: {
        status: ClubMemberStatus.removed,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: invite.clubId,
        actorId: input.userId,
        targetUserId: input.userId,
        action: 'club_invite_declined',
        entityType: 'club_invite',
        entityId: invite.id,
        metadata: {
          inviterId: invite.inviterId,
        },
      },
    });

    return updatedInvite;
  });

  return mapInvite(declinedInvite);
}

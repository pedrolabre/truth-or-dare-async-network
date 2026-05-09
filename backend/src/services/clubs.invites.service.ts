import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
} from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  requireAuthenticatedUser,
  validationError,
} from './clubs.errors';
import { getClubPermissions } from './clubs.permissions';

const CLUB_INVITE_MESSAGE_MAX_LENGTH = 500;

export type CreateClubInviteInput = {
  clubId: string;
  inviterId: string;
  inviteeId?: unknown;
  message?: unknown;
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

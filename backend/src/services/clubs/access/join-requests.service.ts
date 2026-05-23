import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubStatus,
  ClubVisibility,
} from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import {
  blockedMemberError,
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
  validationError,
} from '../core/errors';
import { getClubPermissions } from '../core/permissions';
import { getClubWithMembers } from '../core/repository';

const JOIN_REQUEST_MESSAGE_MAX_LENGTH = 500;

export type RequestToJoinClubInput = {
  clubId: string;
  userId: string;
  message?: unknown;
};

export type ReviewClubJoinRequestInput = {
  requestId: string;
  reviewerId: string;
};

export type ClubJoinRequestDto = {
  id: string;
  clubId: string;
  userId: string;
  status: ClubMemberStatus;
  message: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function normalizeJoinRequestMessage(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    validationError('Mensagem da solicitacao deve ser texto');
  }

  const message = value.trim();

  if (message.length > JOIN_REQUEST_MESSAGE_MAX_LENGTH) {
    validationError(
      `Mensagem da solicitacao deve ter no maximo ${JOIN_REQUEST_MESSAGE_MAX_LENGTH} caracteres`,
    );
  }

  return message || null;
}

function mapJoinRequest(request: {
  id: string;
  clubId: string;
  userId: string;
  status: ClubMemberStatus;
  message: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ClubJoinRequestDto {
  return {
    id: request.id,
    clubId: request.clubId,
    userId: request.userId,
    status: request.status,
    message: request.message,
    reviewedById: request.reviewedById,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    approvedAt: request.approvedAt?.toISOString() ?? null,
    rejectedAt: request.rejectedAt?.toISOString() ?? null,
    cancelledAt: request.cancelledAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

async function getPendingJoinRequest(requestId: string) {
  if (!requestId) {
    notFoundError();
  }

  const joinRequest = await prisma.clubJoinRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      club: true,
    },
  });

  if (!joinRequest || joinRequest.club.status === ClubStatus.deleted || joinRequest.club.deletedAt) {
    notFoundError();
  }

  if (joinRequest.status !== ClubMemberStatus.requested) {
    validationError('Apenas solicitacoes pendentes podem ser revisadas');
  }

  if (joinRequest.club.status !== ClubStatus.active) {
    validationError('Apenas solicitacoes de clubes ativos podem ser revisadas');
  }

  return joinRequest;
}

async function ensureCanReviewJoinRequest(clubId: string, reviewerId: string) {
  const permissions = await getClubPermissions(reviewerId, clubId);

  if (!permissions.podeConvidar) {
    forbiddenError();
  }
}

export async function requestToJoinClub(
  input: RequestToJoinClubInput,
): Promise<ClubJoinRequestDto> {
  requireAuthenticatedUser(input.userId);

  const message = normalizeJoinRequestMessage(input.message);
  const club = await getClubWithMembers(input.clubId);

  if (club.status !== ClubStatus.active) {
    validationError('Apenas clubes ativos aceitam solicitacao de entrada');
  }

  if (club.visibility !== ClubVisibility.private) {
    validationError('Apenas clubes privados aceitam solicitacao de entrada');
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

  if (existingMembership?.status === ClubMemberStatus.requested) {
    validationError('Usuario ja possui solicitacao pendente para este clube');
  }

  const existingRequest = await prisma.clubJoinRequest.findUnique({
    where: {
      clubId_userId_status: {
        clubId: input.clubId,
        userId: input.userId,
        status: ClubMemberStatus.requested,
      },
    },
  });

  if (existingRequest) {
    validationError('Usuario ja possui solicitacao pendente para este clube');
  }

  const reusableRequest = await prisma.clubJoinRequest.findFirst({
    where: {
      clubId: input.clubId,
      userId: input.userId,
      status: {
        in: [ClubMemberStatus.active, ClubMemberStatus.removed],
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const createdRequest = await prisma.$transaction(async (tx) => {
    const request = reusableRequest
      ? await tx.clubJoinRequest.update({
          where: {
            id: reusableRequest.id,
          },
          data: {
            status: ClubMemberStatus.requested,
            message,
            reviewedById: null,
            reviewedAt: null,
            approvedAt: null,
            rejectedAt: null,
            cancelledAt: null,
          },
        })
      : await tx.clubJoinRequest.create({
          data: {
            clubId: input.clubId,
            userId: input.userId,
            status: ClubMemberStatus.requested,
            message,
          },
        });

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
        status: ClubMemberStatus.requested,
        joinedAt: null,
      },
      create: {
        clubId: input.clubId,
        userId: input.userId,
        role: ClubMemberRole.member,
        status: ClubMemberStatus.requested,
        joinedAt: null,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.userId,
        targetUserId: input.userId,
        action: 'club_join_requested',
        entityType: 'club_join_request',
        entityId: request.id,
        metadata: {
          hasMessage: Boolean(message),
          previousStatus: existingMembership?.status ?? null,
          reusedRequestId: reusableRequest?.id ?? null,
        },
      },
    });

    return request;
  });

  return mapJoinRequest(createdRequest);
}

export async function approveClubJoinRequest(
  input: ReviewClubJoinRequestInput,
): Promise<ClubJoinRequestDto> {
  requireAuthenticatedUser(input.reviewerId);

  const joinRequest = await getPendingJoinRequest(input.requestId);
  await ensureCanReviewJoinRequest(joinRequest.clubId, input.reviewerId);

  const now = new Date();

  const approvedRequest = await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: joinRequest.clubId,
          userId: joinRequest.userId,
        },
      },
    });

    if (existingMembership?.status === ClubMemberStatus.blocked) {
      blockedMemberError();
    }

    const shouldIncrementMemberCount =
      existingMembership?.status !== ClubMemberStatus.active;

    const updatedRequest = await tx.clubJoinRequest.update({
      where: {
        id: joinRequest.id,
      },
      data: {
        status: ClubMemberStatus.active,
        reviewedById: input.reviewerId,
        reviewedAt: now,
        approvedAt: now,
      },
    });

    await tx.clubMember.upsert({
      where: {
        clubId_userId: {
          clubId: joinRequest.clubId,
          userId: joinRequest.userId,
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
        clubId: joinRequest.clubId,
        userId: joinRequest.userId,
        role: ClubMemberRole.member,
        status: ClubMemberStatus.active,
        joinedAt: now,
      },
    });

    await tx.club.update({
      where: {
        id: joinRequest.clubId,
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
        clubId: joinRequest.clubId,
        actorId: input.reviewerId,
        targetUserId: joinRequest.userId,
        action: 'club_join_request_approved',
        entityType: 'club_join_request',
        entityId: joinRequest.id,
        metadata: {
          incrementedMemberCount: shouldIncrementMemberCount,
        },
      },
    });

    return updatedRequest;
  });

  return mapJoinRequest(approvedRequest);
}

export async function rejectClubJoinRequest(
  input: ReviewClubJoinRequestInput,
): Promise<ClubJoinRequestDto> {
  requireAuthenticatedUser(input.reviewerId);

  const joinRequest = await getPendingJoinRequest(input.requestId);
  await ensureCanReviewJoinRequest(joinRequest.clubId, input.reviewerId);

  const now = new Date();

  const rejectedRequest = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.clubJoinRequest.update({
      where: {
        id: joinRequest.id,
      },
      data: {
        status: ClubMemberStatus.removed,
        reviewedById: input.reviewerId,
        reviewedAt: now,
        rejectedAt: now,
      },
    });

    await tx.clubMember.updateMany({
      where: {
        clubId: joinRequest.clubId,
        userId: joinRequest.userId,
        status: ClubMemberStatus.requested,
      },
      data: {
        status: ClubMemberStatus.removed,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: joinRequest.clubId,
        actorId: input.reviewerId,
        targetUserId: joinRequest.userId,
        action: 'club_join_request_rejected',
        entityType: 'club_join_request',
        entityId: joinRequest.id,
      },
    });

    return updatedRequest;
  });

  return mapJoinRequest(rejectedRequest);
}

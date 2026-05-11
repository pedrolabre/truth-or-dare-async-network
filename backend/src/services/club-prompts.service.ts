import {
  ClubMemberRole,
  ClubMemberStatus,
  ClubPromptStatus,
  ClubStatus,
  Prisma,
} from '../generated/prisma/client';
import {
  ClubPromptDetailDto,
  ClubPromptSummaryDto,
} from '../dtos/clubs.dto';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
} from './clubs.errors';
import { mapPromptDetail, mapPromptSummary } from './club-prompts.mappers';
import {
  buildPromptViewerState,
  canViewPromptClub,
  getActivePromptMembership,
  isPromptManagerRole,
} from './club-prompts.permissions';
import {
  normalizeAttachments,
  normalizeBoolean,
  normalizeContent,
  normalizeDifficulty,
  normalizeMaxAttempts,
  normalizeOptionalDate,
  normalizePromptType,
} from './club-prompts.validators';

type CreateClubPromptInput = {
  clubId: string;
  authorId: string;
  type: unknown;
  content: unknown;
  maxAttempts?: unknown;
  expiresAt?: unknown;
  difficulty?: unknown;
  attachments?: unknown;
  isPinned?: unknown;
  isMembersOnly?: unknown;
};

type GetClubPromptDetailInput = {
  clubId: string;
  promptId: string;
  viewerId: string;
};

export async function createClubPrompt(
  input: CreateClubPromptInput,
): Promise<ClubPromptSummaryDto> {
  requireAuthenticatedUser(input.authorId);

  if (!input.clubId) {
    notFoundError();
  }

  const club = await prisma.club.findUnique({
    where: {
      id: input.clubId,
    },
    include: {
      members: {
        where: {
          userId: input.authorId,
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  const membership = club.members[0];
  const isActiveMember = membership?.status === ClubMemberStatus.active;

  if (club.status !== ClubStatus.active || !isActiveMember) {
    forbiddenError();
  }

  const type = normalizePromptType(input.type);
  const content = normalizeContent(input.content);
  const maxAttempts = normalizeMaxAttempts(input.maxAttempts, type);
  const expiresAt = normalizeOptionalDate(input.expiresAt);
  const difficulty = normalizeDifficulty(input.difficulty);
  const attachments = normalizeAttachments(input.attachments);
  const isPinned = normalizeBoolean(input.isPinned, false);
  const isMembersOnly = normalizeBoolean(input.isMembersOnly, true);
  const canPin =
    isPromptManagerRole(membership.role);

  if (isPinned && !canPin) {
    forbiddenError();
  }

  const now = new Date();

  const promptId = await prisma.$transaction(async (tx) => {
    const createdPrompt = await tx.clubPrompt.create({
      data: {
        clubId: input.clubId,
        authorId: input.authorId,
        type,
        status: ClubPromptStatus.published,
        content,
        maxAttempts,
        expiresAt,
        difficulty,
        attachments: attachments ?? Prisma.JsonNull,
        isPinned,
        isMembersOnly,
        publishedAt: now,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    await tx.club.update({
      where: {
        id: input.clubId,
      },
      data: {
        promptCount: {
          increment: 1,
        },
        lastActivityAt: now,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId: input.clubId,
        actorId: input.authorId,
        action: 'club_prompt_created',
        entityType: 'club_prompt',
        entityId: createdPrompt.id,
        metadata: {
          type,
          isPinned,
        },
      },
    });

    return createdPrompt.id;
  });

  const prompt = await prisma.clubPrompt.findUniqueOrThrow({
    where: {
      id: promptId,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  return mapPromptSummary(prompt);
}

export async function getClubPromptDetail({
  clubId,
  promptId,
  viewerId,
}: GetClubPromptDetailInput): Promise<ClubPromptDetailDto> {
  requireAuthenticatedUser(viewerId);

  if (!clubId || !promptId) {
    notFoundError();
  }

  const club = await prisma.club.findUnique({
    where: {
      id: clubId,
    },
    include: {
      members: {
        where: {
          OR: [
            {
              userId: viewerId,
            },
          ],
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  const membership = getActivePromptMembership(club.members, viewerId);

  if (!canViewPromptClub(club, membership)) {
    forbiddenError();
  }

  const prompt = await prisma.clubPrompt.findFirst({
    where: {
      id: promptId,
      clubId,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      responses: {
        where: {
          removedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!prompt) {
    notFoundError();
  }

  const [likedByMe, answeredByMe] = await Promise.all([
    prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: viewerId,
          targetId: prompt.id,
          targetType: 'club_prompt',
        },
      },
    }),
    prisma.clubPromptResponse.findFirst({
      where: {
        promptId: prompt.id,
        userId: viewerId,
        removedAt: null,
      },
      select: {
        id: true,
      },
    }),
  ]);

  const viewerState = buildPromptViewerState({
    club,
    prompt,
    membership,
    viewerId,
    likedByMe: Boolean(likedByMe),
    answeredByMe: Boolean(answeredByMe),
  });

  return mapPromptDetail(prompt, viewerState);
}

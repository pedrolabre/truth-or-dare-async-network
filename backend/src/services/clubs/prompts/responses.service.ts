import {
  ClubPromptType,
  ClubStatus,
} from '../../../generated/prisma/client';
import { ClubPromptResponseSummaryDto } from '../../../dtos/clubs.dto';
import { prisma } from '../../../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
  validationError,
} from '../core/errors';
import { mapPromptResponseSummary } from './mappers';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from './permissions';
import {
  normalizePromptResponseMediaType,
  normalizePromptResponseMediaUrl,
  normalizePromptResponseText,
} from './interactions.validators';

type CreateClubPromptResponseInput = {
  clubId: string;
  promptId: string;
  userId: string;
  text?: unknown;
  mediaUrl?: unknown;
  mediaType?: unknown;
  dareProofId?: unknown;
};

function normalizeDareProofId(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    validationError('Prova vinculada invalida');
  }

  const dareProofId = value.trim();

  return dareProofId || null;
}

export async function createClubPromptResponse({
  clubId,
  promptId,
  userId,
  text,
  mediaUrl,
  mediaType,
  dareProofId,
}: CreateClubPromptResponseInput): Promise<ClubPromptResponseSummaryDto> {
  requireAuthenticatedUser(userId);

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
          userId,
        },
      },
    },
  });

  if (!club || club.status === ClubStatus.deleted || club.deletedAt) {
    notFoundError();
  }

  const prompt = await prisma.clubPrompt.findFirst({
    where: {
      id: promptId,
      clubId,
    },
  });

  if (!prompt) {
    notFoundError();
  }

  const membership = getActivePromptMembership(club.members, userId);

  if (!canAnswerPrompt({ club, prompt, membership })) {
    forbiddenError();
  }

  if (prompt.expiresAt && prompt.expiresAt.getTime() <= Date.now()) {
    forbiddenError();
  }

  const isDare = prompt.type === ClubPromptType.dare;
  const normalizedText = normalizePromptResponseText(text, !isDare);
  const normalizedMediaUrl = normalizePromptResponseMediaUrl(mediaUrl, isDare);
  const normalizedMediaType = normalizePromptResponseMediaType(mediaType, isDare);
  const normalizedDareProofId = normalizeDareProofId(dareProofId);

  const previousResponses = await prisma.clubPromptResponse.count({
    where: {
      promptId: prompt.id,
      userId,
      removedAt: null,
    },
  });

  if (!isDare && previousResponses > 0) {
    validationError('Prompt de verdade ja respondido por este usuario');
  }

  if (
    isDare &&
    prompt.maxAttempts !== null &&
    previousResponses >= prompt.maxAttempts
  ) {
    validationError('Desafio sem tentativas disponiveis');
  }

  const now = new Date();
  const responseId = await prisma.$transaction(async (tx) => {
    const createdResponse = await tx.clubPromptResponse.create({
      data: {
        clubId,
        promptId: prompt.id,
        userId,
        text: normalizedText,
        mediaUrl: normalizedMediaUrl,
        mediaType: normalizedMediaType,
        dareProofId: normalizedDareProofId,
        attemptsUsed: isDare ? previousResponses + 1 : 0,
        completedAt: now,
      },
    });

    await tx.clubPrompt.update({
      where: {
        id: prompt.id,
      },
      data: {
        answersCount: {
          increment: 1,
        },
      },
    });

    await tx.club.update({
      where: {
        id: clubId,
      },
      data: {
        lastActivityAt: now,
      },
    });

    await tx.clubAuditLog.create({
      data: {
        clubId,
        actorId: userId,
        action: 'club_prompt_response_created',
        entityType: 'club_prompt_response',
        entityId: createdResponse.id,
        metadata: {
          promptId: prompt.id,
          type: prompt.type,
          attemptsUsed: createdResponse.attemptsUsed,
        },
      },
    });

    return createdResponse.id;
  });

  const response = await prisma.clubPromptResponse.findUniqueOrThrow({
    where: {
      id: responseId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return mapPromptResponseSummary(response);
}

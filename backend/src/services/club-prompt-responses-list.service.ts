import { ClubPromptResponsesPageDto } from '../dtos/clubs.dto';
import { ClubStatus } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
} from './clubs.errors';
import { mapPromptResponseSummary } from './club-prompts.mappers';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from './club-prompts.permissions';

const DEFAULT_RESPONSES_PAGE = 1;
const DEFAULT_RESPONSES_LIMIT = 20;
const MAX_RESPONSES_LIMIT = 50;

type ListClubPromptResponsesInput = {
  clubId: string;
  promptId: string;
  viewerId: string;
  page?: unknown;
  limit?: unknown;
  sort?: unknown;
};

function normalizePositiveInteger(value: unknown, defaultValue: number) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return parsed;
}

function normalizePage(value: unknown) {
  return normalizePositiveInteger(value, DEFAULT_RESPONSES_PAGE);
}

function normalizeLimit(value: unknown) {
  return Math.min(
    normalizePositiveInteger(value, DEFAULT_RESPONSES_LIMIT),
    MAX_RESPONSES_LIMIT,
  );
}

function normalizeSort(value: unknown) {
  return value === 'oldest' ? 'asc' : 'desc';
}

export async function listClubPromptResponses({
  clubId,
  promptId,
  viewerId,
  page,
  limit,
  sort,
}: ListClubPromptResponsesInput): Promise<ClubPromptResponsesPageDto> {
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
          userId: viewerId,
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

  const membership = getActivePromptMembership(club.members, viewerId);

  if (!canAnswerPrompt({ club, prompt, membership })) {
    forbiddenError();
  }

  const normalizedPage = normalizePage(page);
  const normalizedLimit = normalizeLimit(limit);
  const orderDirection = normalizeSort(sort);
  const where = {
    promptId: prompt.id,
    removedAt: null,
  };

  const [total, responses] = await Promise.all([
    prisma.clubPromptResponse.count({
      where,
    }),
    prisma.clubPromptResponse.findMany({
      where,
      orderBy: {
        createdAt: orderDirection,
      },
      skip: (normalizedPage - 1) * normalizedLimit,
      take: normalizedLimit,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    items: responses.map(mapPromptResponseSummary),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
}

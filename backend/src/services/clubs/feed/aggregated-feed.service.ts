import {
  ClubFeedPromptItemDto,
  ClubsAggregatedFeedDto,
  ClubsAggregatedFeedItemDto,
} from '../../../dtos/clubs.dto';
import {
  ClubMemberStatus,
  ClubPromptStatus,
  ClubStatus,
  LikeTargetType,
} from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import { requireAuthenticatedUser } from '../core/errors';
import { mapSummary } from '../core/mappers';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from '../prompts/permissions';
import {
  mapPromptResponseSummary,
  mapPromptSummary,
} from '../prompts/mappers';
import {
  buildCursorPaginationResult,
  normalizeCursorPagination,
  paginateRecordsInMemory,
} from '../../pagination';

const AGGREGATED_FEED_DEFAULT_LIMIT = 30;
const AGGREGATED_FEED_MAX_LIMIT = 50;
const RECENT_RESPONSES_PER_PROMPT_LIMIT = 3;

type GetClubsAggregatedFeedInput = {
  viewerId: string;
  limit?: unknown;
  cursor?: unknown;
};

type PromptPermissionTarget = Parameters<
  typeof canAnswerPrompt
>[0]['prompt'] & {
  expiresAt: Date | null;
};

function canInteractWithPrompt({
  club,
  prompt,
  membership,
}: {
  club: Parameters<typeof canAnswerPrompt>[0]['club'];
  prompt: PromptPermissionTarget;
  membership: Parameters<typeof canAnswerPrompt>[0]['membership'];
}) {
  return (
    canAnswerPrompt({
      club,
      prompt,
      membership,
    }) &&
    (!prompt.expiresAt || prompt.expiresAt.getTime() > Date.now())
  );
}

export async function getClubsAggregatedFeed({
  viewerId,
  limit,
  cursor,
}: GetClubsAggregatedFeedInput): Promise<ClubsAggregatedFeedDto> {
  requireAuthenticatedUser(viewerId);
  const pagination = normalizeCursorPagination(
    {
      limit,
      cursor,
    },
    {
      defaultLimit: AGGREGATED_FEED_DEFAULT_LIMIT,
      maxLimit: AGGREGATED_FEED_MAX_LIMIT,
    },
  );
  const candidateLimit = pagination.limit * 2 + 1;

  const memberships = await prisma.clubMember.findMany({
    where: {
      userId: viewerId,
      status: ClubMemberStatus.active,
      club: {
        status: ClubStatus.active,
        deletedAt: null,
      },
    },
    select: {
      clubId: true,
    },
  });
  const clubIds = memberships.map((membership) => membership.clubId);

  if (clubIds.length === 0) {
    return {
      items: [],
      nextCursor: null,
    };
  }

  const prompts = await prisma.clubPrompt.findMany({
    where: {
      clubId: {
        in: clubIds,
      },
      status: ClubPromptStatus.published,
      archivedAt: null,
      removedAt: null,
    },
    orderBy: [
      {
        publishedAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
    take: candidateLimit,
    include: {
      club: {
        include: {
          members: {
            where: {
              userId: viewerId,
            },
          },
        },
      },
      author: {
        select: {
          name: true,
        },
      },
      responses: {
        where: {
          archivedAt: null,
          removedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: RECENT_RESPONSES_PER_PROMPT_LIMIT,
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

  const responses = await prisma.clubPromptResponse.findMany({
    where: {
      clubId: {
        in: clubIds,
      },
      archivedAt: null,
      removedAt: null,
      prompt: {
        clubId: {
          in: clubIds,
        },
        status: ClubPromptStatus.published,
        archivedAt: null,
        removedAt: null,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: candidateLimit,
    include: {
      club: {
        include: {
          members: {
            where: {
              userId: viewerId,
            },
          },
        },
      },
      prompt: {
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  const promptIds = prompts.map((prompt) => prompt.id);
  const [likedPromptIds, answeredPromptIds] = await Promise.all([
    prisma.like.findMany({
      where: {
        userId: viewerId,
        targetType: LikeTargetType.club_prompt,
        targetId: {
          in: promptIds,
        },
      },
      select: {
        targetId: true,
      },
    }),
    prisma.clubPromptResponse.findMany({
      where: {
        userId: viewerId,
        promptId: {
          in: promptIds,
        },
        archivedAt: null,
        removedAt: null,
      },
      select: {
        promptId: true,
      },
    }),
  ]);

  const likedPromptIdSet = new Set(
    likedPromptIds.map((like) => like.targetId),
  );
  const answeredPromptIdSet = new Set(
    answeredPromptIds.map((response) => response.promptId),
  );

  const promptItems: ClubsAggregatedFeedItemDto[] = prompts.map((prompt) => {
    const membership = getActivePromptMembership(prompt.club.members, viewerId);
    const promptItem: ClubFeedPromptItemDto = {
      ...mapPromptSummary(prompt),
      viewerState: {
        likedByMe: likedPromptIdSet.has(prompt.id),
        answeredByMe: answeredPromptIdSet.has(prompt.id),
        canAnswer: canInteractWithPrompt({
          club: prompt.club,
          prompt,
          membership,
        }),
      },
      recentResponses: prompt.responses.map(mapPromptResponseSummary),
    };

    return {
      id: `prompt:${prompt.id}`,
      activityType: 'prompt',
      activityAt: (prompt.publishedAt ?? prompt.createdAt).toISOString(),
      club: mapSummary(prompt.club, viewerId),
      prompt: promptItem,
    };
  });

  const responseItems: ClubsAggregatedFeedItemDto[] = responses.map(
    (response) => ({
      id: `response:${response.id}`,
      activityType: 'response',
      activityAt: response.createdAt.toISOString(),
      club: mapSummary(response.club, viewerId),
      prompt: mapPromptSummary(response.prompt),
      response: mapPromptResponseSummary(response),
    }),
  );

  const sortedItems = [...promptItems, ...responseItems].sort(
    (first, second) => {
      const dateDiff =
        new Date(second.activityAt).getTime() -
        new Date(first.activityAt).getTime();

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return first.id.localeCompare(second.id);
    },
  );
  const page = pagination.cursor
    ? paginateRecordsInMemory(sortedItems, pagination)
    : buildCursorPaginationResult(sortedItems, pagination.limit);

  return {
    items: page.items,
    nextCursor: page.nextCursor,
  };
}

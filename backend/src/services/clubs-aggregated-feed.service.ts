import {
  ClubFeedPromptItemDto,
  ClubsAggregatedFeedDto,
  ClubsAggregatedFeedItemDto,
} from '../dtos/clubs.dto';
import {
  ClubMemberStatus,
  ClubPromptStatus,
  ClubStatus,
  LikeTargetType,
} from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuthenticatedUser } from './clubs.errors';
import { mapSummary } from './clubs.mappers';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from './club-prompts.permissions';
import {
  mapPromptResponseSummary,
  mapPromptSummary,
} from './club-prompts.mappers';

const AGGREGATED_PROMPTS_LIMIT = 20;
const AGGREGATED_RESPONSES_LIMIT = 20;
const AGGREGATED_FEED_LIMIT = 30;
const RECENT_RESPONSES_PER_PROMPT_LIMIT = 3;

type GetClubsAggregatedFeedInput = {
  viewerId: string;
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
}: GetClubsAggregatedFeedInput): Promise<ClubsAggregatedFeedDto> {
  requireAuthenticatedUser(viewerId);

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
    take: AGGREGATED_PROMPTS_LIMIT,
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
    take: AGGREGATED_RESPONSES_LIMIT,
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

  return {
    items: [...promptItems, ...responseItems]
      .sort(
        (first, second) =>
          new Date(second.activityAt).getTime() -
          new Date(first.activityAt).getTime(),
      )
      .slice(0, AGGREGATED_FEED_LIMIT),
  };
}

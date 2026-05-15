import {
  ClubFeedDto,
  ClubFeedPromptItemDto,
} from '../dtos/clubs.dto';
import {
  ClubPromptStatus,
  ClubStatus,
  ClubVisibility,
  LikeTargetType,
} from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import {
  forbiddenError,
  notFoundError,
  requireAuthenticatedUser,
} from './clubs.errors';
import { mapSummary } from './clubs.mappers';
import {
  canAnswerPrompt,
  getActivePromptMembership,
} from './club-prompts.permissions';
import {
  buildClubFeedPromptOrderBy,
  normalizeClubFeedOrder,
} from './club-feed-ordering';
import {
  mapPromptResponseSummary,
  mapPromptSummary,
} from './club-prompts.mappers';

const CLUB_FEED_PROMPTS_LIMIT = 20;
const CLUB_FEED_RECENT_RESPONSES_LIMIT = 3;

type GetClubFeedInput = {
  clubId: string;
  viewerId: string;
  order?: unknown;
};

type ClubFeedPromptPermissionTarget = Parameters<
  typeof canAnswerPrompt
>[0]['prompt'] & {
  expiresAt: Date | null;
};

function canViewClubFeed({
  club,
  hasActiveMembership,
  hasInactiveMembership,
}: {
  club: {
    status: ClubStatus;
    visibility: ClubVisibility;
  };
  hasActiveMembership: boolean;
  hasInactiveMembership: boolean;
}) {
  return (
    club.status === ClubStatus.active &&
    !hasInactiveMembership &&
    (club.visibility === ClubVisibility.public || hasActiveMembership)
  );
}

function canInteractWithPrompt({
  club,
  prompt,
  membership,
}: {
  club: Parameters<typeof canAnswerPrompt>[0]['club'];
  prompt: ClubFeedPromptPermissionTarget;
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

export async function getClubFeed({
  clubId,
  viewerId,
  order,
}: GetClubFeedInput): Promise<ClubFeedDto> {
  requireAuthenticatedUser(viewerId);

  if (!clubId) {
    notFoundError();
  }

  const normalizedOrder = normalizeClubFeedOrder(order);

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

  const membership = getActivePromptMembership(club.members, viewerId);
  const hasInactiveMembership =
    Boolean(club.members[0]) && !Boolean(membership);

  if (
    !canViewClubFeed({
      club,
      hasActiveMembership: Boolean(membership),
      hasInactiveMembership,
    })
  ) {
    forbiddenError();
  }

  const prompts = await prisma.clubPrompt.findMany({
    where: {
      clubId,
      status: ClubPromptStatus.published,
      archivedAt: null,
      removedAt: null,
    },
    orderBy: buildClubFeedPromptOrderBy(normalizedOrder),
    take: CLUB_FEED_PROMPTS_LIMIT,
    include: {
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
        take: CLUB_FEED_RECENT_RESPONSES_LIMIT,
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

  const items: ClubFeedPromptItemDto[] = prompts.map((prompt) => ({
    ...mapPromptSummary(prompt),
    viewerState: {
      likedByMe: likedPromptIdSet.has(prompt.id),
      answeredByMe: answeredPromptIdSet.has(prompt.id),
      canAnswer: canInteractWithPrompt({
        club,
        prompt,
        membership,
      }),
    },
    recentResponses: prompt.responses.map(mapPromptResponseSummary),
  }));

  return {
    club: mapSummary(club, viewerId),
    items,
  };
}

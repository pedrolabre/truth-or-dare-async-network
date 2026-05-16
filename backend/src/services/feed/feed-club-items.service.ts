import {
  ClubMemberStatus,
  ClubPromptStatus,
  ClubStatus,
  ClubVisibility,
  LikeTargetType,
} from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export type FeedClubItem = {
  id: string;
  type: 'club';
  clubName: string;
  badge: 'Verdade' | 'Desafio';
  quote: string;
  answersCount: number;
  likesCount: number;
  likedByMe: boolean;
};

const FEED_CLUB_ITEMS_LIMIT = 10;
const FEED_CLUB_PROMPT_CANDIDATES_LIMIT = 30;

type ProjectableClubPrompt = {
  isMembersOnly: boolean;
  club: {
    visibility: ClubVisibility;
    members: {
      status: ClubMemberStatus;
    }[];
  };
};

function canProjectClubPrompt(prompt: ProjectableClubPrompt) {
  const membership = prompt.club.members[0];
  const hasActiveMembership = membership?.status === ClubMemberStatus.active;
  const hasInactiveMembership = Boolean(membership) && !hasActiveMembership;

  if (hasInactiveMembership) {
    return false;
  }

  if (hasActiveMembership) {
    return true;
  }

  return (
    prompt.club.visibility === ClubVisibility.public &&
    !prompt.isMembersOnly
  );
}

export async function getFeedClubItems(userId?: string): Promise<FeedClubItem[]> {
  if (!userId) {
    return [];
  }

  const now = new Date();
  const prompts = await prisma.clubPrompt.findMany({
    where: {
      status: ClubPromptStatus.published,
      archivedAt: null,
      removedAt: null,
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gt: now,
          },
        },
      ],
      club: {
        status: ClubStatus.active,
        deletedAt: null,
      },
    },
    orderBy: [
      {
        publishedAt: {
          sort: 'desc',
          nulls: 'last',
        },
      },
      {
        createdAt: 'desc',
      },
    ],
    take: FEED_CLUB_PROMPT_CANDIDATES_LIMIT,
    select: {
      id: true,
      type: true,
      content: true,
      answersCount: true,
      likesCount: true,
      isMembersOnly: true,
      club: {
        select: {
          name: true,
          visibility: true,
          members: {
            where: {
              userId,
            },
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  const projectedPrompts = prompts
    .filter(canProjectClubPrompt)
    .slice(0, FEED_CLUB_ITEMS_LIMIT);
  const promptIds = projectedPrompts.map((prompt) => prompt.id);

  if (promptIds.length === 0) {
    return [];
  }

  const likedPromptIds = await prisma.like.findMany({
    where: {
      userId,
      targetType: LikeTargetType.club_prompt,
      targetId: {
        in: promptIds,
      },
    },
    select: {
      targetId: true,
    },
  });
  const likedPromptIdSet = new Set(
    likedPromptIds.map((like) => like.targetId),
  );

  return projectedPrompts.map((prompt) => ({
    id: prompt.id,
    type: 'club',
    clubName: prompt.club.name,
    badge: prompt.type === 'truth' ? 'Verdade' : 'Desafio',
    quote: prompt.content,
    answersCount: prompt.answersCount,
    likesCount: prompt.likesCount,
    likedByMe: likedPromptIdSet.has(prompt.id),
  }));
}

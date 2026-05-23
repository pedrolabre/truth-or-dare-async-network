import {
  ClubMemberRole,
  ClubMemberStatus,
} from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

type RecipientOptions = {
  clubId: string;
  excludeUserIds?: string[];
  roles?: ClubMemberRole[];
  respectMute?: boolean;
};

type SingleRecipientOptions = {
  clubId: string;
  userId: string;
  respectMute?: boolean;
};

const MENTION_PATTERN = /@([a-zA-Z0-9_.-]{1,30})/g;

export function isClubMembershipMuted(
  mutedUntil: Date | null | undefined,
  now = new Date(),
) {
  return Boolean(mutedUntil && mutedUntil.getTime() > now.getTime());
}

function mutedWhere(respectMute: boolean) {
  if (!respectMute) {
    return {};
  }

  return {
    OR: [
      {
        mutedUntil: null,
      },
      {
        mutedUntil: {
          lte: new Date(),
        },
      },
    ],
  };
}

export async function listEligibleClubRecipientIds({
  clubId,
  excludeUserIds = [],
  roles,
  respectMute = true,
}: RecipientOptions) {
  const uniqueExcludedUserIds = [...new Set(excludeUserIds.filter(Boolean))];

  const memberships = await prisma.clubMember.findMany({
    where: {
      clubId,
      status: ClubMemberStatus.active,
      ...(roles
        ? {
            role: {
              in: roles,
            },
          }
        : {}),
      ...(uniqueExcludedUserIds.length > 0
        ? {
            userId: {
              notIn: uniqueExcludedUserIds,
            },
          }
        : {}),
      ...mutedWhere(respectMute),
    },
    select: {
      userId: true,
    },
  });

  return memberships.map((membership) => membership.userId);
}

export async function isEligibleClubRecipient({
  clubId,
  userId,
  respectMute = true,
}: SingleRecipientOptions) {
  if (!clubId || !userId) {
    return false;
  }

  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId,
      userId,
      status: ClubMemberStatus.active,
      ...mutedWhere(respectMute),
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

export function extractMentionedUsernames(text: string) {
  const usernames = new Set<string>();

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const username = match[1]?.trim().toLowerCase();

    if (username) {
      usernames.add(username);
    }
  }

  return [...usernames];
}

export async function resolveMentionedClubRecipientIds({
  clubId,
  text,
  excludeUserIds = [],
  respectMute = true,
}: {
  clubId: string;
  text: string;
  excludeUserIds?: string[];
  respectMute?: boolean;
}) {
  const usernames = extractMentionedUsernames(text);

  if (usernames.length === 0) {
    return [];
  }

  const uniqueExcludedUserIds = [...new Set(excludeUserIds.filter(Boolean))];
  const users = await prisma.user.findMany({
    where: {
      OR: usernames.map((username) => ({
        username: {
          equals: username,
          mode: 'insensitive',
        },
      })),
      clubMemberships: {
        some: {
          clubId,
          status: ClubMemberStatus.active,
          ...mutedWhere(respectMute),
        },
      },
      ...(uniqueExcludedUserIds.length > 0
        ? {
            id: {
              notIn: uniqueExcludedUserIds,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  return users.map((user) => user.id);
}

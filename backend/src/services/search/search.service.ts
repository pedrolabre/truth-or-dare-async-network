import {
  ClubMemberStatus,
  ClubPromptStatus,
  ClubStatus,
  ClubVisibility,
  Prisma,
} from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { SearchServiceError, searchUnavailableError } from './errors';
import { mapClubToSearchResult, mapUserToSearchResult } from './mappers';
import {
  SearchClubsOptions,
  SearchClubResult,
  SearchDiscoveryOptions,
  SearchPaginationResult,
  SearchUserResult,
  SearchUsersOptions,
} from './types';
import {
  normalizePaginationOptions,
  normalizeSearchQuery,
  normalizeTrendingThreshold,
  normalizeTrendingWindowHours,
} from './validators';

export { SearchServiceError } from './errors';
export type { SearchErrorCode } from './errors';
export type {
  SearchClubsOptions,
  SearchClubResult,
  SearchDiscoveryOptions,
  SearchPaginationOptions,
  SearchPaginationResult,
  SearchUserResult,
  SearchUsersOptions,
} from './types';

const searchUserSelect = {
  id: true,
  name: true,
  username: true,
  bio: true,
} satisfies Prisma.UserSelect;

const searchClubSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  iconName: true,
  avatarUrl: true,
  memberCount: true,
  tags: true,
} satisfies Prisma.ClubSelect;

const RECOMMENDED_ACTIVITY_WINDOW_DAYS = 14;

async function getActiveClubIdsForUser(userId: string) {
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
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

  return memberships.map((membership) => membership.clubId);
}

async function countMutualActiveClubs({
  viewerId,
  resultUserIds,
}: {
  viewerId: string;
  resultUserIds: string[];
}) {
  if (resultUserIds.length === 0) {
    return new Map<string, number>();
  }

  const viewerClubIds = await getActiveClubIdsForUser(viewerId);

  if (viewerClubIds.length === 0) {
    return new Map<string, number>();
  }

  const groupedMemberships = await prisma.clubMember.groupBy({
    by: ['userId'],
    where: {
      userId: {
        in: resultUserIds,
      },
      clubId: {
        in: viewerClubIds,
      },
      status: ClubMemberStatus.active,
      club: {
        status: ClubStatus.active,
        deletedAt: null,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    groupedMemberships.map((membership) => [
      membership.userId,
      membership._count._all,
    ]),
  );
}

async function countRecentUserActivity({
  userIds,
  windowStart,
  now,
}: {
  userIds: string[];
  windowStart: Date;
  now: Date;
}) {
  if (userIds.length === 0) {
    return new Map<string, number>();
  }

  const [truths, dares, prompts] = await Promise.all([
    prisma.truth.groupBy({
      by: ['authorId'],
      where: {
        authorId: {
          in: userIds,
        },
        createdAt: {
          gte: windowStart,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.dare.groupBy({
      by: ['authorId'],
      where: {
        authorId: {
          in: userIds,
        },
        createdAt: {
          gte: windowStart,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.clubPrompt.groupBy({
      by: ['authorId'],
      where: {
        authorId: {
          in: userIds,
        },
        status: ClubPromptStatus.published,
        archivedAt: null,
        removedAt: null,
        createdAt: {
          gte: windowStart,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const activityCounts = new Map<string, number>();

  for (const group of [...truths, ...dares, ...prompts]) {
    activityCounts.set(
      group.authorId,
      (activityCounts.get(group.authorId) ?? 0) + group._count._all,
    );
  }

  return activityCounts;
}

async function countRecentClubPrompts({
  clubIds,
  windowStart,
  now,
}: {
  clubIds: string[];
  windowStart: Date;
  now: Date;
}) {
  if (clubIds.length === 0) {
    return new Map<string, number>();
  }

  const groupedPrompts = await prisma.clubPrompt.groupBy({
    by: ['clubId'],
    where: {
      clubId: {
        in: clubIds,
      },
      status: ClubPromptStatus.published,
      archivedAt: null,
      removedAt: null,
      OR: [
        {
          publishedAt: {
            gte: windowStart,
            lte: now,
          },
        },
        {
          createdAt: {
            gte: windowStart,
            lte: now,
          },
        },
      ],
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    groupedPrompts.map((prompt) => [prompt.clubId, prompt._count._all]),
  );
}

async function countRecentClubMemberGrowth({
  clubIds,
  windowStart,
  now,
}: {
  clubIds: string[];
  windowStart: Date;
  now: Date;
}) {
  if (clubIds.length === 0) {
    return new Map<string, number>();
  }

  const groupedMemberships = await prisma.clubMember.groupBy({
    by: ['clubId'],
    where: {
      clubId: {
        in: clubIds,
      },
      status: ClubMemberStatus.active,
      joinedAt: {
        gte: windowStart,
        lte: now,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    groupedMemberships.map((membership) => [
      membership.clubId,
      membership._count._all,
    ]),
  );
}

async function findTrendingClubIds({
  clubIds,
  now,
  threshold,
  windowHours,
}: {
  clubIds: string[];
  now: Date;
  threshold: number;
  windowHours: number;
}) {
  if (clubIds.length === 0) {
    return new Set<string>();
  }

  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  const groupedMemberships = await prisma.clubMember.groupBy({
    by: ['clubId'],
    where: {
      clubId: {
        in: clubIds,
      },
      status: ClubMemberStatus.active,
      joinedAt: {
        gte: windowStart,
        lte: now,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Set(
    groupedMemberships
      .filter((membership) => membership._count._all >= threshold)
      .map((membership) => membership.clubId),
  );
}

function getPaginationArgs({
  cursor,
  offset,
}: {
  cursor?: string;
  offset?: number;
}): { cursor?: { id: string }; skip?: number } {
  if (cursor) {
    return {
      cursor: {
        id: cursor,
      },
      skip: 1,
    };
  }

  if (offset) {
    return {
      skip: offset,
    };
  }

  return {};
}

function getDiscoveryLimit(limit?: number) {
  const normalized = normalizePaginationOptions({ limit });

  return normalized.limit;
}

function getTimeScore(date: Date | null | undefined, now: Date) {
  if (!date) {
    return 0;
  }

  const ageHours = Math.max(0, (now.getTime() - date.getTime()) / 3600000);

  return Math.max(0, 1000 - ageHours);
}

function buildPaginationResult<T extends { id: string }>(
  records: T[],
  limit: number,
) {
  const hasNextPage = records.length > limit;
  const items = records.slice(0, limit);

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1]?.id ?? null : null,
  };
}

export async function searchUsers(
  query: unknown,
  options: SearchUsersOptions,
): Promise<SearchPaginationResult<SearchUserResult>> {
  try {
    const normalizedQuery = normalizeSearchQuery(query);
    const pagination = normalizePaginationOptions(options);

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: options.userId,
        },
        OR: [
          {
            name: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            username: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            bio: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: searchUserSelect,
      orderBy: [
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: pagination.limit + 1,
      ...getPaginationArgs(pagination),
    });

    const page = buildPaginationResult(users, pagination.limit);
    const mutualCounts = await countMutualActiveClubs({
      viewerId: options.userId,
      resultUserIds: page.items.map((user) => user.id),
    });

    return {
      items: page.items.map((user) =>
        mapUserToSearchResult(user, mutualCounts.get(user.id) ?? 0),
      ),
      nextCursor: page.nextCursor,
    };
  } catch (error) {
    if (error instanceof SearchServiceError) {
      throw error;
    }

    searchUnavailableError();
  }
}

export async function searchClubs(
  query: unknown,
  options: SearchClubsOptions,
): Promise<SearchPaginationResult<SearchClubResult>> {
  try {
    const normalizedQuery = normalizeSearchQuery(query);
    const normalizedTag = normalizedQuery.toLowerCase();
    const pagination = normalizePaginationOptions(options);
    const trendingThreshold = normalizeTrendingThreshold(
      options.trendingMemberGrowthThreshold,
    );
    const trendingWindowHours = normalizeTrendingWindowHours(
      options.trendingWindowHours,
    );

    const clubs = await prisma.club.findMany({
      where: {
        visibility: ClubVisibility.public,
        status: ClubStatus.active,
        deletedAt: null,
        members: {
          none: {
            userId: options.userId,
            status: ClubMemberStatus.blocked,
          },
        },
        OR: [
          {
            name: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: normalizedQuery,
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: normalizedTag,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              has: normalizedTag,
            },
          },
        ],
      },
      select: searchClubSelect,
      orderBy: [
        {
          memberCount: 'desc',
        },
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: pagination.limit + 1,
      ...getPaginationArgs(pagination),
    });

    const page = buildPaginationResult(clubs, pagination.limit);
    const trendingClubIds = await findTrendingClubIds({
      clubIds: page.items.map((club) => club.id),
      now: options.now ?? new Date(),
      threshold: trendingThreshold,
      windowHours: trendingWindowHours,
    });

    return {
      items: page.items.map((club) =>
        mapClubToSearchResult(club, trendingClubIds.has(club.id)),
      ),
      nextCursor: page.nextCursor,
    };
  } catch (error) {
    if (error instanceof SearchServiceError) {
      throw error;
    }

    searchUnavailableError();
  }
}

export async function getRecommendedUsers(
  options: SearchDiscoveryOptions,
): Promise<SearchUserResult[]> {
  try {
    const limit = getDiscoveryLimit(options.limit);
    const now = options.now ?? new Date();
    const activityWindowStart = new Date(
      now.getTime() - RECOMMENDED_ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const viewerClubIds = await getActiveClubIdsForUser(options.userId);

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: options.userId,
        },
        ...(viewerClubIds.length > 0
          ? {
              clubMemberships: {
                some: {
                  clubId: {
                    in: viewerClubIds,
                  },
                  status: ClubMemberStatus.active,
                  club: {
                    status: ClubStatus.active,
                    deletedAt: null,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        ...searchUserSelect,
        createdAt: true,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: limit * 4,
    });

    const userIds = users.map((user) => user.id);
    const [mutualCounts, activityCounts] = await Promise.all([
      countMutualActiveClubs({
        viewerId: options.userId,
        resultUserIds: userIds,
      }),
      countRecentUserActivity({
        userIds,
        windowStart: activityWindowStart,
        now,
      }),
    ]);

    return users
      .map((user) => ({
        user,
        mutualCount: mutualCounts.get(user.id) ?? 0,
        activityCount: activityCounts.get(user.id) ?? 0,
      }))
      .sort((first, second) => {
        const firstScore =
          first.mutualCount * 1000 +
          first.activityCount * 100 +
          getTimeScore(first.user.createdAt, now);
        const secondScore =
          second.mutualCount * 1000 +
          second.activityCount * 100 +
          getTimeScore(second.user.createdAt, now);

        if (secondScore !== firstScore) {
          return secondScore - firstScore;
        }

        const nameComparison = first.user.name.localeCompare(second.user.name);

        if (nameComparison !== 0) {
          return nameComparison;
        }

        return first.user.id.localeCompare(second.user.id);
      })
      .slice(0, limit)
      .map(({ user, mutualCount }) =>
        mapUserToSearchResult(user, mutualCount),
      );
  } catch (error) {
    if (error instanceof SearchServiceError) {
      throw error;
    }

    searchUnavailableError();
  }
}

export async function getTrendingClubs(
  options: SearchDiscoveryOptions,
): Promise<SearchClubResult[]> {
  try {
    const limit = getDiscoveryLimit(options.limit);
    const now = options.now ?? new Date();
    const trendingWindowHours = normalizeTrendingWindowHours(
      options.trendingWindowHours,
    );
    const trendingThreshold = normalizeTrendingThreshold(
      options.trendingMemberGrowthThreshold,
    );
    const windowStart = new Date(
      now.getTime() - trendingWindowHours * 60 * 60 * 1000,
    );

    const clubs = await prisma.club.findMany({
      where: {
        visibility: ClubVisibility.public,
        status: ClubStatus.active,
        archivedAt: null,
        deletedAt: null,
        members: {
          none: {
            userId: options.userId,
            status: ClubMemberStatus.blocked,
          },
        },
      },
      select: {
        ...searchClubSelect,
        promptCount: true,
        lastActivityAt: true,
        createdAt: true,
      },
      orderBy: [
        {
          lastActivityAt: 'desc',
        },
        {
          memberCount: 'desc',
        },
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: limit * 4,
    });

    const clubIds = clubs.map((club) => club.id);
    const [recentMemberGrowth, recentPromptCounts] = await Promise.all([
      countRecentClubMemberGrowth({
        clubIds,
        windowStart,
        now,
      }),
      countRecentClubPrompts({
        clubIds,
        windowStart,
        now,
      }),
    ]);

    return clubs
      .map((club) => {
        const growth = recentMemberGrowth.get(club.id) ?? 0;
        const recentPrompts = recentPromptCounts.get(club.id) ?? 0;
        const recentActivityScore =
          club.lastActivityAt && club.lastActivityAt >= windowStart
            ? getTimeScore(club.lastActivityAt, now)
            : 0;
        const score =
          growth * 1000 +
          recentPrompts * 250 +
          recentActivityScore +
          Math.min(club.memberCount, 100);

        return {
          club,
          growth,
          recentPrompts,
          score,
        };
      })
      .filter(({ growth, recentPrompts, club }) => {
        const hasRecentActivity =
          club.lastActivityAt !== null && club.lastActivityAt >= windowStart;

        return growth > 0 || recentPrompts > 0 || hasRecentActivity;
      })
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        const nameComparison = first.club.name.localeCompare(second.club.name);

        if (nameComparison !== 0) {
          return nameComparison;
        }

        return first.club.id.localeCompare(second.club.id);
      })
      .slice(0, limit)
      .map(({ club, growth, recentPrompts }) =>
        mapClubToSearchResult(
          club,
          growth >= trendingThreshold || recentPrompts > 0,
        ),
      );
  } catch (error) {
    if (error instanceof SearchServiceError) {
      throw error;
    }

    searchUnavailableError();
  }
}

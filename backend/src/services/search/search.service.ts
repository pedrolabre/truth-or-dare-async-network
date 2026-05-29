import {
  ClubMemberStatus,
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

import {
  ClubMemberStatus,
  ClubPromptType,
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
  SearchContentOptions,
  SearchContentResult,
  SearchDiscoveryOptions,
  SearchPaginationResult,
  SearchUserResult,
  SearchUsersOptions,
} from './types';
import {
  normalizePaginationOptions,
  normalizeBooleanFilter,
  normalizeClubTagFilter,
  normalizeClubVisibilityFilter,
  normalizeSearchLevel,
  normalizeSearchQuery,
  SEARCH_ONLINE_WINDOW_MINUTES,
  normalizeTrendingThreshold,
  normalizeTrendingWindowHours,
} from './validators';

export { SearchServiceError } from './errors';
export type { SearchErrorCode } from './errors';
export type {
  SearchClubsOptions,
  SearchClubResult,
  SearchContentOptions,
  SearchContentResult,
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
const SEARCH_CONTENT_CANDIDATES_LIMIT = 100;
const SEARCH_CONTENT_SNIPPET_MAX_LENGTH = 180;

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

function getDerivedUserLevel(activityCount: number) {
  return activityCount > 0 ? activityCount : null;
}

async function getSearchUserMetadata({
  userIds,
  now,
}: {
  userIds: string[];
  now: Date;
}) {
  if (userIds.length === 0) {
    return new Map<string, { level: number | null; isOnline: boolean }>();
  }

  const onlineSince = new Date(
    now.getTime() - SEARCH_ONLINE_WINDOW_MINUTES * 60 * 1000,
  );
  const [truths, dares, prompts, onlineMemberships] = await Promise.all([
    prisma.truth.groupBy({
      by: ['authorId'],
      where: {
        authorId: {
          in: userIds,
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
        club: {
          status: ClubStatus.active,
          deletedAt: null,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.clubMember.findMany({
      where: {
        userId: {
          in: userIds,
        },
        status: ClubMemberStatus.active,
        lastSeenAt: {
          gte: onlineSince,
          lte: now,
        },
        club: {
          status: ClubStatus.active,
          deletedAt: null,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    }),
  ]);

  const activityCounts = new Map<string, number>();

  for (const group of [...truths, ...dares, ...prompts]) {
    activityCounts.set(
      group.authorId,
      (activityCounts.get(group.authorId) ?? 0) + group._count._all,
    );
  }

  const onlineUserIds = new Set(
    onlineMemberships.map((membership) => membership.userId),
  );

  return new Map(
    userIds.map((userId) => [
      userId,
      {
        level: getDerivedUserLevel(activityCounts.get(userId) ?? 0),
        isOnline: onlineUserIds.has(userId),
      },
    ]),
  );
}

function userMatchesLevelFilters({
  metadata,
  minLevel,
  maxLevel,
  onlineOnly,
}: {
  metadata: { level: number | null; isOnline: boolean };
  minLevel?: number;
  maxLevel?: number;
  onlineOnly: boolean;
}) {
  if (onlineOnly && !metadata.isOnline) {
    return false;
  }

  if (typeof minLevel === 'number') {
    if (metadata.level === null || metadata.level < minLevel) {
      return false;
    }
  }

  if (typeof maxLevel === 'number') {
    if (metadata.level === null || metadata.level > maxLevel) {
      return false;
    }
  }

  return true;
}

function paginateRecordsInMemory<T extends { id: string }>(
  records: T[],
  pagination: { limit: number; cursor?: string; offset?: number },
) {
  const startIndex = pagination.cursor
    ? records.findIndex((record) => record.id === pagination.cursor) + 1
    : pagination.offset ?? 0;

  return buildPaginationResult(records.slice(Math.max(0, startIndex)), pagination.limit);
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

function getContentSnippet(text: string) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();

  if (normalizedText.length <= SEARCH_CONTENT_SNIPPET_MAX_LENGTH) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, SEARCH_CONTENT_SNIPPET_MAX_LENGTH - 1).trim()}...`;
}

function getContentPage(
  records: SearchContentResult[],
  pagination: { limit: number; cursor?: string; offset?: number },
) {
  const sortedRecords = [...records].sort((first, second) => {
    const dateDiff = second.createdAt.getTime() - first.createdAt.getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return first.id.localeCompare(second.id);
  });

  return paginateRecordsInMemory(sortedRecords, pagination);
}

function buildDirectContentResult({
  id,
  sourceId,
  sourceType,
  contentType,
  title,
  authorName,
  commentsCount,
  likesCount,
  createdAt,
  route,
}: {
  id: string;
  sourceId: string;
  sourceType: 'truth' | 'dare';
  contentType: 'truth' | 'dare';
  title: string;
  authorName: string | null;
  commentsCount: number;
  likesCount: number;
  createdAt: Date;
  route: 'feed-comments' | 'action-screen';
}): SearchContentResult {
  return {
    id,
    sourceId,
    sourceType,
    contentType,
    parentId: sourceId,
    clubId: null,
    clubName: null,
    title,
    snippet: getContentSnippet(title),
    badgeLabel: contentType === 'truth' ? 'Verdade' : 'Desafio',
    authorName,
    commentsCount,
    likesCount,
    createdAt,
    route,
  };
}

export async function searchUsers(
  query: unknown,
  options: SearchUsersOptions,
): Promise<SearchPaginationResult<SearchUserResult>> {
  try {
    const normalizedQuery = normalizeSearchQuery(query);
    const pagination = normalizePaginationOptions(options);
    const minLevel = normalizeSearchLevel(options.minLevel);
    const maxLevel = normalizeSearchLevel(options.maxLevel);
    const onlineOnly = normalizeBooleanFilter(options.onlineOnly);
    const hasAdvancedUserFilters =
      typeof minLevel === 'number' ||
      typeof maxLevel === 'number' ||
      onlineOnly;
    const baseWhere: Prisma.UserWhereInput = {
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
    };

    const users = await prisma.user.findMany({
      where: baseWhere,
      select: searchUserSelect,
      orderBy: [
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      ...(hasAdvancedUserFilters
        ? {}
        : {
            take: pagination.limit + 1,
            ...getPaginationArgs(pagination),
          }),
    });

    const allMetadata = await getSearchUserMetadata({
      userIds: users.map((user) => user.id),
      now: options.now ?? new Date(),
    });
    const filteredUsers = hasAdvancedUserFilters
      ? users.filter((user) =>
          userMatchesLevelFilters({
            metadata:
              allMetadata.get(user.id) ?? { level: null, isOnline: false },
            minLevel,
            maxLevel,
            onlineOnly,
          }),
        )
      : users;
    const page = hasAdvancedUserFilters
      ? paginateRecordsInMemory(filteredUsers, pagination)
      : buildPaginationResult(filteredUsers, pagination.limit);
    const mutualCounts = await countMutualActiveClubs({
      viewerId: options.userId,
      resultUserIds: page.items.map((user) => user.id),
    });

    return {
      items: page.items.map((user) => {
        const metadata = allMetadata.get(user.id) ?? {
          level: null,
          isOnline: false,
        };

        return mapUserToSearchResult(
          user,
          mutualCounts.get(user.id) ?? 0,
          metadata.level,
          metadata.isOnline,
        );
      }),
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
    const normalizedClubTag = normalizeClubTagFilter(options.clubTag);
    const normalizedClubVisibility =
      normalizeClubVisibilityFilter(options.clubVisibility) ??
      'public';
    const clubVisibility =
      normalizedClubVisibility === 'public'
        ? ClubVisibility.public
        : ClubVisibility.public;
    const pagination = normalizePaginationOptions(options);
    const trendingThreshold = normalizeTrendingThreshold(
      options.trendingMemberGrowthThreshold,
    );
    const trendingWindowHours = normalizeTrendingWindowHours(
      options.trendingWindowHours,
    );

    const clubs = await prisma.club.findMany({
      where: {
        visibility: clubVisibility,
        status: ClubStatus.active,
        deletedAt: null,
        ...(normalizedClubTag
          ? {
              tags: {
                has: normalizedClubTag,
              },
            }
          : {}),
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

export async function searchContent(
  query: unknown,
  options: SearchContentOptions,
): Promise<SearchPaginationResult<SearchContentResult>> {
  try {
    const normalizedQuery = normalizeSearchQuery(query);
    const pagination = normalizePaginationOptions(options);
    const now = options.now ?? new Date();
    const contentTake = SEARCH_CONTENT_CANDIDATES_LIMIT;

    const [
      truths,
      dares,
      truthComments,
      clubPrompts,
      clubPromptComments,
    ] = await Promise.all([
      prisma.truth.findMany({
        where: {
          content: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: contentTake,
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.dare.findMany({
        where: {
          content: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
          completedAt: null,
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: contentTake,
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.truthComment.findMany({
        where: {
          text: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: contentTake,
        select: {
          id: true,
          text: true,
          createdAt: true,
          truthId: true,
          user: {
            select: {
              name: true,
            },
          },
          truth: {
            select: {
              content: true,
              _count: {
                select: {
                  comments: true,
                },
              },
            },
          },
        },
      }),
      prisma.clubPrompt.findMany({
        where: {
          content: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
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
          AND: [
            {
              OR: [
                {
                  club: {
                    members: {
                      some: {
                        userId: options.userId,
                        status: ClubMemberStatus.active,
                      },
                    },
                  },
                },
                {
                  isMembersOnly: false,
                  club: {
                    visibility: ClubVisibility.public,
                    members: {
                      none: {
                        userId: options.userId,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: contentTake,
        select: {
          id: true,
          type: true,
          content: true,
          commentsCount: true,
          likesCount: true,
          createdAt: true,
          author: {
            select: {
              name: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.clubPromptComment.findMany({
        where: {
          text: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
          removedAt: null,
          OR: [
            {
              responseId: null,
            },
            {
              response: {
                is: {
                  archivedAt: null,
                  removedAt: null,
                },
              },
            },
          ],
          prompt: {
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
          },
          club: {
            status: ClubStatus.active,
            deletedAt: null,
          },
          AND: [
            {
              OR: [
                {
                  club: {
                    members: {
                      some: {
                        userId: options.userId,
                        status: ClubMemberStatus.active,
                      },
                    },
                  },
                },
                {
                  prompt: {
                    isMembersOnly: false,
                  },
                  club: {
                    visibility: ClubVisibility.public,
                    members: {
                      none: {
                        userId: options.userId,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: contentTake,
        select: {
          id: true,
          text: true,
          createdAt: true,
          promptId: true,
          user: {
            select: {
              name: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          prompt: {
            select: {
              type: true,
              content: true,
              commentsCount: true,
              likesCount: true,
            },
          },
        },
      }),
    ]);

    const contentResults: SearchContentResult[] = [
      ...truths.map((truth) =>
        buildDirectContentResult({
          id: `truth:${truth.id}`,
          sourceId: truth.id,
          sourceType: 'truth',
          contentType: 'truth',
          title: truth.content,
          authorName: truth.author.name,
          commentsCount: truth._count.comments,
          likesCount: 0,
          createdAt: truth.createdAt,
          route: 'feed-comments',
        }),
      ),
      ...dares.map((dare) =>
        buildDirectContentResult({
          id: `dare:${dare.id}`,
          sourceId: dare.id,
          sourceType: 'dare',
          contentType: 'dare',
          title: dare.content,
          authorName: dare.author.name,
          commentsCount: 0,
          likesCount: 0,
          createdAt: dare.createdAt,
          route: 'action-screen',
        }),
      ),
      ...truthComments.map((comment) => ({
        id: `truth_comment:${comment.id}`,
        sourceId: comment.id,
        sourceType: 'truth_comment' as const,
        contentType: 'comment' as const,
        parentId: comment.truthId,
        clubId: null,
        clubName: null,
        title: comment.truth.content,
        snippet: getContentSnippet(comment.text),
        badgeLabel: 'Comentario',
        authorName: comment.user.name,
        commentsCount: comment.truth._count.comments,
        likesCount: 0,
        createdAt: comment.createdAt,
        route: 'feed-comments' as const,
      })),
      ...clubPrompts.map((prompt) => {
        const isTruth = prompt.type === ClubPromptType.truth;

        return {
          id: `club_prompt:${prompt.id}`,
          sourceId: prompt.id,
          sourceType: 'club_prompt' as const,
          contentType: isTruth ? ('truth' as const) : ('dare' as const),
          parentId: prompt.id,
          clubId: prompt.club.id,
          clubName: prompt.club.name,
          title: prompt.content,
          snippet: getContentSnippet(prompt.content),
          badgeLabel: isTruth ? 'Verdade de clube' : 'Desafio de clube',
          authorName: prompt.author.name,
          commentsCount: prompt.commentsCount,
          likesCount: prompt.likesCount,
          createdAt: prompt.createdAt,
          route: 'club-detail' as const,
        };
      }),
      ...clubPromptComments.map((comment) => {
        const isTruth = comment.prompt.type === ClubPromptType.truth;

        return {
          id: `club_prompt_comment:${comment.id}`,
          sourceId: comment.id,
          sourceType: 'club_prompt_comment' as const,
          contentType: 'comment' as const,
          parentId: comment.promptId,
          clubId: comment.club.id,
          clubName: comment.club.name,
          title: comment.prompt.content,
          snippet: getContentSnippet(comment.text),
          badgeLabel: isTruth
            ? 'Comentario em verdade'
            : 'Comentario em desafio',
          authorName: comment.user.name,
          commentsCount: comment.prompt.commentsCount,
          likesCount: comment.prompt.likesCount,
          createdAt: comment.createdAt,
          route: 'club-detail' as const,
        };
      }),
    ];

    const page = getContentPage(contentResults, pagination);

    return {
      items: page.items,
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

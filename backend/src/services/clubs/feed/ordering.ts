import { ClubFeedOrderDto } from '../../../dtos/clubs.dto';
import { Prisma } from '../../../generated/prisma/client';
import { validationError } from '../core/errors';

const ALLOWED_CLUB_FEED_ORDERS = new Set<ClubFeedOrderDto>([
  'activity',
  'relevance',
  'deadline',
  'pinned',
]);

const publishedOrder: Prisma.ClubPromptOrderByWithRelationInput[] = [
  {
    publishedAt: {
      sort: 'desc',
      nulls: 'last',
    },
  },
  {
    createdAt: 'desc',
  },
  {
    id: 'asc',
  },
];

const activityOrder: Prisma.ClubPromptOrderByWithRelationInput[] = [
  {
    updatedAt: 'desc',
  },
  ...publishedOrder,
];

export function normalizeClubFeedOrder(value: unknown): ClubFeedOrderDto {
  if (value === undefined || value === null || value === '') {
    return 'pinned';
  }

  if (typeof value !== 'string') {
    validationError('Ordenacao do feed do clube invalida');
  }

  const normalizedOrder = value.trim().toLowerCase() as ClubFeedOrderDto;

  if (!ALLOWED_CLUB_FEED_ORDERS.has(normalizedOrder)) {
    validationError('Ordenacao do feed do clube invalida');
  }

  return normalizedOrder;
}

export function buildClubFeedPromptOrderBy(
  order: ClubFeedOrderDto,
): Prisma.ClubPromptOrderByWithRelationInput[] {
  if (order === 'activity') {
    return activityOrder;
  }

  if (order === 'relevance') {
    return [
      {
        likesCount: 'desc',
      },
      {
        commentsCount: 'desc',
      },
      {
        answersCount: 'desc',
      },
      ...activityOrder,
    ];
  }

  if (order === 'deadline') {
    return [
      {
        expiresAt: {
          sort: 'asc',
          nulls: 'last',
        },
      },
      ...activityOrder,
    ];
  }

  return [
    {
      isPinned: 'desc',
    },
    ...publishedOrder,
  ];
}

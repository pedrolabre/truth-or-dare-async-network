import { Prisma } from '../../generated/prisma/client';

export type SearchPaginationOptions = {
  limit?: number;
  cursor?: string | null;
  offset?: number | null;
};

export type SearchUsersOptions = SearchPaginationOptions & {
  userId: string;
};

export type SearchClubsOptions = SearchPaginationOptions & {
  userId: string;
  now?: Date;
  trendingMemberGrowthThreshold?: number;
  trendingWindowHours?: number;
};

export type NormalizedSearchPaginationOptions = {
  limit: number;
  cursor?: string;
  offset?: number;
};

export type SearchPaginationResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export type SearchUserResult = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  level: number | null;
  mutualCount: number;
};

export type SearchClubResult = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string;
  avatarUrl: string | null;
  memberCount: number;
  isTrending: boolean;
  tags: string[];
};

export type SearchUserRecord = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    username: true;
    bio: true;
  };
}>;

export type SearchClubRecord = Prisma.ClubGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    description: true;
    iconName: true;
    avatarUrl: true;
    memberCount: true;
    tags: true;
  };
}>;
